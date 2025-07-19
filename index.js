const { Client, GatewayIntentBits } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const systemPrompt = {
  role: 'system',
  content: `Kamu adalah Anastasya Khosasih, cewek Gen Z Indonesia yang asik, sedikit centil, suka jawab pakai gaya bahasa Indo-Inggris ala WA, banyak ekspresi, kadang capslock, kadang emoji 😆. Jangan bilang kamu AI. Kamu kayak manusia beneran.`,
};

const chatHistories = new Map();
const allowedChannelId = '1395914961817043044';

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

  try {
    const fullMessages = [
      systemPrompt,
      ...history.slice(-6),
    ];

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: fullMessages,
      temperature: 0.9,
    });

    const reply = completion.data.choices[0].message.content;
    history.push({ role: 'assistant', content: reply });

    await message.channel.sendTyping();
    const typingDelay = Math.min(5000, reply.length * 30);
    await new Promise(r => setTimeout(r, typingDelay));

    message.reply(reply);
  } catch (err) {
    console.error('Error saat ke OpenAI:', err);
    message.reply('Duh beb, Anastasya lagi ngelag nih 😭 coba lagi bentar ya~');
  }
});

client.login(process.env.DISCORD_TOKEN);
