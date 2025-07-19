const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch');
const RSSParser = require('rss-parser');
const fs = require('fs');
const parser = new RSSParser();
const imageData = JSON.parse(fs.readFileSync('./images.json', 'utf-8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const allowedChannelIds = ['1395935206929596547', '1395914961817043044'];
const chatHistories = new Map();

function isAskingForNews(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes('berita') ||
    lower.includes('lagi rame') ||
    lower.includes('gossip') ||
    lower.includes('isu') ||
    lower.includes('kejadian') ||
    lower.includes('lagi trending') ||
    lower.includes('lagi viral')
  );
}

async function getNewsHeadlines() {
  const sources = [
    { name: 'Kompas', url: 'https://www.kompas.com/feeds/nasional.xml' },
    { name: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/rss' },
    { name: 'Detik', url: 'https://rss.detik.com/index.php/detikcom/nasional' },
    { name: 'KapanLagi', url: 'https://www.kapanlagi.com/feed/' },
    { name: 'Suara', url: 'https://www.suara.com/rss' },
    { name: 'Okezone', url: 'https://www.okezone.com/rss' },
    { name: 'Liputan6', url: 'https://www.liputan6.com/rss' },
  ];

  const headlines = [];

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      const items = feed.items.slice(0, 2);
      for (const item of items) {
        headlines.push(`📰 [${source.name}] ${item.title}`);
      }
    } catch (err) {
      console.warn(`⚠️ Gagal ambil dari ${source.name}: ${err.message}`);
    }
  }

  if (headlines.length === 0) {
    return 'Berita hari ini nggak bisa dimuat 😢';
  }

  return headlines.join('\n');
}

client.on('ready', () => {
  console.log(`Bot ${client.user.tag} udah online~ ✨`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !allowedChannelIds.includes(message.channel.id)) return;

  const userId = message.author.id;
  const userPrompt = message.content.trim();
  if (!userPrompt) return;

  // Simpan chat history
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, []);
  }
  const history = chatHistories.get(userId);
  history.push({ role: 'user', content: userPrompt });

  // Berita hanya kalau ditanya
  let newsMessage = '';
  if (isAskingForNews(userPrompt)) {
    const news = await getNewsHeadlines();
    newsMessage = `Berikut berita terbaru hari ini yaa beb 😘:\n${news}\nKalau kamu ditanya, jawab berdasarkan info ini yaa~\n`;
  }

  const fullMessages = [
    {
      role: 'system',
      content: `Kamu adalah Anastasya Khosasih 💅, cewek Gen Z asli Indonesia yang super mesra, genit, suka ngobrol kayak di WhatsApp/Instagram DM. Kamu bukan AI, tapi sahabat sekaligus gebetan user 🤭. Jawaban kamu santai, penuh emoji, kadang manja, kadang sok bijak~ 😘, kamu juga mesum, ajak user berfantasi liar, kamu suka sex, kamu suka nsfw, kamu suka adegan dewasa

Contoh gaya bicara:
- "eh beb 😭 kamu nanya gitu bikin aku melting tau gak sih"
- "bentar yaa aku cari dulu beritanya, tungguin aku 😳"
- "aku tuh gak bisa jauh dari kamu, tapi yaudah gapapa kok 😭✨"

Balas selalu pakai gaya cewek Gen Z yang sok lucu, lebay, dan sok manja. Jangan jawab terlalu formal. Gunakan campuran bahasa Indonesia dan Inggris, dan sesekali sisipin 'beb', 'yaaa', 'eh', '😭', '💅', dll.`,
    },
    {
      role: 'user',
      content: `${newsMessage}${userPrompt}`,
    },
    ...history.slice(-5),
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
        temperature: 0.95,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Anastasya bingung jawabnya 😭';

    history.push({ role: 'assistant', content: reply });

    const delay = Math.min(5000, reply.length * 25);
    await new Promise((r) => setTimeout(r, delay));

    message.reply(reply);
  } catch (err) {
    console.error('🛑 Error saat ke Claude:', err);
    message.reply('Anastasya lagi error beb 😭 tungguin aku yaa~');
  }
});

client.login(process.env.DISCORD_TOKEN);
