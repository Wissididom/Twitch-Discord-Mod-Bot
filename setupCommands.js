import * as DotEnv from "dotenv";
DotEnv.config();
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error(
    "DISCORD_TOKEN not found! You must setup the Discord TOKEN in the .env file or as environment variable first!",
  );
}

const rest = new REST().setToken(token);

const commands = [
  new SlashCommandBuilder()
    .setName("getpoll")
    .setNameLocalizations({ de: "umfrageabrufen" })
    .setDescription(
      "Get information about the most recent poll in the authorized Twitch channel",
    )
    .setDescriptionLocalizations({
      de: "Informationen über die letzte Umfrage des authorisierten Twitch-Kanals abrufen",
    }),
  new SlashCommandBuilder()
    .setName("poll")
    .setNameLocalizations({ de: "umfrage" })
    .setDescription("Create a poll in the authorized Twitch channel")
    .setDescriptionLocalizations({
      de: "Eine Umfrage im authorisierten Twitch-Kanal erstellen",
    })
    .addStringOption((option) =>
      option
        .setName("title")
        .setNameLocalizations({ de: "frage" })
        .setDescription("Title displayed in the poll")
        .setDescriptionLocalizations({
          de: "Der Titel, der in der Umfrage angezeigt werden soll",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("choices")
        .setNameLocalizations({ de: "antworten" })
        .setDescription("List of the poll choices (separated by semicolon)")
        .setDescriptionLocalizations({
          de: "Eine Liste an Antwortmöglichkeiten (getrennt durch Strichpunkte/Semikolon)",
        })
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setNameLocalizations({ de: "dauer" })
        .setDescription("Total duration for the poll (Default: in seconds).")
        .setDescriptionLocalizations({
          de: "Gesamtdauer der Umfrage (Standardmäßig in Sekunden)",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("unit")
        .setNameLocalizations({ de: "einheit" })
        .setDescription("Which unit to use for the duration")
        .setDescriptionLocalizations({
          de: "Welche Einheit soll für die Dauer genutzt werden",
        })
        .setChoices(
          {
            name: "Minutes",
            nameLocalizations: {
              de: "Minuten",
            },
            value: "minutes",
          },
          {
            name: "Seconds",
            nameLocalizations: {
              de: "Sekunden",
            },
            value: "seconds",
          },
        )
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("channelpoints")
        .setNameLocalizations({ de: "kanalpunkte" })
        .setDescription(
          "Number of Channel Points required to vote once with Channel Points.",
        )
        .setDescriptionLocalizations({
          de: "Anzahl der Kanalpunkte, die für eine Stimme mit Kanalpunkten benötigt wird",
        })
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("endpoll")
    .setNameLocalizations({ de: "umfragebeenden" })
    .setDescription("End the poll that is currently active")
    .setDescriptionLocalizations({
      de: "Die Umfrage, die aktuell läuft, beenden",
    })
    .addStringOption((option) =>
      option
        .setName("status")
        .setNameLocalizations({ de: "status" })
        .setDescription("The poll status to be set")
        .setDescriptionLocalizations({
          de: "Die Umfrage, die aktuell läuft, beenden",
        })
        .setChoices(
          {
            name: "Terminated (End the poll manually, but allow it to be viewed publicly)",
            nameLocalizations: {
              de: "Beendet (Umfrage manuell beenden, aber öffentlich sichtbar lassen)",
            },
            value: "TERMINATED",
          },
          {
            name: "Archived (End the poll manually and do not allow it to be viewed publicly)",
            nameLocalizations: {
              de: "Archiviert (Umfrage manuell beenden und auf privat stellen)",
            },
            value: "ARCHIVED",
          },
        )
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("getprediction")
    .setNameLocalizations({ de: "vorhersageabrufen" })
    .setDescription(
      "Get information about the most recent prediction in the authorized Twitch channel",
    )
    .setDescriptionLocalizations({
      de: "Informationen über die letzte Vorhersage des authorisierten Twitch-Kanals abrufen",
    }),
  new SlashCommandBuilder()
    .setName("prediction")
    .setNameLocalizations({ de: "vorhersage" })
    .setDescription("Create a prediction in the authorized Twitch channel")
    .setDescriptionLocalizations({
      de: "Eine Vorhersage im authorisierten Twitch-Kanal erstellen",
    })
    .addStringOption((option) =>
      option
        .setName("title")
        .setNameLocalizations({ de: "titel" })
        .setDescription("Title for the prediction")
        .setDescriptionLocalizations({
          de: "Titel für die Vorhersage",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("outcomes")
        .setNameLocalizations({ de: "ergebnisse" })
        .setDescription("List of the outcomes (separated by semicolon)")
        .setDescriptionLocalizations({
          de: "Liste der möglichen Ergebnisse (getrennt durch Strichpunkte/Semikolon)",
        })
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setNameLocalizations({ de: "dauer" })
        .setDescription(
          "Total duration for the prediction (Default: in seconds)",
        )
        .setDescriptionLocalizations({
          de: "Gesamtdauer der Vorhersage (Standardmäßig in Sekunden)",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("unit")
        .setNameLocalizations({ de: "einheit" })
        .setDescription("Which unit to use for duration")
        .setDescriptionLocalizations({
          de: "Welche Einheit soll für die Dauer genutzt werden",
        })
        .setChoices(
          {
            name: "Minutes",
            nameLocalizations: {
              de: "Minuten",
            },
            value: "minutes",
          },
          {
            name: "Seconds",
            nameLocalizations: {
              de: "Sekunden",
            },
            value: "seconds",
          },
        )
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("endprediction")
    .setNameLocalizations({ de: "vorhersagebeenden" })
    .setDescription("Lock, resolve, or cancel a prediction")
    .setDescriptionLocalizations({
      de: "Eine Vorhersage sperren, auflösen oder abbrechen",
    })
    .addStringOption((option) =>
      option
        .setName("status")
        .setNameLocalizations({ de: "status" })
        .setDescription("The prediction status to be set")
        .setDescriptionLocalizations({
          de: "Der Status, auf den die Vorhersage gesetzt werden soll",
        })
        .setChoices(
          {
            name: "Resolved (A winning outcome has been chosen and the Channel Points have been distributed)",
            nameLocalizations: {
              de: "Aufgelöst (Ein Gewinner wurde ausgewählt und die Kanalpunkte wurden verteilt)",
            },
            value: "RESOLVED",
          },
          {
            name: "Canceled (The prediction has been canceled and the Channel Points have been refunded)",
            nameLocalizations: {
              de: "Abgebrochen (Die Vorhersage wurde abgebrochen und die Kanalpunkte wurden zurückerstattet)",
            },
            value: "CANCELED",
          },
          {
            name: "Locked (The prediction has been locked and viewers can no longer make predictions)",
            nameLocalizations: {
              de: "Gesperrt (Die Vorhersage wurde gesperrt und Zuschauer können nicht länger vorhersagen)",
            },
            value: "LOCKED",
          },
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("winning_outcome_id")
        .setNameLocalizations({ de: "gewinnendes_ergebnis_id" })
        .setDescription(
          'ID of the winning outcome for the prediction (Required if status is "Resolved")',
        )
        .setDescriptionLocalizations({
          de: 'ID des Ergebnisses, welches die Vorhersage gewinnen soll (Erforderlich, wenn status "Aufgelöst" ist)',
        })
        .setRequired(false),
    ),
];

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );
    const userData = await rest.get(Routes.user());
    const userId = userData.id;
    const data = await rest.put(Routes.applicationCommands(userId), {
      body: commands,
    });
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (err) {
    console.error(err);
  }
})();
