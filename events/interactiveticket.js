const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        // Hanya memproses interaksi Tombol (Button)
        if (!interaction.isButton()) return;

        const { customId, guild, user, channel, member } = interaction;

        // ==========================================
        // 1. TOMBOL BUKA TIKET (OPEN TICKET)
        // ==========================================
        if (customId.startsWith('ticket_open_')) {
            // Parsing data dari CustomID (Format: ticket_open_KATEGORI_ID_ROLE_ID)
            const parts = customId.split('_');
            const categoryId = parts[2];
            const staffRoleId = parts[3];

            // --- CEK DUPLIKASI TIKET (ANTI SPAM) ---
            // Bot akan memindai semua channel untuk mencari channel dengan topik yang berisi ID User ini.
            // Jika ditemukan, pembuatan tiket baru akan ditolak.
            const existingChannel = guild.channels.cache.find(c => 
                c.topic && c.topic.includes(`Ticket User ID: ${user.id}`) // Diperbaiki: &amp;&amp; menjadi &&
            );

            if (existingChannel) {
                return interaction.reply({ 
                    content: `🛑 **Kamu sudah memiliki tiket yang masih aktif!**\nSilakan gunakan tiket lama kamu di sini: ${existingChannel}\n\n*(Kamu hanya bisa membuat tiket baru setelah tiket lama dihapus oleh Staf)*`, 
                    ephemeral: true 
                });
            }

            // Defer reply untuk memberi waktu bot membuat channel
            await interaction.deferReply({ ephemeral: true });

            try {
                // --- BUAT CHANNEL DENGAN PERMISSION KETAT ---
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}`,
                    type: ChannelType.GuildText,
                    parent: categoryId,
                    topic: `Ticket User ID: ${user.id}`, // Metadata penting untuk identifikasi pemilik
                    permissionOverwrites: [
                        // 1. TOLAK @everyone
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        // 2. IZINKAN Pembuat Tiket
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        // 3. IZINKAN Role Staf
                        {
                            id: staffRoleId,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        // 4. IZINKAN Bot
                        {
                            id: interaction.client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
                        }
                    ]
                });

                // --- KIRIM PESAN SAMBUTAN & DASHBOARD ---
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🎫 Tiket Support Dibuat')
                    .setDescription(`Halo ${user}, terima kasih telah menghubungi support.\nStaf kami akan segera merespons pertanyaan kamu.`)
                    .addFields(
                        { name: 'Pemilik Tiket', value: `${user.tag}`, inline: true },
                        { name: 'Status', value: 'Menunggu Staf', inline: true }
                    )
                    .setFooter({ text: 'Tombol di bawah hanya bisa digunakan oleh Staf/Admin.' });

                // Tombol Dashboard
                const dashboardRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Tutup').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Klaim').setStyle(ButtonStyle.Success).setEmoji('✋'),
                        new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
                        new ButtonBuilder().setCustomId('ticket_delete').setLabel('Hapus').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
                    );

                // Kirim ke channel tiket baru
                await ticketChannel.send({ 
                    content: `${user} | ` , 
                    embeds: [welcomeEmbed], 
                    components: [dashboardRow] 
                });

                // Konfirmasi ke user
                await interaction.editReply({ content: `✅ Tiket berhasil dibuat: ${ticketChannel}` });

            } catch (error) {
                console.error('Error membuat tiket:', error);
                await interaction.editReply({ content: '❌ Terjadi kesalahan saat membuat tiket. Cek izin bot atau kategori.' });
            }
        }

        // ==========================================
        // 2. TOMBOL CLOSE (TUTUP TIKET)
        // ==========================================
        else if (customId === 'ticket_close') {
            // IZIN: Hanya Pembuat Tiket ATAU Staf (ManageMessages)
            const isCreator = channel.topic && channel.topic.includes(`Ticket User ID: ${user.id}`); // Diperbaiki: &amp;&amp; menjadi &&
            const isStaff = member.permissions.has(PermissionFlagsBits.ManageMessages);

            if (!isCreator && !isStaff) { // Diperbaiki: &amp;&amp; menjadi &&
                return interaction.reply({ content: '❌ Kamu tidak punya izin untuk menutup tiket ini.', ephemeral: true });
            }

            // Logika Lock Channel:
            // Diubah: Menggunakan split untuk mengambil ID lebih aman dibanding mengandalkan indeks array tetap
            const creatorId = channel.topic ? channel.topic.split('Ticket User ID: ')[1] : null;
            
            if (creatorId) {
                await channel.permissionOverwrites.edit(creatorId, {
                    SendMessages: false,
                    ViewChannel: true // Tetap bisa lihat history
                });
            }

            const closedEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`🔒 Tiket ini telah ditutup oleh ${user}.\nStaf dapat menghapus channel ini jika sudah selesai.`);

            // Tombol Hapus muncul setelah ditutup
            const deleteRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Hapus Tiket').setStyle(ButtonStyle.Danger)
                );

            await interaction.update({ embeds: [closedEmbed], components: [deleteRow] });
        }

        // ==========================================
        // 3. TOMBOL STAF (CLAIM, DELETE, TRANSCRIPT)
        // ==========================================
        else if (customId === 'ticket_claim' || customId === 'ticket_delete' || customId === 'ticket_transcript') {
            
            // VALIDASI PENTING: Cek izin Staf
            if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ 
                    content: '🛑 **Ditolak!** Tombol ini hanya bisa digunakan oleh Staf/Admin (Membutuhkan izin Manage Messages).', 
                    ephemeral: true 
                });
            }

            // --- LOGIKA DELETE ---
            if (customId === 'ticket_delete') {
                await interaction.reply({ content: '🗑️ Channel ini akan dihapus dalam 5 detik...' });
                setTimeout(() => channel.delete('Tiket selesai').catch(console.error), 5000); // Diperbaiki: =&gt; menjadi =>
            }

            // --- LOGIKA CLAIM ---
            else if (customId === 'ticket_claim') {
                const claimEmbed = new EmbedBuilder()
                    .setColor('Gold')
                    .setDescription(`✋ Tiket ini sedang ditangani (Claimed) oleh ${user}.`);
                await interaction.reply({ embeds: [claimEmbed] });
            }

            // --- LOGIKA TRANSCRIPT ---
            else if (customId === 'ticket_transcript') {
                await interaction.deferReply({ ephemeral: true });
                
                // Ambil 100 pesan terakhir
                const messages = await channel.messages.fetch({ limit: 100 });
                // Urutkan dari yang paling lama
                const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp); // Diperbaiki: =&gt; menjadi =>
                
                let transcriptContent = `TRANSCRIPT TIKET: ${channel.name}\nWaktu: ${new Date().toLocaleString()}\n========================================\n\n`;
                
                sortedMessages.forEach(msg => { // Diperbaiki: =&gt; menjadi =>
                    const time = new Date(msg.createdTimestamp).toLocaleString();
                    const author = msg.author.tag;
                    const content = msg.content || "[Embed/Attachment]";
                    transcriptContent += `[${time}] ${author}: ${content}\n`;
                });

                // Kirim file .txt
                await interaction.editReply({
                    content: '📜 Berikut adalah salinan transcript tiket:',
                    files: [{ attachment: Buffer.from(transcriptContent), name: `transcript-${channel.name}.txt` }]
                });
            }
        }
    },
};