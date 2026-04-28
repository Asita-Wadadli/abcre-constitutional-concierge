const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Load constitution chunks
const constitutionData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/ABCRE-constitution-chunks.json'), 'utf8')
);

// In-memory user tracking (replace with database in production)
const users = new Map();

class ConstitutionalConcierge {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      // Initialize user
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

      this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Search command
    this.bot.onText(/\/search (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const searchTerm = match[1].toLowerCase();

      if (!this.checkQueryLimit(userId)) {
        this.bot.sendMessage(chatId, 
          `⚠️ You've reached your daily limit (3 queries).\n\n` +
          `Upgrade to Premium for unlimited access:\n` +
          `/subscribe`
        );
        return;
      }

      // Search constitution chunks
      const results = this.searchConstitution(searchTerm);
      
      if (results.length === 0) {
        this.bot.sendMessage(chatId, 
          `❌ No results found for "${match[1]}".\n\n` +
          `Try different keywords or use /help for search tips.`
        );
        return;
      }

      // Send top 3 results
      let response = `🔍 **Search Results for "${match[1]}"**\n\n`;
      results.slice(0, 3).forEach((result, index) => {
        response += `${index + 1}. **${result.metadata.title}**\n`;
        response += `   Section ${result.metadata.section}\n`;
        response += `   ${result.text.substring(0, 150)}...\n\n`;
      });

      response += `💡 *Upgrade to Premium for full text and unlimited searches*`;
      
      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      this.incrementQueryCount(userId);
    });

    // Section command
    this.bot.onText(/\/section (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const sectionNum = match[1];

      if (!this.checkQueryLimit(userId)) {
        this.bot.sendMessage(chatId, 
          `⚠️ You've reached your daily limit (3 queries).\n\n` +
          `Upgrade to Premium for unlimited access:\n` +
          `/subscribe`
        );
        return;
      }

      const section = this.getSection(sectionNum);
      
      if (!section) {
        this.bot.sendMessage(chatId, 
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

      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      this.incrementQueryCount(userId);
    });

    // Rights command
    this.bot.onText(/\/rights/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (!this.checkQueryLimit(userId)) {
        this.bot.sendMessage(chatId, 
          `⚠️ You've reached your daily limit (3 queries).\n\n` +
          `Upgrade to Premium for unlimited access.`
        );
        return;
      }

      const response = `⚖️ **Your Fundamental Rights** (Chapter II)\n\n` +
        `**1. Right to Life** (Section 4)\n` +
        `No one can intentionally take your life, except by court order for treason or murder.\n\n` +
        `**2. Right to Personal Liberty** (Section 5)\n` +
        `Freedom from arbitrary arrest and detention.\n\n` +
        `**3. Freedom from Slavery** (Section 6)\n` +
        `No forced labor or servitude.\n\n` +
        `**4. Protection from Inhuman Treatment** (Section 7)\n` +
        `No torture or degrading punishment.\n\n` +
        `**5. Freedom of Movement** (Section 8)\n` +
        `Right to move freely, reside, enter and leave Antigua and Barbuda.\n\n` +
        `**6. Protection of Property** (Section 9)\n` +
        `Fair compensation if government takes your property.\n\n` +
        `**7. Freedom of Conscience** (Section 11)\n` +
        `Freedom of religion, thought, and belief.\n\n` +
        `**8. Freedom of Expression** (Section 12)\n` +
        `Freedom of speech, press, and communication.\n\n` +
        `**9. Freedom of Assembly** (Section 13)\n` +
        `Right to gather and form associations.\n\n` +
        `**10. Protection from Discrimination** (Section 14)\n` +
        `Equal treatment regardless of race, sex, creed, or political opinion.\n\n` +
        `💡 *Use /section [number] for full details*\n` +
        `💎 *Premium: Plain English explanations*`

      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      this.incrementQueryCount(userId);
    });

    // Government command
    this.bot.onText(/\/government/, (msg) => {
      const chatId = msg.chat.id;
      
      const response = `🏛️ **Government Structure**\n\n` +
        `**The Crown:**\n` +
        `• King Charles III (Head of State)\n` +
        `• Represented by Governor-General\n\n` +
        `**Parliament** (Chapter IV):\n` +
        `• Senate (appointed members)\n` +
        `• House of Representatives (elected)\n` +
        `• Makes laws for Antigua and Barbuda\n\n` +
        `**Executive** (Chapter V):\n` +
        `• Prime Minister (head of government)\n` +
        `• Cabinet (ministers)\n` +
        `• Implements laws and policies\n\n` +
        `**Judiciary** (Chapter IX):\n` +
        `• High Court\n` +
        `• Court of Appeal\n` +
        `• Interprets the Constitution\n\n` +
        `**Key Principle:** Separation of powers keeps government accountable.\n\n` +
        `📖 *The Constitution is supreme law — even Parliament must follow it*`

      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    // Reform command
    this.bot.onText(/\/reform/, (msg) => {
      const chatId = msg.chat.id;
      
      const response = `📝 **Constitutional Reform**\n\n` +
        `**How to Change the Constitution:**\n\n` +
        `**Step 1:** Parliament passes amendment bill\n` +
        `• Requires 2/3 majority in House\n` +
        `• Requires 2/3 majority in Senate\n\n` +
        `**Step 2:** Referendum (for major changes)\n` +
        `• Citizens vote on amendment\n` +
        `• Requires 2/3 support\n\n` +
        `**Current Reform Discussions:**\n` +
        `• Oaths Bill 2025\n` +
        `• Republic status (removing King)\n` +
        `• Enhanced rights protections\n\n` +
        `**Your Role:**\n` +
        `• Stay informed\n` +
        `• Contact your MP\n` +
        `• Participate in public consultations\n\n` +
        `💪 *The Constitution belongs to the people — your voice matters*`

      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    // Subscribe command
    this.bot.onText(/\/subscribe/, (msg) => {
      const chatId = msg.chat.id;
      
      const response = `💎 **Upgrade to Premium**\n\n` +
        `**🇦🇬 Citizen Basic — $4.99/month**\n` +
        `✓ Unlimited Constitution searches\n` +
        `✓ Section-by-section lookup\n` +
        `✓ Fundamental rights guide\n` +
        `✓ Government structure info\n\n` +
        `**🇦🇬 Citizen Pro — $14.99/month**\n` +
        `✓ Everything in Basic\n` +
        `✓ Plain English translations\n` +
        `✓ Historical context & Hansard\n` +
        `✓ Reform tracking & alerts\n` +
        `✓ Citation generator\n` +
        `✓ Web widget access\n\n` +
        `**🏛️ Organization — $49.99/month**\n` +
        `✓ 5 team members\n` +
        `✓ WhatsApp integration\n` +
        `✓ Priority support\n` +
        `✓ Custom alerts\n\n` +
        `**🏢 Institution — $149.99/month**\n` +
        `✓ Unlimited team members\n` +
        `✓ API access\n` +
        `✓ White-label option\n` +
        `✓ Dedicated support\n\n` +
        `**🎁 Special Offer:**\n` +
        `Annual plan = 2 months FREE\n\n` +
        `👉 Click here to subscribe: [Payment Link Coming Soon]\n\n` +
        `*40% of your subscription supports A.B.C.R.E.'s constitutional reform work*`

      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      
      const response = `📚 **A.B.C.R.E. Constitutional Concierge Help**\n\n` +
        `**Search Commands:**\n` +
        `/search [keyword] — Find constitutional provisions\n` +
        `  Example: /search freedom of speech\n\n` +
        `/section [number] — Get specific section\n` +
        `  Example: /section 12\n\n` +
        `**Information Commands:**\n` +
        `/rights — Your fundamental rights\n` +
        `/government — How government works\n` +
        `/reform — Constitutional amendment process\n\n` +
        `**Account Commands:**\n` +
        `/subscribe — Upgrade to premium\n` +
        `/start — Welcome message\n` +
        `/help — This message\n\n` +
        `**Search Tips:**\n` +
        `• Use specific keywords\n` +
        `• Try legal terms and plain English\n` +
        `• Search for concepts like "property" or "discrimination"\n\n` +
        `**About:**\n` +
        `Built for A.B.C.R.E. by Hemisphere Claw Agency\n` +
        `Mission: Constitutional literacy for every citizen`

      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    // Handle plain text messages (natural language queries)
    this.bot.on('message', (msg) => {
      // Skip if it's a command
      if (msg.text && msg.text.startsWith('/')) return;
      
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const query = msg.text;

      if (!query) return;

      if (!this.checkQueryLimit(userId)) {
        this.bot.sendMessage(chatId, 
          `⚠️ You've reached your daily limit (3 queries).\n\n` +
          `Upgrade to Premium for unlimited access:\n` +
          `/subscribe`
        );
        return;
      }

      // Simple natural language processing
      const response = this.processNaturalLanguage(query);
      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      this.incrementQueryCount(userId);
    });
  }

  searchConstitution(term) {
    return constitutionData.chunks.filter(chunk => {
      const searchText = (chunk.text + ' ' + chunk.metadata.title).toLowerCase();
      return searchText.includes(term.toLowerCase());
    }).sort((a, b) => {
      // Prioritize title matches
      const aTitleMatch = a.metadata.title.toLowerCase().includes(term.toLowerCase());
      const bTitleMatch = b.metadata.title.toLowerCase().includes(term.toLowerCase());
      return bTitleMatch - aTitleMatch;
    });
  }

  getSection(sectionNum) {
    return constitutionData.chunks.find(chunk => 
      chunk.metadata.section === sectionNum
    );
  }

  processNaturalLanguage(query) {
    const lowerQuery = query.toLowerCase();
    
    // Check for common patterns
    if (lowerQuery.includes('right') && lowerQuery.includes('speech')) {
      return `🎤 **Freedom of Expression**\n\n` +
        `Section 12 protects your right to:\n` +
        `• Express opinions freely\n` +
        `• Access information\n` +
        `• Communicate ideas\n` +
        `• Freedom of the press\n\n` +
        `**Limitations:** Must respect others' rights and public interest.\n\n` +
        `📖 Use /section 12 for full text\n` +
        `🔍 Try /search expression for more`;
    }
    
    if (lowerQuery.includes('vote') || lowerQuery.includes('election')) {
      return `🗳️ **Voting Rights**\n\n` +
        `The Constitution establishes your right to participate in democracy through:\n` +
        `• Free and fair elections\n` +
        `• Multiple political parties\n` +
        `• Secret ballot\n\n` +
        `**Requirements:** Must be a citizen and registered voter.\n\n` +
        `🔍 Try /search election for constitutional provisions`;
    }

    if (lowerQuery.includes('property') || lowerQuery.includes('land')) {
      return `🏠 **Property Rights**\n\n` +
        `Section 9 protects you from:\n` +
        `• Unlawful property seizure\n` +
        `• Deprivation without compensation\n\n` +
        `**Government can take property ONLY if:**\n` +
        `• It's for public benefit\n` +
        `• You receive fair compensation\n` +
        `• Process is lawful\n\n` +
        `📖 Use /section 9 for full details`;
    }

    // Default response
    const results = this.searchConstitution(query);
    if (results.length > 0) {
      let response = `🔍 **Results for "${query}"**\n\n`;
      results.slice(0, 2).forEach((result, index) => {
        response += `${index + 1}. **${result.metadata.title}** (Section ${result.metadata.section})\n`;
        response += `${result.text.substring(0, 200)}...\n\n`;
      });
      response += `💡 *Upgrade to Premium for detailed explanations with African-centered analysis*`;
      return response;
    }

    return `❓ I couldn't find specific information about "${query}".\n\n` +
      `Try:\n` +
      `• /search [keyword] for constitutional provisions\n` +
      `• /section [number] for specific sections\n` +
      `• /rights for your fundamental rights\n\n` +
      `Or rephrase your question with different keywords.`;
  }

  checkQueryLimit(userId) {
    const user = users.get(userId);
    if (!user) return false;
    
    // Reset count if it's a new day
    const today = new Date().toDateString();
    if (user.lastQueryDate !== today) {
      user.queriesToday = 0;
      user.lastQueryDate = today;
    }
    
    // Premium users have unlimited queries
    if (user.tier === 'basic' || user.tier === 'pro' || user.tier === 'org' || user.tier === 'inst') {
      return true;
    }
    
    // Free tier: 3 queries per day
    return user.queriesToday < 3;
  }

  incrementQueryCount(userId) {
    const user = users.get(userId);
    if (user) {
      user.queriesToday++;
    }
  }
}

module.exports = ConstitutionalConcierge;