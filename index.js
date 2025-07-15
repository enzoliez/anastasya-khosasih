require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const db = require('./db');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const app = express();
app.get('/', (_, res) => res.send('OwO bot is running with PostgreSQL!'));
app.listen(3000);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const contentLower = message.content.toLowerCase();
  const PREFIX = '!ak';

  if (contentLower.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === 'top') {
      const period = (args[0] || 'daily').toLowerCase();
      const validPeriods = ['daily', 'weekly', 'monthly'];

      if (!validPeriods.includes(period)) {
        return message.reply('❌ Format salah. Gunakan `!aktop`, `!aktop weekly`, atau `!aktop monthly`.');
      }

      await sendManualLeaderboard(message.channel, period);
      return;
    }

    if (command === 'count') {
      let targetUser = message.mentions.users.first();

      if (!targetUser && args[0] && /^\d{17,19}$/.test(args[0])) {
        try {
          targetUser = await client.users.fetch(args[0]);
        } catch {}
      }

      if (!targetUser) {
        targetUser = message.author;
      }

      const counts = await db.getUserCounts(targetUser.id);
      return message.reply(
        `📦 OwO Count untuk **${targetUser.username}**\n` +
        `Daily: ${counts.daily}x\n` +
        `Weekly: ${counts.weekly}x\n` +
        `Monthly: ${counts.monthly}x`
      );
    }
  }

  if (!contentLower.includes('owo')) return;

  const userId = message.author.id;
  await db.incrementCounts(userId);
});

async function sendManualLeaderboard(channel, type) {
  const data = await db.getTopCounts(type, 10);
  const lines = await Promise.all(data.map(async (row, i) => {
    const user = await client.users.fetch(row.user_id);
    const medals = ['🥇','🥈','🥉'];
    const prefix = i < 3 ? medals[i] : `${i + 1}.`;
    return `${prefix} ${user.username}: ${row[type]}x`;
  }));

  const embed = new EmbedBuilder()
    .setTitle(`📊 SERVER APA ${type.charAt(0).toUpperCase() + type.slice(1)} Count`)
    .setDescription(lines.join('\n'))
    .setColor(Math.floor(Math.random() * 16777215));

  await channel.send({ embeds: [embed] });
}

client.login(process.env.TOKEN);
