const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.BOT_TOKEN;
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const URL = process.env.RENDER_EXTERNAL_URL;

let bot;

if (process.env.NODE_ENV === 'production' && URL) {
  bot = new TelegramBot(token);
  bot.setWebHook(`${URL}/bot${token}`);
  
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
} else {
  bot = new TelegramBot(token, { polling: true });
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Hello! Bot is working perfectly.");
});

app.get('/', (req, res) => {
  res.send('Bot Server is Running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
