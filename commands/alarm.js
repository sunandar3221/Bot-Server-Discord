const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // Bikin struktur slash command-nya
    data: new SlashCommandBuilder()
        .setName('alarm')
        .setDescription('Setel alarm ke DM ala anak tongkrongan')
        .addStringOption(option => 
            option.setName('waktu')
                .setDescription('Berapa lama ngab? (Contoh: 10s, 5m, 1h)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('alasan')
                .setDescription('Buat ngingetin apaan nih?')
                .setRequired(false)),

    async execute(interaction) {
        // Ambil inputan dari user
        const timeArg = interaction.options.getString('waktu');
        const reason = interaction.options.getString('alasan') || 'Waktunya abis bosku, buruan gerak!';

        // Parser waktu simpel (s = detik, m = menit, h = jam)
        const timeRegex = /^(\d+)(s|m|h)$/i;
        const match = timeArg.match(timeRegex);

        // Kalo formatnya ngaco
        if (!match) {
            return interaction.reply({ 
                content: 'Format waktunya kagak jelas coy! Pake s (detik), m (menit), atau h (jam) yak. Contoh: `10m` atau `1h`.', 
                ephemeral: true 
            });
        }

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let ms = 0;

        // Convert ke milisecond
        if (unit === 's') ms = value * 1000;
        if (unit === 'm') ms = value * 60 * 1000;
        if (unit === 'h') ms = value * 60 * 60 * 1000;

        // Bikin limit biar bot gak nunggu kelamaan (max 24 jam)
        if (ms > 24 * 60 * 60 * 1000) {
            return interaction.reply({ 
                content: 'Buset lama amat! Maksimal 24 jam aja ya ngab, kasian bot gua nungguinnya sampe karatan.', 
                ephemeral: true 
            });
        }

        // Trik ngecek DM kebuka atau digembok:
        // Kita coba kirim DM konfirmasi sekarang. Kalo error, berarti DM ditutup.
        try {
            await interaction.user.send(`Sabi bro! Alarm lu buat **"${reason}"** dalam ${value}${unit} udah gua catet. Sans, ntar gua ingetin yak! ☕`);
            
            // Kalo sukses terkirim ke DM, kasih tau di server
            await interaction.reply({ 
                content: `Sip, alarm buat ${value}${unit} lagi udah gua setel. Cek DM lu yak bro!`, 
                ephemeral: true 
            });

            // Setel alarm benerannya pake setTimeout
            setTimeout(async () => {
                try {
                    // Kirim notif pas waktunya abis
                    await interaction.user.send(`🚨 **WOI NGAB! BANGUN!** 🚨\n\nUdah waktunya nih buat: **${reason}**\n\nBuru dah gas lakuin!`);
                } catch (err) {
                    // Jaga-jaga kalau member nutup DM pas alarm lagi jalan
                    console.log(`[ALARM ERROR] Gagal ngirim alarm ke ${interaction.user.tag} karena DM tiba-tiba ditutup.`);
                }
            }, ms);

        } catch (error) {
            // Kalo masuk catch pas kirim pesan pertama, berarti DM-nya digembok dari awal
            return interaction.reply({ 
                content: 'Yaelah bro, DM lu digembok! Gua kagak bisa ngirim alarm ntar. Buka dulu settingan privasi lu (Allow direct messages from server members) yak biar bot bisa masuk.', 
                ephemeral: true 
            });
        }
    }
};


