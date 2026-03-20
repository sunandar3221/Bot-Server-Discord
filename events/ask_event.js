const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // Event ini mendengarkan setiap ada interaksi (Button Click atau Modal Submit)
    name: Events.InteractionCreate,
    once: false, // Berjalan terus menerus, tidak cuma sekali

    async execute(interaction) {
        // ---------------------------------------------------------
        // 1. BAGIAN MENANGANI TOMBOL "JAWAB" (BUTTON CLICK)
        // ---------------------------------------------------------
        if (interaction.isButton() && interaction.customId.startsWith('ask_reply_')) {
            // customId format: ask_reply_USERID
            const targetUserId = interaction.customId.split('_')[2];

            // Buat Modal (Formulir Pop-up)
            const modal = new ModalBuilder()
                .setCustomId(`ask_modal_${targetUserId}`) // Kita oper ID user ke modal
                .setTitle('Jawab Pertanyaan Member');

            // Input Teks Jawaban
            const answerInput = new TextInputBuilder()
                .setCustomId('answer_input')
                .setLabel("Jawaban Anda")
                .setStyle(TextInputStyle.Paragraph) // Paragraph biar bisa panjang
                .setPlaceholder("Ketikan jawaban untuk member di sini...")
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(answerInput);
            modal.addComponents(firstActionRow);

            // Tampilkan Modal ke Admin
            await interaction.showModal(modal);
        }

        // ---------------------------------------------------------
        // 2. BAGIAN MENANGANI SAAT MODAL DI-SUBMIT (KIRIM JAWABAN)
        // ---------------------------------------------------------
        if (interaction.isModalSubmit() && interaction.customId.startsWith('ask_modal_')) {
            // Ambil data dari interaction
            const targetUserId = interaction.customId.split('_')[2];
            const answer = interaction.fields.getTextInputValue('answer_input');
            const admin = interaction.user;

            // Defer update biar user gak nunggu lama (loading state)
            // Kita pakai update() karena kita mau mengubah pesan asli (tombolnya)
            // Tapi hati-hati, update() mengharapkan kita mengedit pesan yang ada tombolnya.
            
            try {
                // Ambil User Target (Member yang nanya)
                const targetUser = await interaction.client.users.fetch(targetUserId);

                // Buat Embed Jawaban untuk Member
                const replyEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🔔 Jawaban dari Admin')
                    .setDescription(`Halo **${targetUser.username}**, admin telah menjawab pertanyaanmu.`)
                    .addFields(
                        { name: '📝 Jawaban:', value: answer },
                        { name: '👤 Dijawab oleh:', value: admin.tag }
                    )
                    .setFooter({ text: 'Terima kasih telah bertanya!' })
                    .setTimestamp();

                // Kirim DM ke Member
                await targetUser.send({ embeds: [replyEmbed] });

                // Update Pesan di Channel Admin
                // Kita edit pesan log biar tombolnya hilang dan statusnya berubah jadi "Dijawab"
                const successEmbed = new EmbedBuilder()
                    .setColor('Green') // Ubah warna jadi hijau tanda selesai
                    .setTitle('✅ Pertanyaan Terjawab')
                    .setDescription(`**Pertanyaan:** (Sudah dijawab)\n\n**Jawaban ${admin.username}:**\n${answer}`)
                    .setFooter({ text: `User ID: ${targetUserId} | Dijawab pada` })
                    .setTimestamp();

                await interaction.update({
                    embeds: [successEmbed],
                    components: [] // Kosongkan array components untuk menghapus tombol
                });

            } catch (error) {
                console.error('Error saat menjawab ask:', error);

                // Error Handling khusus kalau DM User ditutup
                if (error.code === 50007) {
                    return interaction.reply({ 
                        content: '⚠️ **Gagal Mengirim:** DM member tersebut tertutup/private. Jawaban tidak terkirim.', 
                        ephemeral: true 
                    });
                } else {
                    return interaction.reply({ 
                        content: '❌ Terjadi kesalahan saat mengirim jawaban atau user sudah keluar server.', 
                        ephemeral: true 
                    });
                }
            }
        }
    },
};

