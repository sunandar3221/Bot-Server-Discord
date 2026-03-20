const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail')
        .setDescription('Ngobrol privat sama Admin/Moderator'),

    async execute(interaction) {
        const client = interaction.client;
        const userId = interaction.user.id;

        // --- 1. INISIALISASI DATABASE SEMENTARA (MEMORY) ---
        if (!client.modmailCooldowns) {
            client.modmailCooldowns = new Collection();
        }

        if (!client.modmailTickets) {
            client.modmailTickets = new Map();
        }
        // ----------------------------------------------------

        // --- 2. CEK COOLDOWN (Anti Spam) ---
        const now = Date.now();
        const cooldownAmount = 10 * 60 * 1000; // 10 Menit
        
        if (client.modmailCooldowns.has(userId)) {
            const expirationTime = client.modmailCooldowns.get(userId) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000 / 60; 
                // \uD83D\uDEAB = Emoji Simbol Dilarang ()
                return interaction.reply({ 
                    content: `\uD83D\uDEAB **Eits, Sabar Bro!**\nJangan spamming dong. Tunggu **${timeLeft.toFixed(1)} menit** lagi baru bisa bikin tiket baru.`, 
                    ephemeral: true 
                });
            }
        }

        client.modmailCooldowns.set(userId, now);
        setTimeout(() => client.modmailCooldowns.delete(userId), cooldownAmount);
        // ----------------------------------------------------

        // --- 3. LOGIC UTAMA MODMAIL ---
        
        // Cek double session
        if (client.modmailTickets.has(userId)) {
            // \uD83D\uDEAB = Emoji Simbol Dilarang ()
            return interaction.reply({ 
                content: '\uD83D\uDEAB Woi bro, lu kan masih ada sesi chat yang aktif! Kelarin dulu lah pakai `/tutup` baru bikin lagi.', 
                ephemeral: true 
            });
        }

        // Tombol Konfirmasi
        const confirmButton = new ButtonBuilder()
            .setCustomId('modmail_confirm_start')
            .setLabel('Gas Lanjut')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('\uD83D\uDD25'); // \uD83D\uDD25 = Emoji Api ()

        const row = new ActionRowBuilder().addComponents(confirmButton);

        await interaction.reply({
            content: 'Yakin mau ngobrol privat sama Admin/Mod? \nKlik tombol di bawah ya bro. Inget, **DM lu harus kebuka** biar kita bisa bales!',
            components: [row],
            ephemeral: true
        });
    },
};


