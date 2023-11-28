import * as fs from "fs";

import { getPoll, getPollId, createPoll, endPoll } from "./polls.js";
import {
  getPrediction,
  getPredictionId,
  createPrediction,
  endPrediction,
} from "./predictions.js";

import open, { openApp, apps } from "open";

import { getStatusResponse } from "./util.js";

async function getUser(clientId, accessToken, login) {
  if (login) {
    return (
      await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .catch((err) => console.error)
    ).data[0];
  } else {
    return (
      await fetch(`https://api.twitch.tv/helix/users`, {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .catch((err) => console.error)
    ).data[0];
  }
}

async function getBroadcaster(clientId, accessToken) {
  return await getUser(clientId, accessToken);
}

async function getBroadcasterId(clientId, accessToken) {
  return (await getBroadcaster(clientId, accessToken)).id;
}

function getScopes() {
  const scopes = [
    "channel:read:polls",
    "channel:read:predictions",
    "channel:manage:polls",
    "channel:manage:predictions",
  ];
  return scopes.join(" ");
}

function getValidationEndpoint() {
  return "https://id.twitch.tv/oauth2/validate";
}

function getRefreshEndpoint(clientId, clientSecret, refreshToken) {
  return `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${encodeURIComponent(
    refreshToken,
  )}&client_id=${clientId}&client_secret=${clientSecret}`;
}

function getAuthorizationEndpoint(
  clientId,
  clientSecret,
  redirectUri,
  port,
  scopes,
) {
  return `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}%3A${port}&response_type=code&scope=${scopes}`;
}

function getAccessTokenByAuthTokenEndpoint(
  clientId,
  clientSecret,
  code,
  redirectUri,
  port,
) {
  return `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}%3A${port}`;
}

function validateTwitchToken(
  clientId,
  clientSecret,
  tokens,
  redirectUri,
  port,
  openBrowser = true,
) {
  return new Promise(async (resolve, reject) => {
    await fetch(getValidationEndpoint(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status) {
          if (res.status == 401) {
            console.log("Trying to refresh with the refresh token");
            await fetch(
              getRefreshEndpoint(clientId, clientSecret, tokens.refresh_token),
              {
                method: "POST",
                headers: {
                  "Client-ID": clientId,
                  Authorization: `Bearer ${tokens.access_token}`,
                },
              },
            )
              .then((res) => res.json())
              .then((res) => {
                if (res.status) {
                  console.log(
                    "Failed to refresh the token! Try to reauthenticate!",
                  );
                  console.log(`Status: ${res.status}`);
                  console.log(`Error-Message: ${res.message}`);
                  console.log(
                    `Open the following Website to authenticate: ${getAuthorizationEndpoint(
                      clientId,
                      clientSecret,
                      redirectUri,
                      port,
                      getScopes(),
                    )}`,
                  );
                  if (openBrowser)
                    open(
                      getAuthorizationEndpoint(
                        clientId,
                        clientSecret,
                        redirectUri,
                        port,
                        getScopes(),
                      ),
                    );
                } else {
                  tokens = res;
                  fs.writeFileSync("./.tokens.json", JSON.stringify(res));
                  console.log("Tokens saved!");
                  resolve("Tokens successfully refreshed!");
                }
              })
              .catch((err) => {
                console.log(
                  "Failed to refresh the token! Try to reauthenticate!",
                );
                console.error(err);
                console.log(
                  `Open the following Website to authenticate: ${getAuthorizationEndpoint(
                    clientId,
                    clientSecret,
                    redirectUri,
                    port,
                    getScopes(),
                  )}`,
                );
                if (openBrowser)
                  open(
                    getAuthorizationEndpoint(
                      clientId,
                      clientSecret,
                      redirectUri,
                      port,
                      getScopes(),
                    ),
                  );
              });
          } else {
            console.log(`Status: ${res.status}`);
            console.log(`Error-Message: ${res.message}`);
            reject("Tokens couldn't be refreshed!");
          }
        } else {
          console.log("Validating...");
          console.log(`Login-Name: ${res.login}`);
          console.log(`User-ID: ${res.user_id}`);
          console.log(`Expires in: ${res.expires_in} seconds`);
          console.log(`Scopes: ${res.scopes.join(", ")}`);
          resolve("Successfully validated!");
        }
      })
      .catch((err) => {
        reject("Validation failed!");
      });
  });
}

export {
  getUser,
  getBroadcaster,
  getBroadcasterId,
  getPoll,
  getPollId,
  createPoll,
  endPoll,
  getPrediction,
  getPredictionId,
  createPrediction,
  endPrediction,
  getScopes,
  getValidationEndpoint,
  getRefreshEndpoint,
  getAuthorizationEndpoint,
  getAccessTokenByAuthTokenEndpoint,
  validateTwitchToken,
};
