const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Sistem Manajemen Tiket')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Buat panel untuk membuka tiket baru')
                .addChannelOption(option =>
                    option.setName('kategori')
                        .setDescription('Kategori tempat channel tiket akan dibuat')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory))
                .addRoleOption(option =>
                    option.setName('role-staf')
                        .setDescription('Role Staf/Admin (wajib punya izin Manage Messages)')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel tempat panel akan dikirim')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Tambahkan user ke dalam tiket ini')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('User yang akan ditambahkan')
                        .setRequired(true))
        )
        // Hanya Administrator yang bisa setup
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            const kategori = interaction.options.getChannel('kategori');
            const roleStaf = interaction.options.getRole('role-staf');
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            const panelEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('🎫 Sistem Tiket Support')
                .setDescription('Tekan tombol di bawah ini untuk membuat tiket baru.\nTim support kami akan segera membantu Anda.');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_open_${kategori.id}_${roleStaf.id}`)
                        .setLabel('Buka Tiket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📩'),
                );

            await targetChannel.send({ embeds: [panelEmbed], components: [row] });
            await interaction.reply({ content: `✅ Panel tiket berhasil dibuat.\n**Penting:** Pastikan Role Staf (${roleStaf}) benar-benar memiliki izin **Manage Messages** agar bisa mengelola tiket.`, ephemeral: true });
        }
        else if (subcommand === 'add') {
            const targetUser = interaction.options.getUser('target');
            const channel = interaction.channel;

            // VALIDASI:
            // Cek apakah user yang menjalankan command punya izin 'Manage Messages'.
            // Ini memastikan member biasa (meski punya role khusus) tidak bisa menambah orang.
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ 
                    content: '🛑 **Akses Ditolak!** Hanya Staf/Admin (yang punya izin Manage Messages) yang bisa menambahkan member ke tiket.', 
                    ephemeral: true 
                });
            }

            // Tambahkan izin spesifik untuk user target
            await channel.permissionOverwrites.edit(targetUser.id, {
                ViewChannel: true,
                SendMessages: true
            });

            await interaction.reply({ 
                content: `✅ ${targetUser} telah ditambahkan ke tiket ini oleh Staf.`, 
                allowedMentions: { parse: [] } 
            });
        }
    },
};
