const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Lempar koin (Angka/Gambar)'),
    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Angka' : 'Gambar';
        await interaction.reply(`🪙 Koin dilempar... Hasilnya: **${result}**!`);
    },
};

