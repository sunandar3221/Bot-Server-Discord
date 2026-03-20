const { Events, EmbedBuilder, AttachmentBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: Events.MessageCreate, // Nungguin ada pesan baru
    async execute(message) {
        if (message.author.bot) return; // Skip bot
        
        // HANYA PROSES DM (Type 1 = DM)
        // Kalau message.guild ada isinya, berarti itu di server, kita cuekin.
        if (message.guild) return; 

        const client = message.client;
        
        // Jaga-jaga memory
        if (!client.modmailTickets) return; 

        let receiverId = null;
        let senderIsMod = false;

        // Cek siapa yang kirim pesan
        if (client.modmailTickets.has(message.author.id)) {
            // Pengirim adalah USER -> Tujuannya MOD
            receiverId = client.modmailTickets.get(message.author.id);
            senderIsMod = false;
        } else if (client.modmailBusy.has(message.author.id)) {
            // Pengirim adalah MOD -> Tujuannya USER
            receiverId = client.modmailBusy.get(message.author.id);
            senderIsMod = true;
        } else {
            // Bukan sesi modmail, mungkin user iseng DM bot
            return; 
        }

        // Proses Forwarding
        try {
            const receiver = await client.users.fetch(receiverId);

            // Ambil file/gambar kalau ada
            const files = message.attachments.map(att => new AttachmentBuilder(att.url));

            // Bikin tampilan chat ala tongkrongan
            const relayEmbed = new EmbedBuilder()
                .setAuthor({ 
                    name: senderIsMod ? `Admin: ${message.author.username}` : `Member: ${message.author.username}`, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setDescription(message.content || '*(Ngasih gambar/file doang)*')
                .setColor(senderIsMod ? 'Red' : 'Blue') // Admin Merah, Member Biru
                .setTimestamp();

            await receiver.send({ embeds: [relayEmbed], files: files });
            await message.react('✅'); // Kasih centang kalau sukses terkirim

        } catch (error) {
            console.error('Modmail Error:', error);
            message.reply('❌ **Gagal Kirim!**\nKayaknya lawan bicara lu nutup DM nya deh atau nge-blok botnya. Yah gagal ngobrol.');
        }
    },
};

