const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // 1. Cek dasar: Abaikan pesan dari bot
        if (message.author.bot) return;

        // --- KONFIGURASI ---
        const ENGLISH_CHANNEL_ID = '1359509550239055985'; 

        // 2. DATA SAPAAN & BALASAN (DATABASE KECIL)
        
        // A. Bahasa Indonesia
        const sapaanIndo = [
            'halo', 'hai', 'pagi', 'siang', 'sore', 'malam', 'malem',
            'woy', 'tes', 'p', 'assalamualaikum', 'mekum', 'bang', 'kak', 'mas'
        ];
        const balasanIndo = [
            `Halo bang jago, sehat? \uD83D\uDE0E`, // Sunglasses
            `Woy juga! Tumben nongol \uD83D\uDE02`, // Joy
            `Hadir boskuu! \uD83E\uDEE1`, // Salute
            `Gas terus pantang mundur! \uD83D\uDD25`, // Fire
            `Waalaikumsalam, eh.. Halo! \uD83D\uDE4F`, // Folded hands
            `Yoi, apa kabar? \uD83D\uDC4B` // Waving
        ];

        // B. Bahasa Inggris
        const sapaanInggris = [
            'hello', 'hi', 'hey', 'heyo', 'yo', 'sup', 'howdy',
            'morning', 'good morning', 'gm', 'afternoon', 'evening',
            'whats up', 'greetings'
        ];
        const balasanInggris = [
            `Yo what's up buddy! \uD83E\uDD19`, // Call me hand
            `Hey there! Hope you're doing great \uD83D\uDE0E`, // Sunglasses
            `Sup! Welcome back \uD83D\uDC4A`, // Fist bump
            `Hi! Keep the vibe going \uD83D\uDD25`, // Fire
            `Greetings! How's it going? \uD83E\uDEE1`, // Salute
            `Hello! Good to see you \uD83D\uDE04` // Smile
        ];

        // 3. PROSES PENGECEKAN
        const pesanUser = message.content.toLowerCase();
        
        // Fungsi helper buat cek sapaan
        const checkSapaan = (listKata) => listKata.some(kata => 
            pesanUser === kata || pesanUser.startsWith(kata + ' ') || pesanUser.startsWith(kata + ',')
        );

        const isIndo = checkSapaan(sapaanIndo);
        const isInggris = checkSapaan(sapaanInggris);

        // 4. LOGIKA PEMILIHAN BAHASA (THE BRAIN)
        let jawabanFinal = null;

        // KONDISI 1: Jika di Channel Khusus Inggris
        if (message.channel.id === ENGLISH_CHANNEL_ID) {
            // Hanya respon jika sapaannya Inggris
            if (isInggris) {
                jawabanFinal = balasanInggris[Math.floor(Math.random() * balasanInggris.length)];
            }
            // Jika isIndo, bot DIAM SAJA (biarkan module languageChecker yang hapus pesannya)
        } 
        
        // KONDISI 2: Jika di Channel Biasa (General/Lainnya)
        else {
            // Prioritas: Kalau kedeteksi Inggris jawab Inggris, kalau Indo jawab Indo
            if (isInggris) {
                jawabanFinal = balasanInggris[Math.floor(Math.random() * balasanInggris.length)];
            } else if (isIndo) {
                jawabanFinal = balasanIndo[Math.floor(Math.random() * balasanIndo.length)];
            }
        }

        // 5. EKSEKUSI BALASAN
        if (jawabanFinal) {
            try {
                // Kasih reaction dulu biar asik
                await message.react('\uD83D\uDC4B'); // Waving Hand

                // Reply tanpa ping (no mention)
                await message.reply({
                    content: jawabanFinal,
                    allowedMentions: { repliedUser: false }
                });
            } catch (error) {
                console.error('Gagal membalas sapaan:', error);
            }
        }
    },
};


