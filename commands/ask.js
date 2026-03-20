const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

// --- KONFIGURASI ---
// Ganti ID ini dengan ID Channel tempat pertanyaan admin masuk
const CHANNEL_LOG_ID = '1366429514824945715'; 
const COOLDOWN_TIME = 5 * 60 * 1000; // 5 Menit dalam milidetik

// Map untuk menyimpan cooldown (biar gak spam)
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Tanya ke Admin (Privat)')
        .addStringOption(option => 
            option.setName('pertanyaan')
            .setDescription('Apa yang ingin kamu tanyakan?')
            .setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('pertanyaan');
        const user = interaction.user;

        // 1. CEK COOLDOWN
        if (cooldowns.has(user.id)) {
            const expirationTime = cooldowns.get(user.id) + COOLDOWN_TIME;
            const now = Date.now();

            if (now < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - now) / 1000 / 60);
                return interaction.reply({ 
                    content: `⏳ **Sabar bro!** Kamu baru saja bertanya. Tunggu **${timeLeft} menit** lagi ya.`, 
                    ephemeral: true 
                });
            }
        }

        // 2. CEK DM USER (Sesuai request)
        // Kita coba kirim DM "Struk" dulu. Kalau gagal, berarti DM tutup.
        let dmMessage;
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('✉️ Pertanyaan Terkirim')
                .setDescription(`Halo **${user.username}**, pertanyaanmu sudah dikirim ke Admin.\nMohon tunggu balasan ya!`)
                .addFields({ name: 'Pertanyaanmu:', value: question })
                .setTimestamp();
            
            dmMessage = await user.send({ embeds: [dmEmbed] });
        } catch (error) {
            // Kalau masuk sini, berarti DM User TUTUP
            return interaction.reply({ 
                content: '❌ **Gagal Kirim!** DM kamu tertutup (Private). Tolong buka DM agar admin bisa membalas pertanyaanmu.', 
                ephemeral: true 
            });
        }

        // 3. KIRIM KE CHANNEL ADMIN
        const logChannel = interaction.client.channels.cache.get(CHANNEL_LOG_ID);
        if (!logChannel) return interaction.reply({ content: 'Error: Channel Admin tidak ditemukan!', ephemeral: true });

        const adminEmbed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('❓ Pertanyaan Baru')
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setDescription(`**Isi Pertanyaan:**\n${question}`)
            .setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp();

        // Tombol Jawab
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    // Kita simpan ID User di tombol biar admin tau harus balas ke siapa
                    .setCustomId(`ask_reply_${user.id}`) 
                    .setLabel('Jawab Pertanyaan')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✍️')
            );

        await logChannel.send({ embeds: [adminEmbed], components: [row] });

        // 4. SET COOLDOWN & CONFIRM
        cooldowns.set(user.id, Date.now());
        setTimeout(() => cooldowns.delete(user.id), COOLDOWN_TIME);

        return interaction.reply({ content: '✅ Pertanyaanmu berhasil dikirim ke Admin! Cek DM untuk konfirmasi.', ephemeral: true });
    }
};

