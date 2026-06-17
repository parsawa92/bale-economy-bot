/*
 * ================================================
 *  ربات بله - فایل اصلی bot.js
 * ================================================
 *
 * package.json مورد نیاز:
 * {
 *   "name": "bale-bot",
 *   "version": "1.0.0",
 *   "description": "ربات بله با Node.js",
 *   "main": "bot.js",
 *   "scripts": {
 *     "start": "node bot.js"
 *   },
 *   "dependencies": {
 *     "axios": "^1.6.0"
 *   }
 * }
 *
 * نصب وابستگی‌ها:
 *   npm install
 *
 * اجرا:
 *   node bot.js
 * ================================================
 */

const axios = require("axios");

// ================================================
// تنظیمات اصلی - این متغیرها را با اطلاعات خود پر کنید
// ================================================

const BOT_TOKEN = "1903477716:12tRWr3sE_lYh9KrX99xN54vkmzabfb-Kp4"; 
// توکن ربات بله

const JSONBIN_API_KEY = "$2a$10$1kb5PXqeS7QM3WArBTrME.PD7r.1EcMFKcqL0DXXLqSzdwoVsiE7W"; 

// کلید API سایت JSONBin.io

const JSONBIN_BIN_ID = "6a27afa8da38895dfe9e52c0"; 
// شناسه bin در JSONBin

// آدرس‌های پایه API
const BALE_API = `https://tapi.bale.ai/bot${BOT_TOKEN}`;
const JSONBIN_API = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// متغیر برای ردیابی آخرین آپدیت دریافت‌شده
let lastUpdateId = 0;

// ================================================
// توابع JSONBin - ذخیره و بازیابی داده‌ها
// ================================================

/**
 * دریافت اطلاعات تمام کاربران از JSONBin
 * @returns {Object} دیکشنری کاربران
 */
async function getAllUsers() {
  try {
    const response = await axios.get(JSONBIN_API, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
        "X-Bin-Meta": "false",
      },
    });
    return response.data.users || {};
  } catch (error) {
    // اگر bin خالی باشد یا خطا رخ دهد، آرایه خالی برمی‌گردانیم
    console.error("خطا در دریافت داده‌ها از JSONBin:", error.message);
    return {};
  }
}

/**
 * دریافت اطلاعات یک کاربر خاص بر اساس شناسه
 * @param {string|number} userId - شناسه کاربر
 * @returns {Object|null} اطلاعات کاربر یا null
 */
async function getUser(userId) {
  const users = await getAllUsers();
  return users[String(userId)] || null;
}

/**
 * ذخیره اطلاعات یک کاربر در JSONBin
 * @param {string|number} userId - شناسه کاربر
 * @param {Object} userData - اطلاعات کاربر
 */
async function saveUser(userId, userData) {
  try {
    // ابتدا تمام کاربران موجود را می‌خوانیم
    const users = await getAllUsers();

    // کاربر جدید را اضافه یا به‌روز می‌کنیم
    users[String(userId)] = userData;

    // داده‌های به‌روزشده را در JSONBin ذخیره می‌کنیم
    await axios.put(
      JSONBIN_API,
      { users },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": JSONBIN_API_KEY,
        },
      }
    );

    console.log(`✅ کاربر ${userId} با موفقیت ذخیره شد.`);
  } catch (error) {
    console.error("خطا در ذخیره کاربر در JSONBin:", error.message);
    throw error;
  }
}

/**
 * به‌روز کردن موجودی کاربر
 * @param {string|number} userId - شناسه کاربر
 * @param {number} amount - مقدار تغییر موجودی (مثبت یا منفی)
 * @returns {number} موجودی جدید
 */
async function updateBalance(userId, amount) {
  const user = await getUser(userId);
  if (!user) throw new Error("کاربر یافت نشد");

  user.balance = (user.balance || 0) + amount;
  await saveUser(userId, user);

  return user.balance;
}

// ================================================
// توابع ارتباط با API بله
// ================================================

/**
 * ارسال پیام به کاربر
 * @param {string|number} chatId - شناسه چت
 * @param {string} text - متن پیام
 * @param {Object} replyMarkup - کیبورد اینلاین (اختیاری)
 */
async function sendMessage(chatId, text, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
    };

    // اگر کیبورد تعریف شده باشد، اضافه می‌کنیم
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    await axios.post(`${BALE_API}/sendMessage`, payload);
  } catch (error) {
    console.error("خطا در ارسال پیام:", error.message);
  }
}

/**
 * دریافت آپدیت‌های جدید از سرور بله
 * @returns {Array} لیست آپدیت‌های جدید
 */
async function getUpdates() {
  try {
    const response = await axios.get(`${BALE_API}/getUpdates`, {
      params: {
        offset: lastUpdateId + 1,
        timeout: 30,
      },
    });

    return response.data.result || [];
  } catch (error) {
    console.error("خطا در دریافت آپدیت‌ها:", error.message);
    return [];
  }
}

// ================================================
// منوهای اصلی ربات
// ================================================

/** منوی اصلی (Keyboard پایین صفحه) */
const mainMenuKeyboard = {
  keyboard: [
    [{ text: "👤 پروفایل" }, { text: "💼 کار" }],
    [{ text: "📈 ترید" }, { text: "🏦 بانک" }],
  ],
  resize_keyboard: true,
};

/** منوی پنل ترید */
const tradeMenuKeyboard = {
  inline_keyboard: [
    [
      { text: "🟢 خرید سکه", callback_data: "trade_buy" },
      { text: "🔴 فروش سکه", callback_data: "trade_sell" },
    ],
    [{ text: "📊 موجودی مجازی", callback_data: "trade_balance" }],
    [{ text: "🔙 بازگشت", callback_data: "trade_back" }],
  ],
};

/** منوی خدمات بانکی آموزشی */
const bankMenuKeyboard = {
  inline_keyboard: [
    [
      { text: "📚 آموزش پس‌انداز", callback_data: "bank_saving" },
      { text: "📖 آموزش سرمایه‌گذاری", callback_data: "bank_invest" },
    ],
    [
      { text: "💳 آموزش کارت بانکی", callback_data: "bank_card" },
      { text: "🏠 آموزش وام مسکن", callback_data: "bank_loan" },
    ],
    [{ text: "🔙 بازگشت", callback_data: "bank_back" }],
  ],
};

// ================================================
// پردازش دستورات و پیام‌ها
// ================================================

/**
 * پردازش دستور /start
 * @param {Object} msg - پیام دریافت‌شده
 */
async function handleStart(msg) {
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "کاربر";
  const username = msg.from.username || "";

  // بررسی وجود کاربر در JSONBin
  let user = await getUser(userId);

  if (!user) {
    // ساخت پروفایل جدید
    user = {
      id: userId,
      firstName: firstName,
      username: username,
      balance: 500, // موجودی اولیه 500 سکه
      missionCount: 0,
      lastMission: null,
      registeredAt: new Date().toISOString(),
    };

    await saveUser(userId, user);

    await sendMessage(
      msg.chat.id,
      `🎉 خوش آمدید ${firstName} عزیز!\n\n` +
        `✅ پروفایل شما با موفقیت ساخته شد.\n` +
        `💰 موجودی اولیه: 500 سکه\n\n` +
        `از منوی پایین یکی از گزینه‌ها را انتخاب کنید:`,
      mainMenuKeyboard
    );
  } else {
    // کاربر قبلاً ثبت‌نام کرده
    await sendMessage(
      msg.chat.id,
      `👋 سلام ${firstName} عزیز!\n` + `خوش برگشتید! از منوی پایین استفاده کنید:`,
      mainMenuKeyboard
    );
  }
}

/**
 * نمایش پروفایل کاربر
 * @param {Object} msg - پیام دریافت‌شده
 */
async function handleProfile(msg) {
  const userId = msg.from.id;
  const user = await getUser(userId);

  if (!user) {
    await sendMessage(
      msg.chat.id,
      "⚠️ شما هنوز ثبت‌نام نکرده‌اید. لطفاً /start را بفرستید."
    );
    return;
  }

  const profileText =
    `👤 پروفایل شما\n` +
    `─────────────────\n` +
    `📛 نام: ${user.firstName}\n` +
    `🆔 شناسه: ${user.id}\n` +
    `💰 موجودی: ${user.balance} سکه\n` +
    `📋 تعداد ماموریت: ${user.missionCount}\n` +
    `📅 تاریخ ثبت‌نام: ${new Date(user.registeredAt).toLocaleDateString("fa-IR")}\n` +
    `─────────────────`;

  await sendMessage(msg.chat.id, profileText);
}

/**
 * انجام ماموریت روزانه و دریافت 100 سکه
 * @param {Object} msg - پیام دریافت‌شده
 */
async function handleWork(msg) {
  const userId = msg.from.id;
  const user = await getUser(userId);

  if (!user) {
    await sendMessage(
      msg.chat.id,
      "⚠️ شما هنوز ثبت‌نام نکرده‌اید. لطفاً /start را بفرستید."
    );
    return;
  }

  // بررسی ماموریت روزانه - هر 24 ساعت یک‌بار
  const now = new Date();
  const lastMission = user.lastMission ? new Date(user.lastMission) : null;

  if (lastMission) {
    const diffHours = (now - lastMission) / (1000 * 60 * 60);
    if (diffHours < 24) {
      const remaining = Math.ceil(24 - diffHours);
      await sendMessage(
        msg.chat.id,
        `⏳ شما امروز ماموریت خود را انجام داده‌اید.\n` +
          `⏰ ${remaining} ساعت دیگر می‌توانید دوباره کار کنید.`
      );
      return;
    }
  }

  // ماموریت‌های تصادفی
  const missions = [
    "📦 تحویل بسته به مشتری",
    "🚗 رانندگی برای شرکت حمل‌ونقل",
    "💻 طراحی وب‌سایت برای مشتری",
    "🍕 کمک در رستوران",
    "📚 تدریس خصوصی",
    "🧹 نظافت دفتر",
    "📱 فروش محصول دیجیتال",
    "🌳 باغبانی",
  ];

  const randomMission = missions[Math.floor(Math.random() * missions.length)];

  // به‌روز کردن اطلاعات کاربر
  user.balance = (user.balance || 0) + 100;
  user.missionCount = (user.missionCount || 0) + 1;
  user.lastMission = now.toISOString();

  await saveUser(userId, user);

  await sendMessage(
    msg.chat.id,
    `✅ ماموریت انجام شد!\n\n` +
      `💼 ماموریت: ${randomMission}\n` +
      `💰 پاداش: +100 سکه\n` +
      `💳 موجودی جدید: ${user.balance} سکه\n` +
      `📋 مجموع ماموریت‌ها: ${user.missionCount}`
  );
}

/**
 * نمایش پنل شبیه‌سازی ترید
 * @param {Object} msg - پیام دریافت‌شده
 */
async function handleTrade(msg) {
  const userId = msg.from.id;
  const user = await getUser(userId);

  if (!user) {
    await sendMessage(
      msg.chat.id,
      "⚠️ شما هنوز ثبت‌نام نکرده‌اید. لطفاً /start را بفرستید."
    );
    return;
  }

  // قیمت‌های تصادفی برای شبیه‌سازی بازار
  const btcPrice = Math.floor(Math.random() * 5000) + 60000;
  const ethPrice = Math.floor(Math.random() * 500) + 3000;
  const change = (Math.random() * 10 - 5).toFixed(2);

  await sendMessage(
    msg.chat.id,
    `📈 پنل شبیه‌سازی ترید\n` +
      `─────────────────\n` +
      `💰 موجودی مجازی شما: ${user.balance} سکه\n\n` +
      `📊 قیمت‌های لحظه‌ای (شبیه‌سازی):\n` +
      `₿ بیت‌کوین: $${btcPrice.toLocaleString()}\n` +
      `Ξ اتریوم: $${ethPrice.toLocaleString()}\n` +
      `📉 تغییر 24 ساعته: ${change}%\n` +
      `─────────────────\n` +
      `یک گزینه را انتخاب کنید:`,
    tradeMenuKeyboard
  );
}

/**
 * نمایش منوی خدمات آموزشی بانکی
 * @param {Object} msg - پیام دریافت‌شده
 */
async function handleBank(msg) {
  await sendMessage(
    msg.chat.id,
    `🏦 خدمات آموزشی بانکی\n` +
      `─────────────────\n` +
      `⚠️ توجه: این بخش صرفاً آموزشی است و هیچ ارتباطی به بانک‌های واقعی ندارد.\n\n` +
      `📚 موضوعات آموزشی موجود را انتخاب کنید:`,
    bankMenuKeyboard
  );
}

// ================================================
// پردازش Callback Query ها (دکمه‌های اینلاین)
// ================================================

/**
 * پردازش کلیک روی دکمه‌های اینلاین
 * @param {Object} callbackQuery - داده‌های callback
 */
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  // پاسخ به callback برای جلوگیری از نمایش loading
  try {
    await axios.post(`${BALE_API}/answerCallbackQuery`, {
      callback_query_id: callbackQuery.id,
    });
  } catch (e) {
    // نادیده گرفتن خطای answerCallbackQuery
  }

  const user = await getUser(userId);

  // پردازش دکمه‌های ترید
  if (data === "trade_buy") {
    if (!user || user.balance < 100) {
      await sendMessage(chatId, "❌ موجودی کافی نیست! حداقل 100 سکه نیاز است.");
      return;
    }

    const newBalance = await updateBalance(userId, -100);
    const profit = Math.floor(Math.random() * 50) - 25; // سود یا ضرر تصادفی

    await sendMessage(
      chatId,
      `🟢 خرید انجام شد!\n\n` +
        `💸 مبلغ خرید: 100 سکه\n` +
        `📈 تغییر ارزش: ${profit > 0 ? "+" : ""}${profit} سکه\n` +
        `💳 موجودی باقی‌مانده: ${newBalance} سکه\n\n` +
        `⚠️ این یک شبیه‌سازی است.`
    );
  } else if (data === "trade_sell") {
    if (!user || user.balance < 50) {
      await sendMessage(chatId, "❌ موجودی کافی برای فروش ندارید!");
      return;
    }

    const sellAmount = 50;
    const newBalance = await updateBalance(userId, sellAmount);

    await sendMessage(
      chatId,
      `🔴 فروش انجام شد!\n\n` +
        `💰 درآمد فروش: ${sellAmount} سکه\n` +
        `💳 موجودی جدید: ${newBalance} سکه\n\n` +
        `⚠️ این یک شبیه‌سازی است.`
    );
  } else if (data === "trade_balance") {
    if (!user) {
      await sendMessage(chatId, "⚠️ ابتدا ثبت‌نام کنید.");
      return;
    }

    // سبد دارایی مجازی تصادفی
    const btcAmount = (Math.random() * 0.01).toFixed(6);
    const ethAmount = (Math.random() * 0.1).toFixed(4);

    await sendMessage(
      chatId,
      `📊 موجودی مجازی شما\n` +
        `─────────────────\n` +
        `💰 سکه: ${user.balance}\n` +
        `₿ بیت‌کوین: ${btcAmount} BTC\n` +
        `Ξ اتریوم: ${ethAmount} ETH\n` +
        `─────────────────\n` +
        `⚠️ این یک شبیه‌سازی است.`
    );
  } else if (data === "trade_back") {
    await sendMessage(chatId, "🏠 به منوی اصلی بازگشتید:", mainMenuKeyboard);
  }

  // پردازش دکمه‌های بانک
  else if (data === "bank_saving") {
    await sendMessage(
      chatId,
      `📚 آموزش پس‌انداز\n` +
        `─────────────────\n` +
        `💡 پس‌انداز یعنی کنار گذاشتن بخشی از درآمد برای آینده.\n\n` +
        `✅ نکات کلیدی:\n` +
        `• هر ماه حداقل 20% درآمد پس‌انداز کنید\n` +
        `• حساب پس‌انداز جداگانه داشته باشید\n` +
        `• صندوق اضطراری معادل 3-6 ماه هزینه بسازید\n` +
        `• از خرج کردن پس‌انداز در شرایط غیراضطراری پرهیز کنید\n` +
        `─────────────────\n` +
        `⚠️ این اطلاعات صرفاً آموزشی است.`
    );
  } else if (data === "bank_invest") {
    await sendMessage(
      chatId,
      `📖 آموزش سرمایه‌گذاری\n` +
        `─────────────────\n` +
        `💡 سرمایه‌گذاری یعنی قرار دادن پول در دارایی‌هایی که ارزششان افزایش می‌یابد.\n\n` +
        `✅ انواع سرمایه‌گذاری:\n` +
        `• سهام و بورس\n` +
        `• اوراق مشارکت\n` +
        `• ملک و مستغلات\n` +
        `• صندوق‌های سرمایه‌گذاری\n` +
        `• طلا و ارز\n\n` +
        `⚠️ قبل از سرمایه‌گذاری با متخصص مشورت کنید.`
    );
  } else if (data === "bank_card") {
    await sendMessage(
      chatId,
      `💳 آموزش کارت بانکی\n` +
        `─────────────────\n` +
        `💡 کارت بانکی ابزار دسترسی به حساب جاری شماست.\n\n` +
        `✅ نکات امنیتی:\n` +
        `• رمز کارت را به کسی ندهید\n` +
        `• از دستگاه‌های ATM معتبر استفاده کنید\n` +
        `• رمز دوم اینترنتی داشته باشید\n` +
        `• پیامک‌های بانکی را فعال کنید\n` +
        `• کارت مفقودی را فوراً مسدود کنید\n` +
        `─────────────────\n` +
        `⚠️ این اطلاعات صرفاً آموزشی است.`
    );
  } else if (data === "bank_loan") {
    await sendMessage(
      chatId,
      `🏠 آموزش وام مسکن\n` +
        `─────────────────\n` +
        `💡 وام مسکن یک تسهیلات بلندمدت برای خرید خانه است.\n\n` +
        `✅ شرایط معمول:\n` +
        `• داشتن سابقه اعتباری خوب\n` +
        `• آورده اولیه حداقل 20%\n` +
        `• درآمد کافی برای پرداخت اقساط\n` +
        `• ارزیابی ملک توسط بانک\n\n` +
        `📌 مدارک لازم معمولاً شامل:\n` +
        `• مدارک شناسایی\n` +
        `• سند ملک\n` +
        `• مدرک درآمد\n` +
        `─────────────────\n` +
        `⚠️ برای اطلاعات دقیق به بانک مراجعه کنید.`
    );
  } else if (data === "bank_back") {
    await sendMessage(chatId, "🏠 به منوی اصلی بازگشتید:", mainMenuKeyboard);
  }
}

// ================================================
// پردازش اصلی پیام‌ها
// ================================================

/**
 * پردازش هر پیام ورودی از کاربر
 * @param {Object} update - آپدیت دریافت‌شده از بله
 */
async function handleMessage(update) {
  try {
    // پردازش callback query (کلیک دکمه‌های اینلاین)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // پردازش پیام‌های متنی
    if (!update.message || !update.message.text) return;

    const msg = update.message;
    const text = msg.text.trim();

    console.log(`📨 پیام از ${msg.from.first_name} (${msg.from.id}): ${text}`);

    // مسیریابی دستورات
    if (text === "/start") {
      await handleStart(msg);
    } else if (text === "👤 پروفایل") {
      await handleProfile(msg);
    } else if (text === "💼 کار") {
      await handleWork(msg);
    } else if (text === "📈 ترید") {
      await handleTrade(msg);
    } else if (text === "🏦 بانک") {
      await handleBank(msg);
    } else {
      // پیام ناشناخته
      await sendMessage(
        msg.chat.id,
        `❓ دستور شناخته‌شده نیست.\n` + `لطفاً از منوی پایین استفاده کنید یا /start را بفرستید.`,
        mainMenuKeyboard
      );
    }
  } catch (error) {
    console.error("خطا در پردازش پیام:", error.message);

    // اطلاع به کاربر در صورت خطا
    if (update.message) {
      await sendMessage(
        update.message.chat.id,
        "⚠️ یک خطا رخ داده است. لطفاً دوباره تلاش کنید."
      );
    }
  }
}

// ================================================
// حلقه اصلی ربات - Polling
// ================================================

/**
 * حلقه اصلی دریافت و پردازش آپدیت‌ها
 */
async function startPolling() {
  console.log("🚀 ربات بله شروع به کار کرد...");
  console.log("📡 در حال دریافت آپدیت‌ها...\n");

  while (true) {
    try {
      const updates = await getUpdates();

      for (const update of updates) {
        // به‌روز کردن شناسه آخرین آپدیت
        if (update.update_id > lastUpdateId) {
          lastUpdateId = update.update_id;
        }

        // پردازش هر آپدیت
        await handleMessage(update);
      }
    } catch (error) {
      console.error("خطا در حلقه polling:", error.message);
      // صبر کوتاه قبل از تلاش مجدد
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // تأخیر کوتاه بین درخواست‌ها
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// ================================================
// راه‌اندازی ربات
// ================================================

// بررسی تنظیمات ضروری قبل از شروع
if (
  BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" ||
  JSONBIN_API_KEY === "YOUR_JSONBIN_API_KEY_HERE" ||
  JSONBIN_BIN_ID === "YOUR_BIN_ID_HERE"
) {
  console.error("❌ خطا: لطفاً توکن ربات و اطلاعات JSONBin را در ابتدای فایل تنظیم کنید!");
  process.exit(1);
}

// شروع ربات
startPolling().catch((error) => {
  console.error("خطای بحرانی:", error);
  process.exit(1);
});