/* eslint-disable no-loop-func, no-console, no-await-in-loop,
no-param-reassign, consistent-return */

/*
 * This is a command library.
 * Each command library contains exactly one command, and its execution code.
 * The file name is identical to the command name.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  getNumberOfCheckpointsAtLocation,
  removeUserFromLocation,
  updateDate,
  getBungieName,
  getOldestCheckpoint,
  incrementSharedCheckpoints,
  isOlderThan,
} = require('../database');
const { getActivityAndSlots } = require('../bungie-api');
const { parseLocation } = require('../utils');
const { LOCATIONS } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join a destination.')
    .addStringOption((option) => {
      option
        .setName('location')
        .setRequired(true)
        .setDescription('Where are we going?');
      LOCATIONS.forEach((location) => {
        if (location.enabled) option.addChoice(location.name, location.id);
      });
      return option;
    }),

  async execute(interaction) {
    await interaction.reply({
      content: 'Please wait, this might take a bit...',
      ephemeral: true,
    });

    const location = interaction.options.getString('location');

    LOCATIONS.forEach((element) => {
      if (element.name === location && !element.enabled) {
        return interaction.editReply(
          'Sorry, but this location is not enabled.',
        );
      }
    });

    getNumberOfCheckpointsAtLocation(location)
      .then(async (count) => {
        for (count; count >= 0; count -= 1) {
          if (count === 0) {
            return interaction.editReply({
              content: 'No one is sharing checkpoints in this location.',
            });
          }

          await getOldestCheckpoint(location)
            .then(async (userID) => {
              if (await isOlderThan(location, userID, 15)) {
                updateDate(location, userID);
                await getActivityAndSlots(userID).then(
                  async (activityandslots) => {
                    if (activityandslots != null) {
                      await parseLocation(activityandslots[0]).then(
                        async (loc) => {
                          if (loc === location) {
                            if (activityandslots[1] > 0) {
                              await getBungieName(userID).then(
                                async (bungieName) => {
                                  count = -1;
                                  interaction.editReply({
                                    content: `Got one! You can join with \`/join ${bungieName}\``,
                                  });
                                  await incrementSharedCheckpoints(userID);
                                },
                              );
                            }
                          } else {
                            console.log(
                              `REMOVED: ${userID} is not in ${location} -> Moved`,
                            );
                            await removeUserFromLocation(userID, location);
                          }
                        },
                      );
                    } else {
                      console.log(
                        `REMOVED: ${userID} is not in ${location} -> Offline`,
                      );
                      await removeUserFromLocation(userID, location);
                    }
                  },
                );
              }
            })
            .catch((e) => {
              console.log(e);
              return interaction.editReply({
                content: 'Something went wrong. Please try again later.',
              });
            });
        }
      })
      .catch((e) => console.log(e));
  },
};
