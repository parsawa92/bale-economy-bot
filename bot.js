const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

// تنظیمات
const TOKEN = process.env.TOKEN;
const BIN_ID = process.env.BIN_ID;
const MASTER_KEY = process.env.MASTER_KEY;

const API = `https://tapi.bale.ai/bot${TOKEN}`;

// =======================
// JSONBIN
// =======================

async function loadDB() {

    const res = await axios.get(
        `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
        {
            headers: {
                "X-Master-Key": MASTER_KEY
            }
        }
    );

    return res.data.record;
}

async function saveDB(db) {

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
}

async function getUser(userId) {

    const db = await loadDB();

    if (!db.users[userId]) {

        db.users[userId] = {

            money: 1000,
            level: 1,
            xp: 0,

            bank: 0,
            items: [],

            lastWork: 0

        };

        await saveDB(db);
    }

    return db.users[userId];
}

async function updateUser(userId, userData) {

    const db = await loadDB();

    db.users[userId] = userData;

    await saveDB(db);
}

// =======================
// ارسال پیام
// =======================

async function sendMessage(
    chatId,
    text
) {

    try {

        await axios.post(
            `${API}/sendMessage`,
            {
                chat_id: chatId,
                text
            }
        );

    } catch (err) {

        console.log(
            "SEND ERROR:",
            err.message
        );

    }

}

// =======================
// صفحه اصلی
// =======================

app.get("/", (req, res) => {

    res.send("BOT ONLINE");

});

// =======================
// WEBHOOK
// =======================

app.post(
    "/webhook",
    async (req, res) => {

        try {

            const update =
                req.body;

            if (
                !update.message
            ) {

                return res.sendStatus(
                    200
                );

            }

            const chatId =
                update.message.chat.id;

            const userId =
                update.message.from.id;

            const text =
                update.message.text || "";

            let user =
                await getUser(
                    userId
                );

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

return res.sendStatus(200);

                await sendMessage(

                    chatId,

`🎮 به ربات اقتصادی خوش آمدی

دستورات:

/پروفایل
/کار`
                );
async function sendKeyboard(
    chatId,
    text,
    keyboard
) {

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

}


                return res.sendStatus(
                    200
                );

            }

            // پروفایل

            if (
                text === "/پروفایل"
            ) {

                await sendMessage(

                    chatId,

`👤 پروفایل

💰 پول:
${user.money}

🏦 بانک:
${user.bank}

⭐ سطح:
${user.level}

⚡ XP:
${user.xp}`
                );

                return res.sendStatus(
                    200
                );

            }

            // کار

            if (
                text === "/کار"
            ) {

                const now =
                    Date.now();

                if (
                    now -
                    user.lastWork <
                    60000
                ) {

                    await sendMessage(

                        chatId,

                        "⏳ یک دقیقه صبر کن"
                    );

                    return res.sendStatus(
                        200
                    );

                }

                const income =
                    Math.floor(
                        Math.random() *
                        500
                    ) + 100;

                user.money +=
                    income;

                user.xp += 10;

                user.lastWork =
                    now;

                await updateUser(
                    userId,
                    user
                );

                await sendMessage(

                    chatId,

`💼 کار کردی

💵 درآمد:
${income}

💰 موجودی:
${user.money}`
                );

                return res.sendStatus(
                    200
                );

            }

            return res.sendStatus(
                200
            );

        } catch (err) {

            console.log(err);

            return res.sendStatus(
                500
            );

        }

    }
);

// =======================
// START
// =======================

const PORT =
    process.env.PORT ||
    3000;

app.listen(PORT, () => {

    console.log(
        `BOT ONLINE ${PORT}`
    );

});