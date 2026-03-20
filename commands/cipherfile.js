const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const crypto = require('crypto');
const argon2 = require('argon2'); // WAJIB INSTALL: npm install argon2

// --- KONFIGURASI ---
const ALGORITHM = 'aes-256-gcm';

// --- DICTIONARY EMOJI (UNICODE) ---
const e = {
    lock: '\uD83D\uDD12',      // 🔒
    unlock: '\uD83D\uDD13',    // 🔓
    key: '\uD83D\uDD11',       // 🔑
    file: '\uD83D\uDCC1',      // 📁
    download: '\uD83D\uDCE5',  // 📥
    upload: '\uD83D\uDCE4',    // 📤
    shield: '\uD83D\uDEE1\uFE0F', // 🛡️
    check: '\u2705',           // ✅
    cross: '\u274C',           // ❌
    warn: '\u26A0\uFE0F',      // ⚠️
    spy: '\uD83D\uDD75\uFE0F', // 🕵️
    wall: '\uD83E\uDDF1',      // 🧱
    book: '\uD83D\uDCD6',      // 📖
    muscle: '\uD83D\uDCAA'     // 💪
};

// --- MESIN KUNCI (ARGON2ID) ---
// Ini fungsi buat bikin kunci dari password user.
// Argon2id butuh memory (RAM) yang lumayan biar hacker nangis kalau mau brute-force.
const deriveKeyFromArgon2 = async (password, salt) => {
    return await argon2.hash(password, {
        type: argon2.argon2id, // Tipe paling aman
        raw: true, // Kita butuh output mentah (buffer) buat jadi key AES
        salt: salt,
        hashLength: 32, // Panjang kunci AES-256 harus 32 byte
        timeCost: 3,    // Jumlah putaran proses (makin tinggi makin lambat & aman)
        memoryCost: 65536, // Makan 64MB RAM per proses (Hacker gak kuat kalau mau serang massal)
        parallelism: 1
    });
};

// --- ENKRIPSI FILE (Async karena Argon2 itu berat) ---
const encryptBuffer = async (buffer, password) => {
    // 1. Bikin Salt Baru
    const salt = crypto.randomBytes(16);
    
    // 2. Bikin Key pakai Argon2id
    const key = await deriveKeyFromArgon2(password, salt);
    
    // 3. Setup AES
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // 4. Enkripsi Data
    let encrypted = cipher.update(buffer, null, 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Output Format: Salt:IV:Tag:DataTerenkripsi
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
};

// --- DEKRIPSI FILE ---
const decryptToBuffer = async (textData, password) => {
    try {
        const parts = textData.trim().split(':');
        if (parts.length !== 4) throw new Error("Format file rusak.");
        
        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        const encryptedHex = parts[3];
        
        // Bikin ulang key dari password user + salt yang ada di file
        const key = await deriveKeyFromArgon2(password, salt);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, 'hex')),
            decipher.final()
        ]);
        
        return decrypted;
    } catch (error) {
        // Argon2 akan otomatis gagal kalau password beda, jadi aman.
        throw new Error("Password salah atau file korup.");
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('secretfile')
        .setDescription('Enkripsi File Ultra-Secure (Argon2id)')
        .addSubcommand(sub =>
            sub.setName('help')
               .setDescription('Panduan penggunaan secret file'))
        .addSubcommand(sub =>
            sub.setName('lock')
                .setDescription('Enkripsi file jadi kode rahasia')
                .addAttachmentOption(opt =>
                    opt.setName('file')
                        .setDescription('Upload file yang mau diamankan')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('password')
                        .setDescription('WAJIB: Kunci Argon2id untuk file ini')
                        .setRequired(true))) 
        .addSubcommand(sub =>
            sub.setName('unlock')
                .setDescription('Balikin file terenkripsi jadi normal')
                .addAttachmentOption(opt =>
                    opt.setName('file')
                        .setDescription('Upload file hasil enkripsi (.txt)')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('password')
                        .setDescription('WAJIB: Password saat enkripsi')
                        .setRequired(true))),

    async execute(interaction) {
        // Kita defer agak lamaan dikit karena Argon2id butuh proses CPU
        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();

        // --- 1. HELP COMMAND ---
        if (sub === 'help') {
            const helpMsg = 
                `${e.book} **PANDUAN SECRET FILE (ARGON2ID)** ${e.book}\n\n` +
                `Fitur ini menggunakan algoritma **Argon2id** (Pemenang PHC) + **AES-256**.\n` +
                `Level keamanan: **Extreme** ${e.muscle}\n\n` +
                
                `**${e.lock} Cara Enkripsi (LOCK):**\n` +
                `1. Upload file apa saja.\n` +
                `2. Masukkan password.\n` +
                `3. Bot akan memproses hashing Argon2id (memakan waktu bbrp detik).\n` +
                `4. Download file **.txt** hasilnya.\n\n` +

                `**${e.unlock} Cara Dekripsi (UNLOCK):**\n` +
                `1. Upload file **.txt** hasil enkripsi.\n` +
                `2. Masukkan password yang sama persis.\n` +
                `3. File asli akan kembali.\n\n` +

                `${e.warn} **PENTING:**\n` +
                `Jika password hilang, file **TIDAK BISA** dikembalikan. Tidak ada backdoor.`;
            
            return interaction.editReply({ content: helpMsg });
        }

        const fileAttachment = interaction.options.getAttachment('file');
        const password = interaction.options.getString('password');
        
        try {
            const response = await fetch(fileAttachment.url);
            if (!response.ok) throw new Error("Gagal download file.");
            
            let resultBuffer;
            let outputFileName;
            let processMsg = "";

            if (sub === 'lock') {
                // --- PROSES LOCK (ARGON2ID) ---
                const fileBuffer = await response.arrayBuffer();
                const bufferData = Buffer.from(fileBuffer);
                
                // Proses Enkripsi (Sekarang pakai await karena Argon2 async)
                const encryptedString = await encryptBuffer(bufferData, password);
                
                resultBuffer = Buffer.from(encryptedString, 'utf-8');
                outputFileName = `SECURE_${fileAttachment.name}.txt`;
                processMsg = `${e.lock} **FILE DIAMANKAN (ARGON2ID)**\n` +
                             `Algoritma: AES-256-GCM + Argon2id Key Derivation\n` +
                             `Password: ||${password}||\n` +
                             `Simpan file ini. Isinya hanya sampah bagi hacker.`;

            } else {
                // --- PROSES UNLOCK (ARGON2ID) ---
                const fileText = await response.text();
                
                // Proses Dekripsi
                resultBuffer = await decryptToBuffer(fileText, password);
                
                outputFileName = fileAttachment.name.replace('SECURE_', '').replace('.txt', '') || 'decrypted_file';
                if (!outputFileName.includes('.')) outputFileName += ".bin";

                processMsg = `${e.unlock} **VERIFIKASI ARGON2ID SUKSES!**\n` +
                             `Password cocok. File berhasil didekripsi.`;
            }

            const attachment = new AttachmentBuilder(resultBuffer, { name: outputFileName });

            await interaction.editReply({ 
                content: `${processMsg}\n${e.spy} _Hanya lu yang bisa liat pesan ini._`,
                files: [attachment] 
            });

        } catch (error) {
            console.error("Argon2 Error:", error);
            let errorMsg = "Terjadi kesalahan sistem.";
            
            // Error handling spesifik
            if (error.message.includes("Password salah")) errorMsg = "Password salah! Argon2id menolak akses.";
            if (error.code === 'ENOENT') errorMsg = "Library 'argon2' belum diinstall bro. Cek console.";
            
            await interaction.editReply({ 
                content: `${e.cross} **GAGAL BRO!**\n${errorMsg}` 
            });
        }
    },
};


