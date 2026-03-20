const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../economy.json');
const loadDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('judi')
        .setDescription('Game judi (Resiko Tanggung Sendiri)')
        .addSubcommand(sub => sub.setName('coinflip')
            .setDescription('Taruhan tebak koin (Menang = 2x Lipat)')
            .addStringOption(opt => opt.setName('tebakan').setDescription('Pilih sisi').setRequired(true).addChoices({name:'Angka', value:'Angka'}, {name:'Gambar', value:'Gambar'}))
            .addIntegerOption(opt => opt.setName('taruhan').setDescription('Jumlah uang').setRequired(true)))
        .addSubcommand(sub => sub.setName('slots')
            .setDescription('Mesin Slot (Jackpot = 5x Lipat)')
            .addIntegerOption(opt => opt.setName('taruhan').setDescription('Jumlah uang').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const bet = interaction.options.getInteger('taruhan');
        const db = loadDb();
        const userId = interaction.user.id;

        // Validasi User
        if (!db[userId]) db[userId] = { wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, inventory: [] };
        const user = db[userId];

        if (bet <= 0) return interaction.reply({ content: 'Taruhan harus lebih dari 0!', ephemeral: true });
        if (user.wallet < bet) return interaction.reply({ content: `Uang kamu kurang! Dompetmu cuma ada Rp ${user.wallet.toLocaleString()}`, ephemeral: true });

        // --- COINFLIP ---
        if (sub === 'coinflip') {
            const choice = interaction.options.getString('tebakan');
            const result = Math.random() > 0.5 ? 'Angka' : 'Gambar';

            if (choice === result) {
                const winAmount = bet; // Dapat profit seharga bet (Total balik 2x)
                user.wallet += winAmount;
                saveDb(db);
                return interaction.reply(`🪙 **MENANG!**\nKoin menunjukkan **${result}**.\nKamu untung **Rp ${winAmount.toLocaleString()}**!`);
            } else {
                user.wallet -= bet;
                saveDb(db);
                return interaction.reply(`🪙 **KALAH!**\nKoin menunjukkan **${result}**.\nUang **Rp ${bet.toLocaleString()}** melayang.`);
            }
        }

        // --- SLOTS ---
        if (sub === 'slots') {
            // Potong uang dulu
            user.wallet -= bet;
            
            const emojis = ['🍇', '🍊', '🍒', '7️⃣', '💎'];
            const r1 = emojis[Math.floor(Math.random() * emojis.length)];
            const r2 = emojis[Math.floor(Math.random() * emojis.length)];
            const r3 = emojis[Math.floor(Math.random() * emojis.length)];

            const resultEmbed = new EmbedBuilder()
                .setTitle('🎰 SLOT MACHINE')
                .setDescription(`> **[ ${r1} | ${r2} | ${r3} ]**`)
                .setColor('Red');

            // Logika Menang
            if (r1 === r2 && r2 === r3) {
                const winAmount = bet * 5; // Jackpot 5x
                user.wallet += winAmount + bet; // Balikin modal + menang
                saveDb(db);
                resultEmbed.setColor('Gold').addFields({ name: 'JACKPOT!!!', value: `Kamu menang **Rp ${(winAmount + bet).toLocaleString()}**!` });
            } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                const winAmount = Math.floor(bet * 1.5); // Menang kecil 1.5x
                user.wallet += winAmount + bet;
                saveDb(db);
                resultEmbed.setColor('Yellow').addFields({ name: 'Lumayan!', value: `Dua sama! Kamu dapat **Rp ${(winAmount + bet).toLocaleString()}**.` });
            } else {
                saveDb(db); // Uang hangus (sudah dipotong di awal)
                resultEmbed.addFields({ name: 'Rungkad!', value: `Kamu kehilangan **Rp ${bet.toLocaleString()}**.` });
            }

            return interaction.reply({ embeds: [resultEmbed] });
        }
    }
};

