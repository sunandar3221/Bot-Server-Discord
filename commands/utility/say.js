const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Bot akan mengulangi pesanmu')
        .addStringOption(option => 
            option.setName('teks').setDescription('Pesan yang akan dikirim bot').setRequired(true)),
    async execute(interaction) {
        const text = interaction.options.getString('teks');
        
        // Kirim pesan, lalu reply interaction biar ga error "Interaction Failed"
        await interaction.reply({ content: text });
    },
};

