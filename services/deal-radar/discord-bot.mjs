import { Client, GatewayIntentBits } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const ingestUrl = process.env.DEAL_RADAR_DISCORD_INGEST_URL ?? "http://web:3000/api/deal-radar/discord";
const internalToken = process.env.DEAL_RADAR_INTERNAL_TOKEN;
const allowedChannels = new Set(
  (process.env.DISCORD_DEAL_CHANNEL_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

if (!token || !internalToken) {
  console.error("DISCORD_BOT_TOKEN and DEAL_RADAR_INTERNAL_TOKEN are required");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once("ready", () => {
  console.log(`Deal Radar Discord connector ready as ${client.user?.tag ?? "unknown"}`);
  console.log(`Watching ${allowedChannels.size || "all authorized"} configured channels`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content?.trim()) return;
  if (allowedChannels.size && !allowedChannels.has(message.channelId)) return;

  try {
    const response = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${internalToken}`,
      },
      body: JSON.stringify({
        guildName: message.guild?.name,
        channelName: "name" in message.channel ? message.channel.name : message.channelId,
        messageId: message.id,
        messageUrl: message.url,
        author: message.author.username,
        content: message.content,
        timestamp: message.createdAt.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("MetaDex ingest failed", response.status, await response.text());
    }
  } catch (error) {
    console.error("MetaDex ingest error", error);
  }
});

await client.login(token);
