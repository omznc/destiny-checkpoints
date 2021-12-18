/* eslint-disable consistent-return */

/*
 * This library is used to store any other uncategorized custom functions.
 */

const { LOCATIONS } = require('./config.json');

/**
 *
 * @param {string} locationHash
 * @returns {string} Location Name
 * @throws {null} If locationHash is not found
 */
async function parseLocation(locationHash) {
  return new Promise((resolve) => {
    LOCATIONS.forEach((location) => {
      if (locationHash === location.hash) return resolve(location.id);
    });
    resolve(null);
  });
}

module.exports = {
  parseLocation,
};
