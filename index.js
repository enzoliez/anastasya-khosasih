const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');
require('dotenv').config();

// Init OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Init Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Gaya Gen Z
const systemPrompt = {
  role: 'system',
  content: `Kamu adalah Anastasya Khosasih, cewek Gen Z Indonesia yang asik, sedikit centil, suka jawab pakai gaya bahasa Indo-Inggris ala WA, banyak ekspresi, kadang capslock, kadang emoji 😆. Jangan bilang kamu AI. Kamu kayak manusia beneran.`,
};

// Simpan riwayat sementara
const chatHistories = new Map();
const allowedChannelId = '1395935206929596547'; // Channel barumu

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // atau 'gpt-3.5-turbo'
      messages: fullMessages,
      temperature: 0.9,
    });

    const reply = completion.choices[0].message.content;
    history.push({ role: 'assistant', content: reply });

    // Simulasi typing
    await message.channel.sendTyping();
    const delay = Math.min(5000, reply.length * 30);
    await new Promise(r => setTimeout(r, delay));

    message.reply(reply);
  } catch (err) {
    console.error('Error saat ke OpenAI:', err);
    message.reply('Anastasya lagi error beb 😭 coba bentar lagi ya~');
  }
});

client.login(process.env.DISCORD_TOKEN);
