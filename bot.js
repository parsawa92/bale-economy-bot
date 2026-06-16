const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

if (updates.length) {
  offset = updates[updates.length - 1].update_id + 1;
}

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// تنظیمات
const TOKEN = "1903477716:12tRWr3sE_lYh9KrX99xN54vkmzabfb-Kp4";
const BIN_ID = "6a27afa8da38895dfe9e52c0";
const MASTER_KEY = "$2a$10$1kb5PXqeS7QM3WArBTrME.PD7r.1EcMFKcqL0DXXLqSzdwoVsiE7W";

const API = `https://tapi.bale.ai/bot${TOKEN}`;

// =======================
// JSONBIN
// =====================
async function loadDB() {
    try {
        const res = await axios.get(
            `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
            {
                headers: {
                    "X-Master-Key": MASTER_KEY
                }
            }
        );

        const data = res.data.record || {};

        if (!data.users) {
            data.users = {};
        }

        return data;

    } catch (err) {
        console.log("loadDB ERROR:", err.response?.data || err.message);
        return { users: {} };
    }
}
async function saveDB(db) {
    try {
        await axios.put(
            `https://api.jsonbin.io/v3/b/${BIN_ID}`,
            db,
            {
                headers: {
                    "X-Master-Key": MASTER_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("DB SAVED");

    } catch (err) {
        console.log(
            "saveDB ERROR:",
            err.response?.data || err.message
        );
    }
}

      

// Simple DB lock to serialize read-modify-write operations
let dbLock = Promise.resolve();
function withDBLock(fn) {
    // chain operations so they run sequentially
    dbLock = dbLock.then(() => fn()).catch(err => {
        console.log("DB LOCK ERROR:", err && err.message);
    });
    return dbLock;
}

async function getUser(userId) {
console.log("DB USERS =", Object.keys(db.users));

    const uid = String(userId);
    return await withDBLock(async () => {
        const db = await loadDB();
console.log("USER EXISTS:", !!db.users[uid]);
        if (!db.users) db.users = {};
        if (!db.users[uid]) {
            db.users[uid] = {
                money: 1000,
                level: 1,
                xp: 0,
                bank: 0,
                items: [],
                lastWork: 0,
                lastDaily: 0,
                tradeActive: false,
                tradeAmount: 0
            };
            await saveDB(db);
        }
        return db.users[uid];
    });
}

async function updateUser(userId, userData) {
    const uid = String(userId);

    return await withDBLock(async () => {
        const db = await loadDB();

        if (!db.users) {
            db.users = {};
        }

        db.users[uid] = userData;

        console.log("UPDATING USER:", uid);

        await saveDB(db);
    });
}


// =======================
// ارسال پیام
// =======================

async function sendMessage(chatId, text) {
    try {
        await axios.post(
            `${API}/sendMessage`,
            {
                chat_id: chatId,
                text
            }
        );
    } catch (err) {
        console.log("SEND ERROR:", err.message);
    }
}

async function sendKeyboard(chatId, text, keyboard) {
    try {
        await axios.post(
            `${API}/sendMessage`,
            {
                chat_id: chatId,
                text,
                reply_markup: {
                    inline_keyboard: keyboard
                }
            }
        );
    } catch (err) {
        console.log("KEYBOARD ERROR:", err.message);
    }
}

function fmtNumber(n) {
    // اگر خواستی ارقام فارسی یا جداکننده هزار اضافه کن
    try {
        return Number(n).toLocaleString();
    } catch {
        return String(n);
    }
}

// =======================
// معالجه پیام‌ها
// =======================

async function handleMessage(update) {
console.log("USER ID =", userId);
    try {
        // callback_query (دکمه‌ها)
        if (update.callback_query) {
            const chatId = update.callback_query.message.chat.id;
            const userId = update.callback_query.from.id;
            const data = update.callback_query.data;
            const user = await getUser(userId);

            // پروفایل
            if (data === "profile") {
                await sendMessage(
                    chatId,
                    `👤 پروفایل

💰 پول: ${fmtNumber(user.money)}
🏦 بانک: ${fmtNumber(user.bank)}
⭐ سطح: ${fmtNumber(user.level)}
⚡ XP: ${fmtNumber(user.xp)}`
                );
            }

            // بانک
            else if (data === "bank") {
                await sendKeyboard(
                    chatId,
                    `🏦 پنل بانک

موجودی: ${fmtNumber(user.bank)}`,
                    [
                        [
                            {
                                text: "🏛 بانک ملی",
                                callback_data: "meli"
                            }
                        ]
                    ]
                );
            }

            // بانک ملی
            else if (data === "meli") {
                await sendMessage(
                    chatId,
                    `🏛 بانک ملی

هزینه افتتاح: 500 سکه
سود: 3٪ روزانه`
                );
            }

            // ترید
            else if (data === "trade") {
                await sendMessage(
                    chatId,
                    `📈 ترید

برای شروع ترید بنویس:
/ترید [مقدار]

مثال: /ترید 1000`
                );
            }

            // کار
            else if (data === "work") {
                const now = Date.now();

                if (now - user.lastWork < 60000) {
                    await sendMessage(chatId, "⏳ یک دقیقه صبر کن");
                    return;
                }

                const income = Math.floor(Math.random() * 500) + 100;
                user.money += income;
                user.xp += 10;
                user.lastWork = now;

                await updateUser(userId, user);

                await sendMessage(
                    chatId,
                    `💼 کار کردی

💵 درآمد: ${fmtNumber(income)}
💰 موجودی: ${fmtNumber(user.money)}`
                );
            }

            // روزانه (با چک cooldown ساده)
            else if (data === "daily") {
                const now = Date.now();
                const DAY = 24 * 60 * 60 * 1000;
                const dailyAmount = 500;

                if (now - (user.lastDaily || 0) < DAY) {
                    await sendMessage(chatId, "❌ پاداش روزانه قبلا گرفته شده. دوباره فردا تلاش کن.");
                    return;
                }

                user.money += dailyAmount;
                user.lastDaily = now;
                await updateUser(userId, user);

                await sendMessage(
                    chatId,
                    `🎁 پاداش روزانه

💰 ${fmtNumber(dailyAmount)} سکه دریافت کردی
💸 موجودی: ${fmtNumber(user.money)}`
                );
            }

            // فروشگاه
            else if (data === "shop") {
                await sendKeyboard(
                    chatId,
                    "🛒 فروشگاه",
                    [
                        [
                            {
                                text: "👔 کت و شلوار (5000)",
                                callback_data: "buy_suit"
                            }
                        ],
                        [
                            {
                                text: "⌚ ساعت لوکس (10000)",
                                callback_data: "buy_watch"
                            }
                        ],
                        [
                            {
                                text: "🚗 ماشین اسپرت (50000)",
                                callback_data: "buy_car"
                            }
                        ]
                    ]
                );
            }

            // خرید کت و شلوار
            else if (data === "buy_suit") {
                const price = 5000;
                if (user.money < price) {
                    await sendMessage(chatId, "❌ پول کافی نداری");
                    return;
                }
                user.money -= price;
                user.items.push("👔 کت و شلوار");
                await updateUser(userId, user);
                await sendMessage(chatId, "✅ کت و شلوار خریدی");
            }

            // خرید ساعت
            else if (data === "buy_watch") {
                const price = 10000;
                if (user.money < price) {
                    await sendMessage(chatId, "❌ پول کافی نداری");
                    return;
                }
                user.money -= price;
                user.items.push("⌚ ساعت لوکس");
                await updateUser(userId, user);
                await sendMessage(chatId, "⌚ ساعت خریدی");
            }

            // خرید ماشین
            else if (data === "buy_car") {
                const price = 50000;
                if (user.money < price) {
                    await sendMessage(chatId, "❌ پول کافی نداری");
                    return;
                }
                user.money -= price;
                user.items.push("🚗 ماشین اسپرت");
                await updateUser(userId, user);
                await sendMessage(chatId, "🚗 ماشین خریدی");
            }

            return;
        }

        // متن معمولی (دستورات)
        if (!update.message) {
            return;
        }

        const chatId = update.message.chat.id;
        const userId = update.message.from.id;
        const text = update.message.text || "";

console.log("USER EXISTS:", !!db.users[uid]);

        let user = await getUser(userId);

        // /start
        if (text === "/start") {
            await sendKeyboard(
                chatId,
                "🎮 خوش آمدید به بات اقتصادی! 🎮",
                [
                    [
                        {
                            text: "👤 پروفایل",
                            callback_data: "profile"
                        }
                    ],
                    [
                        {
                            text: "💼 کار",
                            callback_data: "work"
                        },
                        {
                            text: "🎁 روزانه",
                            callback_data: "daily"
                        }
                    ],
                    [
                        {
                            text: "🏦 بانک",
                            callback_data: "bank"
                        },
                        {
                            text: "📈 ترید",
                            callback_data: "trade"
                        }
                    ],
                    [
                        {
                            text: "🛒 فروشگاه",
                            callback_data: "shop"
                        }
                    ]
                ]
            );
            return;
        }

        // /پروفایل
        if (text === "/پروفایل") {
            await sendMessage(
                chatId,
                `👤 پروفایل

💰 پول: ${fmtNumber(user.money)}
🏦 بانک: ${fmtNumber(user.bank)}
⭐ سطح: ${fmtNumber(user.level)}
⚡ XP: ${fmtNumber(user.xp)}`
            );
            return;
        }

        // /کار
        if (text === "/کار") {
            const now = Date.now();

            if (now - user.lastWork < 60000) {
                await sendMessage(chatId, "⏳ یک دقیقه صبر کن");
                return;
            }

            const income = Math.floor(Math.random() * 500) + 100;
            user.money += income;
            user.xp += 10;
            user.lastWork = now;

            await updateUser(userId, user);

            await sendMessage(
                chatId,
                `💼 کار کردی

💵 درآمد: ${fmtNumber(income)}
💰 موجودی: ${fmtNumber(user.money)}`
            );
            return;
        }

        // /بانک
        if (text === "/بانک") {
            await sendMessage(
                chatId,
                `🏦 بانک

موجودی: ${fmtNumber(user.bank)}`
            );
            return;
        }

        // /واریز [مقدار]
        if (text.startsWith("/واریز")) {
            const parts = text.split(" ");
            const amount = parseInt(parts[1], 10);

            if (!Number.isInteger(amount) || amount <= 0) {
                await sendMessage(chatId, "❌ مقدار معتبر نیست\n\nمثال: /واریز 100");
                return;
            }

            if (user.money < amount) {
                await sendMessage(chatId, "❌ پول کافی نداری");
                return;
            }

            user.money -= amount;
            user.bank += amount;

            await updateUser(userId, user);

            await sendMessage(
                chatId,
                `✅ واریز شد

💵 مقدار: ${fmtNumber(amount)}
💰 پول: ${fmtNumber(user.money)}
🏦 بانک: ${fmtNumber(user.bank)}`
            );
            return;
        }

        // /برداشت [مقدار]
        if (text.startsWith("/برداشت")) {
            const parts = text.split(" ");
            const amount = parseInt(parts[1], 10);

            if (!Number.isInteger(amount) || amount <= 0) {
                await sendMessage(chatId, "❌ مقدار معتبر نیست\n\nمثال: /برداشت 100");
                return;
            }

            if (user.bank < amount) {
                await sendMessage(chatId, "❌ موجودی بانک کافی نیست");
                return;
            }

            user.bank -= amount;
            user.money += amount;

            await updateUser(userId, user);

            await sendMessage(
                chatId,
                `✅ برداشت شد

💵 مقدار: ${fmtNumber(amount)}
💰 پول: ${fmtNumber(user.money)}
🏦 بانک: ${fmtNumber(user.bank)}`
            );
            return;
        }

        // /خرید تریدر
        if (text === "/خرید تریدر") {
            const price = 10000;

            if (user.money < price) {
                await sendMessage(chatId, "❌ پول کافی نداری\n\n💰 نیاز: 10000");
                return;
            }

            user.money -= price;
            user.items.push("🤖 تریدر");
            user.tradeActive = true;

            await updateUser(userId, user);

            await sendMessage(
                chatId,
                `✅ تریدر خریدی

🤖 تریدر فعال شد
📈 حالا میتونی ترید کنی: /ترید [مقدار]`
            );
            return;
        }

        // /ترید [مقدار]
        if (text.startsWith("/ترید")) {
            if (!user.tradeActive) {
                await sendMessage(
                    chatId,
                    `❌ تریدر فعال نیست

برای خرید تریدر بنویس:
/خرید تریدر (10000 سکه)`
                );
                return;
            }

            const parts = text.split(" ");
            const amount = parseInt(parts[1], 10);

            if (!Number.isInteger(amount) || amount <= 0) {
                await sendMessage(chatId, "❌ مقدار معتبر نیست\n\nمثال: /ترید 1000");
                return;
            }

            if (user.money < amount) {
                await sendMessage(chatId, "❌ پول کافی نداری");
                return;
            }

            // 50% شانس برد/باخت
            const isWin = Math.random() > 0.5;
            const profit = Math.floor(amount * 0.5); // 50% سود/زیان

            if (isWin) {
                user.money += profit;
                await updateUser(userId, user);

                await sendMessage(
                    chatId,
                    `✅ ترید برنده

📈 سود: +${fmtNumber(profit)}
💰 موجودی: ${fmtNumber(user.money)}`
                );
            } else {
                user.money -= profit;
                await updateUser(userId, user);

                await sendMessage(
                    chatId,
                    `❌ ترید باخت

📉 زیان: -${fmtNumber(profit)}
💰 موجودی: ${fmtNumber(user.money)}`
                );
            }

            return;
        }

        // منو اصلی
        await sendKeyboard(
            chatId,
            "🎮 پنل اقتصادی",
            [
                [
                    {
                        text: "👤 پروفایل",
                        callback_data: "profile"
                    }
                ],
                [
                    {
                        text: "💼 کار",
                        callback_data: "work"
                    },
                    {
                        text: "🎁 روزانه",
                        callback_data: "daily"
                    }
                ],
                [
                    {
                        text: "🏦 بانک",
                        callback_data: "bank"
                    },
                    {
                        text: "📈 ترید",
                        callback_data: "trade"
                    }
                ],
                [
                    {
                        text: "🛒 فروشگاه",
                        callback_data: "shop"
                    }
                ]
            ]
        );

    } catch (err) {
        console.log("MESSAGE ERROR:", err && err.message);
    }
}

// =======================
// صفحه اصلی
// =======================

app.get("/", (req, res) => {
    res.send("BOT ONLINE - Using Polling Mode");
});

// =======================
// WEBHOOK (برای سازگاری)
// =======================

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);
    await handleMessage(req.body);
});

// =======================
// POLLING - دریافت پیام‌ها
// =======================

let offset = 0;

async function pollUpdates() {
    try {
        const response = await axios.get(`${API}/getUpdates`, {
            params: {
                offset: offset,
                timeout: 30
            }
        });

        const updates = response.data.result || [];

        for (const update of updates) {
            offset = update.update_id + 1;
            await handleMessage(update);
        }
    } catch (err) {
        console.log("POLL ERROR:", err.message);
    }

    // ادامه polling
    setTimeout(pollUpdates, 1000);
}

// =======================
// START
// =======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`BOT ONLINE on port ${PORT} - Polling Mode Active`);
    // شروع polling
});