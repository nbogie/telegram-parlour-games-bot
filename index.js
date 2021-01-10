const { Telegraf, session } = require('telegraf')
const lodash = require("lodash");
require('dotenv').config()

const rpgDiceRoller = require('rpg-dice-roller');

const categories = require("./categories.json");
const emotions = require("./emotions.json");
const customers = require("./salesman/customers.json");
const things = require("./salesman/things.json");

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session());

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))

bot.command('roll', (ctx) => {
    //https://greenimp.github.io/rpg-dice-roller/guide/notation/
    const parts = ctx.message.text.split(" ");
    if (parts.length > 1 && parts[1].length < 20) {
        try {
            const roll = new rpgDiceRoller.DiceRoll(parts[1]);
            ctx.reply(roll.output)
        } catch (err) {
            ctx.reply("??")
        }
    }
    else {
        ctx.reply("Example: /roll 2d8+2");
    }
})

bot.command('timer', (ctx) => {
    const parts = ctx.message.text.split(" ");
    const usageExample = "Try '/timer 30' for a 30-second timer.";
    if (parts.length < 1) {
        return ctx.reply(usageExample);
    }
    const timeSec = parseInt(parts[1]);
    if (timeSec < 1 || timeSec > 300) {
        return ctx.reply("That's just for short timers")
    }

    setTimeout(() => ctx.replyWithMarkdown(":stopwatch _Brrrrrrinnng!  Time's up!_"), timeSec * 1000);
})

bot.command('dicetest', (ctx) => {
    return ctx.replyWithDice()
})

bot.command('maptest', (ctx) => {
    // return ctx.reply("ok");
    return ctx.replyWithLocation("51.5138453", "-0.1005393");
})

bot.command('count', (ctx => {
    if (!ctx.session || ctx.session.counter === undefined) {
        ctx.session = { counter: 0 };
    }
    ctx.session.counter++
    ctx.reply(`${ctx.session.counter}`)
}))

bot.command('whonext', (ctx) => {
    const who = pick(["neill", "andy", "jon", "pankaj"]);
    ctx.reply("next is: " + who);
})

bot.command('category', (ctx) => {
    const cat = pick(categories);
    const letter = pick("abcdefghijklmnopqrstuvwxyz".split(""));
    ctx.reply(`(${letter}): ${cat}`);
})

bot.command('emotion', (ctx) => {
    const emotion = pick(emotions);
    ctx.reply(`Emotion: ` + emotion);
})

bot.command('snakeoil', (ctx) => {
    const customer = pick(customers);
    const items = lodash.sampleSize(things, 3);
    ctx.reply(`Pitch to ${customer}.  Your items: ` + items.join(", "));
})

const randomPhoto = 'https://picsum.photos/200/300/?random'

bot.command('photo', ({ replyWithPhoto }) =>
    replyWithPhoto({ url: randomPhoto })
)

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];