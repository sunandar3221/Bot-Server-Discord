const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
const CHANNEL_ID = '1367014167688777728'; 
const DB_PATH = path.join(__dirname, '../counting.json');

module.exports = {
    name: Events.MessageDelete, 
    once: false,
    async execute(message) {
        // 1. Cek Channel ID
        // Note: message.channelId lebih aman dipake daripada message.channel.id buat event delete
        if (message.channelId !== CHANNEL_ID) return;

        // 2. Baca Database
        let db = { currentNumber: 0, lastMessageId: "" };
        try {
            if (fs.existsSync(DB_PATH)) {
                db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            }
        } catch (err) { return; }

        // 3. LOGIKA ANTI-TROLL CERDAS
        // Kita cek: Apakah ID pesan yang dihapus SAMA dengan ID angka terakhir yang bener?
        // Kalau beda, berarti dia cuma hapus chat lama/chat gak penting. Cuekin aja.
        if (message.id === db.lastMessageId) {
            
            // Angka yang harusnya dilanjutin
            const nextNumber = db.currentNumber + 1;

            // Kirim notifikasi
            // Kita ambil channel dari cache client karena message.channel bisa jadi null/undefined kalau pesannya tua
            const channel = message.client.channels.cache.get(CHANNEL_ID);
            
            if (channel) {
                channel.send(`👀 **Anti-Troll:** Waduh, angka terakhir (**${db.currentNumber}**) barusan dihapus!\nJangan bingung guys, lanjutannya tetap angka **${nextNumber}** ya!`);
            }
        }
    },
};


