const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tebakangka')
        .setDescription('Mulai game tebak angka 1-100'),

    async execute(interaction) {
        const number = Math.floor(Math.random() * 100) + 1;
        let attempts = 0;

        await interaction.reply(`🔢 **Game Tebak Angka Dimulai!**\nAku sudah memikirkan angka **1 sampai 100**.\nKetik angkamu di chat ini! (Ketik 'batal' untuk menyerah)`);

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', m => {
            const guess = parseInt(m.content);
            if (m.content.toLowerCase() === 'batal') return collector.stop('cancel');
            if (isNaN(guess)) return; // Abaikan jika bukan angka

            attempts++;
            
            if (guess === number) {
                m.reply(`🎉 **BENAR!** Angkanya adalah ${number}.\nKamu berhasil menebak dalam **${attempts}** percobaan.`);
                collector.stop('won');
            } else if (guess < number) {
                m.reply('⬆️ Lebih **BESAR** lagi!');
            } else {
                m.reply('⬇️ Lebih **KECIL** lagi!');
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') interaction.followUp(`⏰ Waktu habis! Angkanya tadi adalah **${number}**.`);
            if (reason === 'cancel') interaction.followUp(`🏳️ Kamu menyerah. Angkanya tadi adalah **${number}**.`);
        });
    }
};

