const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// --- SETTING ID CHANNEL MOD DI SINI BRO ---
const MOD_LOG_CHANNEL_ID = '1456870747854209057'; 

module.exports = {
    name: Events.InteractionCreate, // Nungguin interaksi (tombol)
    async execute(interaction) {
        // Kita cuma urus tombol di sini, command urusan file lain
        if (!interaction.isButton()) return;
        
        const client = interaction.client;

        // Pastikan memory ada (jaga-jaga)
        if (!client.modmailTickets) client.modmailTickets = new Map();
        if (!client.modmailBusy) client.modmailBusy = new Map();

        // === KASUS 1: USER MAU BUAT TIKET ===
        if (interaction.customId === 'modmail_confirm_start') {
            
            // Cek double tiket
            if (client.modmailTickets.has(interaction.user.id)) {
                return interaction.reply({ content: 'Sabar bro, tiket lu udah ada kok. Tunggu admin bales.', ephemeral: true });
            }

            // --- CEK DM MEMBER DULU (SYARAT UTAMA) ---
            try {
                // Test kirim DM
                await interaction.user.send('👋 Sip bro, request lu lagi otw ke markas Admin. Tunggu bentar ya, jangan spam.');
            } catch (error) {
                // Kalo error berarti DM User TUTUP
                return interaction.reply({ 
                    content: '🚫 **Waduh Gagal Bro!**\nDM lu dikunci nih. Bot gak bisa kirim pesan ke lu.\n\nBuka dulu settingan DM lu: `User Settings > Privacy & Safety > Allow DMs from server members` terus coba lagi.', 
                    ephemeral: true 
                });
            }

            // Kirim notif ke Channel Admin
            const modChannel = client.channels.cache.get(MOD_LOG_CHANNEL_ID);
            if (!modChannel) return interaction.reply({ content: 'Error: Channel admin gak ketemu. Lapor owner gih.', ephemeral: true });

            const ticketEmbed = new EmbedBuilder()
                .setTitle('📩 Ada Yang Mau Curhat Nih!')
                .setDescription(`**Tersangka:** ${interaction.user.tag} (<@${interaction.user.id}>)\n**ID:** ${interaction.user.id}\n\nBro admin, ada member mau ngobrol nih. Sikat gak?`)
                .setColor('Gold')
                .setTimestamp();

            const claimButton = new ButtonBuilder()
                .setCustomId(`modmail_claim_${interaction.user.id}`) // ID user disimpen di tombol
                .setLabel('Gue Handle')
                .setStyle(ButtonStyle.Success)
                .setEmoji('😎');

            const row = new ActionRowBuilder().addComponents(claimButton);

            await modChannel.send({ embeds: [ticketEmbed], components: [row] });
            
            // Kasih tau user di server
            await interaction.update({ 
                content: '✅ Oke, udah gue sampein ke anak-anak Admin. Cek DM lu ya, nanti dikabarin.', 
                components: [] 
            });
        }

        // === KASUS 2: MODERATOR AMBIL TIKET ===
        if (interaction.customId.startsWith('modmail_claim_')) {
            const targetUserId = interaction.customId.split('_')[2];
            const moderatorId = interaction.user.id;

            // Validasi tiket
            if (client.modmailTickets.has(targetUserId)) {
                const currentMod = client.modmailTickets.get(targetUserId);
                if (currentMod !== moderatorId) {
                    return interaction.reply({ content: 'Telat bro! Tiket ini udah diembat admin lain.', ephemeral: true });
                }
            }

            // Validasi kesibukan moderator
            if (client.modmailBusy.has(moderatorId)) {
                return interaction.reply({ content: '🚫 Lu masih ada sesi chat lain bro. Kelarin dulu lah satu-satu (`/tutup`).', ephemeral: true });
            }

            // --- CEK DM MODERATOR DULU ---
            try {
                await interaction.user.send(`😎 **Mantap!** Lu sekarang terhubung sama <@${targetUserId}>.\nSemua chat lu ke bot ini bakal diterusin ke dia. Ati-ati ketikan dijaga bro.`);
            } catch (error) {
                return interaction.reply({ 
                    content: '🚫 **Woi Bro Admin!** DM lu sendiri ketutup, gimana mau bales chat member? Buka dulu settingan DM lu!', 
                    ephemeral: true 
                });
            }

            // Simpan data koneksi (Pairing)
            client.modmailTickets.set(targetUserId, moderatorId);
            client.modmailBusy.set(moderatorId, targetUserId);

            // Matikan tombol di channel admin
            const disabledButton = new ButtonBuilder()
                .setCustomId('claimed_btn')
                .setLabel(`Di-handle sama ${interaction.user.username}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            
            await interaction.message.edit({ components: [new ActionRowBuilder().addComponents(disabledButton)] });

            await interaction.reply({ content: 'Siap laksanakan! Cek DM lu ye.', ephemeral: true });

            // Kabari User kalau tiketnya udah diambil
            try {
                const targetUser = await client.users.fetch(targetUserId);
                const connectEmbed = new EmbedBuilder()
                    .setTitle('🎉 Admin Udah Dateng!')
                    .setDescription(`Halo bro, request lu udah diambil sama **${interaction.user.username}**.\nLangsung aja chat di sini, gak usah sungkan.`)
                    .setColor('Green');
                
                await targetUser.send({ embeds: [connectEmbed] });
            } catch (err) {
                // Rollback kalau user tiba-tiba nutup DM
                client.modmailTickets.delete(targetUserId);
                client.modmailBusy.delete(moderatorId);
                return interaction.followUp({ content: 'Yah elah, pas mau diambil, membernya malah nutup DM. Batal deh.', ephemeral: true });
            }
        }
    },
};

