const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
const CHANNEL_ID = '1367014167688777728'; 
const DB_PATH = path.join(__dirname, '../counting.json');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        // 1. Filter Dasar
        if (message.author.bot) return;
        if (message.channel.id !== CHANNEL_ID) return;

        // Cek angka
        const inputNumber = parseInt(message.content);
        if (isNaN(inputNumber)) return; 

        // 2. Baca Database
        let db = { currentNumber: 0, lastUser: "", lastMessageId: "" };
        try {
            if (fs.existsSync(DB_PATH)) {
                db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            }
        } catch (err) { console.error('Error baca DB Counting:', err); }

        const nextNumber = db.currentNumber + 1;

        // --- ATURAN MAIN ---

        // A. Cek Maruk
        if (message.author.id === db.lastUser) {
            message.react('🤡'); 
            message.reply(`🚫 **GABOLEH MARUK!** Woi **${message.author.username}**, gantian dong!\n🔄 **Reset ke 0.**`);
            
            db.currentNumber = 0;
            db.lastUser = "";
            db.lastMessageId = ""; // Reset ID juga
            fs.writeFileSync(DB_PATH, JSON.stringify(db));
            return;
        }

        // B. Cek Angka Benar
        if (inputNumber === nextNumber) {
            message.react('✅'); 
            
            // Update DB
            db.currentNumber = nextNumber;
            db.lastUser = message.author.id;
            db.lastMessageId = message.id; // <--- KITA SIMPAN ID PESANNYA DI SINI
            
            fs.writeFileSync(DB_PATH, JSON.stringify(db));
        } 
        
        // C. Cek Angka Salah
        else {
            message.react('❌'); 
            message.reply(`💀 **SALAH WOI!** **${message.author.username}** malah ngetik ${inputNumber}, harusnya **${nextNumber}**.\n🔄 **Reset ke 0.**`);

            db.currentNumber = 0;
            db.lastUser = "";
            db.lastMessageId = ""; // Reset ID
            fs.writeFileSync(DB_PATH, JSON.stringify(db));
        }
    },
};


