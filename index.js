const { Telegraf, session } = require('telegraf')

const lodash = require("lodash");
const axios = require('axios').default;
const fs = require('fs');
const rpgDiceRoller = require('rpg-dice-roller');
const categories = require("./categories.json");
const emotions = require("./emotions.json");
const customers = require("./salesman/customers.json");
const things = require("./salesman/things.json");

require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session());

bot.start((ctx) => ctx.reply('Welcome'))

bot.help((ctx) => ctx.reply('Send me a sticker'))

bot.on('sticker', (ctx) => ctx.reply('👍'))

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.command('oldschool', (ctx) => ctx.reply('Hello'))

bot.command('hipster', Telegraf.reply('λ'))

bot.command('dicetest', (ctx) => ctx.replyWithDice());

bot.command('maptest', (ctx) => ctx.replyWithLocation("51.5138453", "-0.1005393"));

bot.command('count', (ctx => {
    if (!ctx.session || ctx.session.counter === undefined) {
        ctx.session = { counter: 0 };
    }
    ctx.session.counter++
    ctx.reply(`${ctx.session.counter}`)
}))

bot.command('whonext', (ctx) => {
    const name = pick(["Alice", "Bob", "Charlie", "Dave", "Erin"]);
    ctx.reply(name + " is up next!");
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

bot.command('photo', ({ replyWithPhoto }) => {
    const randomPhotoURL = 'https://picsum.photos/200/300/?random'
    replyWithPhoto({ url: randomPhotoURL })
})

bot.command('fortune', ctx => {
    axios.get("http://yerkee.com/api/fortune")
        .then(function (response) {
            ctx.reply(response.data.fortune)
        })
        .catch(function (error) {
            ctx.reply("Your future is not clear to me (error)");
            console.error("When fetching or processing fortune: ", error);
        })
})

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

bot.command('/colourpoll', async (ctx) => {
    const pollMessage = await ctx.replyWithPoll(
        'What is your favourite colour? Quick!',
        ['blue', 'no, yellow', 'pink', 'purple', 'green'],
        { is_anonymous: false }
    )
    console.log(pollMessage);

    setTimeout(() => {
        ctx.stopPoll(pollMessage.message_id);
        ctx.reply("(Poll is now closed!)");
    }, 20000)
})
bot.command('/gamepoll', ctx => {
    ctx.replyWithPoll(
        'What game shall we play?',
        ['Insider', 'Just One', 'Scategories', 'Sixes', 'Story Cubes', 'Fake Artist', 'SpyFall'],
        { is_anonymous: false }
    )

})
bot.command('/aboutme', async ctx => {
    const sender = await ctx.telegram.getChatMember(ctx.message.chat.id, ctx.message.from.id);
    console.log("from: ", ctx.message.from);

    console.log(sender, sender.status);
    ctx.replyWithMarkdown("```\n" + `${JSON.stringify(sender, null, 2)}` + "\n```")
})

bot.command('timer', (ctx) => {
    //TODO: Telegram supports scheduled messages - may be preferred?
    // However, resolution unlikely to be accurate - a message scheduled within 
    //10 seconds is sent immediately.

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

async function savePhotoToDisk(url, image_id) {
    const response = await axios.get(url, { responseType: 'stream' });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(`./saved_images/${image_id}.jpg`))
            .on('finish', () => {
                console.log("Saved file locally");
                resolve("ok");
            })
            .on('error', e => {
                console.error("While saving image to disk: ", e);
                reject(e);
            })
    });
}

//WARNING: this will write files to bot's local disk space
bot.on('photo', async (ctx) => {
    const files = ctx.message.photo;
    const fileId = files[0].file_id;
    console.log(`I was sent a photo.  (Caption: ${ctx.message.caption}).  Files (various sizes): `, files);
    //WARNING! This URL from file link will have your bot token in it - don't publish it!
    const url = await ctx.telegram.getFileLink(fileId);

    const saveResult = await savePhotoToDisk(url, files[0].file_unique_id);
    console.log("Result of save: ", saveResult);
    ctx.reply('I saved that photo locally, thanks!')
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

