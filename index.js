const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// ၁။ Environment Variables ထဲက Token နဲ့ Port ကို ယူပါ
const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

// ၂။ Token ရှိမရှိ စစ်ဆေးပါ
if (!token) {
  console.error("❌ Error: Render Environment ထဲမှာ BOT_TOKEN မရှိသေးပါ။");
  process.exit(1);
}

// ၃။ Express Server ကို စတင်ပါ (Render အသက်ရှင်နေဖို့ လိုအပ်သည်)
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TopUp Bot is Running!');
});

// ၄။ Bot ကို တည်ဆောက်ပါ
const bot = new TelegramBot(token, { polling: true });

// ၅။ Telegram Bot Commands များ
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "မင်္ဂလာပါ! TopUp Bot မှ ကြိုဆိုပါတယ်။");
});

// ၆။ Express Port နားထောင်ပါ
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


0

