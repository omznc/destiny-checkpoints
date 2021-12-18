/* eslint-disable consistent-return, radix, no-console */

/*
 * This library is used as a command handler
 */

const { addCooldown, hasCooldown } = require('./cooldowns');
const { removeFromRegisteredUsers } = require('./database');

/**
 * Used to handle the confirmation of certain commands. Only invoked in the index.
 * Edits the original interaction with the confirmation message.
 * @param {discord.interaction} interaction
 */
async function handleConfirmation(interaction) {
  if (interaction.customId === 'unregister_confirmation') {
    removeFromRegisteredUsers(interaction.user.id)
      .then(() => {
        interaction.update({
          content: 'You have been unregistered.',
          ephemeral: true,
          components: [],
        });
      })
      .catch(() => {
        interaction.update({
          content: 'There was an error unregistering you.',
          ephemeral: true,
          components: [],
        });
      });
  }
}

/**
 * This function handles slash commands. Only invoked in the index.
 * @param {*} command
 * @param {*} interaction
 */
async function handleCommand(command, interaction) {
  // Check if the user has a cooldown.
  if (hasCooldown(interaction.user.id, command.data.name)) {
    interaction.editReply({
      content: "You're on a cooldown, take a breather.",
      ephemeral: true,
    });
  }

  // If there is no cooldown, adds user to the set that prevents them from using the command again.
  // The cooldown is defined in the config.json file.
  addCooldown(interaction.user.id, command.data.name);

  try {
    // Execute the command
    await command.execute(interaction);
  } catch (error) {
    // Prints the error (if applicable) to the console.
    // Notifies the user that there was an error.
    console.log(
      `User ${interaction.user.username} (${interaction.user.id}) has gotten an error: ${error}`,
    );
    return interaction.editReply({
      content: "There was an error trying to execute that command. We've been notified.",
      ephemeral: true,
    });
  }
}

module.exports = {
  handleConfirmation,
  handleCommand,
};
