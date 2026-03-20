const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help-economy')
        .setDescription('Panduan khusus fitur Ekonomi & Bisnis'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💸 PANDUAN EKONOMI')
            .setColor('Green')
            .setDescription('Jadilah Sultan di server ini! Berikut command yang bisa kamu pakai:')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/2485/2485574.png') // Icon duit
            .addFields(
                { 
                    name: '💼 Mencari Uang', 
                    value: [
                        '`/eco daily` - Gaji harian (GRATIS)',
                        '`/eco work` - Kerja serabutan (Tiap jam)',
                        '`/judi coinflip` - Gandakan uang (50:50)',
                        '`/judi slots` - Jackpot mesin slot'
                    ].join('\n')
                },
                { 
                    name: '🏦 Bank & Transaksi', 
                    value: [
                        '`/eco balance` - Cek saldo ATM & Dompet',
                        '`/eco deposit` - Simpan uang (Aman dari rampok)',
                        '`/eco withdraw` - Tarik uang tunai',
                        '`/eco transfer` - Kirim uang ke teman'
                    ].join('\n')
                },
                { 
                    name: '🛒 Gaya Hidup', 
                    value: [
                        '`/toko list` - Lihat katalog barang mewah',
                        '`/toko buy` - Beli barang',
                        '`/toko inventory` - Cek koleksi barangmu',
                        '`/eco leaderboard` - Cek ranking orang terkaya'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'Tips: Simpan uang di Bank agar aman!' });

        await interaction.reply({ embeds: [embed] });
    }
};

