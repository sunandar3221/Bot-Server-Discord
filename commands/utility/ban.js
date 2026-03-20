const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban member dari server')
        .addUserOption(option => 
            option.setName('target').setDescription('Member yang akan diban').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        
        // Cek member di guild
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Jika member ada di server dan tidak bisa diban
        if (member && !member.bannable) {
            return interaction.reply({ content: '❌ Saya tidak bisa ban user ini (Mungkin role dia lebih tinggi).', ephemeral: true });
        }

        await interaction.guild.members.ban(targetUser);
        await interaction.reply({ content: `🔨 **${targetUser.tag}** telah berhasil di-ban dari server.` });
    },
};

