/* eslint-disable consistent-return */

/*
 * This library is used to keep track of cooldowns.
 * It uses a custom set implementation.
 * There's probably a better way to do this... lol.
 */

const { COOLDOWNS, ADMINS } = require('./config.json');

/**
 * A custom class to store cooldowns in.
 * Stored in a tuple-esque format [user-id, command-name], but it's a string.
 * Thanks to https://stackoverflow.com/a/62076901
 */
class Cooldowns extends Set {
  add(arr) {
    super.add(arr.toString());
  }

  has(arr) {
    return super.has(arr.toString());
  }

  delete(arr) {
    super.delete(arr.toString());
  }
}

// Instantiate the cooldowns set.
const talkedRecently = new Cooldowns();

/**
 * This function is used to add a user to the cooldowns set.
 * Bypasses admins.
 * @param {string} discordUserID The user who is trying to use the command
 * @param {string} commandName The command which we're checking the cooldown for.
 */
function addCooldown(discordUserID, commandName) {
  // Admins bypass cooldowns.
  if (COOLDOWNS.commandName === null || ADMINS.includes(discordUserID)) return;

  talkedRecently.add([discordUserID, commandName]);
  setTimeout(() => {
    talkedRecently.delete([discordUserID, commandName]);
  }, COOLDOWNS.commandName * 1000);
}

/**
 * This function is used to check if a user is a part of the cooldowns set.
 * @param {string} discordUserID The user who is trying to use the command
 * @param {string} commandName The command which we're checking the cooldown for.
 * @returns {bool} `True` if the user is on cooldown, `False` if not.
 */
function hasCooldown(discordUserID, commandName) {
  return talkedRecently.has([discordUserID, commandName]);
}

// Exports
module.exports = {
  addCooldown,
  hasCooldown,
};
