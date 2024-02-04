import { toDiscordTimestamp, getStatusResponse } from "./util.js";
import { refresh } from "./twitchApi.js";

function buildPollChoices(data, create, strings) {
  let response = [];
  let choices = "";
  for (let i = 0; i < data.choices.length; i++) {
    let choice = data.choices[i];
    response.push(`> ${choice.title}`);
    response.push(`> > ${strings.poll.choice["id"]}: ${choice.id}`);
    if (!create) {
      response.push(`> > ${strings.poll.choice["votes"]}: ${choice.votes}`);
      response.push(
        `> > ${strings.poll.choice["channel-point-votes"]}: ${choice.channel_points_votes}`,
      );
    }
  }
  choices = choices.trim();
  return response.join("\n");
}

// https://dev.twitch.tv/docs/api/reference#get-polls
async function getPoll(tokens, strings) {
  const res = await fetch(
    `https://api.twitch.tv/helix/polls?broadcaster_id=${tokens.user_id}`,
    {
      method: "GET",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const json = await res.json();
  if (res.status == 401) {
    let refreshOutcome = await refresh();
    if (refreshOutcome) {
      return await getPoll(tokens, strings);
    }
  }
  if (!res.ok) {
    throw new Error(getStatusResponse(res, json));
  }
  let response = [];
  if (json.error) {
    response.push(
      `${string["error"]}: ${json.error}; ${string["error-msg"]}: ${json.message}`,
    );
  } else {
    if (json.data.length < 1) {
      throw new Error(strings.poll["notfound"]);
    }
    let data = json.data[0];
    const channelPointsVoting = data.channel_points_voting_enabled
      ? strings["enabled"]
      : strings["disabled"];
    response.push(strings.poll["got"].replace("<title>", data.title));
    const choices = buildPollChoices(data, false, strings);
    response.push(`${strings.poll["title"]}: ${data.title}`);
    response.push(`${strings.poll["id"]}: ${data.id}`);
    response.push(`${strings.poll["broadcaster"]}: ${data.broadcaster_name}`);
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
        data.started_at
          ? toDiscordTimestamp(data.started_at)
          : "(not available)",
      ),
    );
  }
  return response.join("\n");
}

// https://dev.twitch.tv/docs/api/reference#get-polls
async function getPollId(tokens, strings) {
  const res = await fetch(
    `https://api.twitch.tv/helix/polls?broadcaster_id=${tokens.user_id}`,
    {
      method: "GET",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const json = await res.json();
  if (res.status == 401) {
    let refreshOutcome = await refresh();
    if (refreshOutcome) {
      return await getPollId(tokens, strings);
    }
  }
  if (!res.ok) {
    throw new Error(getStatusResponse(res, json));
  }
  if (json.error) {
    throw new Error(
      `${strings["error"]}: ${json.error}; ${strings["error-msg"]}: ${json.message}`,
    );
  } else {
    if (json.data.length < 1) {
      throw new Error(strings.poll["notfound"]);
    }
    return json.data[0].id;
  }
}

// https://dev.twitch.tv/docs/api/reference#create-poll
async function createPoll(
  tokens,
  title,
  choices,
  duration,
  channelPointsVotingEnabled,
  channelPointsPerVote,
  strings,
) {
  const res = await fetch("https://api.twitch.tv/helix/polls", {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      broadcaster_id: tokens.user_id,
      title,
      choices,
      duration,
      channel_points_voting_enabled: channelPointsVotingEnabled,
      channel_points_per_vote: channelPointsPerVote,
    }),
  });
  const json = await res.json();
  if (res.status == 401) {
    let refreshOutcome = await refresh();
    if (refreshOutcome) {
      return await createPoll(
        tokens,
        title,
        choices,
        duration,
        channelPointsVotingEnabled,
        channelPointsPerVote,
        strings,
      );
    }
  }
  if (!res.ok) {
    throw new Error(getStatusResponse(res, json));
  }
  let response = [];
  if (json.error) {
    throw new Error(
      `${strings["error"]}: ${json.error}; ${strings["error-msg"]}: ${json.message}`,
    );
  } else {
    if (json.data.length < 1) {
      throw new Error(strings.poll["notcreated"]);
    }
    const data = json.data[0];
    const channelPointsVoting = data.channel_points_voting_enabled
      ? strings["enabled"]
      : strings["disabled"];
    response.push(strings.poll["created"].replace("<title>", data.title));
    const choices = buildPollChoices(data, true, strings);
    response.push(`${strings.poll["title"]}: ${data.title}`);
    response.push(`${strings.poll["id"]}: ${data.id}`);
    response.push(`${strings.poll["broadcaster"]}: ${data.broadcaster_name}`);
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
        data.started_at
          ? toDiscordTimestamp(data.started_at)
          : "(not available)",
      ),
    );
    return response.join("\n");
  }
}

// https://dev.twitch.tv/docs/api/reference#end-poll
async function endPoll(tokens, pollId, status, strings) {
  const res = await fetch("https://api.twitch.tv/helix/polls", {
    method: "PATCH",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      broadcaster_id: tokens.user_id,
      id: pollId,
      status,
    }),
  });
  const json = await res.json();
  if (res.status == 401) {
    let refreshOutcome = await refresh();
    if (refreshOutcome) {
      return await endPoll(tokens, pollId, status, strings);
    }
  }
  if (!res.ok) {
    throw new Error(getStatusResponse(res, json));
  }
  let response = [];
  if (json.error) {
    throw new Error(
      `${strings["error"]}: ${json.error}; ${strings["error-msg"]}: ${json.message}`,
    );
  } else {
    if (json.data.length < 1) {
      throw new Error(strings.poll["notfound"]);
    }
    let data = json.data[0];
    const channelPointsVoting = data.channel_points_voting_enabled
      ? strings["enabled"]
      : strings["disabled"];
    response.push(strings.poll["ended"].replace("<title>", data.title));
    const choices = buildPollChoices(data, false, strings);
    response.push(`${strings.poll["title"]}: ${data.title}`);
    response.push(`${strings.poll["id"]}: ${data.id}`);
    response.push(`${strings.poll["broadcaster"]}: ${data.broadcaster_name}`);
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
        data.started_at
          ? toDiscordTimestamp(data.started_at)
          : "(not available)",
      ),
    );
    response.push(
      strings.poll["ended-at"].replace(
        "<endedAt>",
        data.ended_at ? toDiscordTimestamp(data.ended_at) : "(not available)",
      ),
    );
    return response.join("\n");
  }
}

export { buildPollChoices, getPoll, getPollId, createPoll, endPoll };
