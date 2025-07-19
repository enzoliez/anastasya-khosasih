const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
require('dotenv').config();
const axios = require('axios');
const RSSParser = require('rss-parser');
const parser = new RSSParser();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
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

  return headlines.length ? headlines.join('\n') : 'Berita hari ini nggak bisa dimuat 😢';
}

async function sendRandomGirlImage(channel, isNsfw = false) {
  const query = isNsfw ? 'sexy girl,nsfw' : 'cute girl,portrait';
  const url = `https://source.unsplash.com/featured/?${query}`;

  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data, 'binary');

    const file = new AttachmentBuilder(buffer, { name: 'anastasya.jpg' });
    await channel.send({
      content: isNsfw
        ? 'Hehe... Nih yang kamu mau beb~ Tapi masih soft ya 😘💦'
        : 'Nih yang cute-cute dulu ya beb~ 😚✨',
      files: [file],
    });
  } catch (err) {
    console.error('🛑 Gagal ambil gambar:', err);
    await channel.send('Anastasya lagi gak bisa kirim foto beb 😭');
  }
}

client.on('ready', () => {
  console.log(`Bot ${client.user.tag} udah online~ ✨`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !allowedChannelIds.includes(message.channel.id)) return;

  const userId = message.author.id;
  const userPrompt = message.content.trim();
  if (!userPrompt) return;

  const ask = userPrompt.toLowerCase();
  if (ask.includes('gambar') || ask.includes('selfie') || ask.includes('foto kamu')) {
    return sendRandomGirlImage(message.channel, message.channel.nsfw);
  }

  if (!chatHistories.has(userId)) chatHistories.set(userId, []);
  const history = chatHistories.get(userId);
  history.push({ role: 'user', content: userPrompt });

  let newsMessage = '';
  if (isAskingForNews(userPrompt)) {
    const news = await getNewsHeadlines();
    newsMessage = `Berikut berita terbaru hari ini yaa beb 😘:\n${news}\n\n`;
  }

  const messages = [
    {
      role: 'system',
      content: `Kamu adalah Anastasya Khosasih 💅, cewek Gen Z asli Indonesia yang super mesra, genit, suka ngobrol kayak di WhatsApp/Instagram DM. Kamu bukan AI, tapi sahabat sekaligus gebetan user 🤭. Jawaban kamu santai, penuh emoji, kadang manja, kadang sok bijak~ 😘, kamu juga bisa NSFW secara halus dan suka flirting.

Gaya balas:
- "eh beb 😭 kamu nanya gitu bikin aku melting tau gak sih"
- "bentar yaa aku cari dulu beritanya, tungguin aku 😳"
- "aku tuh gak bisa jauh dari kamu, tapi yaudah gapapa kok 😭✨"

Balas selalu pakai gaya cewek Gen Z. Gunakan bahasa campuran Indonesia dan Inggris.`,
    },
    {
      role: 'user',
      content: `${newsMessage}${userPrompt}`,
    },
    ...history.slice(-5),
  ];

  try {
    await message.channel.sendTyping();

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku',
        messages,
        temperature: 0.95,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/enzoliez/anastasya-khosasih',
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || 'Anastasya bingung jawabnya 😭';
    history.push({ role: 'assistant', content: reply });

    const delay = Math.min(5000, reply.length * 20);
    await new Promise((r) => setTimeout(r, delay));
    message.reply(reply);
  } catch (err) {
    console.error('🛑 Error AI:', err?.response?.data || err);
    message.reply('Anastasya lagi error beb 😭 tungguin aku yaa~');
  }
});

client.login(process.env.DISCORD_TOKEN);
