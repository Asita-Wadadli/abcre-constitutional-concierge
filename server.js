const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const ConstitutionalConcierge = require('./src/telegram-bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Telegram Bot
const bot = new ConstitutionalConcierge(process.env.TELEGRAM_BOT_TOKEN);

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

// Stripe webhook for subscriptions
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // TODO: Verify webhook signature
  // TODO: Handle subscription events
  
  res.json({received: true});
});

// Start server
app.listen(PORT, () => {
  console.log(`🇦🇬 A.B.C.R.E. Constitutional Concierge`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Telegram bot active`);
  console.log(`📚 Constitution loaded: 532 sections`);
  console.log('');
  console.log('Pricing Tiers:');
  console.log('  🇦🇬 Citizen Basic: $4.99/mo');
  console.log('  🇦🇬 Citizen Pro: $14.99/mo');
  console.log('  🏛️ Organization: $49.99/mo');
  console.log('  🏢 Institution: $149.99/mo');
  console.log('');
  console.log('Revenue Share: 40% to ABCRE');
});