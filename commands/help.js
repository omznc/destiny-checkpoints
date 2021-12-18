/* eslint-disable no-console, consistent-return */

/*
 * This is a command library.
 * Each command library contains exactly one command, and its execution code.
 * The file name is identical to the command name.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');
const { COOLDOWNS, LOGO_URL, LOGO_COLOR } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('So, you\'re wondering how this works?'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setTitle('Checkpoints Help')
          .setURL('https://hey.imkez.com/checkpoints-github')
          .setColor(LOGO_COLOR)
          .setThumbnail(LOGO_URL)
          .setDescription(stripIndents`
              This bot is used to share destiny checkpoints.
              It's in beta, so expect downtime and breakage.
              Clicking on the title will bring you to the Github page.
              Below you can find a list of commands and their usage.`)

          .addField(
            '__Register & Unregister__',
            stripIndents`
            Register links your Bungie & Discord accounts with the bot.
            Unregister removes your account from the bot, unless you're banned.
            Unregistering also means that all of your stats will be lost.`,
          )

          .addField(
            '__Join__',
            stripIndents`
            Join a checkpoint, automagically (mostly).
            This doesn't need much explanation.
            You'll have a guaranteed spot for the next ${COOLDOWNS.checkpoint} seconds.`,
          )

          .addField(
            '__Share__',
            stripIndents`
            Share a checkpoint with other users.
            Basically, you travel to the checkpoint in-game, open your fireteam, then just run \`/share\`.
            That's it. If it's a valid location, you'll get a confirmation message.
            _This command requires you to be registered._`,
          )

          .addField(
            '__Stats__',
            stripIndents`
            See your stats, and the leaderboard.
            _This command requires you to be registered._`,
          )],
    });
  },
};
