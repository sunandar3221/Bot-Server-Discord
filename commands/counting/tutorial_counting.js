const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('counting')
        .setDescription('Tutorial cara main counting game'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('🔢 Tutorial Counting Game')
            .setDescription('Game ngitung bareng satu server, jangan sampe salah!')
            .addFields(
                { name: '1. Mulai dari 1', value: 'Kalau angka sebelumnya 0 (reset), mulai lagi dari 1.' },
                { name: '2. Gantian!', value: 'Gaboleh ngirim 2 angka berturut-turut. Abis kirim angka, tunggu orang lain kirim dulu.' },
                { name: '3. Jangan Salah', value: 'Salah angka = RESET ke 0 satu server (Siap-siap diamuk massa).' },
                { name: '4. Anti-Troll', value: 'Kalo ada yang hapus pesan, bot bakal ngasih tau angka selanjutnya biar ga bingung.' }
            )
            .setFooter({ text: 'Good luck bro, jangan jadi beban!' });

        await interaction.reply({ embeds: [embed] });
    },
};

