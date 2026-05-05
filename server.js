const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Load constitution data
const constitutionData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/ABCRE-constitution-chunks.json'), 'utf8')
);

// Initialize Telegram Bot (webhook mode for Vercel)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory user tracking
const users = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ABCRE Constitutional Concierge',
    version: '1.0.0'
  });
});

// API endpoint for web widget
app.post('/api/query', async (req, res) => {
  const { query, userId } = req.body;
  
  // TODO: Implement authentication and rate limiting
  // TODO: Process query through AI with constitution context
  
  res.json({
    query,
    response: 'API endpoint ready for web widget integration',
    status: 'development'
  });
});

// Telegram webhook endpoint
app.post('/webhook/telegram', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Payment endpoints
const { createCheckoutSession, handleWebhook, PRICING_TIERS } = require('./src/payments');

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { tier, userId, telegramId } = req.body;
    const session = await createCheckoutSession(tier, userId, telegramId);
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pricing information
app.get('/api/pricing', (req, res) => {
  res.json(PRICING_TIERS);
});

// Stripe webhook for subscriptions
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    await handleWebhook(req.body, sig);
    res.json({received: true});
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Bot command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      tier: 'free',
      queriesToday: 0,
      lastQueryDate: new Date().toDateString()
    });
  }

  const welcomeMessage = `🇦🇬 **Welcome to the A.B.C.R.E. Constitutional Concierge!**

I'm your AI guide to the Constitution of Antigua and Barbuda.

**What I can do:**
🔍 Search the Constitution by keyword
📚 Explain sections in plain English
⚖️ Help you understand your rights
🏛️ Explain government structure
📰 Track constitutional reform

**Commands:**
/search [term] - Search the Constitution
/section [number] - Get specific section
/rights - List your fundamental rights
/government - How government works
/reform - Amendment process
/subscribe - Upgrade to premium
/help - Show all commands

**Free tier:** 3 queries per day
**Premium:** Unlimited access + more features

*Built for A.B.C.R.E. by Hemisphere Claw Agency*`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/search (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const searchTerm = match[1].toLowerCase();

  if (!checkQueryLimit(userId)) {
    bot.sendMessage(chatId, 
      `⚠️ You've reached your daily limit (3 queries).\n\n` +
      `Upgrade to Premium for unlimited access:\n` +
      `/subscribe`
    );
    return;
  }

  const results = searchConstitution(searchTerm);
  
  if (results.length === 0) {
    bot.sendMessage(chatId, 
      `❌ No results found for "${match[1]}".\n\n` +
      `Try different keywords or use /help for search tips.`
    );
    return;
  }

  let response = `🔍 **Search Results for "${match[1]}"**\n\n`;
  results.slice(0, 3).forEach((result, index) => {
    response += `${index + 1}. **${result.metadata.title}**\n`;
    response += `   Section ${result.metadata.section}\n`;
    response += `   ${result.text.substring(0, 150)}...\n\n`;
  });

  response += `💡 *Upgrade to Premium for full text and unlimited searches*`;
  
  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  incrementQueryCount(userId);
});

bot.onText(/\/section (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const sectionNum = match[1];

  if (!checkQueryLimit(userId)) {
    bot.sendMessage(chatId, 
      `⚠️ You've reached your daily limit (3 queries).\n\n` +
      `Upgrade to Premium for unlimited access:\n` +
      `/subscribe`
    );
    return;
  }

  const section = getSection(sectionNum);
  
  if (!section) {
    bot.sendMessage(chatId, 
      `❌ Section ${sectionNum} not found.\n\n` +
      `The Constitution has sections numbered 1-127.\n` +
      `Try: /section 12 (for freedom of expression)`
    );
    return;
  }

  const response = `📜 **Section ${section.metadata.section}: ${section.metadata.title}**\n\n` +
    `${section.text.substring(0, 800)}\n\n` +
    `(Page ${section.metadata.page})\n\n` +
    `💡 *Upgrade to Premium for plain English explanation*`;

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  incrementQueryCount(userId);
});

bot.onText(/\/rights/, (msg) => {
  const chatId = msg.chat.id;
  
  const response = `⚖️ **Your Fundamental Rights** (Chapter II)\n\n` +
    `**1. Right to Life** (Section 4)\n` +
    `**2. Right to Personal Liberty** (Section 5)\n` +
    `**3. Freedom from Slavery** (Section 6)\n` +
    `**4. Protection from Inhuman Treatment** (Section 7)\n` +
    `**5. Freedom of Movement** (Section 8)\n` +
    `**6. Protection of Property** (Section 9)\n` +
    `**7. Freedom of Conscience** (Section 11)\n` +
    `**8. Freedom of Expression** (Section 12)\n` +
    `**9. Freedom of Assembly** (Section 13)\n` +
    `**10. Protection from Discrimination** (Section 14)\n\n` +
    `💡 *Use /section [number] for full details*\n` +
    `💎 *Premium: Plain English explanations*`;

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  // Note: /rights is an informational command, doesn't count against query limit
});

bot.onText(/\/government/, (msg) => {
  const chatId = msg.chat.id;
  
  const response = `🏛️ **Government Structure**\n\n` +
    `**The Crown:**\n` +
    `• King Charles III (Head of State)\n` +
    `• Represented by Governor-General\n\n` +
    `**Parliament** (Chapter IV):\n` +
    `• Senate (appointed members)\n` +
    `• House of Representatives (elected)\n\n` +
    `**Executive** (Chapter V):\n` +
    `• Prime Minister (head of government)\n` +
    `• Cabinet (ministers)\n\n` +
    `**Judiciary** (Chapter IX):\n` +
    `• High Court\n` +
    `• Court of Appeal\n\n` +
    `📖 *The Constitution is supreme law — even Parliament must follow it*`;

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/reform/, (msg) => {
  const chatId = msg.chat.id;
  
  const response = `📝 **Constitutional Reform**\n\n` +
    `**How to Change the Constitution:**\n\n` +
    `**Step 1:** Parliament passes amendment bill\n` +
    `• Requires 2/3 majority in House\n` +
    `• Requires 2/3 majority in Senate\n\n` +
    `**Step 2:** Referendum (for major changes)\n` +
    `• Citizens vote on amendment\n` +
    `• Requires 2/3 support\n\n` +
    `💪 *The Constitution belongs to the people — your voice matters*`;

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/subscribe/, (msg) => {
  const chatId = msg.chat.id;
  
  const response = `💎 **Upgrade to Premium**\n\n` +
    `**🇦🇬 Citizen Basic — $4.99/month**\n` +
    `**🇦🇬 Citizen Pro — $14.99/month**\n` +
    `**🏛️ Organization — $49.99/month**\n` +
    `**🏢 Institution — $149.99/month**\n\n` +
    `*40% of your subscription supports A.B.C.R.E.'s constitutional reform work*\n\n` +
    `👉 Coming soon!`;

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const response = `📚 **A.B.C.R.E. Constitutional Concierge Help**\n\n` +
    `**Search Commands:**\n` +
    `/search [keyword] — Find constitutional provisions\n` +
    `/section [number] — Get specific section\n\n` +
    `**Information Commands:**\n` +
    `/rights — Your fundamental rights\n` +
    `/government — How government works\n` +
    `/reform — Amendment process\n\n` +
    `**Account Commands:**\n` +
    `/subscribe — Upgrade to premium\n` +
    `/start — Welcome message\n` +
    `/help — This message`;

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Admin command - Grant premium access (for testing)
bot.onText(/\/admin-premium/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Check if it's you (Vance) - your Telegram ID
  if (userId !== 8131033937) {
    bot.sendMessage(chatId, '⛔ This command is restricted.');
    return;
  }
  
  // Grant premium access and reset query count
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      tier: 'pro',
      queriesToday: 0,
      lastQueryDate: new Date().toDateString()
    });
  } else {
    const user = users.get(userId);
    user.tier = 'pro';
    user.queriesToday = 0; // Reset query count
    user.lastQueryDate = new Date().toDateString();
  }
  
  bot.sendMessage(chatId, 
    '✅ **Premium Access Granted!**\n\n' +
    'You now have unlimited queries and full access to all features.\n\n' +
    'Tier: 🇦🇬 Citizen Pro\n' +
    'Status: Active\n\n' +
    'Try: /search or /section commands'
  );
});

// Helper functions
function searchConstitution(term) {
  return constitutionData.chunks.filter(chunk => {
    const searchText = (chunk.text + ' ' + chunk.metadata.title).toLowerCase();
    return searchText.includes(term.toLowerCase());
  }).sort((a, b) => {
    const aTitleMatch = a.metadata.title.toLowerCase().includes(term.toLowerCase());
    const bTitleMatch = b.metadata.title.toLowerCase().includes(term.toLowerCase());
    return bTitleMatch - aTitleMatch;
  });
}

function getSection(sectionNum) {
  return constitutionData.chunks.find(chunk => 
    chunk.metadata.section === sectionNum
  );
}

function checkQueryLimit(userId) {
  const user = users.get(userId);
  if (!user) return false;
  
  const today = new Date().toDateString();
  if (user.lastQueryDate !== today) {
    user.queriesToday = 0;
    user.lastQueryDate = today;
  }
  
  if (user.tier === 'basic' || user.tier === 'pro' || user.tier === 'org' || user.tier === 'inst') {
    return true;
  }
  
  return user.queriesToday < 3;
}

function incrementQueryCount(userId) {
  const user = users.get(userId);
  if (user) {
    user.queriesToday++;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🇦🇬 A.B.C.R.E. Constitutional Concierge`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Telegram bot active (webhook mode)`);
  console.log(`📚 Constitution loaded: 532 sections`);
  console.log('');
  console.log('Pricing Tiers:');
  console.log('  🇦🇬 Citizen Basic: $4.99/mo');
  console.log('  🇦🇬 Citizen Pro: $14.99/mo');
  console.log('  🏛️ Organization: $49.99/mo');
  console.log('  🏢 Institution: $149.99/mo');
  console.log('');
  console.log('Revenue Share: 40% to ABCRE');
});// Deployment timestamp: Mon May  4 23:11:56 UTC 2026
