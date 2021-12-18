/* eslint-disable security/detect-object-injection, no-console, max-len,
consistent-return, security/detect-non-literal-require, import/no-dynamic-require, global-require */

/*
 * This is the main entry point for the application.
 * It includes the main application logic, and ties everything else together.
 */

const { Client, Intents, Collection } = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');
const { TOKEN, ACTIVITIES_WATCHING, COOLDOWNS } = require('./config.json');
const { handleConfirmation, handleCommand } = require('./command-handler');

// Deploy commands
// Usually you'd want to run this manually.
// require('child_process').fork('./deploy-commands.js');

// Client & on-ready
const client = new Client({ intents: Intents.FLAGS.GUILDS });

client.once('ready', () => {
  console.log(chalk.green('Ready!'));
});

// Adding commands to a universal collection
// I used this because it was the 'recommended' way to do it.
// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files
client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));
commandFiles.forEach((file) => {
  // Same thing as in deploy-commands
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
});

// Interaction Handler
client.on('interactionCreate', async (interaction) => {
  // Check if the bot made the interaction
  if (interaction.applicationId !== client.user.id) return;

  // For Commands
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({
        content: 'Command not found, sorry.',
        ephemeral: true,
      });
    }
    await handleCommand(command, interaction);
  }

  // For Confirmation Buttons
  if (interaction.isButton()) {
    if (interaction.message.content.includes(interaction.user.id)) await handleConfirmation(interaction);
  }
});

client.on('ready', () => {
  setInterval(() => {
    const index = Math.floor(Math.random() * (ACTIVITIES_WATCHING.length - 1) + 1);
    client.user.setActivity(ACTIVITIES_WATCHING[index], { type: 'WATCHING' });
  }, COOLDOWNS.status_change * 1000);
});

// Start her up
client
  .login(TOKEN)
  .then(() => console.log(chalk.green('Logged in successfully.')));
