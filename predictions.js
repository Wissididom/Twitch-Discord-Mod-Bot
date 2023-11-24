import {
	toDiscordTimestamp
} from './util.js';

// https://dev.twitch.tv/docs/api/reference#get-predictions
async function getPrediction(clientId, accessToken, broadcasterId, strings) {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await fetch(`https://api.twitch.tv/helix/predictions?broadcaster_id=${broadcasterId}`, {
				method: 'GET',
				headers: {
					'Client-ID': clientId,
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				}
			});
			const json = await res.json();
			if (!res.ok) {
				resolve(getStatusResponse(res, json));
				return;
			}
			let response = [];
			if (json.error) {
				response.push(`${strings['error']}: ${json.error}`);
				response.push(`${strings['error-msg']}: ${json.message}`);
			} else {
				if (json.data.length < 1) {
					resolve(strings.prediction['notfound']);
					return;
				}
				let data = json.data[0];
				response.push(strings.prediction['got'].replace('<title>', data.title));
				let outcomes = [];
				for (let i = 0; i < data.outcomes.length; i++) {
					let outcome = data.outcomes[i];
					outcomes.push(`> ${outcome.title}`);
					outcomes.push(`> > ${strings.prediction.outcome['id']}: ${outcome.id}`);
					outcomes.push(`> > ${strings.prediction.outcome['users']}: ${outcome.users}`);
					outcomes.push(`> > ${strings.prediction.outcome['channel-points']}: ${outcome.channel_points}`);
					outcomes.push(`> > ${strings.prediction.outcome['color']}: ${outcome.color}`);
					outcomes.push(`> > ${strings.prediction.outcome['top-predictors']}:`);
					for (let j = 0; outcome.top_predictors && j < outcome.top_predictors.length; j++) {
						let topPredictor = outcome.top_predictors[j].user;
						outcomes.push(`> > > ${strings.prediction.outcome['top-predictor']['user']}: ${topPredictor.name} (${topPredictor.id})`);
						outcomes.push(`> > > > ${strings.prediction.outcome['top-predictor']['channel-points-used']}: ${topPredictor.channel_points_used}`);
						outcomes.push(`> > > > ${strings.prediction.outcome['top-predictor']['channel-points-won']}: ${topPredictor.channel_points_won}`);
					}
				}
				outcomes = outcomes.join("\n").trim();
				response.push(`${strings.prediction['title']}: ${data.title}`);
				response.push(`${strings.prediction['id']}: ${data.id}`);
				response.push(`${strings.prediction['broadcaster']}: ${data.broadcaster_name}`);
				response.push(`${strings.prediction['outcomes']}:\n${outcomes}`);
				response.push(`${strings.prediction['prediction-window']}: ${data.prediction_window} seconds`);
				response.push(`${strings.prediction['status']}: ${data.status}`);
				response.push(strings.prediction['created-at'].replace('<createdAt>', toDiscordTimestamp(data.created_at)));
				response.push(strings.prediction['ended-at'].replace('<endedAt>', toDiscordTimestamp(data.ended_at)));
				response.push(strings.prediction['locked-at'].replace('<lockedAt>', toDiscordTimestamp(data.locked_at)));
			}
			resolve(response.join("\n"));
		} catch (e) {
			reject(e);
		}
	});
}

// https://dev.twitch.tv/docs/api/reference#get-predictions
async function getPredictionId(clientId, accessToken, broadcasterId, strings) {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await fetch(`https://api.twitch.tv/helix/predictions?broadcaster_id=${broadcasterId}`, {
				method: 'GET',
				headers: {
					'Client-ID': clientId,
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				}
			});
			const json = await res.json();
			if (!res.ok) {
				resolve(getStatusResponse(res, json));
				return;
			}
			if (json.error) {
				reject(`${strings['error']}: ${json.error}; ${strings['error-msg']}: ${json.message}`);
			} else {
				if (json.data.length < 1) {
					reject(strings.prediction['notfound']);
					return;
				}
				resolve(json.data[0].id);
			}
		} catch (e) {
			reject(e);
		}
	});
}

// https://dev.twitch.tv/docs/api/reference#create-prediction
async function createPrediction(clientId, accessToken, broadcasterId, title, outcomes, predictionWindow, strings) {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await fetch('https://api.twitch.tv/helix/predictions', {
				method: 'POST',
				headers: {
					'Client-ID': clientId,
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					broadcaster_id: broadcasterId,
					title,
					outcomes,
					prediction_window: predictionWindow
				})
			});
			const json = await res.json();
			if (!res.ok) {
				resolve(getStatusResponse(res, json));
				return;
			}
			let response = [];
			if (json.error) {
				response.push(`${strings['error']}: ${json.error}`);
				response.push(`${strings['error-msg']}: ${json.message}`);
			} else {
				let data = json.data[0];
				response.push(strings.prediction['started'].replace('<title>', data.title));
				let outcomes = [];
				for (let i = 0; i < data.outcomes.length; i++) {
					let outcome = data.outcomes[i];
					outcomes.push(`> ${outcome.title}`);
					outcomes.push(`> > ${strings.prediction.outcome['id']}: ${outcome.id}`);
					outcomes.push(`> > ${strings.prediction.outcome['color']}: ${outcome.color}`);
				}
				response.push(`${strings.prediction['title']}: ${data.title}`);
				response.push(`${strings.prediction['id']}: ${data.id}`);
				response.push(`${strings.prediction['broadcaster']}: ${data.broadcaster_name}`);
				response.push(`${strings.prediction['outcomes']}:\n${outcomes.join("\n")}`);
				response.push(`${strings.prediction['prediction-window']}: ${data.prediction_window} seconds`);
				response.push(`${strings.prediction['status']}: ${data.status}`);
				response.push(strings.prediction['created-at'].replace('<createdAt>', toDiscordTimestamp(data.created_at)));
			}
			resolve(response.join("\n"));
		} catch (e) {
			reject(e);
		}
	});
}

// https://dev.twitch.tv/docs/api/reference#end-prediction
async function endPrediction(clientId, accessToken, broadcasterId, predictionId, status, winningOutcomeId, strings) {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await fetch('https://api.twitch.tv/helix/predictions', {
				method: 'PATCH',
				headers: {
					'Client-ID': process.env.TWITCH_CLIENT_ID,
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					broadcaster_id: broadcasterId,
					id: predictionId,
					status: status,
					winning_outcome_id: winningOutcomeId
				})
			});
			const json = await res.json();
			if (!res.ok) {
				resolve(getStatusResponse(res, json));
				return;
			}
			let response = [];
			if (json.error) {
				response.push(`${strings['error']}: ${json.error}`);
				response.push(`${strings['error-msg']}: ${json.message}`);
			} else {
				let data = json.data[0];
				response.push(strings.prediction['ended'].replace('<title>', data.title));
				let outcomes = [];
				for (let i = 0; i < data.outcomes.length; i++) {
					let outcome = data.outcomes[i];
					outcomes.push(`> ${outcome.title}`);
					outcomes.push(`> > ${strings.prediction.outcome['id']}: ${outcome.id}`);
					outcomes.push(`> > ${strings.prediction.outcome['users']}: ${outcome.users}`);
					outcomes.push(`> > ${strings.prediction.outcome['channel-points']}: ${outcome.channel_points}`);
					outcomes.push(`> > ${strings.prediction.outcome['color']}: ${outcome.color}`);
					outcomes.push(`> > ${strings.prediction.outcome['top-predictors']}:`);
					for (let j = 0; outcome.top_predictors && j < outcome.top_predictors.length; j++) {
						let topPredictor = outcome.top_predictors[j].user;
						outcomes.push(`> > > ${strings.prediction.outcome['top-predictor']['user']}: ${topPredictor.name} (${topPredictor.id})`);
						outcomes.push(`> > > > ${strings.prediction.outcome['top-predictor']['channel-points-used']}: ${topPredictor.channel_points_used}`);
						outcomes.push(`> > > > ${strings.prediction.outcome['top-predictor']['channel-points-won']}: ${topPredictor.channel_points_won}\n`);
					}
				}
				outcomes = outcomes.join("\n").trim();
				response.push(`${strings.prediction['title']}: ${data.title}`);
				response.push(`${strings.prediction['id']}Prediction-ID: ${data.id}`);
				response.push(`${strings.prediction['broadcaster']}Broadcaster: ${data.broadcaster_name}`);
				response.push(`${strings.prediction['outcomes']}Outcomes:\n${outcomes}`);
				response.push(`${strings.prediction['prediction-window']}: ${data.prediction_window} seconds\n`);
				response.push(`${strings.prediction['status']}Prediction-Status: ${data.status}`);
				response.push(strings.prediction['created-at'].replace('<createdAt>', toDiscordTimestamp(data.created_at)));
				response.push(strings.prediction['ended-at'].replace('<endedAt>', toDiscordTimestamp(data.ended_at)));
				response.push(strings.prediction['locked-at'].replace('<lockedAt>', toDiscordTimestamp(data.locked_at)));
			}
			resolve(response.join("\n"));
		} catch (e) {
			reject(e);
		}
	});
}

export { getPrediction, getPredictionId, createPrediction, endPrediction };
