// Environment Variables ထဲက Token ကို ယူပါ
const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

// Token မရှိရင် Process ကို ချက်ချင်း ရပ်ပစ်ပါ
if (!token) {
  console.error("❌ Error: Render Environment ထဲမှာ BOT_TOKEN မရှိသေးပါ။");
  console.error("👉 ကျေးဇူးပြု၍ Render Dashboard -> Environment ထဲမှာ BOT_TOKEN ကို ထည့်ပေးပါ။");
  process.exit(1);
}

// Token ရှိမှ Bot ကို Init လုပ်ပါ
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: false });

0

