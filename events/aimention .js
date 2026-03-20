const { Events, PermissionsBitField } = require('discord.js');

// --- KONFIGURASI DI SINI ---
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_MODEL = '@cf/google/gemma-3-12b-it'; 

// --- DATABASE KUOTA (IN-MEMORY) ---
const userUsage = new Map(); 

const QUOTA = {
    REGULAR: 15,
    BOOSTER: 50
};

module.exports = {
    name: Events.MessageCreate,
    
    async execute(message) {
        // 1. FILTER DASAR
        if (message.author.bot) return; 
        if (!message.mentions.has(message.client.user)) return; 

        const client = message.client;

        // 2. CEK IZIN 
        const botPerms = message.channel.permissionsFor(client.user);
        if (!botPerms.has(PermissionsBitField.Flags.ReadMessageHistory) || 
            !botPerms.has(PermissionsBitField.Flags.SendMessages)) {
            return; 
        }

        // 3. CEK JATAH KUOTA
        const userId = message.author.id;
        const member = message.member; 
        const isAdmin = member?.permissions.has(PermissionsBitField.Flags.Administrator);
        
        if (!isAdmin) {
            const today = new Date().toISOString().split('T')[0]; 
            let userData = userUsage.get(userId);

            if (!userData || userData.date !== today) {
                userData = { count: 0, date: today };
                userUsage.set(userId, userData);
            }

            const isBooster = member?.premiumSinceTimestamp !== null;
            const limit = isBooster ? QUOTA.BOOSTER : QUOTA.REGULAR;

            if (userData.count >= limit) {
                return message.reply({
                    content: `✋ **Waduh, rem dulu bro!** 🛑\nJatah lu udah abis hari ini (${limit} kali). Besok lagi ya, atau boost dulu servernya biar gacor! 🚀`
                });
            }
        }

        // Indikator mikir (Typing...)
        await message.channel.sendTyping();

        try {
            // 4. AMBIL KONTEKS (TARGET YANG MAU DI-PROCESS)
            let contextText = "";
            let contextSource = "";

            // A. Kalo nge-Reply pesan orang
            if (message.reference && message.reference.messageId) {
                try {
                    const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
                    
                    if (!repliedMsg.content && repliedMsg.attachments.size > 0) {
                         return message.reply("Waduh, pesannya gambar doang bro, gue belom bisa liat gambar 🙈");
                    }
                    
                    contextText = repliedMsg.content;
                    contextSource = `Nanggepin chat-nya @${repliedMsg.author.username}`;
                } catch (err) {
                    return message.reply("Yah, pesannya udah diapus atau ga kebaca nih 👻");
                }
            } 
            // B. Kalo Mention biasa (Ambil history chat sebelumnya)
            else {
                const messages = await message.channel.messages.fetch({ limit: 5, before: message.id });
                const validMessages = messages.filter(m => !m.author.bot && m.content.trim().length > 0);
                const lastMessages = Array.from(validMessages.values()).slice(0, 2).reverse();

                if (lastMessages.length === 0) {
                    return message.reply("Sepi amat, ga ada chat yang bisa gue baca sebelumnya 🦗");
                }

                contextText = lastMessages.map(m => `${m.author.username}: "${m.content}"`).join('\n');
                contextSource = "Obrolan terakhir di sini";
            }

            if (!contextText.trim()) return message.reply("Kosong bro isinya 🫥");

            // 5. BERSIHKAN INPUT USER (Pisahkan Mention dari Perintah)
            // Contoh: "@Bot translate dong" -> "translate dong"
            let userInstruction = message.content.replace(/<@!?[0-9]+>/, '').trim();
            if (!userInstruction) userInstruction = "Lo respon aja chat ini dengan santai, kasih komentar lucu atau relate.";

            // 6. SETTING OTAK AI (GAYA TONGKRONGAN + EMOJI + NURUT PERINTAH)
            const systemPrompt = `
            Lo adalah bot Discord yang asik, temen tongkrongan, suka becanda, dan GAUL ABIS 😎.
            
            ATURAN MAIN:
            1. Gaya bahasa: Santai, pake "lo/gue", slang Indo (anjir, wkwk, gokil), JANGAN BAKU kayak robot 🤖.
            2. TUGAS UTAMA: Baca "KONTEKS CHAT", terus lakuin apa yang diminta di "PERINTAH USER".
            3. Kalo user minta TRANSLATE: Langsung translate aja hasilnya, gausah banyak bacot ngejelasin artinya apa (kecuali diminta) 🤐.
            4. Kalo user minta JELASIN: Baru lo jelasin panjang lebar.
            5. Kalo PERINTAH USER kosong/ga jelas: Lo nimbrung aja komenin chatnya layaknya temen yang lagi nongkrong ☕.
            `;

            const userPrompt = `
            KONTEKS CHAT (Ini yang harus lo perhatiin):
            """
            ${contextText}
            """

            PERINTAH USER (Ini yang harus lo lakuin ke chat di atas):
            "${userInstruction}"
            
            Respon lo (Inget, gaya tongkrongan):`;

            // 7. TEMBAK KE CLOUDFLARE
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${CF_API_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ]
                    })
                }
            );

            const result = await response.json();

            if (!result.success) {
                console.error("Cloudflare Error:", JSON.stringify(result.errors));
                throw new Error("AI-nya lagi pusing.");
            }

            const aiReply = result.result.response;

            // 8. KIRIM BALIK KE DISCORD
            await message.reply({
                content: `**Kata Gue:** (${contextSource})\n\n${aiReply}`,
                allowedMentions: { repliedUser: true }
            });

            // 9. POTONG PULSA/KUOTA
            if (!isAdmin) {
                const userData = userUsage.get(userId);
                userData.count++;
                userUsage.set(userId, userData);
            }

        } catch (error) {
            console.error(error);
            await message.reply("Sori bro, otak gue lagi error nih 🤯. Coba bentar lagi ya!");
        }
    }
};


