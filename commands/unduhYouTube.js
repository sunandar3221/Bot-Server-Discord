const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unduhlagu')
        .setDescription('Download lagu dari YouTube atau cari judul lagu bro!')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Masukin link YouTube atau judul lagu yang mau dicari')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const input = interaction.options.getString('input');
        const isUrl = input.startsWith('http://') || input.startsWith('https://');

        // ==========================================
        // FUNGSI BUAT PROSES DOWNLOAD SUPER RINGAN
        // ==========================================
        const prosesDownload = async (url, interactionUpdate, targetUser, namaLagu) => {
            try {
                // Bersihin judul buat nama file
                let title = namaLagu.replace(/[^a-zA-Z0-9 ]/g, "").trim();
                if (title.length > 40) title = title.substring(0, 40);

                const userId = targetUser.id;
                // Kita pakai m4a sekarang biar server gak usah capek convert ke mp3
                const audioPath = path.join(__dirname, `${userId}_audio.m4a`);
                const zipPath = path.join(__dirname, `${userId}_${title}.zip`);

                // Proses download pakai youtube-dl-exec (Optimasi CPU)
                await youtubedl(url, {
                    format: 'ba[ext=m4a]/ba', // Ngambil best audio dengan format m4a (ringan banget buat CPU)
                    output: audioPath,
                    noCheckCertificates: true,
                    noWarnings: true,
                    addHeader: [
                        'referer:youtube.com',
                        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                    ]
                });

                // Cek kalau filenya gagal disimpen
                if (!fs.existsSync(audioPath)) {
                    return interactionUpdate.editReply('Waduh bro, gagal nyimpen audionya. YouTube masih ketat banget ngeblokir IP server lu.');
                }

                // Proses bungkus jadi ZIP
                const output = fs.createWriteStream(zipPath);
                // Level 0 ini kunci CPU adem bro. Dia cuma mbungkus tanpa meres file.
                const archive = archiver('zip', { zlib: { level: 0 } }); 

                output.on('close', async () => {
                    const attachment = new AttachmentBuilder(zipPath);

                    try {
                        await targetUser.send({
                            content: `Nih bro lagunya: **${title}**. Udah gua bungkus ZIP (Format di dalemnya m4a ya, bisa diputer di HP/PC mana aja)!`,
                            files: [attachment]
                        });
                        await interactionUpdate.editReply(`Cek DM lu bro <@${userId}>! File ZIP lagunya udah mendarat dengan aman.`);
                    } catch (err) {
                        console.error("\n[ERROR DM]:", err.message);
                        await interactionUpdate.editReply(`Bro <@${userId}>, DM lu di-lock nih. Buka dulu settingan privasi server lu!`);
                    }

                    // Bersihin sampah file temporary
                    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
                    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                });

                archive.on('error', (err) => { 
                    console.error("\n[ERROR ZIP]:", err.message);
                    interactionUpdate.editReply('Gagal nge-zip lagunya bro, sistem lagi padet.');
                });

                archive.pipe(output);
                archive.file(audioPath, { name: `${title}.m4a` });
                archive.finalize();

            } catch (error) {
                console.error("\n[ERROR DOWNLOAD YTDL-EXEC]:", error.message);
                await interactionUpdate.editReply('Waduh error bro pas nyoba ambil datanya. IP server lu lagi diawasin ketat sama YouTube, coba lagi nanti yak.');
            }
        };

        if (isUrl) {
            // ==========================================
            // LOGIKA KALAU MEMBER MASUKIN LINK YOUTUBE
            // ==========================================
            await interaction.editReply('Sabar ya cuy, lagi gua seret lagunya... Tenang aja server lagi santai nih.');
            
            let videoTitle = "Lagu_Tongkrongan";
            try {
                // Ambil judul dari link
                const urlObj = new URL(input);
                const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
                const searchRes = await ytSearch({ videoId: videoId });
                if (searchRes && searchRes.title) videoTitle = searchRes.title;
            } catch(e) {
                console.log("Gagal ngambil info judul dari URL, pake nama default.");
            }

            await prosesDownload(input, interaction, interaction.user, videoTitle);

        } else {
            // ==========================================
            // LOGIKA KALAU MEMBER CUMA MASUKIN JUDUL
            // ==========================================
            try {
                const searchResults = await ytSearch(input);
                const videos = searchResults.videos.slice(0, 5); 

                if (!videos || videos.length === 0) {
                    return interaction.editReply('Gua udah nyari ke ujung YouTube tapi gak nemu lagu itu bro.');
                }

                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(`Hasil pencarian buat: "${input}"`)
                    .setDescription('Nih cuy 5 hasil paling gacor. Langsung klik tombol di bawah aja buat download!')
                    .setFooter({ text: 'Bot Tongkrongan Asik' });

                const row = new ActionRowBuilder();

                videos.forEach((video, index) => {
                    embed.addFields({
                        name: `Lagu ${index + 1}: ${video.title}`,
                        value: `⏳ Durasi: ${video.timestamp} | 👤 Channel: ${video.author.name}`
                    });

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`dl_${index}`)
                            .setLabel(`Download Lagu ${index + 1}`)
                            .setStyle(ButtonStyle.Primary)
                    );
                });

                const response = await interaction.editReply({ embeds: [embed], components: [row] });
                const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

                collector.on('collect', async (i) => {
                    if (i.user.id !== interaction.user.id) {
                        return i.reply({ content: 'Bro, lu jangan asal pencet. Lu cari sendiri pakai command /unduhlagu ya!', ephemeral: true });
                    }

                    await i.deferUpdate();
                    await interaction.editReply({ content: 'Sabar ya cuy, lagu pilihan lu lagi ditarik dan dibungkus ZIP tanpa bikin server ngos-ngosan...', embeds: [], components: [] });

                    const index = parseInt(i.customId.split('_')[1]);
                    const selectedVideoUrl = videos[index].url;
                    const selectedVideoTitle = videos[index].title;

                    await prosesDownload(selectedVideoUrl, interaction, interaction.user, selectedVideoTitle);
                });

                collector.on('end', collected => {
                    interaction.editReply({ components: [] }).catch(() => {});
                });

            } catch (error) {
                console.error("\n[ERROR PENCARIAN]:", error.message);
                await interaction.editReply('Waduh error bro pas nyari lagunya. Coba ketik judul yang lain.');
            }
        }
    },
};


