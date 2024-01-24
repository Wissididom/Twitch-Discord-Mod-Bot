import * as fs from "fs";

import {
  getPoll as getPollImpl,
  getPollId as getPollIdImpl,
  createPoll as createPollImpl,
  endPoll as endPollImpl,
} from "./polls.js";
import {
  getPrediction as getPredictionImpl,
  getPredictionId as getPredictionIdImpl,
  createPrediction as createPredictionImpl,
  endPrediction as endPredictionImpl,
} from "./predictions.js";

import { getStatusResponse } from "./util.js";

let tokens = {
  access_token: null,
  refresh_token: null,
  device_code: null,
  user_code: null,
  verification_uri: null,
  user_id: null,
};

const SCOPES = ["channel:manage:polls", "channel:manage:predictions"].join(" ");

async function handleDcfLogin(authenticatedCallback) {
  if (fs.existsSync("./.tokens.json")) {
    tokens = JSON.parse(
      fs.readFileSync("./.tokens.json", { encoding: "utf8", flag: "r" }),
    );
    let validated = await validate();
    if (validated) {
      console.log("Validated tokens and started bot");
      await authenticatedCallback();
      return;
    }
  }
  let dcf = await fetch(
    `https://id.twitch.tv/oauth2/device?client_id=${
      process.env.TWITCH_CLIENT_ID
    }&scopes=${encodeURIComponent(SCOPES)}`,
    {
      method: "POST",
    },
  );
  if (dcf.status >= 200 && dcf.status < 300) {
    // Successfully got DCF data
    let dcfJson = await dcf.json();
    tokens.device_code = dcfJson.device_code;
    tokens.user_code = dcfJson.user_code;
    tokens.verification_uri = dcfJson.verification_uri;
    console.log(
      `Open ${tokens.verification_uri} in a browser and enter ${tokens.user_code} there!`,
    );
  }
  let dcfInterval = setInterval(async () => {
    let tokenPair = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${
        process.env.TWITCH_CLIENT_ID
      }&scopes=${encodeURIComponent(SCOPES)}&device_code=${
        tokens.device_code
      }&grant_type=urn:ietf:params:oauth:grant-type:device_code`,
      {
        method: "POST",
      },
    );
    if (tokenPair.status == 400) return; // Probably authorization pending
    if (tokenPair.status >= 200 && tokenPair.status < 300) {
      // Successfully got token pair
      let tokenJson = await tokenPair.json();
      tokens.access_token = tokenJson.access_token;
      tokens.refresh_token = tokenJson.refresh_token;
      let user = await getUser();
      tokens.user_id = user.id;
      fs.writeFileSync("./.tokens.json", JSON.stringify(tokens), {
        encoding: "utf8",
      });
      clearInterval(dcfInterval);
      console.log(
        `Got Device Code Flow Tokens for ${user.display_name} (${user.login}) and started bot`,
      );
      await authenticatedCallback();
      setInterval(
        async () => {
          await validate();
        },
        60 * 60 * 1000 /*Run every hour*/,
      );
    }
  }, 1000);
}

async function getUser() {
  return (
    await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }).then((res) => res.json())
  ).data[0];
}

async function refresh() {
  console.log("Refreshing tokens...");
  let refreshResult = await fetch(
    `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${encodeURIComponent(
      tokens.refresh_token,
    )}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${
      process.env.TWITCH_CLIENT_SECRET
    }`,
    {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${tokens.access_token}`,
      },
    },
  );
  let refreshJson = await refreshResult.json();
  if (refreshResult.status >= 200 && refreshResult.status < 300) {
    // Successfully refreshed
    tokens.access_token = refreshJson.access_token;
    tokens.refresh_token = refreshJson.refresh_token;
    fs.writeFileSync("./.tokens.json", JSON.stringify(tokens), {
      encoding: "utf8",
    });
    console.log("Successfully refreshed tokens!");
    return true;
  } else {
    // Refreshing failed
    console.log(`Failed refreshing tokens: ${JSON.stringify(refreshJson)}`);
    return false;
  }
}

async function validate() {
  tokens = JSON.parse(
    fs.readFileSync(".tokens.json", { encoding: "utf8", flag: "r" }),
  );
  return await fetch("https://id.twitch.tv/oauth2/validate", {
    method: "GET",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${tokens.access_token}`,
    },
  }).then(async (res) => {
    if (res.status) {
      if (res.status == 401) {
        return await refresh();
      } else if (res.status >= 200 && res.status < 300) {
        console.log("Successfully validated tokens!");
        return true;
      } else {
        console.error(
          `Unhandled validation error: ${JSON.stringify(await res.json())}`,
        );
        return false;
      }
    } else {
      console.error(
        `Unhandled network error! res.status is undefined or null! ${res}`,
      );
      return false;
    }
  });
}

async function getPoll(strings) {
  return await getPollImpl(tokens, strings);
}

async function getPollId(strings) {
  return await getPollIdImpl(tokens, strings);
}

async function createPoll(
  title,
  choices,
  duration,
  channelPointsVotingEnabled,
  channelPointsPerVote,
  strings,
) {
  return await createPollImpl(
    tokens,
    title,
    choices,
    duration,
    channelPointsVotingEnabled,
    channelPointsPerVote,
    strings,
  );
}

async function endPoll(pollId, status, strings) {
  return await endPollImpl(tokens, pollId, status, strings);
}

async function getPrediction(strings) {
  return await getPredictionImpl(tokens, strings);
}

async function getPredictionId(strings) {
  return await getPredictionIdImpl(tokens, strings);
}

async function createPrediction(title, outcomes, predictionWindow, strings) {
  return await createPredictionImpl(
    tokens,
    title,
    outcomes,
    predictionWindow,
    strings,
  );
}

async function endPrediction(predictionId, status, winningOutcomeId, strings) {
  return await endPredictionImpl(
    tokens,
    predictionId,
    status,
    winningOutcomeId,
    strings,
  );
}

export {
  handleDcfLogin,
  getUser,
  getPoll,
  getPollId,
  createPoll,
  endPoll,
  getPrediction,
  getPredictionId,
  createPrediction,
  endPrediction,
  refresh,
};
