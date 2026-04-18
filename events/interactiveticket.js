const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

// ============================================================
// HELPER: Fetch SEMUA pesan di channel (paginasi tanpa batas)
// ============================================================
async function fetchAllMessages(channel) {
    let allMessages = [];
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await channel.messages.fetch(options);
        if (messages.size === 0) break;

        allMessages = allMessages.concat(Array.from(messages.values()));
        lastId = messages.last().id;

        if (messages.size < 100) break;
    }

    return allMessages;
}

// ============================================================
// HELPER: Generate string transcript dari channel
// ============================================================
async function generateTranscriptString(channel) {
    const messages = await fetchAllMessages(channel);
    const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let transcript = `TRANSCRIPT TIKET: ${channel.name}\n`;
    transcript += `Waktu: ${new Date().toLocaleString()}\n`;
    transcript += `========================================\n\n`;

    sortedMessages.forEach(msg => {
        const time = new Date(msg.createdTimestamp).toLocaleString();
        const author = msg.author.tag;
        const content = msg.content || '[Embed/Attachment]';
        transcript += `[${time}] ${author}: ${content}\n`;
    });

    return transcript;
}

// ============================================================
// HELPER: Kirim transcript via DM ke user tertentu
// ============================================================
async function sendTranscriptDM(targetUser, transcriptStr, fileName, description) {
    try {
        await targetUser.send({
            content: description,
            files: [{ attachment: Buffer.from(transcriptStr, 'utf-8'), name: fileName }]
        });
        return true;
    } catch (e) {
        console.log(`Gagal DM ke ${targetUser.tag}: ${e.message}`);
        return false;
    }
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { customId, guild, user, channel, member } = interaction;

        // ==========================================
        // 1. TOMBOL BUKA TIKET (OPEN TICKET)
        // ==========================================
        if (customId.startsWith('ticket_open_')) {
            const parts = customId.split('_');
            const categoryId = parts[2];
            const staffRoleId = parts[3];

            const existingChannel = guild.channels.cache.find(c =>
                c.topic && c.topic.includes(`Ticket User ID: ${user.id}`)
            );

            if (existingChannel) {
                return interaction.reply({
                    content: `🛑 **Kamu sudah memiliki tiket yang masih aktif!**\nSilakan gunakan tiket lama kamu di sini: ${existingChannel}\n\n*(Kamu hanya bisa membuat tiket baru setelah tiket lama dihapus oleh Staf)*`,
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}`,
                    type: ChannelType.GuildText,
                    parent: categoryId,
                    topic: `Ticket User ID: ${user.id}`,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: staffRoleId,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
                        }
                    ]
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🎫 Tiket Support Dibuat')
                    .setDescription(`Halo ${user}, terima kasih telah menghubungi support.\nStaf kami akan segera merespons pertanyaan kamu.`)
                    .addFields(
                        { name: 'Pemilik Tiket', value: `${user.tag}`, inline: true },
                        { name: 'Status', value: 'Menunggu Staf', inline: true }
                    )
                    .setFooter({ text: 'Tombol di bawah hanya bisa digunakan oleh Staf/Admin.' });

                const dashboardRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_close').setLabel('Tutup').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Klaim').setStyle(ButtonStyle.Success).setEmoji('✋'),
                    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
                    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Hapus').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
                );

                await ticketChannel.send({
                    content: `${user} | `,
                    embeds: [welcomeEmbed],
                    components: [dashboardRow]
                });

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
            const isCreator = channel.topic && channel.topic.includes(`Ticket User ID: ${user.id}`);
            const isStaff = member.permissions.has(PermissionFlagsBits.ManageMessages);

            if (!isCreator && !isStaff) {
                return interaction.reply({ content: '❌ Kamu tidak punya izin untuk menutup tiket ini.', ephemeral: true });
            }

            // --- Lock channel untuk pembuat tiket ---
            const creatorId = channel.topic ? channel.topic.split('Ticket User ID: ')[1].split(' |')[0] : null;

            if (creatorId) {
                await channel.permissionOverwrites.edit(creatorId, {
                    SendMessages: false,
                    ViewChannel: true
                });
            }

            // --- Tampilkan embed "Tiket Ditutup" ---
            const closedEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`🔒 Tiket ini telah ditutup oleh ${user}.\nTranscript sedang dibuat dan akan dikirim via DM...`);

            const deleteRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_delete').setLabel('Hapus Tiket').setStyle(ButtonStyle.Danger)
            );

            await interaction.update({ embeds: [closedEmbed], components: [deleteRow] });

            // --- Generate & Kirim Transcript Otomatis Saat Close ---
            try {
                const transcriptStr = await generateTranscriptString(channel);
                const fileName = `transcript-${channel.name}.txt`;

                // 1) Kirim ke Pembuat Tiket via DM
                if (creatorId) {
                    const creator = await interaction.client.users.fetch(creatorId);
                    await sendTranscriptDM(
                        creator,
                        transcriptStr,
                        fileName,
                        `📜 **Transcript tiket kamu** (\`${channel.name}\`) telah dihasilkan:`
                    );
                }

                // 2) Kirim ke Admin yang menutup tiket via DM
                await sendTranscriptDM(
                    user,
                    transcriptStr,
                    fileName,
                    `📜 **Transcript tiket** \`${channel.name}\` telah dihasilkan:`
                );

                // 3) Kirim ke Admin yang klaim tiket via DM (jika berbeda dengan yang menutup)
                const claimedById = channel.topic && channel.topic.includes('Claimed By:')
                    ? channel.topic.split('Claimed By: ')[1].trim()
                    : null;

                if (claimedById && claimedById !== user.id) {
                    const claimedByUser = await interaction.client.users.fetch(claimedById);
                    await sendTranscriptDM(
                        claimedByUser,
                        transcriptStr,
                        fileName,
                        `📜 **Transcript tiket** \`${channel.name}\` yang kamu klaim telah dihasilkan:`
                    );
                }

                // 4) Juga kirim di channel tiket sebagai arsip
                await channel.send({
                    content: '📜 Transcript tiket ini:',
                    files: [{ attachment: Buffer.from(transcriptStr, 'utf-8'), name: fileName }]
                });

            } catch (error) {
                console.error('Error mengirim transcript saat close:', error);
            }
        }

        // ==========================================
        // 3. TOMBOL STAF (CLAIM, DELETE, TRANSCRIPT)
        // ==========================================
        else if (customId === 'ticket_claim' || customId === 'ticket_delete' || customId === 'ticket_transcript') {

            if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: '🛑 **Ditolak!** Tombol ini hanya bisa digunakan oleh Staf/Admin (Membutuhkan izin Manage Messages).',
                    ephemeral: true
                });
            }

            // --- LOGIKA DELETE ---
            if (customId === 'ticket_delete') {
                await interaction.reply({ content: '🗑️ Channel ini akan dihapus dalam 5 detik...' });
                setTimeout(() => channel.delete('Tiket selesai').catch(console.error), 5000);
            }

            // --- LOGIKA CLAIM (HANYA BISA SEKALI) ---
            else if (customId === 'ticket_claim') {
                // ✅ Cek apakah tiket sudah pernah diklaim
                if (channel.topic && channel.topic.includes('Claimed By:')) {
                    return interaction.reply({
                        content: '🛑 **Tiket ini sudah pernah diklaim!** Klaim hanya bisa dilakukan satu kali per tiket.',
                        ephemeral: true
                    });
                }

                // ✅ Simpan info klaim ke channel topic
                const currentTopic = channel.topic || '';
                await channel.setTopic(`${currentTopic} | Claimed By: ${user.id}`);

                // ✅ Cari pesan dashboard & disable tombol klaim
                const dashboardMessages = await channel.messages.fetch({ limit: 10 });
                const dashboardMsg = dashboardMessages.find(m =>
                    m.author.id === interaction.client.user.id &&
                    m.components.length > 0 &&
                    m.components[0].components.some(c => c.customId === 'ticket_claim' && !c.disabled)
                );

                if (dashboardMsg) {
                    const disabledRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Tutup').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Sudah Diklaim').setStyle(ButtonStyle.Success).setEmoji('✋').setDisabled(true),
                        new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
                        new ButtonBuilder().setCustomId('ticket_delete').setLabel('Hapus').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
                    );
                    await dashboardMsg.edit({ components: [disabledRow] });
                }

                const claimEmbed = new EmbedBuilder()
                    .setColor('Gold')
                    .setDescription(`✋ Tiket ini sedang ditangani (Claimed) oleh ${user}.`);
                await interaction.reply({ embeds: [claimEmbed] });
            }

            // --- LOGIKA TRANSCRIPT (FETCH SEMUA PESAN) ---
            else if (customId === 'ticket_transcript') {
                await interaction.deferReply({ ephemeral: true });

                const transcriptStr = await generateTranscriptString(channel);
                const fileName = `transcript-${channel.name}.txt`;

                await interaction.editReply({
                    content: '📜 Berikut adalah salinan transcript tiket:',
                    files: [{ attachment: Buffer.from(transcriptStr, 'utf-8'), name: fileName }]
                });
            }
        }
    },
};