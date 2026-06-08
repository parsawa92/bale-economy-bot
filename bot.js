const express = require("express");
const axios = require("axios");

const TOKEN = "1903477716:12tRWr3sE_lYh9KrX99xN54vkmzabfb-Kp4";
const API = `https://tapi.bale.ai/bot${TOKEN}`;

const app = express();

app.use(express.json());

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

        if (!update.message) {
            return res.sendStatus(200);
        }

        const chatId =
            update.message.chat.id;

        const text =
            update.message.text || "";

        console.log(
            "MESSAGE:",
            text
        );

        if (
            text === "/start" ||
            text === "/شروع"
        ) {

            await sendMessage(
                chatId,
                "✅ ربات آنلاین است"
            );

        }

        if (text === "/ping") {

            await sendMessage(
                chatId,
                "🏓 pong"
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