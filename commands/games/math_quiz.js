const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathquiz')
        .setDescription('Jawab soal matematika dalam 10 detik!'),

    async execute(interaction) {
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;

        let answer;
        let question;

        if (op === '+') { answer = num1 + num2; question = `${num1} + ${num2}`; }
        if (op === '-') { answer = num1 - num2; question = `${num1} - ${num2}`; }
        if (op === '*') { answer = num1 * num2; question = `${num1} x ${num2}`; }

        await interaction.reply(`🧠 **QUICK MATH!**\nBerapa hasil dari: **${question}**?\n*(Waktu 10 detik!)*`);

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 10000, max: 1 });

        collector.on('collect', m => {
            if (parseInt(m.content) === answer) {
                m.reply('✅ **BENAR!** Kamu jenius.');
            } else {
                m.reply(`❌ **SALAH!** Jawabannya adalah ${answer}.`);
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) interaction.followUp(`⏰ Waktu habis! Jawabannya adalah ${answer}.`);
        });
    }
};

