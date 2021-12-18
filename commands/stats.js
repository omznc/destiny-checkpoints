/* eslint-disable no-console, consistent-return */

/*
 * This is a command library.
 * Each command library contains exactly one command, and its execution code.
 * The file name is identical to the command name.
 */

const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { isRegistered, getStats, getTopStats } = require('../database');
const { LOGO_URL, LOGO_COLOR } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('See your stats, and the leaderboard.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    isRegistered(interaction.user.id)
      .then(
        async (registered) => {
          if (registered !== true) return interaction.editReply("You're not registered. Try `/register`");

          await Promise.all([getStats(interaction.user.id), getTopStats(10)])
            .then(([userStats, topStats]) => {
              let userStatsMsg = `Hey \`${userStats.bungie_name}\`! You have shared **${userStats.checkpoints_shared}** checkpoint(s).`;

              if (userStats.checkpoints_shared === 0) userStatsMsg += '\nGive `/share` a shot!';
              else userStatsMsg += '\nYou\'re getting the hang of this!';

              return interaction.editReply({
                embeds: [
                  new MessageEmbed()
                    .setTitle('Global Checkpoint Leaderboards')
                    .setThumbnail(LOGO_URL)
                    .setColor(LOGO_COLOR)
                    .addField('__Top 10 Users__', topStats.map((stat) => `**${stat.checkpoints_shared}** checkpoint(s) shared by \`${stat.bungie_name}\``).join('\n'))
                    .addField('__Your Stats__', userStatsMsg)
                    .setFooter('imkez.com/checkpoints', LOGO_URL),
                ],
              });
            });
        },
      );
  },
};
