const { Events } = require('discord.js');

// KONFIGURASI: Masukkan ID Channel target di sini
const TARGET_CHANNEL_ID = '1365002279723470898';

module.exports = {
    // Nama event: messageCreate (Setiap kali ada pesan baru masuk)
    name: Events.MessageCreate,
    // false artinya event ini akan berjalan terus menerus, tidak hanya sekali
    once: false,

    async execute(message) {
        // 1. Validasi Channel
        // Jika pesan BUKAN berasal dari channel target, abaikan (return)
        if (message.channel.id !== TARGET_CHANNEL_ID) return;

        // 2. Validasi Pengirim (Bot vs User)
        // Jika pengirim adalah Bot, jangan dihapus (return)
        if (message.author.bot) return;

        // 3. Eksekusi Penghapusan
        // Karena lolos filter di atas, berarti ini adalah pesan dari User di channel target
        try {
            // Periksa apakah pesan masih bisa dihapus (deletable)
            if (message.deletable) {
                await message.delete();
                // Opsional: Log ke console untuk memantau
                console.log(`Pesan dari user ${message.author.tag} telah dihapus di channel target.`);
            }
        } catch (error) {
            console.error('Gagal menghapus pesan. Pastikan bot punya izin "Manage Messages":', error);
        }
    },
};

