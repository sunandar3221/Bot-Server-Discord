const franc = require('franc'); // Pastikan install: npm install franc@5

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // 1. Cek dasar: Abaikan pesan dari bot
        if (message.author.bot) return;

        // 2. Konfigurasi
        const TARGET_CHANNEL_ID = '1359509550239055985'; // Ganti dengan ID Channel Inggris kamu
        const ALLOWED_LANGUAGES = ['eng']; // Kode ISO 639-3 untuk English
        const MIN_LENGTH_CHECK = 4; // Minimal karakter untuk dicek (biar "ok", "lol" ga kena hapus)

        // 3. Pastikan hanya berjalan di channel target
        if (message.channel.id !== TARGET_CHANNEL_ID) return;

        // Bersihkan pesan dari mention, emoji, dan link agar deteksi lebih akurat
        const cleanContent = message.content
            .replace(/<@!?[0-9]+>/g, '') // Hapus mention user
            .replace(/https?:\/\/\S+/g, '') // Hapus link
            .replace(/<:.+?:\d+>/g, '') // Hapus emoji custom
            .trim();

        // 4. Bypass jika pesan terlalu pendek (menghindari false positive pada "ok", "yep", "lol")
        if (cleanContent.length < MIN_LENGTH_CHECK) return;

        // 5. Deteksi Bahasa menggunakan library franc
        // franc mengembalikan 'und' (undetermined) jika tidak yakin
        const detectedLang = franc(cleanContent);

        // 6. Filter Tambahan: Cek Kata Gaul/Umum Indonesia
        // Franc kadang kurang akurat untuk bahasa gaul, jadi kita cek manual kata-kata khas Indo
        const indoSlang = [
            'aku', 'kamu', 'gw', 'gua', 'lu', 'lo', 'nggak', 'gak', 'gk', 'bisa', 
            'lagi', 'ini', 'itu', 'yang', 'yg', 'siapa', 'kapan', 'wkwk', 'awok', 
            'bang', 'kak', 'mas', 'mbak', 'iya', 'tidak', 'tapi', 'dan', 'atau',
            'kenapa', 'knp', 'udh', 'udah', 'blm', 'belum'
        ];
        
        // Cek apakah ada kata Indonesia di dalam pesan (case insensitive)
        const isIndoSlang = cleanContent.toLowerCase().split(/\s+/).some(word => indoSlang.includes(word));

        // 7. Logika Pengecekan Akhir
        // Hapus jika: 
        // A. Terdeteksi bahasa tertentu (misal 'ind' untuk Indonesia) DAN bukan 'eng'
        // B. ATAU Terdeteksi mengandung kata-kata gaul Indonesia
        
        let shouldDelete = false;

        if (isIndoSlang) {
            shouldDelete = true;
        } else if (detectedLang !== 'eng' && detectedLang !== 'und') {
            // Kita hanya menghapus jika franc YAKIN itu bukan bahasa Inggris (dan bukan undetermined)
            // Jika franc mendeteksi 'ind' (Indo), 'msa' (Malay), dll, maka hapus.
            shouldDelete = true;
        }

        // 8. Eksekusi Penghapusan
        if (shouldDelete) {
            try {
                await message.delete();
                
                // Opsional: Kirim pesan peringatan lalu hapus setelah 5 detik biar ga nyampah
                const warningMsg = await message.channel.send(
                    `⚠️ **Warning ${message.author}**: This channel is **English Only**. Please speak English.\n*Pesanmu dihapus karena terdeteksi bukan bahasa Inggris.*`
                );
                
                setTimeout(() => {
                    warningMsg.delete().catch(console.error);
                }, 5000);

                console.log(`[AutoMod] Menghapus pesan dari ${message.author.tag}: "${message.content}" (Deteksi: ${detectedLang})`);
            } catch (error) {
                console.error(`Gagal menghapus pesan: ${error}`);
            }
        }
    },
};

