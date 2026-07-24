const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

const bot = new TelegramBot(token, { polling: true });

process.on('uncaughtException', (err) => {
  console.error('Telegram Bot Error:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// HTML အထူးသင်္ကေတများကြောင့် Error မတက်စေရန် Safe ဖြစ်အောင် ပြောင်းပေးသည့် စနစ်
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const users = {};
const prices = {
  mlbb: { 
    image: null, 
    text: '🌸 **Lucky Top-up MM** 🌸\n\n💎 **Mobile Legends စိန်ဈေးနှုန်းလေးတွေပါနော်** ✨\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **Game ID နဲ့ ဝယ်ယူလိုတဲ့ Package လေး ရိုက်ပို့ပေးပါနော်~**\n(ဥပမာ - 86 diamond သို့မဟုတ် Weekly Pass)\nGame ID {123456789(12345)} ပုံစံလေး ပို့ပေးပါနော် သဲတို့ရေ ✨' 
  },
  pubg: { 
    image: null, 
    text: '🌸 **Lucky Top-up MM** 🌸\n\n🔫 **PUBG UC ဈေးနှုန်းလေးတွေပါရှင့်** ✨\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **Character ID နဲ့ UC ပမာဏလေး ရိုက်ပို့ပေးပါနော်~**' 
  },
  chess: { 
    image: null, 
    text: '🌸 **Lucky Top-up MM** 🌸\n\n♟️ **Magic Chess Go Go ဈေးနှုန်းလေးတွေပါရှင့်** ✨\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **Game ID နဲ့ ဝယ်ယူလိုတဲ့ Package လေး ရိုက်ပို့ပေးပါနော်~**' 
  },
  other: { 
    image: null, 
    text: '🌸 **Lucky Top-up MM** 🌸\n\n📦 **အခြား ဂိမ်း/Services ဈေးနှုန်းလေးတွေပါရှင့်** ✨\n\n🏦 **KBZPay** - 09786048552\n🌊 **WavePay** - 09786048552\n\n📌 **ဝယ်ယူလိုတဲ့ ပစ္စည်း/ဂိမ်းအမည်လေး ရိုက်ပို့ပေးပါနော်~**' 
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
  bot.sendMessage(chatId, '🌸 Lucky Top-up MM မှ နွေးထွေးစွာ ကြိုဆိုပါတယ်ရှင့် 🎀\nဝယ်ယူလိုတဲ့ ဂိမ်းအမျိုးအစားလေးကို ရွေးချယ်ပေးပါနော်~ ✨', getKeyboard(chatId));
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
    bot.sendMessage(id, `📢 **သတင်းကောင်းလေး ပါနော် ✨**\n\n${text}`).catch(() => {});
  });
  bot.sendMessage(ADMIN_ID, '✅ Customer များထံ စာပို့ပြီးပါပြီ။');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (text && text.startsWith('/')) return;

  const state = userState[chatId];

  // Admin ပြင်ဆင်သည့် အပိုင်း
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

  // Admin DM ပို့သည့် အပိုင်း
  if (chatId === ADMIN_ID && state && state.startsWith('dm_')) {
    const targetId = state.split('_')[1];
    bot.sendMessage(targetId, `💬 **Admin ထံမှ မက်ဆေ့ခ်ျလေးပါရှင့် ✨**\n\n${msg.text}`);
    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, '✅ မက်ဆေ့ခ်ျ ပို့ပြီးပါပြီ။');
    return;
  }

  // Admin အော်ဒါ လက်ခံသည့် အပိုင်း
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

    let couponMsg = `\n\n🎟️ **Coupon လေးရဲ့ အခြေအနေ:**\n• ခုဝယ်ယူလိုက်တဲ့ ပမာဏ: ${amount.toLocaleString()} MMK\n• နောက်ထပ် Coupon ရဖို့ လိုသေးတဲ့ ပမာဏ: ${(100000 - u.rollover).toLocaleString()} MMK`;
    if (newCoupons > 0) {
      couponMsg += `\n\n🎉 **ဂုဏ်ယူပါတယ်ရှင့်! 500 MMK Discount Coupon (${newCoupons} ခု) ရရှိထားပါတယ်နော်~ 💕**`;
    }

    bot.sendMessage(targetId, `✅ **ငွေလွှဲပြေစာလေး လက်ခံရရှိပါတယ်ရှင့် 💖**\n၁၀ မိနစ်အတွင်း ဂိမ်းအကောင့်ထဲ ထည့်ပေးသွားပါမယ်နော် သဲတို့ရေ~✨${couponMsg}`, {
      reply_markup: {
        inline_keyboard: [[{ text: '💬 Contact Admin', url: 'https://t.me/boneyein' }]]
      }
    });

    userState[chatId] = null;
    bot.sendMessage(ADMIN_ID, `✅ Order လက်ခံမှု အောင်မြင်ပါသည်။ (Amount: ${amount} MMK)`);
    return;
  }

  // Customer မီနူးများ
  if (text === '🎮 MLBB Diamond') sendPrice(chatId, 'mlbb');
  else if (text === '🎮 PUBG UC') sendPrice(chatId, 'pubg');
  else if (text === '♟️ Magic Chess Go Go') sendPrice(chatId, 'chess');
  else if (text === '📦 Other Products') sendPrice(chatId, 'other');
  else if (text === '🎟️ Check Coupon') {
    const u = users[chatId] || { coupons: 0, rollover: 0 };
    bot.sendMessage(chatId, `📊 **Coupon အခြေအနေလေး စစ်ဆေးပေးထားပါတယ်ရှင့် ✨**\n\n• ရရှိထားတဲ့ 500 MMK Coupon: ${u.coupons} ခု 🎟️\n• လက်ရှိ စုဆောင်းထားတဲ့ ပမာဏ: ${u.rollover.toLocaleString()} / 100,000 MMK\n• နောက်ထပ် Coupon ရဖို့ လိုသေးတဲ့ ပမာဏ: ${(100000 - u.rollover).toLocaleString()} MMK`);
  } else if (text === '💬 Contact Admin') {
    bot.sendMessage(chatId, '💬 Admin နဲ့ တိုက်ရိုက် စကားပြောချင်ရင် အောက်က ခလုတ်လေးကို နှိပ်ပေးပါနော်~ ✨', {
      reply_markup: {
        inline_keyboard: [[{ text: '📱 Contact Admin Now', url: 'https://t.me/boneyein' }]]
      }
    });
  } else if (state === 'waiting_game_id' && text) {
    userState[chatId] = { step: 'waiting_slip', gameId: text };
    bot.sendMessage(chatId, '📌 **ကျေးဇူးပြုပြီး ငွေလွှဲပြေစာ (Payment Slip) လေး ပို့ပေးပါဦးနော်~ ✨**');
  } else if ((msg.photo || msg.document) && state && state.step === 'waiting_slip') {
    const gameId = escapeHTML(state.gameId);
    userState[chatId] = null;

    bot.sendMessage(chatId, '✅ **အချက်အလက်နဲ့ ငွေလွှဲပြေစာလေး လက်ခံရရှိပါတယ်ရှင့် ✨**\nစိစစ်နေတာမို့ ခေတ္တလေး စောင့်ဆိုင်းပေးပါနော် သဲတို့ရေ~ 💕');

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
    bot.sendMessage(targetId, '❌ **စိတ်မကောင်းပါဘူးရှင့်~ သင်၏ ငွေလွှဲပြေစာ မမှန်ကန်ပါသဖြင့် ငွေလက်ခံမှုကို ငြင်းပယ်လိုက်ပါတယ်နော် 🥺**\nအသေးစိတ် သိရှိလိုပါက Admin ထံ ဆက်သွယ်ပေးပါရှင့်။', {
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
