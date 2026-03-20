const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI (SAMAIN KAYAK JAIL.JS) ---
const CONFIG = {
    jailRoleId: '1247432852396703754',
    logChannelId: '1250738108647866411'
};

const DB_PATH = path.join(__dirname, '../jail.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unjail')
        .setDescription('Bebasin member dari penjara secara paksa (Manual Release)')
        .addUserOption(opt => 
            opt.setName('target').setDescription('Napi yang mau dibebasin').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const executor = interaction.member;

        await interaction.deferReply();

        // 1. Cek User di Server
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        // 2. Baca Database
        let db = {};
        try {
            if (fs.existsSync(DB_PATH)) {
                db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            }
        } catch (err) {
            return interaction.editReply('❌ Gagal baca database bro. File corrupt atau gak ada.');
        }

        // 3. Cek Apakah Dia Emang Dipenjara?
        if (!db[targetUser.id]) {
            return interaction.editReply('❌ Orang ini gak ada di data penjara bro. Salah orang kali?');
        }

        const napiData = db[targetUser.id];

        // 4. PROSES PEMBEBASAN
        try {
            if (member) {
                // A. Cabut Role Penjara
                const jailRole = interaction.guild.roles.cache.get(CONFIG.jailRoleId);
                if (jailRole) {
                    await member.roles.remove(jailRole).catch(e => console.log('Gagal cabut role jail:', e));
                }

                // B. Balikin Role Lama
                // Kita cek dulu role-nya masih ada gak di server
                if (napiData.savedRoles && Array.isArray(napiData.savedRoles)) {
                    const validRoles = [];
                    for (const rId of napiData.savedRoles) {
                        if (interaction.guild.roles.cache.has(rId)) validRoles.push(rId);
                    }
                    
                    if (validRoles.length > 0) {
                        await member.roles.add(validRoles).catch(e => console.log('Gagal balikin role lama:', e));
                    }
                }
            } else {
                console.log('Member udah keluar server, tapi data penjara tetep dihapus.');
            }

            // C. Hapus Data dari Database
            delete db[targetUser.id];
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

            // D. Kirim Log (WIB)
            const logChannel = interaction.guild.channels.cache.get(CONFIG.logChannelId);
            if (logChannel) {
                const wibTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'medium' });

                const logEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🔓 MEMBER DIBEBASKAN (MANUAL)')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: 'Mantan Napi', value: `${targetUser.tag}`, inline: true },
                        { name: 'Dibebaskan Oleh', value: `${executor.user.tag}`, inline: true },
                        { name: 'Waktu Bebas', value: `${wibTime} WIB` }
                    )
                    .setFooter({ text: 'Bebas jalur ordal nih bos senggol dong' });
                
                logChannel.send({ embeds: [logEmbed] });
            }

            // E. Reply Sukses
            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ **BERHASIL!** ${targetUser} udah dibebasin dari penjara.\nSemua role lama udah dibalikin.`);

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Ada error pas proses unjail. Cek console bro.');
        }
    },
};

