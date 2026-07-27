const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

const ADMIN_USERNAME = 'bonyein'; 
const ADMIN_LINK = `https://t.me/${ADMIN_USERNAME}`;

const DB_FILE = path.join(__dirname, 'database.json');

function loadData() {
  const defaultData = {
    users: {},
    salesData: { today: 0, monthly: 0, totalOrders: 0 },
    orders: [],
    prices: {
      mlbb: { 
        image: null, 
        text: '🌸 *Lucky Top-up MM* 🌸\n\n💎 *Mobile Legends စိန်ဈေးနှုန်းများ* ✨\n\n🏦 *KBZPay* - 09786048552\n🌊 *WavePay* - 09786048552\n\n📌 *Game ID နှင့် ဝယ်ယူလိုသော Package လေး ရိုက်ပို့ပေးပါနော်*\n(ဥပမာ - 86 diamond သို့မဟုတ် Weekly Pass)\nGame ID {123456789(12345)} ပုံစံလေး ပို့ပေးပါနော် ✨' 
      },
      pubg: { 
        image: null, 
        text: '🌸 *Lucky Top-up MM* 🌸\n\n🔫 *PUBG UC ဈေးနှုန်းများ* ✨\n\n🏦 *KBZPay* - 09786048552\n🌊 *WavePay* - 09786048552\n\n📌 *Character ID နှင့် UC ပမာဏလေး ရိုက်ပို့ပေးပါနော်*' 
      },
      chess: { 
        image: null, 
        text: '🌸 *Lucky Top-up MM* 🌸\n\n♟️ *Magic Chess Go Go ဈေးနှုန်းများ* ✨\n\n🏦 *KBZPay* - 09786048552\n🌊 *WavePay* - 09786048552\n\n📌 *Game ID နှင့် ဝယ်ယူလိုသော Package လေး ရိုက်ပို့ပေးပါနော်*' 
      },
      other: { 
        image: null, 
        text: '🌸 *Lucky Top-up MM - Other Products* 🌸\n\n🎮 *Games Available:*\n• Free Fire (Diamonds / Memberships)\n• Honor of Kings (Tokens / Weekly Card)\n• Genshin Impact (Crystals / Welkin Moon)\n• Honkai: Star Rail (Shards / Supply Pass)\n• Zenless Zone Zero\n\n🏦 *KBZPay* - 09786048552\n🌊 *WavePay* - 09786048552\n\n📌 *ဝယ်ယူလိုသော Product အမည် နှင့် Package လေး ရိုက်ပို့ပေးပါနော် ✨*' 
      },
      premium: {
        image: null,
        text: '🌸 *Lucky Top-up MM - Premium Subscriptions* 🌸\n\n✨ *Available Services:*\n• Telegram Premium (1 Month / 3 Months / 1 Year)\n• Spotify Premium (1 Month / 3 Months)\n• YouTube Premium (1 Month / Family Plan)\n• Discord Nitro (Basic / Boost)\n\n🏦 *KBZPay* - 09786048552\n🌊 *WavePay* - 09786048552\n\n📌 *ဝယ်ယူလိုသော Premium Plan နှင့် Telegram Username / Account အချက်အလက်များ ရိုက်ပို့ပေးပါနော် ✨*'
      }
    }
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE);
    return { ...defaultData, ...JSON.parse(raw) };
  } catch (err) {
    return defaultData;
  }
}

function saveData() {
  const data = { users, salesData, orders, prices };
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let { users, salesData, orders, prices } = loadData();
let userState = {};

// 📌 Optimized Polling Options to fix EFATAL Error
const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Clear Webhook before starting Polling
bot.deleteWebhook().then(() => {
  console.log("Cleared webhooks successfully.");
}).catch((err) => {
  console.error("Webhook deletion error:", err.message);
});

bot.on('polling_error', (error) => {
  console.error("Polling Error caught:", error.code || error.message);
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getKeyboard(chatId) {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🎮 MLBB Diamond' }, { text: '🎮 PUBG UC' }],
        [{ text: '♟️ Magic Chess Go Go' }, { text: '📦 Other Products' }],
        [{ text: '✨ Premium Subscription' }, { text: '🎟️ Check Coupon' }],
        [{ text: '💬 Contact Admin' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  };
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId]) {
    users[chatId] = { totalSpent: 0, coupons: 0, rollover: 0 };
    saveData();
  }
  userState[chatId] = null;
  bot.sendMessage(chatId, '🌸 Lucky Top-up MM မှ နွေးထွေးစွာ ကြိုဆိုပါတယ်ရှင့် 🎀\nဝယ်ယူလိုသော ဂိမ်း (သို့မဟုတ်) Service အကြောင်းအရာလေးကို ရွေးချယ်ပေးပါနော် ✨', getKeyboard(chatId));
});

bot.onText(/\/admin/, (msg) => {
  if (msg.chat.id !== ADMIN_ID) return;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚙️ Edit MLBB', callback_data: 'edit_mlbb' }, { text: '⚙️ Edit PUBG', callback_data: 'edit_pubg' }],
        [{ text: '⚙️ Edit Magic Chess', callback_data: 'edit_chess' }, { text: '⚙️ Edit Other', callback_data: 'edit_other' }],
        [{ text: '⚙️ Edit Premium Subscriptions', callback_data: 'edit_premium' }]
      ]
    },
    parse_mode: 'Markdown'
  };
  bot.sendMessage(ADMIN_ID, '🔑 *Admin Panel Controls:*', opts);
});

bot.onText(/\/report/, (msg) => {
  if (msg.chat.id !== ADMIN_ID) return;
  bot.sendMessage(ADMIN_ID, `📊 *Sales Report*\n\n• ဒီနေ့ ရောင်းရငွေ: ${salesData.today.toLocaleString()} MMK\n• ဒီလ ရောင်းရငွေ: ${salesData.monthly.toLocaleString()} MMK\n• စုစုပေါင်း အော်ဒါ: ${salesData.totalOrders} ခု`, { parse_mode: 'Markdown' });
});

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id !== ADMIN_ID) return;
  const text = match[1];
  Object.keys(users).forEach(id => {
    bot.sendMessage(id, `📢 *သတင်းကောင်းလေး ပါနော် ✨*\n\n${text}`, { parse_mode: 'Markdown' }).catch(() => {});
  });
  bot.sendMessage(ADMIN_ID, '✅ Customer များထံ စာပို့ပြီးပါပြီ။');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (text && text.startsWith('/')) return;

  const state = userState[chatId];

  if (chatId === ADMIN_ID && state && typeof state === 'string' && state.startsWith('waiting_edit_')) {
    const category = state.replace('waiting_edit_', '');
    if (msg.photo) {
      prices[category].image = msg.photo[msg.photo.length - 1].file_id;
      if (msg.caption) prices[category].text = msg.caption;
    } else if (msg.text) {
      prices[category].text = msg.text;
    }
    saveData();
    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, `✅ ${category.toUpperCase()} ဈေးနှုန်းနှင့် ဓာတ်ပုံ ပြင်ဆင်ပြီးပါပြီ။`);
    return;
  }

  if (chatId === ADMIN_ID && state && typeof state === 'string' && state.startsWith('dm_')) {
    const targetId = state.split('_')[1];
    bot.sendMessage(targetId, `💬 *Admin ထံမှ မက်ဆေ့ခ်ျလေးပါရှင့် ✨*\n\n${msg.text}`, { parse_mode: 'Markdown' });
    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, '✅ မက်ဆေ့ခ်ျ ပို့ပြီးပါပြီ။');
    return;
  }

  if (chatId === ADMIN_ID && state && typeof state === 'string' && state.startsWith('accept_')) {
    const targetId = state.split('_')[1];
    const amount = parseInt(text);
    if (isNaN(amount)) {
      bot.sendMessage(ADMIN_ID, '❌ ကျေးဇူးပြု၍ ဂဏန်းများသာ ရိုက်ထည့်ပါ (ဥပမာ- 45000):');
      return;
    }

    salesData.today += amount;
    salesData.monthly += amount;
    salesData.totalOrders += 1;

    if (!users[targetId]) {
      users[targetId] = { totalSpent: 0, coupons: 0, rollover: 0 };
    }
    let u = users[targetId];

    const usedCoupons = userState[`used_coupon_${targetId}`] || 0;
    if (usedCoupons > 0) {
      u.coupons = Math.max(0, u.coupons - usedCoupons);
      delete userState[`used_coupon_${targetId}`];
    }

    u.totalSpent += amount;
    u.rollover += amount;

    let newCoupons = 0;
    while (u.rollover >= 100000) {
      newCoupons++;
      u.rollover -= 100000;
    }

    u.coupons += newCoupons;

    orders.push({
      orderId: Date.now(),
      chatId: targetId,
      amount: amount,
      usedCoupons: usedCoupons,
      date: new Date().toISOString()
    });

    saveData();

    let neededAmount = 100000 - u.rollover;
    let couponMsg = `\n\n🎟️ *Coupon အခြေအနေ:*\n• ဝယ်ယူခဲ့သော ပမာဏ: ${amount.toLocaleString()} MMK\n• နောက်ထပ် Coupon ရရန် လိုအပ်သည့် ပမာဏ: ${neededAmount.toLocaleString()} MMK`;
    if (newCoupons > 0) {
      couponMsg += `\n\n🎉 *ဂုဏ်ယူပါတယ်ရှင့်! 500 MMK Discount Coupon (${newCoupons} ခု) အသစ် ထပ်မံရရှိထားပါတယ်နော် 💕*`;
    }

    bot.sendMessage(targetId, `✅ *ငွေလွှဲပြေစာလေး လက်ခံရရှိပါတယ်ရှင့် 💖*\n၁၀ မိနစ်အတွင်း ဂိမ်းအကောင့်ထဲ ထည့်ပေးသွားပါမည်နော် ✨${couponMsg}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '💬 Contact Admin', url: ADMIN_LINK }]]
      }
    });

    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, `✅ Order လက်ခံမှု အောင်မြင်ပါသည်။ (Amount: ${amount} MMK)`);
    return;
  }

  // Menu Handling
  if (text === '🎮 MLBB Diamond') sendPrice(chatId, 'mlbb');
  else if (text === '🎮 PUBG UC') sendPrice(chatId, 'pubg');
  else if (text === '♟️ Magic Chess Go Go') sendPrice(chatId, 'chess');
  else if (text === '📦 Other Products') sendPrice(chatId, 'other');
  else if (text === '✨ Premium Subscription') sendPrice(chatId, 'premium');
  else if (text === '🎟️ Check Coupon') {
    userState[chatId] = null;
    if (!users[chatId]) {
      users[chatId] = { totalSpent: 0, coupons: 0, rollover: 0 };
      saveData();
    }
    const u = users[chatId];
    let neededAmount = 100000 - u.rollover;
    bot.sendMessage(chatId, `📊 *Coupon အခြေအနေ စစ်ဆေးပေးထားပါတယ်ရှင့် ✨*\n\n• ရရှိထားသော 500 MMK Coupon: ${u.coupons} ခု 🎟️ (စုစုပေါင်း Discount: ${(u.coupons * 500).toLocaleString()} MMK)\n• လက်ရှိ စုဆောင်းထားသော ပမာဏ: ${u.rollover.toLocaleString()} / 100,000 MMK\n• နောက်ထပ် Coupon ရရန် လိုအပ်သည့် ပမာဏ: ${neededAmount.toLocaleString()} MMK`, { parse_mode: 'Markdown' });
  } else if (text === '💬 Contact Admin') {
    userState[chatId] = null;
    bot.sendMessage(chatId, `💬 Admin နှင့် တိုက်ရိုက် စကားပြောချင်ပါက အောက်ပါ ခလုတ်လေးကို နှိပ်ပါ သို့မဟုတ် @${ADMIN_USERNAME} သို့ တိုက်ရိုက် စာပို့နိုင်ပါတယ်နော် ✨`, {
      reply_markup: {
        inline_keyboard: [[{ text: '📱 Contact Admin Now', url: ADMIN_LINK }]]
      }
    });
  } else if (state === 'waiting_game_id' && text) {
    if (!users[chatId]) {
      users[chatId] = { totalSpent: 0, coupons: 0, rollover: 0 };
      saveData();
    }
    const u = users[chatId];
    
    if (u.coupons > 0) {
      const discountAmount = u.coupons * 500;
      userState[chatId] = { step: 'asking_coupon', gameId: text, discount: discountAmount, count: u.coupons };
      
      bot.sendMessage(chatId, `🎟️ *သင့်ထံတွင် ${u.coupons} ခုမြောက် Coupon (${discountAmount.toLocaleString()} MMK Discount) ရှိနေပါတယ်နော်!*\n\nဒီ အော်ဒါအတွက် Discount Coupon ကို အသုံးပြုချင်ပါသလားရှင့်?`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `✅ Coupon သုံးမည် (${discountAmount.toLocaleString()} MMK နှုတ်မည်)`, callback_data: 'use_coupon' }],
            [{ text: '❌ မသုံးပါ (နောက်မှ သုံးမည်)', callback_data: 'skip_coupon' }]
          ]
        }
      });
    } else {
      userState[chatId] = { step: 'waiting_slip', gameId: text, usedCoupon: 0 };
      bot.sendMessage(chatId, '📌 *ကျေးဇူးပြုပြီး ငွေလွှဲပြေစာ (Payment Slip) လေး ပို့ပေးပါဦးနော် ✨*', { parse_mode: 'Markdown' });
    }
  } else if ((msg.photo || msg.document) && state && typeof state === 'object' && state.step === 'waiting_slip') {
    const gameId = escapeHTML(state.gameId);
    const usedCouponCount = state.usedCoupon || 0;
    userState[`used_coupon_${chatId}`] = usedCouponCount;
    userState[chatId] = null;

    const firstName = msg.from.first_name ? escapeHTML(msg.from.first_name) : '';
    const lastName = msg.from.last_name ? escapeHTML(msg.from.last_name) : '';
    const fullName = `${firstName} ${lastName}`.trim() || 'No Name';
    const username = msg.from.username ? `@${escapeHTML(msg.from.username)}` : 'None';

    bot.sendMessage(chatId, '✅ *အချက်အလက်နှင့် ငွေလွှဲပြေစာလေး လက်ခံရရှိပါတယ်ရှင့် ✨*\nစိစစ်နေတာမို့ ခေတ္တလေး စောင့်ဆိုင်းပေးပါနော် 💕', { parse_mode: 'Markdown' });

    const adminOpts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Accept Payment', callback_data: `accept_${chatId}` }],
          [{ text: '❌ Reject Payment', callback_data: `reject_${chatId}` }],
          [{ text: '✉️ Direct Message', callback_data: `dm_${chatId}` }]
        ]
      }
    };

    let couponStatusText = usedCouponCount > 0 ? `\n• 🎟️ <b>Discount Coupon သုံးထားသည်:</b> ${(usedCouponCount * 500).toLocaleString()} MMK နှုတ်ထားပါသည်` : '';
    const captionText = `📥 <b>New Order Received!</b>\n\n• 👤 <b>Customer Name:</b> ${fullName}\n• 🔗 <b>Username:</b> ${username}\n• 🆔 <b>Customer ID:</b> <code>${chatId}</code>\n• 🎮 <b>Game ID / Info:</b> ${gameId}${couponStatusText}`;

    if (msg.photo) {
      const photoId = msg.photo[msg.photo.length - 1].file_id;
      bot.sendPhoto(ADMIN_ID, photoId, { caption: captionText, parse_mode: 'HTML', ...adminOpts }).catch(err => console.error(err));
    } else if (msg.document) {
      const docId = msg.document.file_id;
      bot.sendDocument(ADMIN_ID, docId, { caption: captionText, parse_mode: 'HTML', ...adminOpts }).catch(err => console.error(err));
    }
  }
});

function sendPrice(chatId, category) {
  userState[chatId] = 'waiting_game_id';
  const p = prices[category];
  const opts = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{ text: '💬 Contact Admin', url: ADMIN_LINK }]]
    }
  };
  if (p.image) {
    bot.sendPhoto(chatId, p.image, { caption: p.text, ...opts });
  } else {
    bot.sendMessage(chatId, p.text, opts);
  }
}

bot.on('callback_query', (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;

  if (data === 'use_coupon') {
    const st = userState[chatId];
    if (st && st.step === 'asking_coupon') {
      userState[chatId] = { step: 'waiting_slip', gameId: st.gameId, usedCoupon: st.count };
      bot.answerCallbackQuery(query.id, { text: 'Coupon အသုံးပြုလိုက်ပါပြီ' });
      bot.sendMessage(chatId, `🎉 *${st.discount.toLocaleString()} MMK Discount Coupon အသုံးပြုလိုက်ပါပြီနော်!*\n\nကျေးဇူးပြု၍ ကျသင့်ငွေထဲမှ *${st.discount.toLocaleString()} MMK နှုတ်ပြီး* ကျန်ရှိသော ပမာဏကို ငွေလွှဲပေးပါရှင့် ✨\n\n📌 *ငွေလွှဲပြီးပါက ငွေလွှဲပြေစာ (Payment Slip) ဓာတ်ပုံ ပို့ပေးပါနော်*`, { parse_mode: 'Markdown' });
    }
  } else if (data === 'skip_coupon') {
    const st = userState[chatId];
    if (st && st.step === 'asking_coupon') {
      userState[chatId] = { step: 'waiting_slip', gameId: st.gameId, usedCoupon: 0 };
      bot.answerCallbackQuery(query.id, { text: 'Coupon မသုံးပါ' });
      bot.sendMessage(chatId, '📌 *ကျေးဇူးပြုပြီး ငွေလွှဲပြေစာ (Payment Slip) လေး ပို့ပေးပါဦးနော် ✨*', { parse_mode: 'Markdown' });
    }
  } else if (data.startsWith('edit_')) {
    const category = data.replace('edit_', '');
    userState[ADMIN_ID] = `waiting_edit_${category}`;
    bot.sendMessage(ADMIN_ID, `✏️ ကျေးဇူးပြု၍ ${category.toUpperCase()} အတွက် ဈေးနှုန်း ဓာတ်ပုံ (သို့မဟုတ်) စာသားအသစ် ပို့ပေးပါ။`);
  } else if (data.startsWith('accept_')) {
    const targetId = data.split('_')[1];
    userState[ADMIN_ID] = `accept_${targetId}`;
    bot.sendMessage(ADMIN_ID, '💰 ဒီ Customer ဝယ်ယူခဲ့သော စုစုပေါင်း ကျသင့်ငွေ (MMK) ကို ဂဏန်းအတိုင်း ရိုက်ထည့်ပါ (ဥပမာ- 45000):');
  } else if (data.startsWith('reject_')) {
    const targetId = data.split('_')[1];
    bot.sendMessage(targetId, '❌ *စိတ်မကောင်းပါဘူးရှင့် သင်၏ ငွေလွှဲပြေစာ မမှန်ကန်ပါသဖြင့် ငွေလက်ခံမှုကို ငြင်းပယ်လိုက်ပါတယ်နော် 🥺*\nအသေးစိတ် သိရှိလိုပါက Admin ထံ ဆက်သွယ်ပေးပါရှင့်။', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '💬 Contact Admin', url: ADMIN_LINK }]]
      }
    });
    bot.sendMessage(ADMIN_ID, '❌ Order ငြင်းပယ်ကြောင်း Customer ထံ အကြောင်းကြားလိုက်ပါပြီ။');
  } else if (data.startsWith('dm_')) {
    const targetId = data.split('_')[1];
    userState[ADMIN_ID] = `dm_${targetId}`;
    bot.sendMessage(ADMIN_ID, '✉️ Customer ထံ ပို့လိုသော စာကို ရိုက်ထည့်ပါ:');
  }
});
