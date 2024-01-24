function getStatusResponse(res, json) {
  switch (res.status) {
    case 400:
      return `Bad Request: ${json.message}`;
    case 401:
      return `Unauthorized: ${json.message}`;
    case 404:
      return `Not Found: ${json.message}`;
    case 429:
      return `Too Many Requests: ${json.message}`;
    case 500:
      return `Internal Server Error: ${json.message}`;
    default:
      return `${json.error} (${res.status}): ${json.message}`;
  }
}

function toDiscordTimestamp(twitchTime) {
  return `<t:${Math.floor(Date.parse(twitchTime) / 1000)}:T>`;
}

export { getStatusResponse, toDiscordTimestamp };
