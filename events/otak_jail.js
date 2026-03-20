const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
const CONFIG = {
    jailRoleId: '1247432852396703754',
    logChannelId: '1250738108647866411'
};

const DB_PATH = path.join(__dirname, '../jail.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('👮 [SYSTEM] Sistem Penjara Siap 86! Memulai patroli...');

        // Cek database tiap 10 detik
        setInterval(async () => {
            // 1. Baca Database
            let db = {};
            try {
                if (fs.existsSync(DB_PATH)) {
                    const rawData = fs.readFileSync(DB_PATH, 'utf8');
                    // Cek kalo file kosong biar ga crash
                    if (rawData) db = JSON.parse(rawData);
                }
            } catch (err) { 
                console.error('[ERROR] Gagal baca jail.json:', err);
                return;
            }

            const now = Date.now();
            let isUpdated = false;
            
            // 2. Loop Semua Napi
            // Object.keys(db) ngambil semua ID user yang ada di DB
            for (const userId of Object.keys(db)) {
                const napiData = db[userId];

                // Cek apakah waktunya sudah habis?
                if (now >= napiData.releaseTime) {
                    console.log(`🔓 Waktunya membebaskan user ID: ${userId}`);

                    // Loop ke semua server dimana bot berada (biasanya cuma 1 sih)
                    for (const guild of client.guilds.cache.values()) {
                        try {
                            // Coba ambil membernya
                            const member = await guild.members.fetch(userId).catch(() => null);
                            
                            // Kalau member ketemu di server ini
                            if (member) {
                                // A. Cabut Role Penjara
                                const jailRole = guild.roles.cache.get(CONFIG.jailRoleId);
                                if (jailRole) {
                                    await member.roles.remove(jailRole).catch(e => console.log(`Gagal cabut role jail: ${e.message}`));
                                }

                                // B. Balikin Role Lama (Kalau ada datanya)
                                if (napiData.savedRoles && Array.isArray(napiData.savedRoles)) {
                                    // Filter role yang masih valid/ada di server
                                    const validRoles = [];
                                    for (const rId of napiData.savedRoles) {
                                        if (guild.roles.cache.has(rId)) validRoles.push(rId);
                                    }
                                    
                                    if (validRoles.length > 0) {
                                        await member.roles.add(validRoles).catch(e => console.log(`Gagal balikin role lama: ${e.message}`));
                                    }
                                }

                                // C. Kirim Log Bebas (Pake WIB)
                                const logChannel = guild.channels.cache.get(CONFIG.logChannelId);
                                if (logChannel) {
                                    const wibTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'medium' });

                                    const embed = new EmbedBuilder()
                                        .setColor('Green')
                                        .setTitle('🕊️ MEMBER BEBAS')
                                        .setThumbnail(member.user.displayAvatarURL())
                                        .setDescription(`**${member.user.tag}** telah menyelesaikan masa hukumannya.`)
                                        .addFields({ name: 'Waktu Keluar', value: `${wibTime} WIB` })
                                        .setFooter({ text: 'Jangan nakal lagi ya!' });
                                    
                                    await logChannel.send({ embeds: [embed] });
                                }
                            }
                        } catch (err) {
                            console.error(`[ERROR] Gagal proses release user ${userId} di guild ${guild.name}:`, err);
                        }
                    }

                    // Hapus dari database (karena udah diproses)
                    delete db[userId];
                    isUpdated = true;
                }
            }

            // 3. Simpan Perubahan (Kalau ada yang dihapus)
            if (isUpdated) {
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
                console.log('💾 Database Penjara di-update (Ada yang bebas).');
            }

        }, 10000); // 10 Detik sekali


        // --- ANTI BYPASS LOGIC (Event Listener Manual) ---
        // Ini biar gak perlu bikin file terpisah lagi
        client.on(Events.GuildMemberAdd, async (member) => {
            let db = {};
            try {
                if (fs.existsSync(DB_PATH)) db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            } catch (err) { return; }

            // Kalau ID member yang masuk ada di database penjara
            if (db[member.id]) {
                const jailRole = member.guild.roles.cache.get(CONFIG.jailRoleId);
                if (jailRole) {
                    // Penjarain lagi
                    await member.roles.add(jailRole);
                    
                    const logChannel = member.guild.channels.cache.get(CONFIG.logChannelId);
                    if (logChannel) {
                        logChannel.send(`🚨 **ANTI-BYPASS TRIGGERED!**\nSi **${member.user.tag}** mencoba kabur (rejoin), tapi langsung ketangkep lagi! Hukuman berlanjut.`);
                    }
                }
            }
        });
    },
};


