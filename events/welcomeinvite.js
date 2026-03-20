// Simpan di folder events lu dengan nama welcomeinvite.js

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // Kita ambil 'client' langsung dari object member-nya
        const client = member.client;

        // GANTI INI SAMA ID CHANNEL LOG TONGKRONGAN LU
        const logChannelId = '1249285908964970618'; 
        const channel = member.guild.channels.cache.get(logChannelId);

        // Kalo channelnya gak ada/salah ID, mending cabut daripada error
        if (!channel) return;

        try {
            // Ambil data invite yang baru sekarang
            const newInvites = await member.guild.invites.fetch();
            
            // Ambil data invite yang lama dari cache
            const oldInvites = client.invites.get(member.guild.id);

            // Cari tau invite mana yang jumlah 'uses' nya nambah
            const inviteUsed = newInvites.find(i => {
                const uses = oldInvites.get(i.code);
                return uses < i.uses;
            });

            // Update cache-nya biar valid buat member selanjutnya yang join
            client.invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));

            // Siapin teks buat dikirim
            let inviterText = 'Misterius (gak ketahuan jalur mana \uD83D\uDC7B)'; // \uD83D\uDC7B = 👻
            let usesText = '?';

            if (inviteUsed) {
                inviterText = `<@${inviteUsed.inviter.id}>`;
                usesText = inviteUsed.uses;
            }

            // Bikin pesan Embed ala tongkrongan
            const welcomeEmbed = {
                color: 0x00FF00, // Warna ijo neon biar seger
                title: '\uD83C\uDF89 Warga Baru Landing! \uD83C\uDF89', // \uD83C\uDF89 = 🎉
                description: `Woy <@${member.user.id}>, met join di tongkrongan! Cari tempat duduk yang kosong bro. \u2615`, // \u2615 = ☕
                thumbnail: {
                    // Nampilin foto profil (avatar) yang baru masuk
                    url: member.user.displayAvatarURL({ dynamic: true })
                },
                fields: [
                    {
                        name: '\uD83D\uDC64 Diseret ke sini sama:', // \uD83D\uDC64 = 👤
                        value: inviterText,
                        inline: true
                    },
                    {
                        name: '\uD83D\uDCC8 Link ini udah dipake:', // \uD83D\uDCC8 = 📈
                        value: `${usesText} kali`,
                        inline: true
                    }
                ],
                footer: {
                    text: `Sabi lah kenalan dulu bro \uD83E\uDD1D` // \uD83E\uDD1D = 🤝
                },
                // Tambahin waktu joinnya
                timestamp: new Date().toISOString()
            };

            // Kirim embednya ke channel
            channel.send({ embeds: [welcomeEmbed] });

        } catch (err) {
            console.error('[ERROR] Gagal nge-track invite nih bro:', err);
        }
    },
};


