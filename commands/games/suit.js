const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suit')
        .setDescription('Bermain Batu Gunting Kertas (Suit)')
        .addUserOption(option => 
            option.setName('lawan')
                .setDescription('Pilih user untuk main multiplayer (Kosongkan untuk lawan Bot)')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('lawan');
        const player = interaction.user;

        // --- DEFINISI PILIHAN & LOGIKA ---
        const choices = [
            { name: 'Batu', emoji: '🪨', id: 'batu' },
            { name: 'Kertas', emoji: '📄', id: 'kertas' },
            { name: 'Gunting', emoji: '✂️', id: 'gunting' }
        ];

        // Fungsi untuk menentukan pemenang
        // Return: 0 (Seri), 1 (P1 Menang), 2 (P2 Menang)
        const determineWinner = (p1Choice, p2Choice) => {
            if (p1Choice === p2Choice) return 0;
            if (
                (p1Choice === 'batu' && p2Choice === 'gunting') ||
                (p1Choice === 'kertas' && p2Choice === 'batu') ||
                (p1Choice === 'gunting' && p2Choice === 'kertas')
            ) {
                return 1;
            }
            return 2;
        };

        // Membuat Tombol
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('batu').setLabel('Batu').setEmoji('🪨').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('kertas').setLabel('Kertas').setEmoji('📄').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('gunting').setLabel('Gunting').setEmoji('✂️').setStyle(ButtonStyle.Primary)
            );

        // --- MODE 1: LAWAN BOT (Singleplayer) ---
        if (!targetUser || targetUser.id === interaction.client.user.id) {
            const embedMsg = await interaction.reply({
                content: `**${player.username}** vs **Bot**\nSilakan pilih langkahmu!`,
                components: [row],
                fetchReply: true
            });

            const collector = embedMsg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 30000 // 30 detik waktu memilih
            });

            collector.on('collect', async i => {
                if (i.user.id !== player.id) {
                    return i.reply({ content: 'Ini bukan giliranmu!', ephemeral: true });
                }

                // Logika Bot
                const botChoice = choices[Math.floor(Math.random() * choices.length)];
                const playerChoice = choices.find(c => c.id === i.customId);
                const result = determineWinner(playerChoice.id, botChoice.id);

                let resultText = '';
                if (result === 0) resultText = 'Hasilnya **SERI!** 🤝';
                else if (result === 1) resultText = `**${player.username}** Menang! 🎉`;
                else resultText = '**Bot** Menang! 🤖';

                // Matikan tombol setelah selesai
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );

                await i.update({
                    content: `**${player.username}** memilih ${playerChoice.emoji} vs **Bot** memilih ${botChoice.emoji}\n\n${resultText}`,
                    components: [disabledRow]
                });
                collector.stop();
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({
                        content: 'Waktu habis! Game dibatalkan.',
                        components: []
                    });
                }
            });
            return;
        }

        // --- MODE 2: MULTIPLAYER (PvP) ---
        if (targetUser.id === player.id) {
            return interaction.reply({ content: 'Kamu tidak bisa main suit lawan diri sendiri, dasar kesepian! 🗿', ephemeral: true });
        }
        if (targetUser.bot) {
            return interaction.reply({ content: 'Bot lain tidak bisa diajak main suit. Kosongkan pilihan lawan untuk main sama aku saja.', ephemeral: true });
        }

        const embedMsg = await interaction.reply({
            content: `🏁 **SUIT BATTLE** 🏁\n**${player.username}** VS **${targetUser.username}**\n\nSilakan keduanya memilih tombol di bawah! (Pilihan dirahasiakan sampai keduanya memilih)`,
            components: [row],
            fetchReply: true
        });

        // Variabel untuk menyimpan pilihan
        const picks = {};

        const collector = embedMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // 60 detik untuk PvP
        });

        collector.on('collect', async i => {
            // Cek apakah yang klik adalah salah satu dari 2 pemain
            if (i.user.id !== player.id && i.user.id !== targetUser.id) {
                return i.reply({ content: 'Kamu bukan bagian dari pertandingan ini!', ephemeral: true });
            }

            // Cek apakah user ini sudah milih sebelumnya
            if (picks[i.user.id]) {
                return i.reply({ content: `Kamu sudah memilih **${picks[i.user.id].emoji}**! Tunggu lawanmu.`, ephemeral: true });
            }

            // Simpan pilihan
            const selectedChoice = choices.find(c => c.id === i.customId);
            picks[i.user.id] = selectedChoice;

            await i.reply({ content: `Kamu memilih ${selectedChoice.emoji}. Menunggu lawan...`, ephemeral: true });

            // Jika kedua pemain sudah memilih
            if (Object.keys(picks).length === 2) {
                const p1Choice = picks[player.id];
                const p2Choice = picks[targetUser.id];
                const result = determineWinner(p1Choice.id, p2Choice.id);

                let resultText = '';
                if (result === 0) resultText = 'Hasilnya **SERI!** 🤝';
                else if (result === 1) resultText = `Selamat **${player.username}** Menang! 🎉`;
                else resultText = `Selamat **${targetUser.username}** Menang! 🎉`;

                // Matikan tombol
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );

                await interaction.editReply({
                    content: `🏁 **HASIL SUIT** 🏁\n\n**${player.username}**: ${p1Choice.emoji}\n**${targetUser.username}**: ${p2Choice.emoji}\n\n${resultText}`,
                    components: [disabledRow]
                });
                collector.stop();
            }
        });

        collector.on('end', collected => {
            // Jika waktu habis dan belum lengkap 2 pemain
            if (Object.keys(picks).length < 2 && collected.size > 0) {
                interaction.editReply({
                    content: 'Waktu habis! Salah satu pemain tidak memilih. Game dibatalkan.',
                    components: []
                });
            } else if (collected.size === 0) {
                interaction.editReply({
                    content: 'Waktu habis! Tidak ada yang merespon.',
                    components: []
                });
            }
        });
    },
};

