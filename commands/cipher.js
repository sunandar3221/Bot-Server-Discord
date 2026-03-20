const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const argon2 = require('argon2'); // WAJIB INSTALL: npm install argon2

// --- KONFIGURASI TINGKAT DEWA ---
// Password Default (Full Chaos - Opsi 3)
const DEFAULT_KEY = "!7A$b9@X#2zP&5mK*8qR^3vL(6nH)4jW%1s"; 

const ALGORITHM = 'aes-256-gcm';

// --- DICTIONARY EMOJI UNICODE ---
const e = {
    lock: '\uD83D\uDD12',      // 🔒
    unlock: '\uD83D\uDD13',    // 🔓
    key: '\uD83D\uDD11',       // 🔑
    shield: '\uD83D\uDEE1\uFE0F', // 🛡️
    alien: '\uD83D\uDC7D',     // 👽
    check: '\u2705',           // ✅
    cross: '\u274C',           // ❌
    warn: '\u26A0\uFE0F',      // ⚠️
    magic: '\u2728',           // ✨
    spy: '\uD83D\uDD75\uFE0F', // 🕵️
    wall: '\uD83E\uDDF1',      // 🧱
    book: '\uD83D\uDCD6',      // 📖
    robot: '\uD83E\uDD16',     // 🤖
    brain: '\uD83E\uDDE0',     // 🧠
    ghost: '\uD83D\uDC7B',     // 👻
    ninja: '\uD83E\uDD77',     // 🥷
    police: '\uD83D\uDC6E',    // 👮
    link: '\uD83D\uDD17',      // 🔗
    muscle: '\uD83D\uDCAA'     // 💪
};

// --- MESIN KUNCI (ARGON2ID) ---
// Fungsi ini mengubah password jadi key 32-byte yang super keras
const deriveKeyFromArgon2 = async (password, salt) => {
    return await argon2.hash(password, {
        type: argon2.argon2id, // Mode hybrid (paling aman)
        raw: true,             // Output buffer mentah
        salt: salt,
        hashLength: 32,        // Sesuai AES-256
        timeCost: 3,           // Iterasi proses
        memoryCost: 65536,     // Makan RAM biar berat buat hacker
        parallelism: 1
    });
};

// --- ENKRIPSI UTAMA (ASYNC) ---
const encryptMessage = async (text, password) => {
    // 1. Salt
    const salt = crypto.randomBytes(16); 
    
    // 2. Key Derivation (Argon2id) - Pake await karena berat
    const key = await deriveKeyFromArgon2(password, salt);
    
    // 3. IV
    const iv = crypto.randomBytes(12);
    
    // 4. Proses AES
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Output: Salt:IV:Tag:Pesan
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
};

// --- DEKRIPSI UTAMA (ASYNC) ---
const decryptMessage = async (text, password) => {
    try {
        const parts = text.split(':');
        if (parts.length !== 4) throw new Error("Format salah");
        
        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        const encryptedText = parts[3];
        
        // Bikin ulang key pakai Argon2id
        const key = await deriveKeyFromArgon2(password, salt);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        throw new Error("Gagal dekripsi");
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('secret')
        .setDescription('Alat sandi teks Argon2id (Extreme Security)')
        .addSubcommand(sub =>
            sub.setName('help')
               .setDescription('Panduan keamanan & cara pakai'))
        .addSubcommand(sub =>
            sub.setName('lock')
                .setDescription('Enkripsi pesan teks')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Pesan rahasia lu')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('password')
                        .setDescription('(OPSIONAL) Isi password sendiri biar Admin pun gak bisa baca!')
                        .setRequired(false))) 
        .addSubcommand(sub =>
            sub.setName('unlock')
                .setDescription('Dekripsi kode teks')
                .addStringOption(opt =>
                    opt.setName('code')
                        .setDescription('Kode yang mau dibaca')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('password')
                        .setDescription('(OPSIONAL) Isi kalau pas nge-lock pake password sendiri.')
                        .setRequired(false))),

    async execute(interaction) {
        // Defer reply karena Argon2id butuh waktu proses (CPU Intensive)
        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();

        // --- FITUR 1: MENU BANTUAN (HELP) ---
        if (sub === 'help') {
            const helpMsg = 
                `${e.book} **PANDUAN KEAMANAN DATA** ${e.book}\n` +
                `_Engine: AES-256 + Argon2id Hashing ${e.muscle}_\n\n` +
                
                `**1. ${e.robot} Mode Server (Tanpa Password)**\n` +
                `> Cukup isi \`text\`, kosongin \`password\`.\n` +
                `> ${e.warn} **Risiko:** Admin/Owner masih bisa dekripsi pakai kunci master.\n` +
                `> **Cocok buat:** Fun, jokes, circle.\n\n` +
                
                `**2. ${e.ninja} Mode Pribadi (Password Kustom)**\n` +
                `> Isi \`text\` DAN isi kolom \`password\`.\n` +
                `> ${e.shield} **Keamanan:** **MUSTAHIL DIBACA** tanpa password itu.\n` +
                `> **Cocok buat:** Data Sensitif (Password/Email/Alamat).\n\n` +
                
                `**${e.brain} Cara Buka Pesan:**\n` +
                `Copy kodenya -> Pilih \`/secret unlock\` -> Paste kode -> Masukin password.`;
            
            return interaction.editReply({ content: helpMsg });
        }

        // --- LOGIKA UTAMA ---
        const input = interaction.options.getString('text') || interaction.options.getString('code');
        const userPassword = interaction.options.getString('password');
        const activeKey = userPassword || DEFAULT_KEY;
        const isCustom = !!userPassword; 

        let output = '';
        let display = '';

        try {
            if (sub === 'lock') {
                // ENKRIPSI (Pake Await)
                output = await encryptMessage(input, activeKey);
                
                const statusTitle = isCustom ? "PRIVASI TOTAL (ARGON2ID)" : "MODE SERVER";
                const statusIcon = isCustom ? e.ninja : e.robot;
                
                let footerNote = "";
                if (!isCustom) {
                    footerNote = `\n${e.police} **PERINGATAN:**\n` +
                                 `Lu pakai password server. Admin bisa baca ini.\n` +
                                 `Gunakan kolom \`password\` untuk keamanan maksimal!`;
                } else {
                    footerNote = `\n${e.ghost} **MODE HANTU AKTIF:**\n` +
                                 `Password: ||${userPassword}||\n` +
                                 `Hanya lu & penerima yang tau password ini yang bisa baca.`;
                }

                display = `${e.lock} ${e.link} **ENKRIPSI SUKSES** ${e.link} ${e.lock}\n\n` +
                          `${statusIcon} **Mode:** ${statusTitle}\n` +
                          `${e.key} **Pesan Asli:** ||${input}||\n` +
                          `${e.magic} **Kode Enkripsi:**\n` +
                          `\`\`\`\n${output}\n\`\`\`` + 
                          footerNote;
            
            } else {
                // UNLOCK (Pake Await)
                output = await decryptMessage(input, activeKey);
                
                display = `${e.unlock} ${e.wall} **DEKRIPSI SUKSES** ${e.wall} ${e.unlock}\n\n` +
                          `${e.brain} **Mode:** ${isCustom ? "Kustom Key" : "Server Key"}\n` +
                          `${e.check} **Integritas:** Valid (Argon2id Verified)\n` +
                          `${e.spy} **Isi Pesan:**\n` +
                          `\`\`\`\n${output}\n\`\`\``; 
            }

            await interaction.editReply({ content: display });
            
        } catch (error) {
            console.error("Argon2 Error:", error);
            // Error handling yang ramah
            let msg = "Ada masalah teknis.";
            if (error.message.includes("Gagal dekripsi")) msg = "Password salah, kode rusak, atau ini kode versi lama.";
            
            await interaction.editReply({ 
                content: `${e.cross} **GAGAL BRO!**\n${msg}` 
            });
        }
    },
};


