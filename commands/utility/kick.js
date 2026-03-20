const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick member dari server')
        .addUserOption(option => 
            option.setName('target').setDescription('Member yang akan dikick').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(targetUser.id);

        // Cek apakah bot bisa kick member tersebut (role hierarchy)
        if (!member.kickable) {
            return interaction.reply({ content: '❌ Saya tidak bisa kick user ini (Mungkin role dia lebih tinggi dari bot atau dia admin).', ephemeral: true });
        }

        await member.kick();
        await interaction.reply({ content: `👋 **${targetUser.tag}** telah berhasil di-kick dari server.` });
    },
};

