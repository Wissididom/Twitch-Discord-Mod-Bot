async function getStatusResponse(res, json) {
  switch (res.status) {
    case 400:
      return `Bad Request: ${json.message}`;
    case 401:
      return `Unauthorized: ${json.message}`;
    case 404:
      return `Not Found: ${json.message}`;
    case 429:
      return `Too Many Requests: ${json.message}`;
    default:
      return `${json.error} (${res.status}): ${json.message}`;
  }
}

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

function toDiscordTimestamp(twitchTime) {
  return `<t:${Math.floor(Date.parse(twitchTime) / 1000)}:T>`;
}

export { getStatusResponse, buildPollChoices, toDiscordTimestamp };
