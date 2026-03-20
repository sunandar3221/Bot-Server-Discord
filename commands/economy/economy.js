const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- DATABASE SETUP ---
const dbPath = path.join(__dirname, '../../economy.json');

const loadDb = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
        return {};
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
};

const saveDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const getUserData = (db, userId) => {
    if (!db[userId]) {
        db[userId] = { wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, inventory: [] };
    }
    return db[userId];
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eco')
        .setDescription('Sistem Ekonomi Utama')
        .addSubcommand(sub => sub.setName('balance').setDescription('Cek saldo dompet dan bank')
            .addUserOption(opt => opt.setName('user').setDescription('Cek saldo orang lain')))
        .addSubcommand(sub => sub.setName('daily').setDescription('Ambil gaji harian (24 jam sekali)'))
        .addSubcommand(sub => sub.setName('work').setDescription('Bekerja untuk dapat uang (1 jam sekali)'))
        .addSubcommand(sub => sub.setName('deposit').setDescription('Simpan uang ke bank')
            .addIntegerOption(opt => opt.setName('jumlah').setDescription('Jumlah uang').setRequired(true)))
        .addSubcommand(sub => sub.setName('withdraw').setDescription('Tarik uang dari bank')
            .addIntegerOption(opt => opt.setName('jumlah').setDescription('Jumlah uang').setRequired(true)))
        .addSubcommand(sub => sub.setName('transfer').setDescription('Kirim uang ke teman')
            .addUserOption(opt => opt.setName('tujuan').setDescription('Kirim ke siapa?').setRequired(true))
            .addIntegerOption(opt => opt.setName('jumlah').setDescription('Jumlah uang').setRequired(true)))
        .addSubcommand(sub => sub.setName('leaderboard').setDescription('Lihat orang terkaya di server')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const db = loadDb();
        const userId = interaction.user.id;
        const user = getUserData(db, userId); // Pastikan user ada di db

        // --- 1. BALANCE (CEK SALDO) ---
        if (sub === 'balance') {
            const target = interaction.options.getUser('user') || interaction.user;
            const targetData = getUserData(db, target.id);
            const total = targetData.wallet + targetData.bank;

            const embed = new EmbedBuilder()
                .setTitle(`💳 Keuangan: ${target.username}`)
                .setColor('Green')
                .addFields(
                    { name: '💵 Dompet', value: `Rp ${targetData.wallet.toLocaleString()}`, inline: true },
                    { name: '🏦 Bank', value: `Rp ${targetData.bank.toLocaleString()}`, inline: true },
                    { name: '💰 Total Kekayaan', value: `Rp ${total.toLocaleString()}` }
                );
            return interaction.reply({ embeds: [embed] });
        }

        // --- 2. DAILY (HARIAN) ---
        if (sub === 'daily') {
            const cooldown = 86400000; // 24 Jam
            const now = Date.now();

            if (now - user.lastDaily < cooldown) {
                const sisa = Math.ceil((user.lastDaily + cooldown - now) / 3600000);
                return interaction.reply({ content: `⏳ Kamu sudah ambil daily hari ini! Kembali lagi dalam **${sisa} jam**.`, ephemeral: true });
            }

            const reward = 5000; // Hadiah daily
            user.wallet += reward;
            user.lastDaily = now;
            saveDb(db);

            return interaction.reply(`📆 **Daily Reward!**\nKamu mendapatkan **Rp ${reward.toLocaleString()}** hari ini.`);
        }

        // --- 3. WORK (KERJA) ---
        if (sub === 'work') {
            const cooldown = 3600000; // 1 Jam
            const now = Date.now();

            if (now - user.lastWork < cooldown) {
                const sisa = Math.ceil((user.lastWork + cooldown - now) / 60000);
                return interaction.reply({ content: `⏳ Istirahat dulu bro! Bisa kerja lagi dalam **${sisa} menit**.`, ephemeral: true });
            }

            const jobs = [
                { text: 'Membantu nenek menyeberang jalan', min: 500, max: 1500 },
                { text: 'Menjadi kuli jawa di proyek', min: 2000, max: 5000 },
                { text: 'Menjual gorengan', min: 1000, max: 3000 },
                { text: 'Coding bot discord', min: 3000, max: 7000 },
                { text: 'Menemukan dompet dijalan', min: 500, max: 1000 }
            ];

            const job = jobs[Math.floor(Math.random() * jobs.length)];
            const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

            user.wallet += salary;
            user.lastWork = now;
            saveDb(db);

            return interaction.reply(`🔨 **Kerja Keras!**\n${job.text} dan dibayar **Rp ${salary.toLocaleString()}**.`);
        }

        // --- 4. DEPOSIT (NABUNG) ---
        if (sub === 'deposit') {
            const amount = interaction.options.getInteger('jumlah');
            if (amount <= 0) return interaction.reply({ content: 'Jumlah harus positif!', ephemeral: true });
            if (user.wallet < amount) return interaction.reply({ content: 'Uang di dompet kurang!', ephemeral: true });

            user.wallet -= amount;
            user.bank += amount;
            saveDb(db);

            return interaction.reply(`🏦 Berhasil deposit **Rp ${amount.toLocaleString()}** ke bank.`);
        }

        // --- 5. WITHDRAW (TARIK TUNAI) ---
        if (sub === 'withdraw') {
            const amount = interaction.options.getInteger('jumlah');
            if (amount <= 0) return interaction.reply({ content: 'Jumlah harus positif!', ephemeral: true });
            if (user.bank < amount) return interaction.reply({ content: 'Saldo bank kurang!', ephemeral: true });

            user.bank -= amount;
            user.wallet += amount;
            saveDb(db);

            return interaction.reply(`🏧 Berhasil menarik **Rp ${amount.toLocaleString()}** dari bank.`);
        }

        // --- 6. TRANSFER ---
        if (sub === 'transfer') {
            const target = interaction.options.getUser('tujuan');
            const amount = interaction.options.getInteger('jumlah');
            const targetData = getUserData(db, target.id);

            if (target.id === userId) return interaction.reply({ content: 'Gak bisa transfer ke diri sendiri.', ephemeral: true });
            if (target.bot) return interaction.reply({ content: 'Bot tidak butuh uang.', ephemeral: true });
            if (amount <= 0) return interaction.reply({ content: 'Minimal transfer Rp 1.', ephemeral: true });
            if (user.wallet < amount) return interaction.reply({ content: 'Uang di dompet kurang!', ephemeral: true });

            user.wallet -= amount;
            targetData.wallet += amount;
            saveDb(db);

            return interaction.reply(`💸 Berhasil transfer **Rp ${amount.toLocaleString()}** ke **${target.username}**.`);
        }

        // --- 7. LEADERBOARD ---
        if (sub === 'leaderboard') {
            const sortedUsers = Object.keys(db)
                .map(id => ({ id, total: db[id].wallet + db[id].bank }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10); // Top 10

            const lbString = await Promise.all(sortedUsers.map(async (u, index) => {
                let username = u.id;
                try {
                    const fetchedUser = await interaction.client.users.fetch(u.id);
                    username = fetchedUser.username;
                } catch (e) {}
                
                let medal = '';
                if (index === 0) medal = '🥇';
                else if (index === 1) medal = '🥈';
                else if (index === 2) medal = '🥉';
                else medal = `#${index + 1}`;

                return `${medal} **${username}** — Rp ${u.total.toLocaleString()}`;
            }));

            const embed = new EmbedBuilder()
                .setTitle('🏆 Top Global Sultan')
                .setDescription(lbString.join('\n') || 'Belum ada data.')
                .setColor('Gold');

            return interaction.reply({ embeds: [embed] });
        }
    }
};

