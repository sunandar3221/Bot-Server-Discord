const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Menampilkan informasi user')
        .addUserOption(option => 
            option.setName('target').setDescription('User yang ingin dilihat').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '📅 Join Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '📅 Akun Dibuat', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    },
};

