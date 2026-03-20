const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('@napi-rs/canvas'); // Menggunakan napi-rs/canvas yang support Node 22

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qrserver')
        .setDescription('Bikin QR code dari teks/link.')
        .addStringOption(option =>
            option.setName('teks')
                .setDescription('Masukin teks atau link yang mau lu jadiin QR code')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Defer reply karena proses generate gambar butuh waktu
        await interaction.deferReply();

        const text = interaction.options.getString('teks');
        
        // Ambil icon server. Kalau ga ada, nilainya null
        const guildIcon = interaction.guild.iconURL({ extension: 'png', size: 256 });

        try {
            const canvasSize = 500;
            
            // 1. Generate QR Code ke dalam bentuk Buffer terlebih dahulu
            // Ini lebih aman dan mencegah isu kompatibilitas antara qrcode dan canvas API
            const qrBuffer = await QRCode.toBuffer(text, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: canvasSize,
                color: {
                    dark: '#000000', // Warna QR code (Hitam)
                    light: '#ffffff' // Warna background (Putih)
                }
            });

            // 2. Siapkan canvas menggunakan @napi-rs/canvas
            const canvas = createCanvas(canvasSize, canvasSize);
            const ctx = canvas.getContext('2d');

            // 3. Load hasil QR code dari buffer ke canvas
            const qrImage = await loadImage(qrBuffer);
            ctx.drawImage(qrImage, 0, 0, canvasSize, canvasSize);

            // 4. Proses nempelin logo server di tengah (jika ada icon)
            if (guildIcon) {
                const img = await loadImage(guildIcon);
                const logoSize = 120; // Ukuran logo proporsional
                
                // Cari titik tengah canvas
                const center = canvasSize / 2;
                const logoX = center - (logoSize / 2);
                const logoY = center - (logoSize / 2);

                // Background putih di belakang logo
                const borderSize = 10;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(logoX - (borderSize / 2), logoY - (borderSize / 2), logoSize + borderSize, logoSize + borderSize);

                // Gambar logo server
                ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
            }

            // 5. Ubah canvas jadi file buffer menggunakan encode() bawaan napi-rs
            const buffer = await canvas.encode('png');
            
            // Siapin attachment
            const attachment = new AttachmentBuilder(buffer, { name: 'qr-kece.png' });

            // Kirim hasilnya
            await interaction.editReply({ 
                content: `Nih bro QR code lu udah jadi! Mantap kan?`, 
                files: [attachment] 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('Waduh bro, ada yang error nih pas botnya nyoba bikin QR code.');
        }
    },
};

