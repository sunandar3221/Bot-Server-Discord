const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

ffmpeg.setFfmpegPath(ffmpegPath);

const cooldowns = new Map();

// [FIX #6] Fungsi sanitasi nama file
function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// [FIX #5] Cleanup yang aman tanpa race condition
function cleanupFiles(...files) {
    for (const file of files) {
        try {
            fs.unlinkSync(file);
        } catch (e) {
            // File udah ga ada atau lagi dipake, skip aje
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reverse')
        .setDescription('Balikin teks atau media (Audio/Video) biar jadi kebalik bro!')
        .addStringOption(option =>
            option.setName('teks')
                .setDescription('Teks yang mau lu balik'))
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('File audio atau video (Maksimal 8MB)')),

    async execute(interaction) {
        const teks = interaction.options.getString('teks');
        const file = interaction.options.getAttachment('file');

        // Validasi input
        if (!teks && !file) {
            return interaction.reply({
                content: 'Masukin apa kek bro, teks atau file gitu. Jangan kosong melompong!',
                ephemeral: true
            });
        }

        // [FIX #7] Kalau keduanya diisi, kasih tau user
        if (teks && file) {
            return interaction.reply({
                content: 'Pilih salah satu aja bro, teks **atau** file. Jangan kedua-duanya!',
                ephemeral: true
            });
        }

        // --- LOGIK REVERSE TEKS ---
        if (teks) {
            const reversedText = teks.split('').reverse().join('');
            return interaction.reply({ content: `**Teks kebalik lu nih:**\n\`${reversedText}\`` });
        }

        // --- LOGIK REVERSE MEDIA ---
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 30 * 1000;

        // Cek Cooldown
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    content: `Sabar cuy! Mesin lagi adem, tunggu ${timeLeft.toFixed(1)} detik lagi ya.`,
                    ephemeral: true
                });
            }
        }

        // Batas ukuran file
        const MAX_SIZE = 8 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return interaction.reply({
                content: 'Filenya kegedean bro! Maksimal 8MB aja biar bot gua ga engap.',
                ephemeral: true
            });
        }

        // Cek jenis file
        const isVideo = file.contentType?.startsWith('video/');
        const isAudio = file.contentType?.startsWith('audio/');

        if (!isVideo && !isAudio) {
            return interaction.reply({
                content: 'Gua cuma bisa reverse audio atau video doang bro!',
                ephemeral: true
            });
        }

        // [FIX #1] Set cooldown SEGERA sebelum mulai proses
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        await interaction.deferReply();

        // [FIX #6] Sanitasi nama file & pake ID unik
        const safeName = sanitizeFilename(file.name);
        const ext = path.extname(safeName) || (isVideo ? '.mp4' : '.mp3');
        const inputPath = path.join(__dirname, `input_${now}_${userId}${ext}`);
        const outputPath = path.join(__dirname, `reversed_${now}_${userId}${ext}`);

        let ffmpegProc = null;

        try {
            // 1. Download file dari Discord (dengan timeout)
            const response = await axios({
                url: file.url,
                method: 'GET',
                responseType: 'stream',
                timeout: 30000 // 30 detik timeout download
            });

            const writer = fs.createWriteStream(inputPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // 2. Proses Reverse pake FFmpeg (wrapped in Promise)
            await new Promise((resolve, reject) => {
                ffmpegProc = ffmpeg(inputPath);

                if (isVideo) {
                    ffmpegProc = ffmpegProc.outputOptions(['-vf reverse', '-af areverse']);
                } else {
                    ffmpegProc = ffmpegProc.outputOptions(['-af areverse']);
                }

                // [FIX #3] Timeout FFmpeg 60 detik biar ga hang selamanya
                const timeout = setTimeout(() => {
                    if (ffmpegProc) {
                        ffmpegProc.kill('SIGKILL');
                    }
                    reject(new Error('FFmpeg timeout: proses kebacaan lama, kemungkinan file corrupt'));
                }, 60 * 1000);

                ffmpegProc
                    .on('error', (err) => {
                        clearTimeout(timeout);
                        reject(err);
                    })
                    .on('end', () => {
                        clearTimeout(timeout);
                        resolve();
                    })
                    .save(outputPath);
            });

            // 3. Kirim hasil
            const attachment = new AttachmentBuilder(outputPath, { name: `kebalik_${safeName}` });
            await interaction.editReply({ content: 'Nih bro, udah gua balik!', files: [attachment] });

        } catch (error) {
            console.error('[REVERSE CMD ERROR]', error.message || error);

            // [FIX #2] Sekarang cuma ada 1 path error, ga bisa double reply
            try {
                await interaction.editReply('Waduh, gagal nge-reverse filenya. Coba lagi ntar ya bro.');
            } catch (replyErr) {
                console.error('[REPLY ERROR]', replyErr.message);
            }
        } finally {
            // [FIX #8] Bunuh FFmpeg kalau masih jalan
            if (ffmpegProc) {
                try { ffmpegProc.kill(); } catch (e) { /* biarin */ }
            }
            // [FIX #5] Selalu cleanup, aman dari race condition
            cleanupFiles(inputPath, outputPath);
        }
    },
};