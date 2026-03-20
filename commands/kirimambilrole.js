const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kirimambilrole')
        .setDescription('Kirim pesan reaction role ke channel tertentu')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel tujuan pengiriman pesan')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role yang akan dikasih ke member')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Emoji untuk reaksi (contoh: ✅)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('judul')
                .setDescription('Judul embed pesan')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('deskripsi')
                .setDescription('Isi pesan embed')
                .setRequired(false)),

    async execute(interaction) {
        // 1. Kasih tau Discord bot lagi mikir (biar gak error Unknown Interaction)
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');
        const judul = interaction.options.getString('judul') || 'Ambil Role';
        const deskripsi = interaction.options.getString('deskripsi') || `Klik emoji ${emoji} di bawah untuk mendapatkan role **${role.name}**.`;

        // Validasi Channel
        if (!channel.isTextBased()) {
            return interaction.editReply({ content: 'Bro, tolong pilih channel teks biasa ya.' });
        }

        // Validasi Permission Bot
        const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
        if (role.position >= botMember.roles.highest.position) {
            return interaction.editReply({ content: 'Waduh, aku gak bisa ngasih role itu karena posisinya lebih tinggi atau sama dengan role aku.' });
        }

        try {
            // Buat Embed
            const embed = new EmbedBuilder()
                .setTitle(judul)
                .setDescription(deskripsi)
                .setColor('Blue')
                .setFooter({ text: `Role ID: ${role.id}` }); // ID Role disimpen di sini

            // Kirim pesan ke channel tujuan
            const sentMessage = await channel.send({ embeds: [embed] });
            
            // Coba React
            try {
                await sentMessage.react(emoji);
            } catch (emojiError) {
                // Hapus pesan kalau emojinya error biar gak nyampah
                await sentMessage.delete().catch(() => {}); 
                console.error('Emoji error:', emojiError);
                return interaction.editReply({ content: `Gagal react! Kemungkinan emojinya salah atau emoji dari server lain yang botnya gak join. Coba pakai emoji standar (misal: ✅).` });
            }

            // Kalau sukses semua
            await interaction.editReply({ content: `Sip! Pesan reaction role udah dikirim ke ${channel}.` });

        } catch (error) {
            console.error('Error kirim pesan:', error);
            // Cek kalau errornya karena permission channel
            if (error.code === 50013) {
                await interaction.editReply({ content: 'Bot gak punya izin buat ngirim pesan di channel itu bro.' });
            } else {
                await interaction.editReply({ content: 'Ada error pas ngirim pesan. Cek console log.' });
            }
        }
    },
};


