# 🇦🇬 A.B.C.R.E. Constitutional Concierge

**AI-Powered Constitutional Guide for Antigua and Barbuda**

Built for: A.B.C.R.E. (Antigua and Barbuda Citizens for Constitutional Reform and Education)  
Built by: Hemisphere Claw Agency

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Telegram Bot Token (from @BotFather)
- (Optional) Stripe account for payments
- (Optional) Vercel account for hosting

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your tokens

# Run locally
npm start
```

### Environment Variables

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Optional (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (for AI features)
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 💰 Pricing Structure

| Tier | Price | Features | ABCRE Share |
|------|-------|----------|-------------|
| 🇦🇬 Citizen Basic | $4.99/mo | Unlimited search, rights guide | 40% |
| 🇦🇬 Citizen Pro | $14.99/mo | + Plain English, reform tracking | 40% |
| 🏛️ Organization | $49.99/mo | + 5 users, WhatsApp, priority | 40% |
| 🏢 Institution | $149.99/mo | + API, white-label, training | 40% |

**Setup Fee:** $1,000 (one-time to ClawForge)

---

## 📱 Telegram Bot Commands

- `/start` - Welcome message
- `/search [term]` - Search Constitution
- `/section [number]` - Get specific section
- `/rights` - List fundamental rights
- `/government` - Government structure
- `/reform` - Amendment process
- `/subscribe` - Upgrade to premium
- `/help` - Show all commands

---

## 🏗️ Architecture

```
abcre-concierge/
├── server.js              # Express API server
├── src/
│   └── telegram-bot.js    # Telegram bot logic
├── public/
│   └── index.html         # Pricing page
├── data/
│   └── ABCRE-constitution-chunks.json  # Constitution data
└── package.json
```

---

## 🚀 Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Traditional Server

```bash
# Start with PM2
npm install -g pm2
pm2 start server.js --name abcre-concierge
```

---

## 📊 Revenue Tracking

ABCRE receives 40% of all subscription revenue:
- Citizen Basic: $2.00/mo
- Citizen Pro: $6.00/mo
- Organization: $20.00/mo
- Institution: $60.00/mo

Payouts monthly to ABCRE.

---

## 🔒 Security

- No personal data stored
- Conversations anonymized
- End-to-end encryption (Telegram)
- GDPR compliant

---

## 📞 Support

- **Website:** https://myabcre.org
- **Email:** support@myabcre.org
- **Telegram:** @ABCRE_Constitution_Bot

---

## 📜 License

MIT License - Hemisphere Claw Agency for A.B.C.R.E.

---

*Empowering Antiguan and Barbudan citizens through constitutional literacy*