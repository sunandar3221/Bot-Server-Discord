const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dadu')
        .setDescription('Lempar dadu')
        .addIntegerOption(option => 
            option.setName('sisi')
            .setDescription('Jumlah sisi dadu (Default: 6)')
            .setMinValue(2)
            .setMaxValue(100)),

    async execute(interaction) {
        const sides = interaction.options.getInteger('sisi') || 6;
        const result = Math.floor(Math.random() * sides) + 1;

        await interaction.reply(`🎲 Kamu melempar dadu **D${sides}** dan mendapat angka: **${result}**`);
    }
};

