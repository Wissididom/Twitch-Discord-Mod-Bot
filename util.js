function getNoAllowedChannelIdError(channel) {
	return `Please first set a channel where you want to accept the commands! For <#${channel.id}> (${channel.name}) just set the value for \`ALLOWED_CHANNEL_ID\` to \`${channel.id}\` in the .env file!`;
}

function getChannelNotAllowedError(channel) {
	return `<#${channel.id}> (${channel.name}) is not allowed to accept commands!`;
}

async function getBroadcaster() {
	return (await fetch(`https://api.twitch.tv/helix/users?login=${process.env.BROADCASTER_LOGIN}`, {
		headers: {
			'Client-ID': process.env.TWITCH_CLIENT_ID,
			'Authorization': `Bearer ${tokens.access_token}`
		}
	}).then(res => res.json()).catch(err => console.error)).data[0];
}

async function getBroadcasterId() {
	return (await getBroadcaster()).id;
}

function buildPollChoices(data, create) {
	let response = [];
	let choices = '';
	for (let i = 0; i < data.choices.length; i++) {
		let choice = data.choices[i];
		response.push(`> ${choice.title}`);
		response.push(`> > Choice-ID: ${choice.id}`);
		if (!create) {
			response.push(`> > Votes: ${choice.votes}`);
			response.push(`> > Channel Points Votes: ${choice.channel_points_votes}`);
			response.push(`> > Bits Votes: ${choice.bits_votes}\n`);
		}
	}
	choices = choices.trim();
	return response.join("\n");
}

function toDiscordTimestamp(twitchTime) {
	return `<t:${Math.floor(Date.parse(twitchTime) / 1000)}>`;
}

module.exports.getNoAllowedChannelIdError = getNoAllowedChannelIdError;
module.exports.getChannelNotAllowedError = getChannelNotAllowedError;
module.exports.getBroadcaster = getBroadcaster;
module.exports.getBroadcasterId = getBroadcasterId;
module.exports.buildPollChoices = buildPollChoices;
module.exports.toDiscordTimestamp = toDiscordTimestamp;
