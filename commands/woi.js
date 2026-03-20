const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// KONFIGURASI LINK SERVER BETA
const LINK_SERVER_BETA = "https://discord.gg/nHZVZtXVw6"; 

// File database sederhana untuk menyimpan siapa yang sudah request
const DB_FILE = path.join(__dirname, 'beta_applicants.json');

// Fungsi helper untuk memuat database
function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([]));
        return [];
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error membaca database:", err);
        return [];
    }
}

// Fungsi helper untuk menyimpan user ke database
function saveUserToDatabase(userId) {
    const users = loadDatabase();
    if (!users.includes(userId)) {
        users.push(userId);
        fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('betatest')
        .setDescription('Ajukan permohonan untuk menjadi Beta Tester')
        .addStringOption(option =>
            option.setName('alasan')
                .setDescription('Jelaskan mengapa Anda ingin menjadi Beta Tester')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const reason = interaction.options.getString('alasan');

        // 1. Cek apakah user sudah pernah menggunakan command ini (diterima/ditolak sama saja)
        const applicants = loadDatabase();
        if (applicants.includes(userId)) {
            return interaction.reply({ 
                content: '❌ Anda sudah pernah mengajukan permohonan Beta Tester sebelumnya. Permohonan hanya dapat dilakukan satu kali.', 
                ephemeral: true 
            });
        }

        // Defer reply karena proses DM mungkin memakan waktu
        await interaction.deferReply({ ephemeral: true });

        try {
            // 2. Dapatkan Owner Server
            const guild = interaction.guild;
            const owner = await guild.fetchOwner();

            // 3. Simpan ID user ke database SEKARANG agar tidak bisa spam command
            saveUserToDatabase(userId);

            // 4. Siapkan Embed untuk Owner
            const embedOwner = new EmbedBuilder()
                .setTitle('📩 Permintaan Beta Tester Baru')
                .setColor('Blue')
                .addFields(
                    { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
                    { name: 'Alasan', value: reason },
                    { name: 'Waktu', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                )
                .setFooter({ text: 'Klik tombol di bawah untuk memutuskan.' });

            // 5. Siapkan Tombol (Accept / Decline)
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept_beta')
                        .setLabel('Terima')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('decline_beta')
                        .setLabel('Tolak')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⛔')
                );

            // 6. Kirim DM ke Owner
            const ownerMessage = await owner.send({ 
                content: `Halo Owner, ada permintaan baru dari server **${guild.name}**.`,
                embeds: [embedOwner], 
                components: [buttons] 
            });

            // Beritahu user bahwa permintaan terkirim
            await interaction.editReply({ 
                content: '✅ Permohonan Beta Tester Anda telah dikirim ke Owner Server. Silakan tunggu konfirmasi melalui DM. Pastikan DM Anda terbuka.' 
            });

            // 7. Buat Collector untuk menangkap respon Owner pada pesan DM tersebut
            // Collector aktif selama 24 jam (86400000 ms), jika lewat manual handle mungkin diperlukan
            const collector = ownerMessage.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 86_400_000 
            });

            collector.on('collect', async i => {
                // Pastikan yang klik tombol benar-benar owner (meskipun ini di DM, good practice)
                if (i.user.id !== owner.id) return;

                // Matikan tombol setelah diklik
                const disabledRow = new ActionRowBuilder().addComponents(
                    buttons.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );

                try {
                    if (i.customId === 'accept_beta') {
                        // --- JIKA DITERIMA ---
                        
                        // Kirim DM ke User
                        try {
                            await interaction.user.send({
                                content: `🎉 **Selamat!** Permohonan Beta Tester Anda diterima.\n\nSilakan bergabung melalui link berikut:\n${LINK_SERVER_BETA}`
                            });
                        } catch (err) {
                            await i.reply({ content: '⚠️ User diterima, tapi saya tidak bisa mengirim DM ke mereka (DM tertutup).', ephemeral: true });
                            return; // Stop update embed jika gagal DM (opsional)
                        }

                        // Update pesan di DM Owner
                        const acceptedEmbed = EmbedBuilder.from(embedOwner)
                            .setColor('Green')
                            .addFields({ name: 'Status', value: '✅ DITERIMA' });
                        
                        await i.update({ embeds: [acceptedEmbed], components: [disabledRow] });

                    } else if (i.customId === 'decline_beta') {
                        // --- JIKA DITOLAK ---
                        
                        // Kirim DM ke User
                        try {
                            await interaction.user.send({
                                content: `maaf, permohonan Beta Tester Anda untuk server **${guild.name}** telah ditolak oleh Owner.`
                            });
                        } catch (err) {
                            await i.reply({ content: '⚠️ User ditolak, tapi saya tidak bisa mengirim DM ke mereka (DM tertutup).', ephemeral: true });
                            return;
                        }

                        // Update pesan di DM Owner
                        const declinedEmbed = EmbedBuilder.from(embedOwner)
                            .setColor('Red')
                            .addFields({ name: 'Status', value: '⛔ DITOLAK' });

                        await i.update({ embeds: [declinedEmbed], components: [disabledRow] });
                    }
                } catch (error) {
                    console.error("Error saat memproses tombol:", error);
                    if (!i.replied && !i.deferred) {
                        await i.reply({ content: 'Terjadi kesalahan saat memproses keputusan.', ephemeral: true });
                    }
                }
            });

        } catch (error) {
            console.error(error);
            // Handle jika Owner DM tertutup atau error lain
            if (error.code === 50007) {
                await interaction.editReply('❌ Gagal mengirim pesan ke Owner (DM Owner mungkin tertutup).');
            } else {
                await interaction.editReply('❌ Terjadi kesalahan internal saat memproses command.');
            }
        }
    },
};

