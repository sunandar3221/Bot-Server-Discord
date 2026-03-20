const { Events, EmbedBuilder } = require('discord.js');

// --- SETUP ID DI SINI JUGA BRO ---
const CONFIG = {
    ROLE_MODERATOR: '1458429293909643285', // Role ID Admin/Mod yang berhak nentuin nasib saran
    ROLE_DEVELOPER: '1247890394835062878'  // Role ID Developer yang bakal ngerjain sarannya
};

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Cek dulu ini tombol saran bukan?
        if (!interaction.isButton()) return;
        if (!['terima_saran', 'tolak_saran'].includes(interaction.customId)) return;

        // 1. Cek Permission: Lu siapa brader? Punya akses gak?
        if (!interaction.member.roles.cache.has(CONFIG.ROLE_MODERATOR)) {
            return interaction.reply({
                content: 'Eits, tangan lu bau bawang bro! \uD83D\uDE45\u200D\u2642\uFE0F Cuma Admin kece yang boleh pencet tombol keramat ini.', // \uD83D\uDE45\u200D\u2642\uFE0F = Man gesturing NO
                ephemeral: true
            });
        }

        // Ambil Embed asli
        const originalEmbed = interaction.message.embeds[0];
        if (!originalEmbed) return interaction.reply({ content: 'Embed-nya ilang ditelan bumi bro.', ephemeral: true });

        // Logic Regex buat nyari ID User (Sesuai format di file saran.js)
        const footerText = originalEmbed.footer.text;
        const userIdMatch = footerText.match(/ID Pengirim: (\d+)/);
        const suggesterId = userIdMatch ? userIdMatch[1] : null;

        let newStatus = '';
        let newColor = 0;
        let actionMessageDM = '';
        let isAccepted = false;
        
        // Logic Tombolnya
        if (interaction.customId === 'terima_saran') {
            newStatus = '\u2705 Ide Diterima (Auto Gass!)'; // \u2705 = Green Check
            newColor = 0x00FF00; // Hijau Neon
            actionMessageDM = 'udah **DITERIMA** nih! Gokil, ide lu emang mahal! \uD83C\uDF89'; // \uD83C\uDF89 = Popper
            isAccepted = true;
        } else {
            newStatus = '\u26D4 Ide Di-Skip Dulu (Sorry Ye)'; // \u26D4 = No Entry
            newColor = 0xFF0000; // Merah Membara
            actionMessageDM = 'kayaknya harus **DITOLAK** dulu deh. Jangan baper ya, coba lagi kapan-kapan! \uD83E\uDD7A'; // \uD83E\uDD7A = Pleading Face
            isAccepted = false;
        }

        // 2. Update Embed di Channel (Matiin tombolnya biar gak dipencet 2x)
        const updatedEmbed = new EmbedBuilder(originalEmbed.data)
            .setColor(newColor)
            .spliceFields(0, 1, { name: 'Status Terkini', value: `${newStatus}\nDiurus sama: <@${interaction.user.id}>`, inline: true });

        await interaction.update({ embeds: [updatedEmbed], components: [] });

        // 3. DM User Pengirim (Biar berasa diperhatiin)
        if (suggesterId) {
            try {
                const user = await interaction.client.users.fetch(suggesterId);
                await user.send({
                    content: `Yoo what's up bro! \uD83D\uDC4B\nSaran yang lu kirim di server **${interaction.guild.name}** ${actionMessageDM}\n\n\uD83D\uDCDD **Review Ide Lu:**\n${originalEmbed.description}`
                });
            } catch (err) {
                console.log(`Yah, gagal DM si user ${suggesterId}. DM-nya dikunci kali.`, err);
            }
        }

        // 4. Kalo DITERIMA -> Teror Developer di DM
        if (isAccepted) {
            try {
                // Tarik data member biar update
                await interaction.guild.members.fetch();
                
                // Cari kaum-kaum developer
                const developers = interaction.guild.members.cache.filter(member => 
                    member.roles.cache.has(CONFIG.ROLE_DEVELOPER) && !member.user.bot
                );

                const devEmbed = new EmbedBuilder()
                    .setTitle('\uD83D\uDEE0\uFE0F Woy Dev! Ada Kerjaan Baru Nih!') // \uD83D\uDEE0\uFE0F = Hammer & Wrench
                    .setDescription(`Nih ada ide mantep yang udah di-ACC sama Mod **${interaction.user.tag}**. Sikat miring bro! \uD83D\uDCBB`) // \uD83D\uDCBB = Laptop
                    .addFields(
                        { name: '\uD83D\uDC64 Otak Dibalik Ide', value: `<@${suggesterId}>`, inline: true }, // \uD83D\uDC64 = Bust in silhouette
                        { name: '\uD83D\uDCC4 Detail Saran', value: originalEmbed.description } // \uD83D\uDCC4 = Page facing up
                    )
                    .setColor(0xFFA500) // Orange Developer
                    .setTimestamp()
                    .setFooter({ text: 'Semangat ngodingnya bang jago! \u2615' }); // \u2615 = Coffee

                // Spam DM Developer
                developers.forEach(dev => {
                    dev.send({ embeds: [devEmbed] })
                        .catch(err => console.log(`Gagal bangunin Developer ${dev.user.tag}:`, err));
                });

            } catch (error) {
                console.error('Error pas mau ngontak developer:', error);
                await interaction.followUp({ content: 'Saran sih diterima, tapi sistem error pas mau nge-DM developer. Haduh.', ephemeral: true });
            }
        }
    },
};


