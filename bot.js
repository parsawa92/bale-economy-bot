const express = require("express");
const axios = require("axios");

const {
    TOKEN,
    WORK_COOLDOWN,
    DAILY_COOLDOWN
} = require("./config");

const {
    getUser,
    updateUser,
    getTopUsers
} = require("./database");

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
if (
    text === "/start" ||
    text === "/شروع"
) {

    return sendKeyboard(

        chatId,

        "🎮 به ربات اقتصادی خوش آمدی",

        [

            [
                {
                    text: "👤 پروفایل",
                    callback_data: "profile"
                },

                {
                    text: "💼 کار",
                    callback_data: "work"
                }
            ],

            [
                {
                    text: "🎁 روزانه",
                    callback_data: "daily"
                },

                {
                    text: "📈 ترید",
                    callback_data: "trade"
                }
            ],

            [
                {
                    text: "🏦 بانک",
                    callback_data: "bank"
                },

                {
                    text: "🛒 فروشگاه",
                    callback_data: "shop"
                }
            ]

        ]

    );

}
