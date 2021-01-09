//import { DiceRoller } from 'rpg-dice-roller';
const rpgDiceRoller = require('rpg-dice-roller');
const categories = require("./categories.json");
const emotions = require("./emotions.json");
const customers = require("./salesman/customers.json");
const things = require("./salesman/things.json");
const lodash = require("lodash");
const { Telegraf } = require('telegraf')
require('dotenv').config()

const diceDescriptionString = '4d6';

const roll = new rpgDiceRoller.DiceRoll(diceDescriptionString);
console.log(roll.total);
console.log(roll.output);

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))

bot.command('roll', (ctx) => {
    const roll = new rpgDiceRoller.DiceRoll(diceDescriptionString);
    ctx.reply(roll.output)
})

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

bot.command('wizard', (ctx) => Telegraf.reply("Neill?"));

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];