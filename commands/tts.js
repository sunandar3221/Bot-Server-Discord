const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const googleTTS = require('google-tts-api'); // Ingat udah di npm install ya bro!

module.exports = {
    // Setup slash command-nya di sini bro
    data: new SlashCommandBuilder()
        .setName('tts')
        .setDescription('Suruh Mbah Google bacotin sesuatu buat anak tongkrongan')
        .addStringOption(option =>
            option.setName('bacotan')
                .setDescription('Ketik teks yang mau diomongin (maks 200 huruf ya bro)')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Kita hold dulu interaction-nya biar ga kena timeout dari Discord kalo inet lagi lemot
        await interaction.deferReply();

        // Ambil teks yang diketik user dari opsi slash command
        const teks = interaction.options.getString('bacotan');

        // Kasih limit biar orang ga masukin teks sepanjang naskah skripsi
        // TTS Google biasanya mentok di 200 karakter buat 1 request gampang
        if (teks.length > 200) {
            return interaction.editReply('Buset bro, panjang amat kek cerpen! Kasihan Mbah Google engap, maksimal 200 karakter aja yak.');
        }

        try {
            // Generate URL audio dari Google Translate (Suara legend Mbah Google)
            const audioUrl = googleTTS.getAudioUrl(teks, {
                lang: 'id', // Set ke Bahasa Indonesia biar kearifan lokalnya dapet
                slow: false, // Normal speed. Kalo mau suara orang ngantuk, ganti jadi true
                host: 'https://translate.google.com',
            });

            // Bungkus URL-nya jadi attachment Discord biar bisa langsung di-play di chat
            const attachment = new AttachmentBuilder(audioUrl, { name: 'suara-mbah-google.mp3' });

            // Kirim deh hasilnya ke tongkrongan (channel)
            await interaction.editReply({
                content: `🎙️ **Mbah Google bersabda:**\n*"${teks}"*\n\nGas dengerin audionya di bawah nih bro! 👇`,
                files: [attachment]
            });

        } catch (error) {
            console.error('Error dari command TTS:', error);
            // Kalo tiba-tiba error (API limit atau inet down), kita kasih respon chill
            await interaction.editReply('Waduh bro, Mbah Google lagi radang tenggorokan nih keknya. Gagal nge-generate suaranya, coba bentaran lagi yak.');
        }
    },
};

