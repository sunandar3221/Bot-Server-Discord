const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Menghapus pesan (1-100)')
        .addIntegerOption(option => 
            option.setName('jumlah').setDescription('Jumlah pesan').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Hanya member yang punya izin Manage Messages
    async execute(interaction) {
        const amount = interaction.options.getInteger('jumlah');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: 'Jumlah harus antara 1 sampai 100!', ephemeral: true });
        }

        // Hapus pesan
        await interaction.channel.bulkDelete(amount, true).catch(err => {
            console.error(err);
            return interaction.reply({ content: 'Gagal menghapus pesan (Pesan mungkin lebih tua dari 14 hari).', ephemeral: true });
        });

        return interaction.reply({ content: `🧹 Berhasil menghapus **${amount}** pesan.`, ephemeral: true });
    },
};

