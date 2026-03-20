const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
const LEVEL_LOG_CHANNEL_ID = '1251080883889377310'; 
const DB_PATH = path.join(__dirname, '../levels.json'); // Lokasi file database

// Biar ga spam XP (Cooldown sederhana pake Set)
const talkedRecently = new Set();

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        // 1. Cuekin kalau yang chat itu Bot atau pesan DM
        if (message.author.bot || !message.guild) return;

        // 2. Cek Cooldown (Biar ga farming XP dengan spam)
        // User cuma dapet XP setiap 60 detik sekali
        if (talkedRecently.has(message.author.id)) return;

        // Tambahin user ke cooldown
        talkedRecently.add(message.author.id);
        setTimeout(() => {
            talkedRecently.delete(message.author.id);
        }, 60000); // 60 detik = 60000 ms

        // 3. Baca Database
        let db = {};
        try {
            if (fs.existsSync(DB_PATH)) {
                const data = fs.readFileSync(DB_PATH, 'utf8');
                db = JSON.parse(data);
            }
        } catch (err) {
            console.error('Gagal baca database level:', err);
        }

        const userId = message.author.id;

        // 4. Setup Data User kalau belum ada
        if (!db[userId]) {
            db[userId] = {
                xp: 0,
                level: 1,
                username: message.author.username // Simpen nama buat gampang dicek manual
            };
        }

        // 5. Tambah XP Random (10 - 25 XP per chat)
        const xpGained = Math.floor(Math.random() * 16) + 10;
        db[userId].xp += xpGained;

        // 6. Logika Naik Level
        // Rumus: Level * 200 (Contoh: Level 1 butuh 200 XP, Level 2 butuh 400 XP)
        const xpNeeded = db[userId].level * 200;

        if (db[userId].xp >= xpNeeded) {
            db[userId].level++;
            db[userId].xp -= xpNeeded; // Reset XP atau lanjutin sisa XP (pilih reset biar rapi)

            // Kirim Notifikasi ke Channel Khusus
            const logChannel = message.guild.channels.cache.get(LEVEL_LOG_CHANNEL_ID);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('Gold')
                    .setTitle('🚀 LEVEL UP!')
                    .setDescription(`Wih mantap! **${message.author}** baru aja naik ke **Level ${db[userId].level}**!`)
                    .setFooter({ text: 'Makin rajin chat makin gacor bro!' });
                
                logChannel.send({ embeds: [embed] });
            } else {
                // Fallback kalau channel log ga ketemu, kirim di channel tempat dia chat
                message.channel.send(`🎉 Selamat **${message.author}**, lo naik ke **Level ${db[userId].level}** bro!`);
            }
        }

        // 7. Simpan Database
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        } catch (err) {
            console.error('Gagal simpan database level:', err);
        }
    },
};

