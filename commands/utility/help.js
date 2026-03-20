const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Menampilkan semua command yang tersedia di bot ini secara otomatis'),

    async execute(interaction) {
        // Mengambil semua command yang sudah di-load oleh bot
        const commands = interaction.client.commands;

        // Kita urutkan command-nya berdasarkan abjad (A-Z) biar rapi
        const sortedCommands = [...commands.values()].sort((a, b) => 
            a.data.name.localeCompare(b.data.name)
        );

        // Membuat list teks untuk dimasukkan ke Embed
        // Format: `/nama` - Deskripsi
        const commandList = sortedCommands.map(cmd => {
            const name = cmd.data.name;
            const description = cmd.data.description || 'Tidak ada deskripsi.';
            return `\`/${name}\` - ${description}`;
        }).join('\n');

        // Buat Embed
        const helpEmbed = new EmbedBuilder()
            .setColor('Random') // Warna acak biar asik
            .setTitle(`🤖 Daftar Command ${interaction.client.user.username}`)
            .setDescription(`Berikut adalah **${commands.size}** command yang tersedia secara live:\n\n${commandList}`)
            .setFooter({ 
                text: `Requested by ${interaction.user.username}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        // Kirim
        await interaction.reply({ embeds: [helpEmbed] });
    }
};


