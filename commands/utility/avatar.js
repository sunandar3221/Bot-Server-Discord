const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Mengambil foto profil user')
        .addUserOption(option => 
            option.setName('target').setDescription('User target').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`Avatar ${user.username}`)
            .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }));

        await interaction.reply({ embeds: [embed] });
    },
};

