const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // Setup data command slash-nya nih bro
    data: new SlashCommandBuilder()
        .setName('ikon-server')
        .setDescription('Nampilin gambar ikon server tempat kita nongkrong bro!'),

    // Fungsi yang bakal jalan pas commandnya lu ketik
    async execute(interaction) {
        // Cek dulu, commandnya di-run di dalem server kan? Jangan sampe di DM
        if (!interaction.guild) {
            return interaction.reply({ 
                content: 'Bro, command ini cuma bisa dipake di dalem server tongkrongan kita doang ya!', 
                ephemeral: true 
            });
        }

        // Ambil URL ikon server. Pake dynamic true biar kalo ikonnya GIF tetep bisa gerak
        const iconUrl = interaction.guild.iconURL({ dynamic: true, size: 1024 });

        // Kalo adminnya belom pasang ikon server, kita kasih tau
        if (!iconUrl) {
            return interaction.reply({ 
                content: 'Yah elah bro, server kita kaga ada ikonnya nih. Suruh admin pasang napa!', 
                ephemeral: true 
            });
        }

        // Bikin embed biar tampilannya lebih kece di chat
        const embed = new EmbedBuilder()
            .setTitle(`Ikon Server: ${interaction.guild.name}`)
            .setImage(iconUrl)
            .setColor('Random') // Warnanya dibikin random biar asik
            .setFooter({ 
                text: `Di-request sama si ${interaction.user.username}`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
            });

        // Langsung kirim ke channel
        await interaction.reply({ embeds: [embed] });
    },
};

