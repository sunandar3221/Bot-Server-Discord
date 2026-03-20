const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
const CONFIG = {
    jailRoleId: '1247432852396703754',
    logChannelId: '1250738108647866411'
};

const DB_PATH = path.join(__dirname, '../jail.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jail')
        .setDescription('Penjarakan member nakal (Mod/Admin Only)')
        .addUserOption(opt => 
            opt.setName('target').setDescription('Terdakwa').setRequired(true))
        .addIntegerOption(opt => 
            opt.setName('durasi').setDescription('Durasi dalam MENIT').setRequired(true))
        .addStringOption(opt => 
            opt.setName('alasan').setDescription('Kenapa dia dipenjara?').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const durationMinutes = interaction.options.getInteger('durasi');
        const reason = interaction.options.getString('alasan');
        const executor = interaction.member;

        await interaction.deferReply(); 

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) return interaction.editReply('❌ Usernya ga ketemu bro.');

        // Cek Hierarki
        if (member.roles.highest.position >= executor.roles.highest.position) {
            return interaction.editReply('⛔ **GAK BISA BRO!** Pangkat dia setara atau lebih tinggi dari lo.');
        }
        if (member.id === interaction.guild.ownerId) {
            return interaction.editReply('💀 Mau ngudeta Owner lo?');
        }

        // Baca DB
        let db = {};
        try {
            if (fs.existsSync(DB_PATH)) db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        } catch (err) {}

        if (db[member.id]) return interaction.editReply('❌ Dia udah di dalam penjara bro.');

        // Filter Role yang mau dicabut (Skip role everyone, managed bot role, dan booster)
        const rolesToSave = member.roles.cache
            .filter(r => r.id !== interaction.guild.id && !r.managed && !r.tags?.premiumSubscriberRole)
            .map(r => r.id);

        const rolesToRemove = member.roles.cache
            .filter(r => r.id !== interaction.guild.id && !r.managed && !r.tags?.premiumSubscriberRole);

        try {
            // Cabut & Pasang Role
            await member.roles.remove(rolesToRemove);
            
            const jailRole = interaction.guild.roles.cache.get(CONFIG.jailRoleId);
            if (!jailRole) return interaction.editReply('❌ Config Error: Role Penjara ID salah/ga ketemu.');
            await member.roles.add(jailRole);

            // Hitung Waktu Keluar
            const releaseTime = Date.now() + (durationMinutes * 60 * 1000);
            
            // Format Waktu ke WIB
            const wibReleaseString = new Date(releaseTime).toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                dateStyle: 'full', 
                timeStyle: 'short' 
            });

            // Simpan DB
            db[member.id] = {
                username: targetUser.username,
                releaseTime: releaseTime,
                savedRoles: rolesToSave,
                reason: reason,
                jailedBy: executor.user.username
            };
            
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

            // Kirim Log (WIB)
            const logChannel = interaction.guild.channels.cache.get(CONFIG.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('🚔 MEMBER DIPENJARA')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: 'Terdakwa', value: `${targetUser}`, inline: true },
                        { name: 'Hakim', value: `${executor.user}`, inline: true },
                        { name: 'Durasi', value: `${durationMinutes} Menit`, inline: true },
                        { name: 'Alasan', value: reason },
                        { name: 'Keluar Pada', value: `${wibReleaseString} WIB` }
                    );
                logChannel.send({ embeds: [logEmbed] });
            }

            // Reply Sukses
            const successEmbed = new EmbedBuilder()
                .setColor('DarkRed')
                .setDescription(`🔒 **SUKSES!** ${targetUser} dijebloskan ke penjara selama **${durationMinutes} menit**.\nBakal bebas otomatis pada: **${wibReleaseString} WIB**.`);
            
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Gagal eksekusi. Pastikan Role Bot ada di atas role target.');
        }
    },
};


