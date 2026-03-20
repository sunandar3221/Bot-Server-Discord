const { Events, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI AI & LIMIT ---
const CONFIG = {
    // 1. Channel ID (AI Cuma mau ngomong di sini)
    channelId: '1258029219628187791', 

    // 2. Cloudflare Credentials
    cfAccountId: 'PLACEHOLDER',
    cfApiToken: 'PLACEHOLDER',
    
    // 3. Model AI
    cfModel: '@cf/openai/gpt-oss-20b',

    // 4. Limit Harian
    limitMember: 15,
    limitBooster: 50
};

// Lokasi database limit (file json)
const DB_PATH = path.join(__dirname, '../ai_usage.json');

// --- DATABASE INGATAN (MEMORY) ---
// Disimpen di RAM biar cepet. Format: userId -> Array Pesan
const conversationHistory = new Map();

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        // --- FILTER AWAL ---
        if (message.author.bot) return;
        if (message.channel.id !== CONFIG.channelId) return;
        if (!message.content) return;

        // --- FITUR RESET INGATAN ---
        if (message.content.toLowerCase() === 'reset' || message.content.toLowerCase() === 'lupa') {
            conversationHistory.delete(message.author.id);
            return message.reply('🧠 **Ingatan dihapus!** Gue udah lupa kita ngomongin apa tadi. Mulai topik baru kuy!');
        }

        // --- SISTEM LIMIT & DATABASE ---
        let db = { lastReset: '', users: {} };
        const today = new Date().toISOString().split('T')[0];

        try {
            if (fs.existsSync(DB_PATH)) {
                db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            }
        } catch (err) { console.error('Gagal baca DB AI:', err); }

        if (db.lastReset !== today) {
            db.lastReset = today;
            db.users = {}; 
            fs.writeFileSync(DB_PATH, JSON.stringify(db));
        }

        const userId = message.author.id;
        const userUsage = db.users[userId] || 0;

        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
        const isBooster = message.member.premiumSinceTimestamp !== null;

        if (!isAdmin) {
            const limit = isBooster ? CONFIG.limitBooster : CONFIG.limitMember;
            if (userUsage >= limit) {
                return message.reply(`🛑 **Limit Harian Abis!**\nJatah chat lo (${userUsage}/${limit}) udah kelar hari ini bro.\n${!isBooster ? "Boost server biar dapet 50 chat!" : "Besok lagi ya!"}`);
            }
        }

        // --- PERSIAPAN PESAN & LOADING STATE ---
        // Kirim pesan "berpikir" yang nanti bakal diedit
        const thinkingMessage = await message.reply('🧠 **Bentar bro, AI lagi mikir keras...** ⏳');

        let userHistory = conversationHistory.get(userId) || [];
        const systemPrompt = "Kamu adalah teman ngobrol di Discord yang asik, gaul, pakai bahasa tongkrongan (lo/gue). Jangan kaku, boleh pakai emoji, dan jawab singkat padat kecuali diminta panjang.";

        userHistory.push({ role: 'user', content: message.content });

        const messagesPayload = [
            { role: 'system', content: systemPrompt },
            ...userHistory
        ];

        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${CONFIG.cfAccountId}/ai/run/${CONFIG.cfModel}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CONFIG.cfApiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: messagesPayload,
                        max_tokens: 2048 
                    })
                }
            );

            const result = await response.json();

            if (!result.success) {
                console.error('Cloudflare Error:', result.errors);
                userHistory.pop(); 
                conversationHistory.set(userId, userHistory);
                // Edit pesan loading jadi pesan error
                return thinkingMessage.edit('❌ Otak AI lagi nge-lag bro. Coba bentar lagi.');
            }

            // --- SISTEM BACA RESPONSE SUPER AMAN ---
            let aiReply = '';

            if (result?.result?.response) {
                aiReply = result.result.response;
            } 
            else if (result?.result?.choices && result.result.choices.length > 0) {
                const choice = result.result.choices[0];
                const msg = choice?.message || {};
                
                const content = msg.content || '';
                const reasoning = msg.reasoning_content || '';
                const text = choice.text || '';

                aiReply = content || reasoning || text || '';
            }

            if (typeof aiReply === 'string') {
                aiReply = aiReply.trim();
            }

            if (!aiReply) {
                console.error('API Response Kosong/Aneh:\n', JSON.stringify(result, null, 2));
                userHistory.pop(); 
                conversationHistory.set(userId, userHistory);
                // Edit pesan loading jadi pesan error
                return thinkingMessage.edit('❌ Waduh, AI kayaknya lagi nge-blank nih bro. Coba ketik hal lain.');
            }

            // --- UPDATE MEMORY & DATABASE ---
            userHistory.push({ role: 'assistant', content: aiReply });

            if (userHistory.length > 10) {
                userHistory = userHistory.slice(userHistory.length - 10);
            }
            conversationHistory.set(userId, userHistory);

            if (!isAdmin) {
                db.users[userId] = userUsage + 1;
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            }

            // --- LOGIKA KIRIM PESAN (EDIT PESAN LOADING) ---
            if (aiReply.length > 1900) {
                const buffer = Buffer.from(aiReply, 'utf-8');
                const txtFile = new AttachmentBuilder(buffer, { name: 'jawaban-ai.txt' });

                // Edit pesan dengan teks + file txt
                await thinkingMessage.edit({ 
                    content: '📝 **Jawabannya kepanjangan bro!**\nNih gua kirim lewat file txt aja ya, baca sendiri di dalem.', 
                    files: [txtFile] 
                });
            } else {
                // Edit pesan loading jadi jawaban asli
                await thinkingMessage.edit(aiReply);
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            userHistory.pop(); 
            conversationHistory.set(userId, userHistory);
            
            // Edit pesan loading jadi pesan error
            thinkingMessage.edit('❌ Gagal nyambung ke server AI bro. Koneksi lagi bapuk.');
        }
    },
};


