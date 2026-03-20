const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Putar mesin slot untuk dapat jackpot!'),

    async execute(interaction) {
        const slots = ['🍇', '🍊', '🍋', '🍌', '🍒', '💎', '7️⃣'];
        
        // Acak 3 slot
        const result = [
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)]
        ];

        let win = false;
        let message = 'Coba lagi bro...';

        // Logika menang
        if (result[0] === result[1] && result[1] === result[2]) {
            win = true;
            message = 'JACKPOT!!! 🎉🎉🎉';
        } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
            message = 'Nyaris bro, dapet 2 sama!';
        }

        const embed = new EmbedBuilder()
            .setTitle('🎰 SLOT MACHINE 🎰')
            .setDescription(`\n> **[ ${result[0]} | ${result[1]} | ${result[2]} ]**\n\n${message}`)
            .setColor(win ? 0xFFD700 : 0xFF0000);

        await interaction.reply({ embeds: [embed] });
    }
};

