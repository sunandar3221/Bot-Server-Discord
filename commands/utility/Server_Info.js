const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Menampilkan informasi server ini'),
    async execute(interaction) {
        const { guild } = interaction;
        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👥 Total Member', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Dibuat Pada', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: false }
            )
            .setFooter({ text: `ID Server: ${guild.id}` });
            
        await interaction.reply({ embeds: [embed] });
    },
};

