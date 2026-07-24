const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

const bot = new TelegramBot(token, { polling: true });

// Error တက်ရင် Bot မရပ်သွားအောင် ကာကွယ်ပေးသည့် စနစ်
process.on('uncaughtException', (err) => {
  console.error('Telegram Bot Error:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

const users = {};
const prices = {
  mlbb: { 
    image: null, 
    text: '💎 **Lucky Top-up MM**\n\n📋 **Mobile Legends စိန်ဈေးနှုန်းများ**\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **ကျေးဇူးပြု၍ Game ID နှင့် ပက်ကေ့ခ်ျအမျိုးအစားကို ရိုက်ပို့ပေးပါ။**\nသင်၏ Game ID {123456789(12345)}\nဥပမာ - 86 diamond (သို့မဟုတ်) Weekly Pass' 
  },
  pubg: { 
    image: null, 
    text: '🔫 **Lucky Top-up MM**\n\n📋 **PUBG UC ဈေးနှုန်းများ**\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **ကျေးဇူးပြု၍ Character ID နှင့် ပက်ကေ့ခ်ျအမျိုးအစားကို ရိုက်ပို့ပေးပါ။**' 
  },
  chess: { 
    image: null, 
    text: '♟️ **Lucky Top-up MM**\n\n📋 **Magic Chess Go Go ဈေးနှုန်းများ**\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **ကျေးဇူးပြု၍ Game ID နှင့် ပက်ကေ့ခ်ျအမျိုးအစားကို ရိုက်ပို့ပေးပါ။**' 
  },
  other: { 
    image: null, 
    text: '📦 **Lucky Top-up MM**\n\n📋 **Other Products ဈေးနှုန်းများ**\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **ကျေးဇူးပြု၍ ဝယ်ယူလိုသော ပစ္စည်းအမည်ကို ရိုက်ပို့ပေးပါ။**' 
  }
};

let userState = {};
let salesData = { today: 0, monthly: 0, totalOrders: 0 };

function getKeyboard(chatId) {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🎮 MLBB Diamond' }, { text: '🎮 PUBG UC' }],
        [{ text: '♟️ Magic Chess Go Go' }, { text: '📦 Other Products' }],
        [{ text: '🎟️ Check Coupon' }, { text: '💬 Contact Admin' }]
      ],
      resize_keyboard: true
    }
  };
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId]) {
    users[chatId] = { totalSpent: 0, coupons: 0, rollover: 0 };
  }
  userState[chatId] = null;
  bot.sendMessage(chatId, 'Lucky Top-up MM မှ ကြိုဆိုပါတယ်။\nဝယ်ယူလိုသော ဂိမ်းအမျိုးအစားကို ရွေးချယ်ပေးပါရှင့်။', getKeyboard(chatId));
});

bot.onText(/\/admin/, (msg) => {
  if (msg.chat.id !== ADMIN_ID) return;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚙️ Edit MLBB', callback_data: 'edit_mlbb' }, { text: '⚙️ Edit PUBG', callback_data: 'edit_pubg' }],
        [{ text: '⚙️ Edit Magic Chess', callback_data: 'edit_chess' }, { text: '⚙️ Edit Other', callback_data: 'edit_other' }]
      ]
    }
  };
  bot.sendMessage(ADMIN_ID, '🔑 **Admin Panel Controls:**', opts);
});

bot.onText(/\/report/, (msg) => {
  if (msg.chat.id !== ADMIN_ID) return;
  bot.sendMessage(ADMIN_ID, `📊 **Sales Report**\n\n• ဒီနေ့ ရောင်းရငွေ: ${salesData.today.toLocaleString()} MMK\n• ဒီလ ရောင်းရငွေ: ${salesData.monthly.toLocaleString()} MMK\n• စုစုပေါင်း အော်ဒါ: ${salesData.totalOrders} ခု`);
});

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id !== ADMIN_ID) return;
  const text = match[1];
  Object.keys(users).forEach(id => {
    bot.sendMessage(id, `📢 **အကြောင်းကြားစာ:**\n\n${text}`).catch(() => {});
  });
  bot.sendMessage(ADMIN_ID, '✅ Customer များထံ စာပို့ပြီးပါပြီ။');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (text && text.startsWith('/')) return;

  const state = userState[chatId];

  if (chatId === ADMIN_ID && state && state.startsWith('waiting_edit_')) {
    const category = state.replace('waiting_edit_', '');
    if (msg.photo) {
      prices[category].image = msg.photo[msg.photo.length - 1].file_id;
      if (msg.caption) prices[category].text = msg.caption;
    } else if (msg.text) {
      prices[category].text = msg.text;
    }
    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, `✅ ${category.toUpperCase()} ဈေးနှုန်းနှင့် ဓာတ်ပုံ ပြင်ဆင်ပြီးပါပြီ။`);
    return;
  }

  if (chatId === ADMIN_ID && state && state.startsWith('dm_')) {
    const targetId = state.split('_')[1];
    bot.sendMessage(targetId, `💬 **Admin ထံမှ မက်ဆေ့ခ်ျ:**\n\n${msg.text}`);
    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, '✅ မက်ဆေ့ခ်ျ ပို့ပြီးပါပြီ။');
    return;
  }

  if (chatId === ADMIN_ID && state && state.startsWith('accept_')) {
    const targetId = state.split('_')[1];
    const amount = parseInt(text);
    if (isNaN(amount)) {
      bot.sendMessage(ADMIN_ID, '❌ ကျေးဇူးပြု၍ ဂဏန်းများသာ ရိုက်ထည့်ပါ (ဥပမာ- 45000):');
      return;
    }

    salesData.today += amount;
    salesData.monthly += amount;
    salesData.totalOrders += 1;

    let u = users[targetId] || { totalSpent: 0, coupons: 0, rollover: 0 };
    u.totalSpent += amount;
    u.rollover += amount;

    let newCoupons = 0;
    while (u.rollover >= 100000) {
      newCoupons++;
      u.coupons++;
      u.rollover -= 100000;
    }

    let couponMsg = `\n\n🎟️ **Coupon အခြေအနေ:**\n• ဝယ်ယူခဲ့သော ပမာဏ: ${amount.toLocaleString()} MMK\n• နောက်ထပ် Coupon ရရန် လိုအပ်သည့် ပမာဏ: ${(100000 - u.rollover).toLocaleString()} MMK`;
    if (newCoupons > 0) {
      couponMsg += `\n🎉 **ဂုဏ်ယူပါတယ်! 500 MMK Discount Coupon (${newCoupons} ခု) ရရှိထားပါသည်။**`;
    }

    bot.sendMessage(targetId, `✅ **သင့်၏ ငွေလွှဲမှုကို လက်ခံရရှိပါသည်။**\n၁၀ မိနစ်အတွင်း ဂိမ်းအကောင့်ထဲသို့ ထည့်သွင်းပေးသွားမည် ဖြစ်ပါသည်။${couponMsg}`, {
      reply_markup: {
        inline_keyboard: [[{ text: '💬 Contact Admin', url: 'https://t.me/boneyein' }]]
      }
    });

    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, `✅ Order လက်ခံမှု အောင်မြင်ပါသည်။ (Amount: ${amount} MMK)`);
    return;
  }

  if (text === '🎮 MLBB Diamond') sendPrice(chatId, 'mlbb');
  else if (text === '🎮 PUBG UC') sendPrice(chatId, 'pubg');
  else if (text === '♟️ Magic Chess Go Go') sendPrice(chatId, 'chess');
  else if (text === '📦 Other Products') sendPrice(chatId, 'other');
  else if (text === '🎟️ Check Coupon') {
    const u = users[chatId] || { coupons: 0, rollover: 0 };
    bot.sendMessage(chatId, `📊 **သင့်၏ Coupon အခြေအနေ**\n\n• ရရှိထားသော 500 MMK Coupon: ${u.coupons} ခု\n• လက်ရှိ စုဆောင်းထားသော ပမာဏ: ${u.rollover.toLocaleString()} / 100,000 MMK\n• နောက်ထပ် Coupon ရရန် လိုအပ်သည့် ပမာဏ: ${(100000 - u.rollover).toLocaleString()} MMK`);
  } else if (text === '💬 Contact Admin') {
    bot.sendMessage(chatId, '💬 Admin ထံ တိုက်ရိုက် ဆက်သွယ်ရန် အောက်ပါ ခလုတ်ကို နှိပ်ပါ:', {
      reply_markup: {
        inline_keyboard: [[{ text: '📱 Contact Admin Now', url: 'https://t.me/boneyein' }]]
      }
    });
  } else if (state === 'waiting_game_id') {
    userState[chatId] = { step: 'waiting_slip', gameId: text };
    bot.sendMessage(chatId, '📌 ကျေးဇူးပြု၍ ငွေလွှဲပြေစာ (Payment Slip) ဓာတ်ပုံ ပို့ပေးပါခင်ဗျာ။');
  } else if (msg.photo && state && state.step === 'waiting_slip') {
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    const gameId = state.gameId;
    userState[chatId] = null;

    bot.sendMessage(chatId, '✅ သင့်၏ အချက်အလက်နှင့် ငွေလွှဲပြေစာကို လက်ခံရရှိပါသည်။ စိစစ်နေပါသဖြင့် ခေတ္တ စောင့်ဆိုင်းပေးပါရှင့်။');

    const adminOpts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Accept Payment', callback_data: `accept_${chatId}` }],
          [{ text: '❌ Reject Payment', callback_data: `reject_${chatId}` }],
          [{ text: '✉️ Direct Message', callback_data: `dm_${chatId}` }]
        ]
      }
    };

    const captionText = `📥 <b>New Order Received!</b>\n\n• Customer ID: <code>${chatId}</code>\n• Game ID / Info: ${gameId}`;

    bot.sendPhoto(ADMIN_ID, photoId, {
      caption: captionText,
      parse_mode: 'HTML',
      ...adminOpts
    }).catch(err => {
      console.error("Failed to send order to admin:", err);
    });
  }
});

function sendPrice(chatId, category) {
  userState[chatId] = 'waiting_game_id';
  const p = prices[category];
  const opts = {
    reply_markup: {
      inline_keyboard: [[{ text: '💬 Contact Admin', url: 'https://t.me/boneyein' }]]
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

  if (data.startsWith('edit_')) {
    const category = data.replace('edit_', '');
    userState[ADMIN_ID] = `waiting_edit_${category}`;
    bot.sendMessage(ADMIN_ID, `✏️ ကျေးဇူးပြု၍ ${category.toUpperCase()} အတွက် ဈေးနှုန်း ဓာတ်ပုံ (သို့မဟုတ်) စာသားအသစ် ပို့ပေးပါ။`);
  } else if (data.startsWith('accept_')) {
    const targetId = data.split('_')[1];
    userState[ADMIN_ID] = `accept_${targetId}`;
    bot.sendMessage(ADMIN_ID, '💰 ဒီ Customer ဝယ်ယူခဲ့သော စုစုပေါင်း ကျသင့်ငွေ (MMK) ကို ဂဏန်းအတိုင်း ရိုက်ထည့်ပါ (ဥပမာ- 45000):');
  } else if (data.startsWith('reject_')) {
    const targetId = data.split('_')[1];
    bot.sendMessage(targetId, '❌ **သင်၏ ငွေလွှဲပြေစာ မမှန်ကန်ပါသဖြင့် ငွေလက်ခံမှုကို ငြင်းပယ်လိုက်ပါသည်။**\nအသေးစိတ် သိရှိလိုပါက Admin ထံ ဆက်သွယ်ပါ။', {
      reply_markup: {
        inline_keyboard: [[{ text: '💬 Contact Admin', url: 'https://t.me/boneyein' }]]
      }
    });
    bot.sendMessage(ADMIN_ID, '❌ Order ငြင်းပယ်ကြောင်း Customer ထံ အကြောင်းကြားလိုက်ပါပြီ။');
  } else if (data.startsWith('dm_')) {
    const targetId = data.split('_')[1];
    userState[ADMIN_ID] = `dm_${targetId}`;
    bot.sendMessage(ADMIN_ID, '✉️ Customer ထံ ပို့လိုသော စာကို ရိုက်ထည့်ပါ:');
  }
});
