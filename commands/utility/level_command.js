const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../levels.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Cek statistik level dan XP lo')
        .addUserOption(option => 
            option.setName('target').setDescription('Cek level orang lain').setRequired(false)),
    async execute(interaction) {
        // Cek target (diri sendiri atau orang lain)
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const userId = targetUser.id;

        // Baca Database
        let db = {};
        try {
            if (fs.existsSync(DB_PATH)) {
                const data = fs.readFileSync(DB_PATH, 'utf8');
                db = JSON.parse(data);
            }
        } catch (err) {
            return interaction.reply({ content: '❌ Waduh, database level lagi bermasalah bro.', ephemeral: true });
        }

        // Ambil Data User
        const userData = db[userId];

        if (!userData) {
            return interaction.reply({ 
                content: targetUser.id === interaction.user.id 
                    ? '❌ Lo belum punya XP bro. Mulai chat dulu gih!' 
                    : `❌ Si **${targetUser.username}** belum pernah chat bro, masih level 0.`,
                ephemeral: true 
            });
        }

        // Hitung Progress Bar (Visualisasi)
        const xpNeeded = userData.level * 200;
        const percentage = Math.floor((userData.xp / xpNeeded) * 100);
        
        // Bikin bar sederhana [■■■■■□□□□□]
        const totalBars = 10;
        const filledBars = Math.round((percentage / 100) * totalBars);
        const emptyBars = totalBars - filledBars;
        const progressBar = '🟦'.repeat(filledBars) + '⬜'.repeat(emptyBars);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
            .setTitle('Statistik Level')
            .addFields(
                { name: '⚡ Level', value: `${userData.level}`, inline: true },
                { name: '✨ XP Saat Ini', value: `${userData.xp} / ${xpNeeded}`, inline: true },
                { name: '📊 Progress', value: `${progressBar} (${percentage}%)`, inline: false }
            )
            .setFooter({ text: 'Terus ramaikan server biar makin tinggi level lo!' });

        await interaction.reply({ embeds: [embed] });
    },
};

