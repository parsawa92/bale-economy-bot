module.exports = {

    TOKEN: process.env.TOKEN,

    BIN_ID: process.env.BIN_ID,

    MASTER_KEY: process.env.MASTER_KEY,

    WORK_COOLDOWN: 60000,

    DAILY_COOLDOWN: 86400000

};
const axios = require("axios");
const {
    BIN_ID,
    MASTER_KEY
} = require("./config");

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

async function getUser(id) {

    const db = await loadDB();

    if (!db.users[id]) {

        db.users[id] = {

            money: 1000,
            bank: 0,
            bankType: null,

            level: 1,
            xp: 0,

            pcLevel: 1,
            traderLevel: 0,

            items: [],

            lastWork: 0,
            lastDaily: 0,

            spam: {
                count: 0,
                lastMsg: 0,
                muteUntil: 0
            }

        };

        await saveDB(db);

    }

    return db.users[id];

}

async function updateUser(id, user) {

    const db = await loadDB();

    db.users[id] = user;

    await saveDB(db);

}

module.exports = {
    loadDB,
    saveDB,
    getUser,
    updateUser
};
const express = require("express");
const axios = require("axios");

const {
    TOKEN,
    WORK_COOLDOWN,
    DAILY_COOLDOWN
} = require("./config");

const {
    getUser,
    updateUser
} = require("./database");

const API =
`https://tapi.bale.ai/bot${TOKEN}`;

const app = express();

app.use(express.json());

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

    } catch (e) {

        console.log(
            "Send Error",
            e.message
        );

    }

}

app.get("/", (req, res) => {

    res.send("BOT ONLINE");

});

app.post("/webhook", async (req, res) => {

    try {

        const update = req.body;

        if (!update.message)
            return res.sendStatus(200);

        const chatId =
            update.message.chat.id;

        const userId =
            update.message.from.id;

        const text =
            update.message.text || "";

        let user =
            await getUser(userId);

        const now =
            Date.now();

        // ضد اسپم
        if (
            user.spam.muteUntil >
            now
        ) {

            return res.sendStatus(200);

        }

        if (
            now -
            user.spam.lastMsg <
            1200
        ) {

            user.spam.count++;

        } else {

            user.spam.count = 0;

        }

        user.spam.lastMsg =
            now;

        if (
            user.spam.count >= 6
        ) {

            user.spam.muteUntil =
                now + 60000;

            await updateUser(
                userId,
                user
            );

            await sendMessage(
                chatId,
                "🚫 1 دقیقه محدود شدی"
            );

            return res.sendStatus(200);

        }

        // استارت
        if (
            text === "/start" ||
            text === "/شروع"
        ) {

            return sendMessage(
                chatId,
if (text === "/خریدتریدر") {

    const price =
        (user.traderLevel + 1) * 5000;

    if (user.money < price) {

        return sendMessage(
            chatId,
            `❌ ${price} سکه لازم داری`
        );

    }

    user.money -= price;

    user.traderLevel++;

    await updateUser(
        userId,
        user
    );

    return sendMessage(
        chatId,
        `📈 تریدر سطح ${user.traderLevel} خریدی`
    );

}

if (text === "/ارتقا") {

    const price =
        user.pcLevel * 3000;

    if (user.money < price) {

        return sendMessage(
            chatId,
            "❌ پول کافی نداری"
        );

    }

    user.money -= price;

    user.pcLevel++;

    await updateUser(
        userId,
        user
    );

    return sendMessage(
        chatId,
        `🖥 سطح سیستم: ${user.pcLevel}`
    );

}
if (text === "/افتتاح ملی") {

    user.bankType = "ملی";

    await updateUser(
        userId,
        user
    );

    return sendMessage(
        chatId,
        "🏦 حساب ملی ساخته شد"
    );

}

if (text.startsWith("/واریز ")) {

    const amount =
        parseInt(
            text.split(" ")[1]
        );

    if (
        isNaN(amount) ||
        amount <= 0
    ) return;

    if (
        user.money < amount
    ) {

        return sendMessage(
            chatId,
            "❌ پول کافی نداری"
        );

    }

    user.money -= amount;

    user.bank += amount;

    await updateUser(
        userId,
        user
    );

    return sendMessage(
        chatId,
        `🏦 ${amount} واریز شد`
    );

}

if (text.startsWith("/برداشت ")) {

    const amount =
        parseInt(
            text.split(" ")[1]
        );

    if (
        user.bank < amount
    ) {

        return sendMessage(
            chatId,
            "❌ موجودی بانک کافی نیست"
        );

    }

    user.bank -= amount;

    user.money += amount;

    await updateUser(
        userId,
        user
    );

    return sendMessage(
        chatId,
        `💵 ${amount} برداشت شد`
    );

}

if (text === "/سود") {

    const profit =
        Math.floor(
            user.bank * 0.03
        );

    user.bank += profit;

    await updateUser(
        userId,
        user
    );

    return sendMessage(
        chatId,
        `💰 سود: ${profit}`
    );

}
if (text === "/فروشگاه") {

    return sendMessage(
        chatId,

`🛒 فروشگاه

👔 کت و شلوار = 5000

⌚ ساعت لوکس = 10000

🚗 ماشین اسپرت = 50000`
    );

}

`🎮 ربات اقتصادی

/پروفایل
/کار
/روزانه
/ترید`
            );

        }

        // پروفایل
        if (
            text === "/پروفایل"
        ) {

            return sendMessage(
                chatId,

`👤 پروفایل

💰 پول: ${user.money}

🏦 بانک: ${user.bank}

⭐ سطح: ${user.level}

📈 تریدر: ${user.traderLevel}

🖥 کامپیوتر: ${user.pcLevel}`
            );

        }

        // کار
        if (
            text === "/کار"
        ) {

            if (
                now -
                user.lastWork <
                WORK_COOLDOWN
            ) {

                return sendMessage(
                    chatId,
                    "⏳ کمی صبر کن"
                );

            }

            const income =
                Math.floor(
                    Math.random() *
                    500 *
                    user.pcLevel
                ) + 100;

            user.money += income;

            user.lastWork =
                now;

            user.xp += 10;

            await updateUser(
                userId,
                user
            );

            return sendMessage(
                chatId,

`💼 درآمد

+${income}

💰 ${user.money}`
            );

        }

        // روزانه
        if (
            text === "/روزانه"
        ) {

            if (
                now -
                user.lastDaily <
                DAILY_COOLDOWN
            ) {

                return sendMessage(
                    chatId,
                    "🎁 قبلا گرفتی"
                );

            }

            user.money += 5000;

            user.lastDaily =
                now;

            await updateUser(
                userId,
                user
            );

            return sendMessage(
                chatId,
                "🎁 5000 سکه گرفتی"
            );

        }

        // ترید
        if (
            text === "/ترید"
        ) {

            if (
                user.traderLevel < 1
            ) {

                return sendMessage(
                    chatId,
                    "❌ تریدر نداری"
                );

            }

            const profit =
                Math.floor(
                    Math.random() *
                    3000
                ) - 1000;

            user.money += profit;

            await updateUser(
                userId,
                user
            );

            return sendMessage(
                chatId,

profit >= 0

? `📈 سود ${profit}`

: `📉 ضرر ${Math.abs(profit)}`
            );

        }

        res.sendStatus(200);

    } catch (e) {

        console.log(e);

        res.sendStatus(500);

    }

});

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "BOT ONLINE"
    );

});