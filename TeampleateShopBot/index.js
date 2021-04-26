const {
    Telegraf,
    Scenes,
    session,
    Markup,
    Stage
} = require('telegraf');
const {
    enter,
    leave
} = Stage;
const axios = require('axios');
const express = require('express');
const Scene = require('telegraf/scenes/base')
const {
    BOT_TOKEN,
    QIWI_API,
    API_URL,
    port
} = require('./config');
const server = express();
const bot = new Telegraf(BOT_TOKEN);
const QiwiBillPaymentsAPI = require('@qiwi/bill-payments-node-js-sdk');
const qiwiApi = new QiwiBillPaymentsAPI(QIWI_API)



// server.use(bot.webhookCallback('/'))
// bot.webhookReply = false
// bot.telegram.setWebhook(`https://codovstvo.ru/helloapi/${10000 + Number(process.argv[4])}`).then(res => {
//     console.log(res)
// }).catch(err => {
//     console.log(err)
// })

const scene1 = new Scene('scene1')
scene1.enter((ctx) => {
    ctx.scene.state.data = {};
    if (ctx.scene.state.text === undefined) {
        axios({
            method: 'get',
            url: `${API_URL}/categories`
        }).then(res => {
            console.log(res.data.products)
            ctx.reply(`Категории`, {
                reply_markup: {
                    inline_keyboard: res.data.map(item => [{
                        text: `${item.name}`,
                        callback_data: `${item.id}`
                    }])
                }
            })
        }).catch(err => {
            console.log(err)
        })
    } else {
        ctx.reply(ctx.scene.state.text, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: `Отменить создание проекта`,
                        callback_data: `close`
                    }],
                ]
            }
        })
    }
})

scene1.on(`callback_query`, ctx => {
    if (ctx.update.callback_query.data === "close") {
        ctx.deleteMessage()
        ctx.scene.leave()
        ctx.reply('Создание отменено', Markup.keyboard([
                ['Создать проект', 'Мои проекты'],
            ])
            .resize()
            .extra()
        );
    }
    ctx.deleteMessage()
    ctx.scene.enter("scene2", {
        id: ctx.update.callback_query.data
    })
})


const scene2 = new Scene('scene2')
scene2.enter((ctx) => {
    if (ctx.scene.state.text === undefined) {
        axios({
            method: 'get',
            url: `${API_URL}/categories/${ctx.scene.state.id}`
        }).then(res => {
            console.log(res.data)
            ctx.reply(`${res.data.name}`, {
                reply_markup: {
                    inline_keyboard: res.data.products.map(item => [{
                        text: `${item.name}`,
                        callback_data: `${res.id}`
                    }])
                }
            })
        }).catch(err => {
            console.log(err)
        })
    } else {
        ctx.reply(ctx.scene.state.text, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: `Отменить создание проекта`,
                        callback_data: `close`
                    }],
                ]
            }
        })
    }
})


server.get('/', (req, res) => res.send('Hello World!'))

bot.launch()
server.listen(port, err => {
    if (err) {
        throw err;
    }
    console.log(`Bot has been start on port ${port}`)
})


bot.start((ctx) =>
    ctx.reply(`Приветствие......`,
        Markup.keyboard([
            ['Категории', 'Моя подписка'],
        ])
        .resize()
        .extra(),
    ),
);



const stage = new Stage([scene1, scene2])

bot.use(session());
bot.use(stage.middleware());

bot.hears('Категории', async ctx => {
    ctx.scene.enter('scene1')
})


console.log('Бот запущен');