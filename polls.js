import { buildPollChoices, toDiscordTimestamp } from "./util.js";

// https://dev.twitch.tv/docs/api/reference#get-polls
async function getPoll(clientId, accessToken, broadcasterId, strings) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        `https://api.twitch.tv/helix/polls?broadcaster_id=${broadcasterId}`,
        {
          method: "GET",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      const json = await res.json();
      if (!res.ok) {
        resolve(getStatusResponse(res, json));
        return;
      }
      let response = [];
      if (json.error) {
        response.push(`${string["error"]}: ${json.error}`);
        response.push(`${string["error-msg"]}: ${json.message}`);
      } else {
        if (json.data.length < 1) {
          resolve(strings.poll["notfound"]);
          return;
        }
        let data = json.data[0];
        const channelPointsVoting = data.channel_points_voting_enabled
          ? strings["enabled"]
          : strings["disabled"];
        response.push(strings.poll["got"].replace("<title>", data.title));
        const choices = buildPollChoices(data, false, strings);
        response.push(`${strings.poll["title"]}: ${data.title}`);
        response.push(`${strings.poll["id"]}: ${data.id}`);
        response.push(
          `${strings.poll["broadcaster"]}: ${data.broadcaster_name}`,
        );
        response.push(`${strings.poll["choices"]}:\n${choices}`);
        response.push(
          strings.poll["channel-points-voting"].replace(
            "<channelPointsVoting>",
            channelPointsVoting,
          ),
        );
        response.push(`${strings.poll["status"]}: ${data.status}`);
        response.push(`${strings.poll["duration"]}: ${data.duration} seconds`);
        response.push(
          strings.poll["started-at"].replace(
            "<startedAt>",
            toDiscordTimestamp(data.started_at),
          ),
        );
      }
      resolve(response.join("\n"));
    } catch (e) {
      reject(e);
    }
  });
}

// https://dev.twitch.tv/docs/api/reference#get-polls
async function getPollId(clientId, accessToken, broadcasterId, strings) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        `https://api.twitch.tv/helix/polls?broadcaster_id=${broadcasterId}`,
        {
          method: "GET",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      const json = await res.json();
      if (!res.ok) {
        resolve(getStatusResponse(res, json));
        return;
      }
      if (json.error) {
        reject(
          `${strings["error"]}: ${json.error}; ${strings["error-msg"]}: ${json.message}`,
        );
      } else {
        if (json.data.length < 1) {
          reject(strings.poll["notfound"]);
          return;
        }
        resolve(json.data[0].id);
      }
    } catch (e) {
      reject(e);
    }
  });
}

// https://dev.twitch.tv/docs/api/reference#create-poll
async function createPoll(
  clientId,
  accessToken,
  broadcasterId,
  title,
  choices,
  duration,
  channelPointsVotingEnabled,
  channelPointsPerVote,
  strings,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch("https://api.twitch.tv/helix/polls", {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          broadcaster_id: broadcasterId,
          title,
          choices,
          duration,
          channel_points_voting_enabled: channelPointsVotingEnabled,
          channel_points_per_vote: channelPointsPerVote,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        resolve(getStatusResponse(res, json));
        return;
      }
      const response = [];
      if (json.error) {
        response.push(`${strings["error"]}: ${json.error}`);
        response.push(`${strings["error-msg"]}: ${json.message}`);
        console.log(`Create-Poll-Error: ${JSON.stringify(json)}`);
      } else {
        if (json.data.length < 1) {
          resolve(strings.poll["notcreated"]);
          return;
        }
        const data = json.data[0];
        const channelPointsVoting = data.channel_points_voting_enabled
          ? strings["enabled"]
          : strings["disabled"];
        response.push(strings.poll["created"].replace("<title>", data.title));
        const choices = buildPollChoices(data, true, strings);
        response.push(`${strings.poll["title"]}: ${data.title}`);
        response.push(`${strings.poll["id"]}: ${data.id}`);
        response.push(
          `${strings.poll["broadcaster"]}: ${data.broadcaster_name}`,
        );
        response.push(`${strings.poll["choices"]}:\n${choices}`);
        response.push(
          strings.poll["channel-points-voting"].replace(
            "<channelPointsVoting>",
            channelPointsVoting,
          ),
        );
        response.push(`${strings.poll["status"]}: ${data.status}`);
        response.push(`${strings.poll["duration"]}: ${data.duration} seconds`);
        response.push(
          strings.poll["started-at"].replace(
            "<startedAt>",
            toDiscordTimestamp(data.started_at),
          ),
        );
      }
      resolve(response.join("\n"));
    } catch (e) {
      reject(e);
    }
  });
}

// https://dev.twitch.tv/docs/api/reference#end-poll
async function endPoll(
  clientId,
  accessToken,
  broadcasterId,
  pollId,
  status,
  strings,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch("https://api.twitch.tv/helix/polls", {
        method: "PATCH",
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          broadcaster_id: broadcasterId,
          id: pollId,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        resolve(getStatusResponse(res, json));
        return;
      }
      let response = [];
      if (json.error) {
        response.push(`${strings["error"]}: ${json.error}`);
        response.push(`${strings["error-msg"]}: ${json.message}`);
      } else {
        if (json.data.length < 1) {
          resolve(strings.poll["notfound"]);
          return;
        }
        let data = json.data[0];
        const channelPointsVoting = data.channel_points_voting_enabled
          ? strings["enabled"]
          : strings["disabled"];
        response.push(strings.poll["ended"].replace("<title>", data.title));
        const choices = buildPollChoices(data, false, strings);
        response.push(`${strings.poll["title"]}: ${data.title}`);
        response.push(`${strings.poll["id"]}: ${data.id}`);
        response.push(
          `${strings.poll["broadcaster"]}: ${data.broadcaster_name}`,
        );
        response.push(`${strings.poll["choices"]}:\n${choices}`);
        response.push(
          strings.poll["channel-points-voting"].replace(
            "<channelPointsVoting>",
            channelPointsVoting,
          ),
        );
        response.push(`${strings.poll["status"]}: ${data.status}`);
        response.push(`${strings.poll["duration"]}: ${data.duration} seconds`);
        response.push(
          strings.poll["started-at"].replace(
            "<startedAt>",
            toDiscordTimestamp(data.started_at),
          ),
        );
        response.push(
          strings.poll["ended-at"].replace(
            "<endedAt>",
            toDiscordTimestamp(data.ended_at),
          ),
        );
      }
      resolve(response.join("\n"));
    } catch (e) {
      reject(e);
    }
  });
}

export { getPoll, getPollId, createPoll, endPoll };
