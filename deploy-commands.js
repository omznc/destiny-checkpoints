/* eslint-disable security/detect-non-literal-require, no-console,
global-require, no-restricted-syntax, import/no-dynamic-require */

/*
 * This is a library used to deploy commands to the discord api.
 * It defaults to the dev server, but can be deployed globally via the --global flag.
 * If deployed globally, the propagation will take about an hour.
 * Overwrites old commands by default.
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const chalk = require('chalk');
const fs = require('fs');
const { TOKEN, GUILD_ID, CLIENT_ID } = require('./config.json');

const rest = new REST({ version: '9' }).setToken(TOKEN);

// Reads the command files and saves the commands to the variable `commands`
// I used this because it was the 'recommended' way to do it.
// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files
const commands = [];
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  // Probably not the best way to do this.
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// Deploys the commands
// Globally if --global flag is passed
// Development guild by default
const init = async () => {
  if (process.argv.includes('--global')) {
    await rest
      .put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      })
      .catch((error) => {
        console.log(chalk.redBright('ERROR IN DEV COMMAND DEPLOY'), error);
      });
  } else {
    await rest
      .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      })
      .catch((error) => {
        console.error(chalk.redBright('ERROR IN DEV COMMAND DEPLOY'), error);
      });
  }
  console.log(chalk.blue('Successfully updated commands.'));
};

init();
