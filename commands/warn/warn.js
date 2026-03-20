const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Lokasi file database warn (akan dibuat otomatis)
const dbPath = path.join(__dirname, '../../warnings.json');

// Fungsi bantu untuk load/save database
const loadDb = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
        return {};
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
};

const saveDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Sistem Peringatan (Warn) untuk member nakal')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers) // Hanya user yg bisa Kick yg bisa pakai ini
        .addSubcommand(sub =>
            sub.setName('tambah')
                .setDescription('Beri peringatan ke member')
                .addUserOption(option => option.setName('target').setDescription('Siapa yang mau diwarn?').setRequired(true))
                .addStringOption(option => option.setName('alasan').setDescription('Kenapa dia diwarn?').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('lihat')
                .setDescription('Lihat history warn member')
                .addUserOption(option => option.setName('target').setDescription('Cek warn siapa?').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('hapus')
                .setDescription('Hapus semua warn member (Reset)')
                .addUserOption(option => option.setName('target').setDescription('Siapa yang mau direset warn-nya?').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('target');
        const db = loadDb();
        
        // Buat key unik per server agar warn beda server tidak campur
        const guildId = interaction.guild.id;
        if (!db[guildId]) db[guildId] = {};

        // --- 1. TAMBAH WARN ---
        if (sub === 'tambah') {
            const reason = interaction.options.getString('alasan');

            // Cek apakah target admin/bot
            if (targetUser.bot) return interaction.reply({ content: 'Bot tidak bisa diwarn.', ephemeral: true });
            if (targetUser.id === interaction.user.id) return interaction.reply({ content: 'Jangan warn diri sendiri bro.', ephemeral: true });

            // Inisialisasi array jika belum ada
            if (!db[guildId][targetUser.id]) db[guildId][targetUser.id] = [];

            // Simpan data warn
            const warnData = {
                id: Date.now().toString().slice(-5), // ID simpel 5 digit
                moderator: interaction.user.id,
                reason: reason,
                date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
            };

            db[guildId][targetUser.id].push(warnData);
            saveDb(db);

            const totalWarn = db[guildId][targetUser.id].length;

            // Embed Pesan Publik
            const embed = new EmbedBuilder()
                .setTitle('⚠️ USER WARNED')
                .setColor('Red')
                .setDescription(`**${targetUser.tag}** telah diberikan peringatan!`)
                .addFields(
                    { name: 'Alasan', value: reason },
                    { name: 'Total Warn', value: `${totalWarn}x`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setFooter({ text: 'Jangan diulangi lagi ya!' })
                .setTimestamp();

            // Coba DM user biar dia tau rasa
            try {
                await targetUser.send(`🚨 **Kamu mendapatkan Peringatan di ${interaction.guild.name}**\nAlasan: ${reason}\nTotal Warn: ${totalWarn}`);
            } catch (err) {
                // Ignore kalau DM dikunci
            }

            return interaction.reply({ embeds: [embed] });
        }

        // --- 2. LIHAT WARN ---
        if (sub === 'lihat') {
            const warnings = db[guildId][targetUser.id] || [];

            if (warnings.length === 0) {
                return interaction.reply({ content: `✅ **${targetUser.tag}** bersih! Belum ada catatan kriminal.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📜 History Warn: ${targetUser.username}`)
                .setColor('Orange')
                .setDescription(`Total pelanggaran: **${warnings.length}**`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            // Loop list warn (Max 10 terakhir biar gak kepanjangan)
            const recentWarns = warnings.slice(-10);
            recentWarns.forEach((w, index) => {
                embed.addFields({
                    name: `#${index + 1} | ID: ${w.id} (${w.date})`,
                    value: `📄 **Alasan:** ${w.reason}\n👮 **Mod:** <@${w.moderator}>`
                });
            });

            return interaction.reply({ embeds: [embed] });
        }

        // --- 3. HAPUS WARN ---
        if (sub === 'hapus') {
            if (!db[guildId][targetUser.id] || db[guildId][targetUser.id].length === 0) {
                return interaction.reply({ content: 'User ini memang tidak punya warn untuk dihapus.', ephemeral: true });
            }

            // Hapus data
            delete db[guildId][targetUser.id];
            saveDb(db);

            const embed = new EmbedBuilder()
                .setTitle('♻️ WARN RESET')
                .setColor('Green')
                .setDescription(`Catatan warn untuk **${targetUser.tag}** telah dihapus bersih oleh **${interaction.user.tag}**.`)
                .setFooter({ text: 'Sekarang dia kembali suci.' });

            return interaction.reply({ embeds: [embed] });
        }
    }
};

