const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    
    async execute(member) {
        // --- KONFIGURASI ---
        // Ganti ID role member biasa (Role Tamu/Warga) di sini
        const NORMAL_ROLE_ID = '1249295746935689246'; 
        const DB_PATH = path.join(__dirname, '../jail.json');

        // --- CEK APAKAH USER LAGI DIPENJARA? ---
        let isJailed = false;
        try {
            if (fs.existsSync(DB_PATH)) {
                const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
                if (db[member.id]) {
                    isJailed = true;
                }
            }
        } catch (err) {
            console.error('[Auto Role] Gagal baca database jail:', err);
        }

        // Kalau lagi dipenjara, JANGAN kasih role member biasa
        if (isJailed) {
            console.log(`🚫 [Auto Role] Skip ngasih role ke ${member.user.tag} karena dia NAPI (Lagi dipenjara).`);
            return; // Berhenti di sini, biarin sistem Anti-Bypass yang kerja
        }

        // --- LANJUT KASIH ROLE BIASA ---
        const role = member.guild.roles.cache.get(NORMAL_ROLE_ID);

        if (!role) {
            console.error(`[Auto Role] Role ID ${NORMAL_ROLE_ID} ga ketemu bro!`);
            return;
        }

        try {
            await member.roles.add(role);
            console.log(`✅ [Auto Role] Berhasil kasih role ${role.name} ke ${member.user.tag}`);
        } catch (error) {
            console.error(`❌ [Auto Role] Gagal kasih role:`, error);
        }
    },
};

