const TelegramBot = require('node-telegram-bot-api');

// Токен вашего бота
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7260346507:AAHgyipsw-rCJHvOzsqXQgZgHRkJkMjMI90';

// Создаем экземпляр бота
const bot = new TelegramBot(TOKEN, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
 
    const description = `
Привет! 👋
Я - бот для отслеживания тренировок. Нажми на кнопку ниже, чтобы запустить приложение.
    `;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🚀 Запустить приложение',
                        web_app: { url: 'https://workout-tracker-beta-rose.vercel.app/' } // Замените URL на ваш
                    }
                ]
            ] 
        }
    };

    bot.sendMessage(chatId, description, options);
});

module.exports = bot;
