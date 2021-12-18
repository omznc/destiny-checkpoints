/* eslint-disable no-console, consistent-return */

/*
 * This is a command library.
 * Each command library contains exactly one command, and its execution code.
 * The file name is identical to the command name.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  isRegistered, isBanned, addNewCheckpoint, removeUserFromLocation,
} = require('../database');
const { getLocationFromBungie } = require('../bungie-api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('share')
    .setDescription('Share a checkpoint.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await Promise.all([isRegistered(interaction.user.id), isBanned(interaction.user.id)])
      .then(([registered, banned]) => {
        if (registered !== true) return interaction.editReply("You're not registered. Do `/register` first.");
        if (banned === true) return interaction.editReply('You are banned from using this bot.');
        interaction.editReply({ content: '<a:typing:920678050918703175> Please wait, this might take a bit.' });
        getLocationFromBungie(interaction.user.id)
          .then(
            (location) => {
              if (location === null) return interaction.editReply('You\'re either not at a valid location, or your fireteam isn\'t set to public.');
              removeUserFromLocation(interaction.user.id, location);
              addNewCheckpoint(
                interaction.user.id,
                location,
              )
                .then(
                  () => {
                    interaction.editReply('Checkpoint shared! Once you leave the activity, your checkpoint will be automatically removed.');
                  },
                );
            },
          );
      });
  },
};
