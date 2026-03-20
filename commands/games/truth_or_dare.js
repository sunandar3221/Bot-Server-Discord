const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tod')
        .setDescription('Main Truth or Dare'),

    async execute(interaction) {
        const truths = [
            'Siapa orang yang terakhir kamu search di Instagram?',
            'Apa kebohongan terbesar yang pernah kamu buat?',
            'Siapa member di server ini yang diam-diam kamu kagumi?',
            'Hal paling memalukan apa yang pernah terjadi di sekolah/kantor?',
            'Kapan terakhir kali kamu menangis dan kenapa?'
        ];

        const dares = [
            'Ganti foto profil Discord kamu jadi foto monyet selama 10 menit.',
            'Chat orang random di DM bilang "Aku sayang kamu".',
            'Kirim screenshot chat terakhir kamu di WA ke sini.',
            'Nyanyi Voice Note di server ini sekarang.',
            'Ketik pake hidung kamu: "Aku wibu bau bawang".'
        ];

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('truth').setLabel('Truth').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('dare').setLabel('Dare').setStyle(ButtonStyle.Danger)
            );

        const msg = await interaction.reply({
            content: 'Pilih **Truth** atau **Dare**!',
            components: [row],
            fetchReply: true
        });

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Bikin command sendiri dong!', ephemeral: true });

            const choice = i.customId === 'truth' 
                ? `🧐 **TRUTH:** ${truths[Math.floor(Math.random() * truths.length)]}`
                : `😈 **DARE:** ${dares[Math.floor(Math.random() * dares.length)]}`;

            await i.update({ content: choice, components: [] });
            collector.stop();
        });
    }
};

