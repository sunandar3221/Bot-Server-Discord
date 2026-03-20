const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    // Data command buat di-register ke Discord
    data: new SlashCommandBuilder()
        .setName('setup-verify')
        .setDescription('Kirim panel verifikasi OAuth2 buat warga tongkrongan')
        // Biar cuma admin/owner yang bisa nongol-in command ini
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        
    async execute(interaction) {
        // PERHATIAN: Ganti link ini sama link OAuth2 lu dari Discord Developer Portal
        // Pastiin redirect URI-nya ngarah ke web/server bot lu
        const oauth2Url = "https://discord.com/oauth2/authorize?client_id=1247419562601873521&response_type=code&redirect_uri=https%3A%2F%2Fwellkops.dpdns.org%2Fcallback&scope=identify+guilds";

        // Bikin embed yang kece buat di channel
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Verifikasi Warga Tongkrongan')
            .setDescription('Woi cuy! Biar lu bisa ngobrol dan akses semua channel di server ini, lu wajib verifikasi dulu ya.\n\nCaranya gampang banget:\n1. Klik tombol **Verifikasi Sekarang** di bawah.\n2. Nanti bakal diarahin ke halaman resmi Discord.\n3. Klik **Authorize** biar sistem kita tau lu bukan robot.\n\nAman kok bro, kita cuma ngecek profil lu doang!')
            .setColor('#5865F2') // Warna khas Discord
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Sistem Verifikasi Otomatis', iconURL: interaction.client.user.displayAvatarURL() });

        // Bikin tombol bentuk Link
        const button = new ButtonBuilder()
            .setLabel('Verifikasi Sekarang')
            .setURL(oauth2Url)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🔗');

        const row = new ActionRowBuilder().addComponents(button);

        // Kasih tau owner kalau panel sukses dikirim (pesan ini cuma bisa diliat owner)
        await interaction.reply({ 
            content: 'Mantap bro! Panel verifikasi udah berhasil dikirim ke channel ini. 🚀', 
            ephemeral: true 
        });

        // Kirim panelnya ke channel
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};

