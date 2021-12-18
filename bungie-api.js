/* eslint-disable security/detect-object-injection, no-restricted-syntax,
no-undef, consistent-return, no-console */

/*
 * This library is used to directly access the Bungie API.
 * The API key is stored in config.json.
 */

const axios = require('axios');
const rateLimit = require('axios-rate-limit');
const { getDestinyMembershipIDFromDatabase } = require('./database');
const { parseLocation } = require('./utils');
const { BUNGIE_API } = require('./config.json');

// Rate limts all requests sent to the Bungie API to be no more than 20/second.
const http = rateLimit(axios.create(), { maxRPS: 20 });

/**
 * Makes a request to the Bungie API to get the location.
 * Works only with Steam users... I think.
 * and the number of free slots (if applicable) of a player.
 * Thanks to https://tadpolefeet.com
 * @param {string} discordUserID
 * @returns {[string, int]} [currentActivityHash, slots]
 */
async function getActivityAndSlots(discordUserID) {
  return new Promise((resolve) => {
    getDestinyMembershipIDFromDatabase(discordUserID)
      .then(
        async (membershipID) => {
          await http
            .get(
              `https://www.bungie.net/Platform/Destiny2/3/Profile/${membershipID}/?components=1000,204`,
              {
                headers: {
                  'X-API-Key': BUNGIE_API.KEY,
                },
              },
            )
            .then((response) => {
              if (response.status === 200) {
                const output = response.data.Response;

                try {
                  time = output.profileTransitoryData.data.currentActivity.startTime;
                } catch (e) {
                  return resolve(null);
                }

                const characters = output.characterActivities.data;

                // eslint-disable-next-line max-len
                if (output.profileTransitoryData.data.joinability.privacySetting !== 0) resolve(null);

                // TODO: Stop using for-in loop.
                for (const key in characters) {
                  if (
                    characters[key].currentActivityHash !== 0
                  && characters[key].dateActivityStarted === time
                  ) {
                    resolve(
                      [characters[key].currentActivityHash,
                        output.profileTransitoryData.data.joinability.openSlots],
                    );
                  }
                }
                return resolve(null);
              }
            })
            .catch((e) => {
              console.log(e);
              resolve(null);
            });
        },
      );
  });
}

/**
 * Uses the `discordUserID` to call `getActivityAndSlots`, then translates that to a `location`.
 * If the user is at a valid location, it returns the `parsedLocation` name of the location.
 * If the user isn't at a valid location, it returns `null`
 * If the user is offline, it returns `null`.
 * @param {string} discordUserID
 * @returns {string} `parsedLocation`
 */
async function getLocationFromBungie(discordUserID) {
  return new Promise((resolve) => {
    getActivityAndSlots(discordUserID).then((response) => {
      if (response === null) return resolve(null);
      parseLocation(response[0]).then((location) => {
        if (location == null) return resolve(null);
        resolve(location);
      });
    });
  });
}

/**
 * Returns Username and Membership ID of a user who authenticated
 * @param {registration_code} code Gotten from auth.kewlkez.com after using /register
 * @returns {{string, string}} {username, membershipID}
 */
async function getDestinyMembershipIDAndBungieName(code) {
  return new Promise((resolve) => {
    const data = new URLSearchParams();
    data.append('grant_type', 'authorization_code');
    data.append('code', code);
    data.append('client_id', BUNGIE_API.CLIENT_ID);
    data.append('client_secret', BUNGIE_API.CLIENT_SECRET);
    http
      .post('https://www.bungie.net/Platform/App/OAuth/Token/', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((response1) => {
        http
          .get(
            `http://www.bungie.net/platform/User/GetBungieAccount/${response1.data.membership_id}/254/`,
            {
              headers: {
                'X-API-Key': BUNGIE_API.KEY,
              },
            },
          )
          .then((response2) => {
            console.log();
            resolve({
              username: response2.data.Response.bungieNetUser.uniqueName,
              membership_id: response2.data.Response.destinyMemberships[0].membershipId,
            });
          });
      })
      .catch(() => {
        console.log(
          `Error in registration. Probably wrong code - provided code: ${code}`,
        );
        resolve(null);
      });
  });
}

module.exports = {
  getActivityAndSlots,
  getLocationFromBungie,
  getDestinyMembershipIDAndBungieName,
};
