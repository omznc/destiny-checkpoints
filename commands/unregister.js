/* eslint-disable no-console, consistent-return */

/*
 * This is a command library.
 * Each command library contains exactly one command, and its execution code.
 * The file name is identical to the command name.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { isRegistered, isBanned } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Unregister your account.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await Promise.all([isRegistered(interaction.user.id), isBanned(interaction.user.id)])
      .then(([registered, banned]) => {
        if (registered !== true) return interaction.editReply("You're not registered. Try `/register`");
        if (banned === true) return interaction.editReply('You are banned from using this bot, this would do nothing.');

        interaction.editReply({
          content: `Hey there ${interaction.user}! You can unregister by clicking the button below.\nThis **will** delete all of your stored stats. You have 15 seconds to confirm.`,
          ephemeral: true,
          components: [
            new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setLabel('Go ahead, delete me.')
                  .setStyle('DANGER')
                  .setCustomId('unregister_confirmation'),
              ),
          ],
        });
      });
  },
};
