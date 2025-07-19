const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const allowedChannelId = '1395935206929596547';

const chatHistories = new Map();

client.on('ready', () => {
  console.log(`Bot ${client.user.tag} udah online~ ✨`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== allowedChannelId) return;

  const userId = message.author.id;
  const userPrompt = message.content.trim();
  if (!userPrompt) return;

  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, []);
  }

  const history = chatHistories.get(userId);
  history.push({ role: 'user', content: userPrompt });

  const fullMessages = [
    {
      role: 'system',
      content: `Kamu adalah Anastasya Khosasih, cewek Gen Z Indonesia yang asik, suka nyaut pakai gaya WA, campur Indo-Inggris, banyak emoji dan capslock. Kamu bukan AI, tapi cewek asli yang suka ngobrol santai. Jangan terlalu formal.`,
    },
    ...history.slice(-6),
  ];

  try {
    await message.channel.sendTyping();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/enzoliez/anastasya-khosasih',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: fullMessages,
        temperature: 0.9,
      }),
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || 'Anastasya bingung mau jawab apa beb 😅';
    history.push({ role: 'assistant', content: reply });

    const delay = Math.min(5000, reply.length * 25);
    await new Promise((r) => setTimeout(r, delay));

    message.reply(reply);
  } catch (err) {
    console.error('🛑 Error saat ke Claude (OpenRouter):', err);
    message.reply('Anastasya lagi error beb 😭 mungkin OpenRouter-nya ngambek.');
  }
});

client.login(process.env.DISCORD_TOKEN);
