const express = require("express");
const axios = require("axios");
const fs = require("fs");

const TOKEN = "1903477716:12tRWr3sE_lYh9KrX99xN54vkmzabfb-Kp4";
const API = `https://tapi.bale.ai/bot${TOKEN}`;

const app = express();
app.use(express.json());

const DB_FILE = "database.json";

function loadDB() {

    if (!fs.existsSync(DB_FILE)) {

        fs.writeFileSync(
            DB_FILE,
            JSON.stringify({
                users: {}
            }, null, 2)
        );

    }

    return JSON.parse(
        fs.readFileSync(DB_FILE)
    );

}

function saveDB(db) {

    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(db, null, 2)
    );

}

function getUser(id) {

    const db = loadDB();

    if (!db.users[id]) {

        db.users[id] = {

            money: 1000,
            level: 1,
            xp: 0,
            lastWork: 0

        };

        saveDB(db);

    }

    return db.users[id];

}

function updateUser(id, data) {

    const db = loadDB();

    db.users[id] = data;

    saveDB(db);

}

async function sendMessage(chatId, text) {

    await axios.post(
        `${API}/sendMessage`,
        {
            chat_id: chatId,
            text: text
        }
    );

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
            getUser(userId);

        if (
            text === "/start" ||
            text === "/شروع"
        ) {

            await sendMessage(
                chatId,
                "🎮 به ربات اقتصادی خوش آمدی\n\nدستورات:\n/پروفایل\n/کار"
            );

        }

        else if (
            text === "/پروفایل"
        ) {

            await sendMessage(
                chatId,

`👤 پروفایل

💰 پول: ${user.money}

⭐ سطح: ${user.level}

⚡ XP: ${user.xp}`
            );

        }

        else if (
            text === "/کار"
        ) {

            const now =
                Date.now();

            const wait =
                60000;

            if (
                now - user.lastWork < wait
            ) {

                const left =
                    Math.ceil(
                        (
                            wait -
                            (now - user.lastWork)
                        ) / 1000
                    );

                return sendMessage(
                    chatId,
                    `⏳ ${left} ثانیه دیگر تلاش کن`
                );

            }

            const income =
                Math.floor(
                    Math.random() * 500
                ) + 100;

            user.money += income;

            user.xp += 10;

            user.lastWork =
                now;

            if (
                user.xp >=
                user.level * 100
            ) {

                user.level++;

                user.xp = 0;

            }

            updateUser(
                userId,
                user
            );

            await sendMessage(
                chatId,

`💼 کار کردی

💵 درآمد: ${income}

💰 موجودی: ${user.money}`
            );

        }

        res.sendStatus(200);

    } catch (err) {

        console.log(err);

        res.sendStatus(500);

    }

});

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Server Running On ${PORT}`
    );

});