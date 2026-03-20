const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Cek respon bot (ms)'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Sedang mengecek ping...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        await interaction.editReply(`🏓 Pong! Latensi Bot: **${latency}ms** | API: **${Math.round(interaction.client.ws.ping)}ms**`);
    },
};

