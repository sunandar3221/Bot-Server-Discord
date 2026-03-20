const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tutup')
        .setDescription('Udah kelar ngobrolnya? Pake ini buat udahan.'),

    async execute(interaction) {
        const { client, user } = interaction;

        if (!client.modmailTickets) client.modmailTickets = new Map();
        if (!client.modmailBusy) client.modmailBusy = new Map();

        let targetId = null;
        let isMod = false;

        // Cek siapa yang mutusin koneksi
        if (client.modmailTickets.has(user.id)) {
            // User yang nutup
            targetId = client.modmailTickets.get(user.id);
            client.modmailBusy.delete(targetId); 
            client.modmailTickets.delete(user.id); 
        } else if (client.modmailBusy.has(user.id)) {
            // Mod yang nutup
            isMod = true;
            targetId = client.modmailBusy.get(user.id);
            client.modmailTickets.delete(targetId); 
            client.modmailBusy.delete(user.id); 
        } else {
            return interaction.reply({ content: '🚫 Gak ada sesi ngobrol yang aktif bro. Lu ngelindur?', ephemeral: true });
        }

        // Respon ke yang ngetik
        await interaction.reply({ content: '👌 Sip, sesi modmail udah gue tutup. Thanks ye.', ephemeral: true });

        // Respon ke lawan bicara
        try {
            const targetUser = await client.users.fetch(targetId);
            await targetUser.send(`🛑 Sesi obrolan udah di-end sama **${user.username}**. Kalo butuh apa-apa lagi, bikin baru aja bro.`);
        } catch (error) {
            console.log(`Gagal kirim notif tutup ke ${targetId}`);
        }
    },
};


