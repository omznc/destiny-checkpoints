/* eslint-disable consistent-return */

/*
 * This is a command library.
 * Each command library contains exactly one command, and its execution code.
 * The file name is identical to the command name.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { getDestinyMembershipIDAndBungieName } = require('../bungie-api');
const {
  isRegistered,
  addToRegisteredUsers,
} = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Link your Discord and Bungie accounts with Checkpoints.')
    .addStringOption((option) => option
      .setName('code')
      .setRequired(false)
      .setDescription('The code you got from the website, or will get. Click that button.')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const authcode = interaction.options.getString('code');

    isRegistered(interaction.user.id).then((registered) => {
      if (registered === true) return interaction.editReply('You are already registered.');

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel('Register')
          .setEmoji('✍️')
          .setStyle('LINK')
          .setURL('https://auth.imkez.com/'),
      );

      if (authcode === null) {
        interaction.editReply({
          content: `Hello ${interaction.user}, you can register by clicking the button below, then following the instructions.`,
          components: [row],
          ephemeral: true,
        });
      } else {
        interaction.editReply({
          content: 'Please wait, this might take a bit...',
        });
        getDestinyMembershipIDAndBungieName(authcode)
          .then(
            (data) => {
              if (data != null) {
                addToRegisteredUsers(
                  interaction.user.id,
                  data.membership_id,
                  data.username,
                );
                interaction.editReply({
                  content: 'You have been successfully registered.',
                });
              } else {
                interaction.editReply({
                  content: 'Invalid code, try again.',
                  components: [row],
                });
              }
            },
          );
      }
    });
  },
};
