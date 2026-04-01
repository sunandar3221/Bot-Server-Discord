const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// ==========================================
// COOLDOWN TRACKER (30 detik per user)
// ==========================================
const cooldowns = new Map(); // Key: userId, Value: timestamp kapan cooldown habis
const COOLDOWN_DETIK = 30;

// ==========================================
// SESSION LOCK (Biar ga bisa double command)
// ==========================================
const activeSessions = new Set(); // Nyimpen userId yang lagi aktif milih/download

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
        // CEK COOLDOWN DI AWAL
        // ==========================================
        const sekarang = Date.now();
        const cooldownHabis = cooldowns.get(interaction.user.id);

        if (cooldownHabis && sekarang < cooldownHabis) {
            const sisaDetik = Math.ceil((cooldownHabis - sekarang) / 1000);
            return interaction.editReply(
                `Slow down bro <@${interaction.user.id}>! Lu baru aja download. Tunggu **${sisaDetik} detik** lagi ya sebelum download lagi.`
            );
        }

        // ==========================================
        // CEK SESSION LOCK
        // ==========================================
        if (activeSessions.has(interaction.user.id)) {
            return interaction.editReply(
                `Bro <@${interaction.user.id}>, lu masih ada sesi yang lagi jalan nih! Selesain dulu pilihan sebelumnya atau tunggu sampe kadaluarsa ya.`
            );
        }

        // Daftarin user ke sesi aktif
        activeSessions.add(interaction.user.id);

        // Helper buat bersihin sesi user di semua exit point
        const bebaskanSesi = () => activeSessions.delete(interaction.user.id);

        // ==========================================
        // FUNGSI UTAMA BUAT PROSES DOWNLOAD
        // ==========================================
        const prosesDownload = async (url, interactionUpdate, namaLagu, kirimKeDM, formatZip) => {
            await interactionUpdate.editReply({ content: 'Sabar ya cuy, lagu lu lagi ditarik dan diproses. Santai dulu sambil ngopi...', components: [] });

            try {
                // Bersihin judul buat nama file biar ga error di OS
                let title = namaLagu.replace(/[^a-zA-Z0-9 ]/g, "").trim();
                if (title.length > 40) title = title.substring(0, 40);

                const reqId = interaction.id; // Pake ID interaksi biar file ga tabrakan kalau ada request barengan
                const m4aPath = path.join(__dirname, `${reqId}_audio.m4a`);
                const mp3Path = path.join(__dirname, `${reqId}_${title}.mp3`);
                const zipPath = path.join(__dirname, `${reqId}_${title}.zip`);

                // Setup opsi download (Bikin CPU lebih adem)
                const dlOptions = {
                    noCheckCertificates: true,
                    noWarnings: true,
                    noPlaylist: true,
                    limitRate: '5M', // Batasin kecepatan download biar CPU ga kaget
                    addHeader: [
                        'referer:youtube.com',
                        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                    ]
                };

                let finalPathToUpload = '';
                let finalFileName = '';

                if (formatZip) {
                    // OPSI ZIP (Super ringan buat CPU server)
                    dlOptions.format = 'ba[ext=m4a]/ba';
                    dlOptions.output = m4aPath;
                    
                    await youtubedl(url, dlOptions);

                    if (!fs.existsSync(m4aPath)) throw new Error("Gagal nyimpen M4A.");

                    // Proses bungkus ZIP tanpa kompresi (level 0)
                    await new Promise((resolve, reject) => {
                        const output = fs.createWriteStream(zipPath);
                        const archive = archiver('zip', { zlib: { level: 0 } }); 

                        output.on('close', resolve);
                        archive.on('error', reject);

                        archive.pipe(output);
                        archive.file(m4aPath, { name: `${title}.m4a` });
                        archive.finalize();
                    });

                    finalPathToUpload = zipPath;
                    finalFileName = `${title}.zip`;
                } else {
                    // OPSI MP3 (Agak berat karena FFmpeg, tapi udah dioptimasi settingannya)
                    dlOptions.extractAudio = true;
                    dlOptions.audioFormat = 'mp3';
                    dlOptions.audioQuality = 5; // Kualitas standar (128k), bikin encode ffmpeg jauh lebih cepet
                    dlOptions.output = mp3Path;

                    await youtubedl(url, dlOptions);

                    if (!fs.existsSync(mp3Path)) throw new Error("Gagal nyimpen MP3.");

                    finalPathToUpload = mp3Path;
                    finalFileName = `${title}.mp3`;
                }

                // Siapin attachment buat dikirim
                const attachment = new AttachmentBuilder(finalPathToUpload, { name: finalFileName });
                const pesanSukses = `Nih bro lagunya: **${title}**. Udah mantap pokoknya siap diputer di tongkrongan!`;

                // Kirim ke target yang dipilih
                if (kirimKeDM) {
                    try {
                        await interaction.user.send({ content: pesanSukses, files: [attachment] });
                        await interactionUpdate.editReply(`Cek DM lu bro <@${interaction.user.id}>! Lagunya udah mendarat dengan aman.`);
                    } catch (err) {
                        await interactionUpdate.editReply(`Bro <@${interaction.user.id}>, DM lu di-lock nih. Gagal ngirim. Buka dulu settingan privasi server lu besok-besok ya!`);
                    }
                } else {
                    await interactionUpdate.editReply({ content: `<@${interaction.user.id}>, ${pesanSukses}`, files: [attachment] });
                }

                // Bersih-bersih sampah file temporary
                if (fs.existsSync(m4aPath)) fs.unlinkSync(m4aPath);
                if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
                if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

            } catch (error) {
                console.error("\n[ERROR DOWNLOAD]:", error.message);
                await interactionUpdate.editReply({ content: 'Waduh error bro pas nyoba ambil atau convert datanya. Coba lagi nanti yak.', components: []});
            }

            // ==========================================
            // SET COOLDOWN + BEBASIN SESI SETELAH DOWNLOAD SELESAI
            // (Berlaku baik sukses maupun error, tapi
            //  TIDAK berlaku kalau user expired/timeout)
            // ==========================================
            cooldowns.set(interaction.user.id, Date.now() + COOLDOWN_DETIK * 1000);
            bebaskanSesi();
        };

        // VARIABEL BUAT NYIMPEN PILIHAN MEMBER
        let selectedUrl = input;
        let selectedTitle = "Lagu_Tongkrongan";

        // ==========================================
        // 1. PROSES CARI LAGU (KALAU BUKAN URL)
        // ==========================================
        if (!isUrl) {
            try {
                const searchResults = await ytSearch(input);
                const videos = searchResults.videos.slice(0, 5); 

                if (!videos || videos.length === 0) {
                    bebaskanSesi();
                    return interaction.editReply('Gua udah nyari ke ujung YouTube tapi gak nemu lagu itu bro.');
                }

                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(`Hasil pencarian buat: "${input}"`)
                    .setDescription('Nih cuy 5 hasil paling gacor. Langsung klik tombol di bawah aja!')
                    .setFooter({ text: 'Bot Tongkrongan Asik • Waktu milih 1 menit' });

                const row = new ActionRowBuilder();
                videos.forEach((video, index) => {
                    embed.addFields({
                        name: `${index + 1}. ${video.title}`,
                        value: `⏳ ${video.timestamp} | 👤 ${video.author.name}`
                    });
                    row.addComponents(
                        new ButtonBuilder().setCustomId(`dl_${index}`).setLabel(`Lagu ${index + 1}`).setStyle(ButtonStyle.Primary)
                    );
                });

                const response = await interaction.editReply({ embeds: [embed], components: [row] });

                try {
                    // Nunggu member milih lagu, limit 60 detik
                    const konfirmasiLagu = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 });
                    await konfirmasiLagu.deferUpdate(); // Biar ga failed interaction di sisi discord

                    const index = parseInt(konfirmasiLagu.customId.split('_')[1]);
                    selectedUrl = videos[index].url;
                    selectedTitle = videos[index].title;

                } catch (e) {
                    // KALAU KADALUARSA (Gak dipencet) — cooldown TIDAK di-set
                    bebaskanSesi();
                    return interaction.editReply({ 
                        content: 'Waktu lu abis bro buat milih lagu. Keburu kadaluarsa nih, kalau masih mau cari ketik lagi aja command-nya ya!', 
                        embeds: [], 
                        components: [] 
                    });
                }
            } catch (error) {
                bebaskanSesi();
                return interaction.editReply('Waduh error bro pas nyari lagunya. Coba ketik judul yang lain.');
            }
        } else {
            // Kalau inputnya emang URL, coba comot judulnya
            try {
                const urlObj = new URL(input);
                const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
                const searchRes = await ytSearch({ videoId: videoId });
                if (searchRes && searchRes.title) selectedTitle = searchRes.title;
            } catch(e) {
                // Biarin judul default kalau gagal
            }
        }

        // ==========================================
        // 2. TANYA MAU DIKIRIM KE MANA
        // ==========================================
        const rowLokasi = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('loc_channel').setLabel('Kirim ke Sini Aja').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('loc_dm').setLabel('Kirim via DM').setStyle(ButtonStyle.Secondary)
        );

        const responLokasi = await interaction.editReply({ 
            content: `Mantap, lagu **${selectedTitle}** mau gua lempar ke mana nih bro?`, 
            embeds: [], 
            components: [rowLokasi] 
        });

        let kirimKeDM = false;
        try {
            const konfirmasiLokasi = await responLokasi.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 });
            await konfirmasiLokasi.deferUpdate();
            kirimKeDM = konfirmasiLokasi.customId === 'loc_dm';
        } catch (e) {
            // Timeout milih lokasi — cooldown TIDAK di-set
            bebaskanSesi();
            return interaction.editReply({ content: 'Kelamaan mikir lu bro, batalin aja ya. Ulang lagi kalau mau.', components: [] });
        }

        // ==========================================
        // 3. TANYA MAU FORMAT APA
        // ==========================================
        const rowFormat = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fmt_zip').setLabel('Bungkus ZIP (Disarankan)').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('fmt_mp3').setLabel('Langsung MP3').setStyle(ButtonStyle.Primary)
        );

        const responFormat = await interaction.editReply({ 
            content: `Oke. Sekarang mau format apa bro?\n*(Pilih ZIP kalau lu di Android/PC, ini aman banget buat server. MP3 agak nyiksa CPU dikit tapi langsung puter)*`, 
            components: [rowFormat] 
        });

        let formatZip = true;
        try {
            const konfirmasiFormat = await responFormat.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 });
            await konfirmasiFormat.deferUpdate();
            formatZip = konfirmasiFormat.customId === 'fmt_zip';
        } catch (e) {
            // Timeout milih format — cooldown TIDAK di-set
            bebaskanSesi();
            return interaction.editReply({ content: 'Kelamaan milih format bro, gua batalin yak.', components: [] });
        }

        // ==========================================
        // 4. EKSEKUSI DOWNLOAD
        // ==========================================
        await prosesDownload(selectedUrl, interaction, selectedTitle, kirimKeDM, formatZip);
    },
};
