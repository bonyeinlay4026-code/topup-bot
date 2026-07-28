const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// ၁။ Environment Variables ထဲက Token နဲ့ Port ကို ယူပါ
const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

// Token စစ်ဆေးခြင်း
if (!token) {
  console.error("❌ Error: Render Environment ထဲမှာ BOT_TOKEN မရှိသေးပါ။");
  process.exit(1);
}

// ၂။ Express Server စတင်ခြင်း (Render အတွက်)
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Lucky Top-up Bot is Running Online!');
});

// ၃။ Telegram Bot စတင်ခြင်း
const bot = new TelegramBot(token, { polling: true });

// Main Menu Keyboard ခလုတ်များ
const mainMenuKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: "💎 Top Up ပြုလုပ်ရန်" }],
      [{ text: "📜 စျေးနှုန်းဇယားကြည့်ရန်" }, { text: "📞 Admin သို့ ဆက်သွယ်ရန်" }],
      [{ text: "ℹ️ အကူအညီနှင့် လမ်းညွှန်" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

// ၄။ Bot Commands & Messages တုံ့ပြန်မှုများ

// /start သို့မဟုတ် /menu
bot.onText(/\/(start|menu)/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = `မင်္ဂလာပါ ${msg.from.first_name || 'မိတ်ဆွေ'} 👋\n\n` +
                      `**Lucky Top-up MM** မှ ကြိုဆိုပါတယ်ခင်ဗျာ။\n` +
                      `အောက်ပါ ခလုတ်များမှတစ်ဆင့် ဝန်ဆောင်မှုများကို ရွေးချယ်နိုင်ပါသည်။`;
  
  bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

// ခလုတ်စာသားများအလိုက် တုံ့ပြန်ခြင်း
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // /start သို့မဟုတ် /menu ဆိုလျှင် ရှေ့က onText က ကိုင်တွယ်ပြီးဖြစ်၍ ကျော်မည်
  if (text === '/start' || text === '/menu') return;

  if (text === "💎 Top Up ပြုလုပ်ရန်") {
    const inlineButtons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎮 Mobile Legends (MLBB)", callback_data: "topup_mlbb" }],
          [{ text: "🔥 PUBG Mobile", callback_data: "topup_pubg" }],
          [{ text: "💎 Free Fire", callback_data: "topup_ff" }]
        ]
      }
    };
    bot.sendMessage(chatId, "ကျေးဇူးပြု၍ ဝယ်ယူလိုသည့် ဂိမ်းအမျိုးအစားကို ရွေးချယ်ပါ -", inlineButtons);
  } 
  else if (text === "📜 စျေးနှုန်းဇယားကြည့်ရန်") {
    bot.sendMessage(chatId, "📌 **လက်ရှိ စျေးနှုန်းများ**\n\n- MLBB 86 Diamonds = 3,500 Ks\n- MLBB 172 Diamonds = 7,000 Ks\n- PUBG 60 UC = 3,800 Ks\n\n*(စျေးနှုန်းများ အပြောင်းအလဲ ရှိနိုင်ပါသည်။)*", { parse_mode: 'Markdown' });
  } 
  else if (text === "📞 Admin သို့ ဆက်သွယ်ရန်") {
    bot.sendMessage(chatId, "💬 **Admin Direct Contact:**\n\nTelegram: @ LuckyTopUpAdmin\nဖုန်း: 09-123456789", { parse_mode: 'Markdown' });
  } 
  else if (text === "ℹ️ အကူအညီနှင့် လမ်းညွှန်") {
    bot.sendMessage(chatId, "ℹ️ Game ID နှင့် Server ID ကို မှန်ကန်စွာ ပေးပို့၍ ငွေလွှဲပြေစာ (Screenshot) တင်ပေးရပါမည်။");
  }
});

// Inline Keyboard ခလုတ်များကို နှိပ်သည့်အခါ တုံ့ပြန်မှု
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "topup_mlbb") {
    bot.sendMessage(chatId, "🎮 **Mobile Legends Top-Up**\n\nကျေးဇူးပြု၍ သင့်ရဲ့ `Player ID` နှင့် `Server ID` ကို ရိုက်ပို့ပေးပါခင်ဗျာ။\nဥပမာ - `12345678 (1234)`", { parse_mode: 'Markdown' });
  } else if (data === "topup_pubg") {
    bot.sendMessage(chatId, "🔥 **PUBG Mobile Top-Up**\n\nကျေးဇူးပြု၍ သင့်ရဲ့ `Character ID` ကို ရိုက်ပို့ပေးပါခင်ဗျာ။", { parse_mode: 'Markdown' });
  } else if (data === "topup_ff") {
    bot.sendMessage(chatId, "💎 **Free Fire Top-Up**\n\nကျေးဇူးပြု၍ သင့်ရဲ့ `Player ID` ကို ရိုက်ပို့ပေးပါခင်ဗျာ။", { parse_mode: 'Markdown' });
  }

  // Answer callback query to stop loading animation
  bot.answerCallbackQuery(query.id);
});

// ၅။ Express Port နားထောင်ခြင်း
app.listen(PORT, () => {
  console.log(`Lucky Top-up Server is running on port ${PORT}`);
});

0

