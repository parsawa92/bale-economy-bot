const express = require("express");
const axios = require("axios");
const fs = require("fs");

const TOKEN = "توکن_ربات";
const API = `https://tapi.bale.ai/bot${TOKEN}`;

const app = express();

app.use(express.json());

const DB_FILE = "./database.json";

function loadDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
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

            money: 5000,

            bankMoney: 0,

            bank: null,

            computer: 1,

            trader: 0,

            items: [],

            xp: 0,

            level: 1,

            lastWork: 0,

            lastDaily: 0
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

async function sendMessage(
    chatId,
    text,
    keyboard = null
) {

    const data = {
        chat_id: chatId,
        text
    };

    if (keyboard)
        data.reply_markup = keyboard;

    await axios.post(
        `${API}/sendMessage`,
        data
    );
}

function mainMenu() {

    return {
        inline_keyboard: [

            [
                {
                    text: "💼 کار",
                    callback_data: "work"
                }
            ],

            [
                {
                    text: "📈 ترید",
                    callback_data: "trade"
                }
            ],

            [
                {
                    text: "💻 ارتقا",
                    callback_data: "upgrade"
                }
            ],

            [
                {
                    text: "🏦 بانک",
                    callback_data: "bank"
                }
            ],

            [
                {
                    text: "🛒 فروشگاه",
                    callback_data: "shop"
                }
            ],

            [
                {
                    text: "👤 پروفایل",
                    callback_data: "profile"
                }
            ]
        ]
    };
}

const BANKS = {

    ملی: {
        profit: 3
    },

    سپه: {
        profit: 4
    },

    پاسارگاد: {
        profit: 5
    }
};

const SHOP = {

    "کت و شلوار": 15000,

    "ساعت لوکس": 30000,

    "ماشین اسپرت": 150000,

    "ویلا": 500000
};

function addXP(user, amount) {

    user.xp += amount;

    const need =
        user.level * 100;

    if (user.xp >= need) {

        user.level++;

        user.xp = 0;

        user.money +=
            user.level * 1000;
    }
}

app.post(
    "/webhook",
    async (req, res) => {

        try {

            const update = req.body;

            if (!update.message)
                return res.sendStatus(200);

            const msg =
                update.message;

            const chatId =
                msg.chat.id;

            const userId =
                msg.from.id;

            const text =
                msg.text || "";

            let user =
                getUser(userId);

            if (
                text == "/start" ||
                text == "/شروع"
            ) {

                return sendMessage(
                    chatId,
                    "به بازی اقتصادی خوش آمدی",
                    mainMenu()
                );
            }

            if (
                text == "/پروفایل"
            ) {

                return sendMessage(
                    chatId,

`👤 سطح: ${user.level}

⭐ XP: ${user.xp}

💰 پول: ${user.money}

🏦 بانک: ${user.bank || "ندارد"}

🏛 موجودی بانک: ${user.bankMoney}

💻 کامپیوتر: ${user.computer}

📈 تریدر: ${user.trader}

🎒 دارایی:
${user.items.join(", ") || "ندارد"}`
                );
            }

            if (
                text == "/کار"
            ) {

                const now =
                    Date.now();

                if (
                    now -
                    user.lastWork <
                    60000
                ) {

                    return sendMessage(
                        chatId,
                        "1 دقیقه صبر کن"
                    );
                }

                const income =
                    Math.floor(
                        (Math.random() *
                            500 +
                            100) *
                        user.computer
                    );

                user.money += income;

                user.lastWork =
                    now;

                addXP(user, 20);

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,
                    `💼 ${income} تومان درآمد`
                );
            }

            if (
                text ==
                "/ارتقا"
            ) {

                const price =
                    user.computer *
                    5000;

                if (
                    user.money <
                    price
                ) {

                    return sendMessage(
                        chatId,
                        "پول کافی نیست"
                    );
                }

                user.money -=
                    price;

                user.computer++;

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,
                    `🚀 سطح جدید:
${user.computer}`
                );
            }

            if (
                text ==
                "/خریدتریدر"
            ) {

                const price =
                    (user.trader +
                        1) *
                    10000;

                if (
                    user.money <
                    price
                ) {

                    return sendMessage(
                        chatId,
                        "پول کافی نیست"
                    );
                }

                user.money -=
                    price;

                user.trader++;

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,
                    "📈 خرید انجام شد"
                );
            }

            if (
                text ==
                "/ترید"
            ) {

                if (
                    user.trader ==
                    0
                ) {

                    return sendMessage(
                        chatId,
                        "اول تریدر بخر"
                    );
                }

                const profit =
                    Math.floor(
                        (Math.random() *
                            3000 -
                            1000) *
                        user.trader
                    );

                user.money +=
                    profit;

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,

profit > 0
? `📈 سود:
${profit}`
: `📉 ضرر:
${profit}`
                );
            }

            if (
                text.startsWith(
                    "/افتتاح "
                )
            ) {

                const bank =
                    text.replace(
                        "/افتتاح ",
                        ""
                    );

                if (
                    !BANKS[
                        bank
                    ]
                ) {

                    return sendMessage(
                        chatId,
                        "بانک وجود ندارد"
                    );
                }

                user.bank =
                    bank;

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,
                    `🏦 حساب در بانک ${bank} افتتاح شد`
                );
            }

            if (
                text.startsWith(
                    "/واریز "
                )
            ) {

                const amount =
                    Number(
                        text.split(
                            " "
                        )[1]
                    );

                if (
                    amount >
                    user.money
                ) {

                    return sendMessage(
                        chatId,
                        "موجودی کافی نیست"
                    );
                }

                user.money -=
                    amount;

                user.bankMoney +=
                    amount;

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,
                    "✅ واریز شد"
                );
            }

            if (
                text ==
                "/سود"
            ) {

                if (
                    !user.bank
                ) {

                    return sendMessage(
                        chatId,
                        "حساب بانکی نداری"
                    );
                }

                const percent =
                    BANKS[
                        user.bank
                    ]
                        .profit;

                const profit =
                    Math.floor(
                        user.bankMoney *
                            percent /
                            100
                    );

                user.bankMoney +=
                    profit;

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,
                    `🏦 سود:
${profit}`
                );
            }

            if (
                text ==
                "/فروشگاه"
            ) {

                let txt =
                    "🛒 فروشگاه\n\n";

                for (
                    let i in SHOP
                ) {

                    txt +=
                        `${i}
${SHOP[i]}

`;
                }

                return sendMessage(
                    chatId,
                    txt
                );
            }

            if (
                text.startsWith(
                    "/خرید "
                )
            ) {

                const item =
                    text.replace(
                        "/خرید ",
                        ""
                    );

                if (
                    !SHOP[item]
                ) {

                    return sendMessage(
                        chatId,
                        "وجود ندارد"
                    );
                }

                if (
                    user.money <
                    SHOP[item]
                ) {

                    return sendMessage(
                        chatId,
                        "پول کافی نیست"
                    );
                }

                user.money -=
                    SHOP[item];

                user.items.push(
                    item
                );

                updateUser(
                    userId,
                    user
                );

                return sendMessage(
                    chatId,
                    "🛍 خرید شد"
                );
            }

            if (
                text ==
                "/لیدربورد"
            ) {

                const db =
                    loadDB();

                const top =
                    Object.values(
                        db.users
                    )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                b.money -
                                a.money
                        )
                        .slice(
                            0,
                            10
                        );

                let textOut =
                    "🏆 برترین ها\n\n";

                top.forEach(
                    (
                        x,
                        index
                    ) => {

                        textOut +=
                            `${index + 1}
💰 ${x.money}

`;
                    }
                );

                return sendMessage(
                    chatId,
                    textOut
                );
            }

            res.sendStatus(200);

        } catch (err) {

            console.log(err);

            res.sendStatus(500);
        }
    }
);

app.listen(
    3000,
    () => {

        console.log(
            "BOT ONLINE"
        );
    }
);
