const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({
    authStrategy: new LocalAuth()
});

let conversationContext = {};

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('message', async (message) => {
    console.log(`Received message: ${message.body}`);

    if (message.body.toLowerCase().startsWith('.ai') || message.hasQuotedMsg) {
        let prompt = '';

        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (conversationContext[quotedMsg.id._serialized]) {
                prompt = conversationContext[quotedMsg.id._serialized] + " " + message.body.trim();
            } else {
                message.reply('Maaf, saya tidak dapat melanjutkan percakapan ini karena tidak ada konteks yang ditemukan.');
                return;
            }
        } else {
            prompt = message.body.slice(4).trim();
        }

        if (prompt.length > 0) {
            let typingMessage;
            try {
                typingMessage = await message.reply('*Bot is typing...*');
                const genAI = new GoogleGenerativeAI(process.env.API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent("'Anda adalah Robot-Damar, sebuah AI yang dikembangkan oleh Damar dari kelas XII RPL 2 di Sekolah SMK Angkasa 1 Margahayu. Tugas Anda adalah memberikan informasi dan menjawab pertanyaan dengan cara yang jelas, informatif, dan mudah dimengerti dalam bahasa Indonesia. Gunakan bahasa yang sederhana dan hindari jargon teknis yang sulit dipahami. Pastikan setiap respons Anda ramah, sehingga pengguna merasa nyaman untuk berinteraksi dengan Anda. Jika tidak mengetahui jawaban atas pertanyaan, sampaikan dengan sopan dan tawarkan untuk membantu dengan pertanyaan lain. Dan ini adalah pertanyaannya : ''" + prompt  + "'");
                const responseText = result.response.text();
                const replyMessage = await typingMessage.edit(responseText);
                conversationContext[replyMessage.id._serialized] = responseText;
            } catch (error) {
                console.error("Error generating content:", error);
                await typingMessage.edit('Maaf, terjadi kesalahan saat memproses permintaan AI.');
            }
        } else {
            message.reply('Mohon sertakan prompt setelah perintah ".ai".');
        }
    } else {
        if (message.body.toLowerCase() === 'halo') {
            message.reply('Halo! Ada yang bisa saya bantu?');
        } else if (message.body.toLowerCase() === 'info') {
            message.reply('Ini adalah WhatsApp bot yang dibangun menggunakan Node.js dan whatsapp-web.js.');
        }
    }
});

client.initialize();
