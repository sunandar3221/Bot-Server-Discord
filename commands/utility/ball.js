const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Bertanya pada bola ajaib (Ya/Tidak)')
        .addStringOption(option => 
            option.setName('pertanyaan').setDescription('Pertanyaan kamu').setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('pertanyaan');
        const answers = [
            'Pasti iya!', 'Tentu saja.', 'Tanpa keraguan.', 'Ya - jelas.',
            'Mungkin saja.', 'Coba tanya lagi nanti.', 'Saya tidak yakin sekarang.',
            'Jangan berharap.', 'Jawaban saya tidak.', 'Sumber saya bilang tidak.'
        ];
        
        const result = answers[Math.floor(Math.random() * answers.length)];
        
        await interaction.reply(`🎱 **Tanya:** ${question}\n**Jawab:** ${result}`);
    },
};

