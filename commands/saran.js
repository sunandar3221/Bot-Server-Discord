const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// --- SETUP ID DI SINI BRO ---
const CONFIG = {
    CHANNEL_SARAN: '1458433190262997025', // ID Channel buat nampung ide-ide liar member
    COOLDOWN_DURASI: 10 * 60 * 1000 // 10 Menit (format milidetik: 10 * 60 detik * 1000 ms)
};

// Variable buat nampung data cooldown sementara (Reset kalo bot restart)
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('saran')
        .setDescription('Kasih ide brilian atau uneg-uneg lu buat server ini \uD83D\uDCA1') 
        .addStringOption(option =>
            option.setName('isi')
                .setDescription('Tumpahin ide gila lu disini, jangan dipendem!')
                .setRequired(true)
        ),

    async execute(interaction) {
        // --- CEK COOLDOWN DULU BRO ---
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id);
            const now = Date.now();

            if (now < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - now) / 1000 / 60); // Itung sisa menit
                return interaction.reply({ 
                    content: `Waduh, napas dulu ngab! \uD83D\uDE24 Lu barusan kirim saran.\nTunggu **${timeLeft} menit** lagi ya biar gak dikira spammer. Santuy... \u2615`, // \uD83D\uDE24 = Face with Steam, \u2615 = Coffee
                    ephemeral: true 
                });
            }
        }

        const isiSaran = interaction.options.getString('isi');
        const channelSaran = interaction.guild.channels.cache.get(CONFIG.CHANNEL_SARAN);

        // Kalo admin lupa setting channel
        if (!channelSaran) {
            return interaction.reply({ 
                content: 'Waduh, Channel Saran belum di-setup sama admin nih. Senggol adminnya dong! \uD83D\uDE2D', 
                ephemeral: true 
            });
        }

        // 1. Bikin Embed Saran yang Kece
        const embedSaran = new EmbedBuilder()
            .setColor(0x0099FF) // Biru Langit
            .setTitle('\uD83D\uDCA1 Ada Ide Seger Masuk Nih!') 
            .setAuthor({ 
                name: `${interaction.user.tag} lagi mode kreatif`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setDescription(`\uD83D\uDCDD **Isi Saran:**\n${isiSaran}`) 
            .addFields(
                { name: 'Status Saat Ini', value: '\u23F3 Masih Dipantau Admin...', inline: true } 
            )
            .setTimestamp()
            .setFooter({ 
                text: `ID Pengirim: ${interaction.user.id} \u2022 Mode Gaul On \uD83D\uDE0E`
            });

        // 2. Tombol Eksekusi
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('terima_saran')
                    .setLabel('Gass Terima!')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('\uD83D\uDE80'), 
                new ButtonBuilder()
                    .setCustomId('tolak_saran')
                    .setLabel('Skip Dulu')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('\uD83D\uDEAB') 
            );

        try {
            // 3. Kirim ke Channel Khusus
            await channelSaran.send({ embeds: [embedSaran], components: [row] });

            // 4. Kasih tau user kalo udah dikirim
            await interaction.reply({ 
                content: 'Mantap soul! Ide lu udah meluncur ke meja admin. Tunggu kabar yak! \uD83D\uDC4C\uD83D\uDD25', 
                ephemeral: true 
            });

            // --- PASANG COOLDOWN BRO ---
            // Set waktu kadaluarsa cooldown buat user ini
            cooldowns.set(interaction.user.id, Date.now() + CONFIG.COOLDOWN_DURASI);
            
            // Hapus data cooldown otomatis setelah waktunya abis (biar hemat RAM)
            setTimeout(() => cooldowns.delete(interaction.user.id), CONFIG.COOLDOWN_DURASI);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Ada error pas ngirim saran bro, coba lagi nanti ya!', ephemeral: true });
        }
    },
};


