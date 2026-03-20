const { Collection } = require('discord.js');

// Simpen data warning di memory (RAM)
const userWarnings = new Collection();

// Daftar kata kasar (Huruf kecil semua)
const badWordsList = [
    'anjing', 'kontol', 'memek', 'bangsat', 'goblok', 'tolol', 
    'bajingan', 'asu', 'jancok', 'ngentot', 'ngewe', 'jembut', 'pantek'
];

// Mapping huruf aneh (Leet speak) buat normalisasi
const leetMap = {
    '4': 'a', '@': 'a', 'a': 'a',
    '3': 'e', 'e': 'e',
    '1': 'i', '!': 'i', 'i': 'i',
    '0': 'o', 'o': 'o',
    '5': 's', '$': 's', 's': 's',
    '7': 't', 't': 't',
    '6': 'g', 'g': 'g',
    '9': 'g', 'q': 'g' // Kadang 9/q mirip g
};

// Fungsi Normalisasi Teks (The Brain)
function normalizeText(text) {
    return text
        .toLowerCase() // Biar lowercase semua
        .split('') // Pecah jadi per huruf
        .map(char => leetMap[char] || char) // Ubah angka/simbol ke huruf
        .join('') // Gabung lagi
        .replace(/[^a-z]/g, ''); // Hapus semua yang bukan huruf (spasi, titik, koma, dll)
}

// Fungsi buat reset warning otomatis (Timer 5 menit)
function scheduleReset(userId) {
    if (userWarnings.get(userId)?.timeoutId) {
        clearTimeout(userWarnings.get(userId).timeoutId);
    }

    const timeoutId = setTimeout(() => {
        userWarnings.delete(userId);
        console.log(`[RESET] Warning user ${userId} udah ke-reset bro.`);
    }, 5 * 60 * 1000);

    return timeoutId;
}

module.exports = {
    name: 'messageCreate',
    once: false,

    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // 1. Normalisasi teks pesan user
        const rawContent = message.content;
        const normalizedContent = normalizeText(rawContent);

        // 2. Cek apakah ada kata kasar di teks yang udah bersih
        // Kita pakai .some() buat cek satu-satu apakah kata kasar ada di dalam teks
        const foundBadWord = badWordsList.find(word => normalizedContent.includes(word));

        if (foundBadWord) {
            // Hapus pesan user
            try {
                await message.delete();
            } catch (err) {
                console.error("Gagal hapus pesan, cek permission bot!");
            }

            // Ambil data warning
            let userData = userWarnings.get(message.author.id);
            if (!userData) {
                userData = { warnings: 0, messages: [], timeoutId: null };
            }

            userData.warnings += 1;
            userData.messages.push(message.id);
            userData.timeoutId = scheduleReset(message.author.id);
            userWarnings.set(message.author.id, userData);

            console.log(`[WARNING] ${message.author.tag} kena warning ke-${userData.warnings} | Teks Asli: "${rawContent}" | Normalisasi: "${normalizedContent}"`);

            const { member } = message;

            // Logika Hukuman
            if (userData.warnings >= 3) {
                // === EKSEKUSI: TIMEOUT 10 MENIT ===
                try {
                    if (member.moderatable) {
                        await member.timeout(10 * 60 * 1000, '3x Pakai Kata Kasar (Auto Mod)');
                        
                        // Kirim pesan hukuman & auto delete setelah 10 detik
                        const punishMsg = await message.channel.send(`**Woi <@${message.author.id}>!** Lu kebanyakan mulut kasar. Enjoy timeout 10 menit yaa! 🚮`);
                        
                        setTimeout(() => {
                            punishMsg.delete().catch(() => {});
                        }, 10000); // 10 detik

                        clearTimeout(userData.timeoutId);
                        userWarnings.delete(message.author.id);
                    } else {
                        message.channel.send("Waduh role dia lebih gede dari gua, gua gabisa timeout dia. Ada moderator online ga?")
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                    }
                } catch (error) {
                    console.error("Error saat mau timeout:", error);
                }
            } else {
                // === EKSEKUSI: WARNING BIASA ===
                const sisaNyawa = 3 - userData.warnings;
                const warningMsg = await message.channel.send(`**⚠️ Warning ${userData.warnings}/3** - Hey <@${message.author.id}>, jangan pakai kata kasar! Sisa kesempatan lu tinggal **${sisaNyawa}** kali.`);
                
                // Auto delete warning message setelah 10 detik
                setTimeout(() => {
                    warningMsg.delete().catch(() => {});
                }, 10000);
            }
        }
    }
};