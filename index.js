import "dotenv/config";
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import * as fs from "fs";

import {
  handleDcfLogin,
  getPoll,
  getPollId,
  createPoll,
  endPoll,
  getPrediction,
  getPredictionId,
  createPrediction,
  endPrediction,
} from "./twitchApi.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [],
});

// Outputs console log when bot is logged in
client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`); // Logging
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isCommand() || interaction.isChatInputCommand())
    await handleCommand(interaction);
});

async function handleCommand(interaction) {
  const strings = fs.existsSync(`languages/${interaction.locale}.json`)
    ? JSON.parse(fs.readFileSync(`languages/${interaction.locale}.json`))
    : JSON.parse(fs.readFileSync("languages/en-US.json"));
  await interaction.deferReply({ ephemeral: process.env.EPHEMERAL == "true" });
  if (!process.env.ALLOWED_CHANNEL_ID) {
    await interaction.editReply({
      content: strings["no-allowed-channel-id-error"]
        .replace("<channel-id>", interaction.channel.id)
        .replace("<channel-name>", interaction.channel.name),
    });
    return;
  }
  if (interaction.channel.id != process.env.ALLOWED_CHANNEL_ID) {
    await interaction.editReply({
      content: strings["channel-not-allowed-error"]
        .replace("<channel-id>", interaction.channel.id)
        .replace("<channel-name>", interaction.channel.name),
    });
    return;
  }
  switch (interaction.commandName) {
    case "getpoll":
      await getPollCommand(interaction, strings);
      break;
    case "poll":
      await createPollCommand(interaction, strings);
      break;
    case "endpoll":
      await endPollCommand(interaction, strings);
      break;
    case "getprediction":
      await getPredictionCommand(interaction, strings);
      break;
    case "prediction":
      await createPredictionCommand(interaction, strings);
      break;
    case "endprediction":
      await endPredictionCommand(interaction, strings);
      break;
  }
}

async function getPollCommand(interaction, strings) {
  await getPoll(strings)
    .then(async (res) => {
      console.log(res);
      await interaction.editReply({
        content: res.toString(),
      });
    })
    .catch(async (err) => {
      console.log(err);
      await interaction.editReply({
        content: err.toString(),
      });
    });
}

async function createPollCommand(interaction, strings) {
  const title = interaction.options.getString("title");
  const choicesStr = interaction.options.getString("choices").split(";");
  let choicesArr = [];
  for (let i = 0; i < choicesStr.length; i++) {
    choicesArr.push({
      title: choicesStr[i].trim(),
    });
  }
  const duration = interaction.options.getInteger("duration");
  const unit = interaction.options.getString("unit");
  let durationMultiplier = 1;
  if (unit && unit.toLowerCase() == "minutes") durationMultiplier = 60;
  const cppv = interaction.options.getInteger("channelpoints"); // Channel Points Per Vote
  let cpve = cppv > 0; // Channel Points Voting Enabled
  if (cppv > 0 && cppv <= 1000000) {
    cpve = true;
  } else if (cppv < 0) {
    await interaction.editReply({
      content:
        "A viewer cannot cast a  negative amount of Channel Points on a vote!",
    });
    return;
  } else if (cppv > 1000000) {
    await interaction.editReply({
      content: `A viewer can only cast between 1 and 1000000 Channel Points on a vote! You've specified ${cppv}.`,
    });
    return;
  } else {
    cpve = false;
  }
  await createPoll(
    title,
    choicesArr,
    duration * durationMultiplier,
    cpve,
    cppv,
    strings,
  )
    .then(async (res) => {
      await interaction.editReply({
        content: res.toString(),
      });
    })
    .catch(async (err) => {
      await interaction.editReply({
        content: err.toString(),
      });
    });
}

async function endPollCommand(interaction, strings) {
  let status = interaction.options.getString("status");
  if (status.includes(" "))
    // There shouldn't be a space in the value but better safe than sorry
    status = status.substring(0, status.indexOf(" ")).trim();
  await getPollId(strings)
    .then(async (res) => {
      await endPoll(res, status, strings)
        .then(async (res) => {
          await interaction.editReply({
            content: res.toString(),
          });
        })
        .catch(async (err) => {
          await interaction.editReply({
            content: `Error ending Poll on Twitch: ${err}`,
          });
        });
    })
    .catch(async (err) => {
      console.log(err);
      await interaction.editReply({
        content: `Error getting Poll-ID to be ended from Twitch: ${err}`,
      });
    });
}

async function getPredictionCommand(interaction, strings) {
  await getPrediction(strings)
    .then(async (res) => {
      console.log(res);
      await interaction.editReply({
        content: res.toString(),
      });
    })
    .catch(async (err) => {
      console.log(err);
      await interaction.editReply({
        content: `Error getting prediction from Twitch: ${err}`,
      });
    });
}

async function createPredictionCommand(interaction, strings) {
  const title = interaction.options.getString("title");
  const outcomesStr = interaction.options.getString("outcomes").split(";");
  let outcomesArr = [];
  for (let i = 0; i < outcomesStr.length; i++) {
    outcomesArr.push({
      title: outcomesStr[i].trim(),
    });
  }
  const duration = interaction.options.getInteger("duration");
  const unit = interaction.options.getString("unit");
  let durationMultiplier = 1;
  if (unit && unit.toLowerCase() == "minutes") durationMultiplier = 60;
  await createPrediction(
    title,
    outcomesArr,
    duration * durationMultiplier,
    strings,
  )
    .then(async (res) => {
      await interaction.editReply({
        content: res.toString(),
      });
    })
    .catch(async (err) => {
      await interaction.editReply({
        content: `Error creating prediction on Twitch: ${err}`,
      });
    });
}

async function endPredictionCommand(interaction, strings) {
  let status = interaction.options.getString("status");
  if (status.includes(" "))
    // There shouldn't be a space in the value but better safe than sorry
    status = status.substring(0, status.indexOf(" ")).trim();
  const winningOutcomeId =
    interaction.options.getString("winning_outcome_id") ?? undefined;
  await getPredictionId(strings)
    .then(async (res) => {
      await endPrediction(res, status, winningOutcomeId, strings)
        .then(async (res) => {
          await interaction.editReply({
            content: res.toString(),
          });
        })
        .catch(async (err) => {
          await interaction.editReply({
            content: `Error ending Prediction on Twitch: ${err}`,
          });
        });
    })
    .catch(async (err) => {
      await interaction.editReply({
        content: `Error getting Prediction-ID to be ended from Twitch: ${err}`,
      });
    });
}

if (!process.env.DISCORD_TOKEN) {
  console.log(
    "TOKEN not found! You must configure the Discord Token as environment variable or in a .env file before running this bot.",
  );
} else {
  await handleDcfLogin(async () => {
    client.login(process.env.DISCORD_TOKEN);
  });
}
