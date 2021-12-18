/* eslint-disable consistent-return */

/*
 * This is a command library.
 * Each command library contains exactly one command, and its execution code.
 * The file name is identical to the command name.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags/lib');
const { MessageEmbed } = require('discord.js');
const { LOGO_URL, LOGO_COLOR, LOCATIONS } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('locations')
    .setDescription('Lists all the valid locations for sharing.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setTitle('Valid Locations')
          .setColor(LOGO_COLOR)
          .setThumbnail(LOGO_URL)
          // Add all locations to the embed
          .setDescription(stripIndents`
          The following locations are currently enabled:
          ${LOCATIONS.map((location) => `**${location.name}**`).join('\n')}`)],
    });
  },
};
