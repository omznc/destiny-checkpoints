/* eslint-disable no-console, consistent-return, no-useless-escape */

/*
 * This library is used to connect to the database and provide functions.
 */

const mysql = require('mysql2/promise');
const { DATABASE_SETTINGS, LOCATIONS } = require('./config.json');

// Initial database setup
const db = mysql.createPool(DATABASE_SETTINGS);

// Log whenever a new connection is made in the pool.
// This will get removed later.
db.on('acquire', (connection) => {
  console.log(`DB Connection ${connection.threadId} acquired.`);
});

/**
 * Function to query raw SQL statements.
 * This will not be called directly, but rather through the other functions.
 * @param {string} statement
 * @returns {any} Query result
 * TODO: Error handling?
 */
async function query(statement) {
  const [rows] = await db.execute(statement);
  return rows;
}

/**
 * Sets the last_edited date of an entry to the current date.
 * @param {string} location A valid location name, options restricted in the config file.
 * @param {int} discord_user_id Discord user's ID
 */
async function updateDate(location, discordUserID) {
  query(
    `UPDATE ${location} SET last_edited = CURRENT_TIMESTAMP WHERE discord_user_id = ${discordUserID}`,
  ).catch((e) => console.log(`Error in updateDate: ${e}`));
}

/**
 * Checks if the checkpoint was accessed in the last seconds seconds.
 * @param {int} seconds
 * @returns {bool}
 */
async function isOlderThan(location, discordUserID, seconds) {
  return new Promise((resolve) => {
    query(
      `SELECT last_edited FROM ${location} WHERE discord_user_id = ${discordUserID}`,
    )
      .then((result) => {
        if (result.length === 0) return resolve(false);
        const lastEdited = new Date(result[0].last_edited);
        const now = new Date();
        resolve(now - lastEdited > seconds * 1000);
      })
      .catch((e) => console.log(`Error in isOlderThan: ${e}`));
  });
}

/**
 * Removes the user with the specified `discord_user_id` from the `location` table.
 * @param {int} discord_user_id Discord user's ID
 * @param {string} location A valid location name, options restricted in the config file.
 */
async function removeUserFromLocation(discordUserID, location) {
  await query(
    `DELETE FROM ${location} WHERE discord_user_id = ${discordUserID}`,
  ).catch((e) => console.log(`Error in removeUserFromLocation: ${e}`));
}

/**
 * Removes the user with the specified `discord_user_id` from all locations.
 * @param {int} discord_user_id
 */
async function removeUserFromAllLocations(discordUserID) {
  try {
    LOCATIONS.forEach((location) => removeUserFromLocation(discordUserID, location.id));
  } catch (e) {
    console.log(`Error in removeUserFromAllLocations: ${e}`);
  }
}

/**
 * Checks if the user is banned from using the bot.
 * @param {string} discordUserID
 * @returns {bool} True if banned, false if not.
 */
async function isBanned(discordUserID) {
  return new Promise((resolve) => {
    query(
      `SELECT is_banned FROM registered_users WHERE discord_user_id = ${discordUserID}`,
    )
      .then((result) => {
        resolve(result[0].is_banned === 1);
      })
      .catch(() => resolve(false));
  });
}

/**
 * Increments the user's `checkpoints_shared` stat by 1, in the `registered_users` table.
 * @param {int} discord_user_id
 */
async function incrementSharedCheckpoints(discordUserID) {
  await query(
    `UPDATE registered_users SET checkpoints_shared = checkpoints_shared + 1 WHERE discord_user_id = ${discordUserID}`,
  ).catch((e) => console.log(`Error in incrementSharedCheckpoints: ${e}`));
}

/**
 * Checks if the user is in the `registered_users` table.
 * @param {int} discord_user_id
 * @returns {bool}
 */
async function isRegistered(discordUserID) {
  return new Promise((resolve) => {
    query(
      `SELECT discord_user_id FROM registered_users WHERE discord_user_id = ${discordUserID}`,
    )
      .then((result) => {
        resolve(result.length > 0);
      })
      .catch((e) => console.log(`Error in isRegistered: ${e}`));
  });
}

/**
 * Adds user to the `registered_users` table.
 * @param {*} discord_user_id
 * @param {*} destiny_membership_id
 * @param {*} bungie_name
 */
async function addToRegisteredUsers(
  discordUserID,
  bungieMembershipID,
  bungieName,
) {
  await query(
    `INSERT INTO registered_users (discord_user_id, destiny_membership_id, is_banned, checkpoints_shared, bungie_name) VALUES ("${discordUserID}", "${bungieMembershipID}", 0, 0, "${bungieName}")`,
  ).catch((e) => console.log(`Error in addToRegisteredUsers: ${e}`));
}

/**
 * Removes user from the `registered_users` table.
 * @param {int} discord_user_id
 */
async function removeFromRegisteredUsers(discordUserID) {
  query(
    `DELETE FROM registered_users WHERE discord_user_id = ${discordUserID}`,
  ).catch((e) => console.log(`Error in removeFromRegisteredUsers: ${e}`));
}

/**
 * Fetches the user's destiny membership ID from the `registered_users` table.
 * @param {string} discordUserID
 * @returns {string} bungieMembershipID
 */
async function getDestinyMembershipIDFromDatabase(discordUserID) {
  return new Promise((resolve) => {
    query(
      `SELECT destiny_membership_id FROM registered_users WHERE discord_user_id = ${discordUserID}`,
    )
      .then((result) => {
        resolve(result[0].destiny_membership_id);
      })
      .catch(() => resolve(null));
  });
}

/**
 *
 * @param {string} location
 * @returns {int} Number of checkpoints in the location
 */
async function getNumberOfCheckpointsAtLocation(location) {
  return new Promise((resolve) => {
    query(`SELECT COUNT(*) FROM ${location}`)
      .then((count) => resolve(count[0]['COUNT(*)']))
      .catch(() => resolve(null));
  });
}

/**
 * Returns the bungie name associated with the registered user
 * @param {int} discord_user_id
 * @returns {string} Bungie Username
 */
async function getBungieName(discordUserID) {
  return new Promise((resolve) => {
    query(
      `SELECT bungie_name FROM registered_users WHERE discord_user_id = ${discordUserID}`,
    )
      .then((result) => {
        resolve(result[0].bungie_name);
      })
      .catch(() => resolve(null));
  });
}

/**
 * Returns the oldest accessed checkpoint entry at `location`
 * @param {*} location
 * @returns {string} discord_user_id
 */
async function getOldestCheckpoint(location) {
  return new Promise((resolve) => {
    query(
      `SELECT discord_user_id FROM ${location} ORDER BY last_edited ASC LIMIT 1`,
    )
      .then((result) => {
        if (result.length === 0) return resolve(null);
        resolve(result[0].discord_user_id);
      })
      .catch(() => resolve(null));
  });
}

/**
 * Gets the user's `bungie_name` and `checkpoints_shared`.
 * @param {string} discordUserID Specify a user
 * @returns {dict} {bungie_name, checkpoints_shared}
 */
async function getStats(discordUserID) {
  return new Promise((resolve) => {
    query(
      `SELECT bungie_name, checkpoints_shared FROM registered_users WHERE discord_user_id = ${discordUserID}`,
    )
      .then((result) => {
        resolve(result[0]);
      })
      .catch((e) => console.log(`Error in getStats: ${e}`));
  });
}

/**
 * Gets the top `number` users with the most `checkpoints_shared`.
 * @param {int} number How many top users to return
 * @returns {array[dict]} [{bungie_name, checkpoints_shared}, ...]
 */
async function getTopStats(number) {
  return new Promise((resolve) => {
    query(
      `SELECT bungie_name, checkpoints_shared FROM registered_users ORDER BY checkpoints_shared DESC LIMIT ${number}`,
    )
      .then((result) => {
        resolve(result);
      })
      .catch((e) => console.log(`Error in getTopStats: ${e}`));
  });
}

/**
 * Adds a checkpoint to the `location` table.
 * @param {string} discordUserID
 * @param {string} location
 */
async function addNewCheckpoint(discordUserID, location) {
  await query(
    `INSERT INTO ${location} (discord_user_id, last_edited) VALUES ("${discordUserID}", CURRENT_TIMESTAMP)`,
  ).catch((e) => console.log(`Error in addNewCheckpoint: ${e}`));
}

// TODO: Figure out which ones aren't being used externally.
module.exports = {
  removeUserFromLocation,
  removeUserFromAllLocations,
  removeFromRegisteredUsers,
  incrementSharedCheckpoints,
  isRegistered,
  updateDate,
  getDestinyMembershipIDFromDatabase,
  getNumberOfCheckpointsAtLocation,
  getOldestCheckpoint,
  getBungieName,
  getTopStats,
  getStats,
  isOlderThan,
  addToRegisteredUsers,
  isBanned,
  addNewCheckpoint,
};
