const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../economy.json');
const loadDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// Daftar Barang
const shopItems = [
    { id: 'kopi', name: 'Kopi Kapal Api', price: 5000, desc: 'Bikin melek saat coding' },
    { id: 'laptop', name: 'Laptop Gaming', price: 5000000, desc: 'Alat tempur programmer' },
    { id: 'mobil', name: 'Toyota Supra', price: 100000000, desc: 'Mobil idaman wibu' },
    { id: 'rumah', name: 'Rumah Mewah', price: 500000000, desc: 'Tempat tinggal sultan' },
    { id: 'cincin', name: 'Cincin Emas', price: 2000000, desc: 'Buat melamar dia' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toko')
        .setDescription('Menu Belanja')
        .addSubcommand(sub => sub.setName('list').setDescription('Lihat barang yang dijual'))
        .addSubcommand(sub => sub.setName('buy').setDescription('Beli barang')
            .addStringOption(opt => opt.setName('item').setDescription('ID Barang').setRequired(true)))
        .addSubcommand(sub => sub.setName('inventory').setDescription('Lihat tas kamu')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const db = loadDb();
        const userId = interaction.user.id;
        if (!db[userId]) db[userId] = { wallet: 0, bank: 0, inventory: [] };
        const user = db[userId];

        // --- LIST BARANG ---
        if (sub === 'list') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Warung Serba Ada')
                .setColor('Blue')
                .setDescription('Gunakan `/toko buy [id]` untuk membeli.');
            
            shopItems.forEach(item => {
                embed.addFields({ 
                    name: `${item.name} (ID: \`${item.id}\`)`, 
                    value: `Harga: Rp ${item.price.toLocaleString()}\n*${item.desc}*` 
                });
            });
            return interaction.reply({ embeds: [embed] });
        }

        // --- BUY (BELI) ---
        if (sub === 'buy') {
            const itemId = interaction.options.getString('item').toLowerCase();
            const item = shopItems.find(i => i.id === itemId);

            if (!item) return interaction.reply({ content: 'Barang tidak ditemukan! Cek `/toko list`.', ephemeral: true });
            if (user.wallet < item.price) return interaction.reply({ content: 'Uang tidak cukup bro!', ephemeral: true });

            user.wallet -= item.price;
            // Tambah ke inventory (simpan ID dan Nama)
            user.inventory.push({ id: item.id, name: item.name, date: new Date().toLocaleDateString() });
            saveDb(db);

            return interaction.reply(`✅ Berhasil membeli **${item.name}** seharga **Rp ${item.price.toLocaleString()}**.`);
        }

        // --- INVENTORY ---
        if (sub === 'inventory') {
            if (!user.inventory || user.inventory.length === 0) {
                return interaction.reply('Tas kamu kosong melompong.');
            }

            // Hitung jumlah item kembar
            const counts = {};
            user.inventory.forEach(x => { counts[x.name] = (counts[x.name] || 0) + 1; });

            const invList = Object.keys(counts).map(name => `• **${name}**: ${counts[name]}x`).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`🎒 Inventory: ${interaction.user.username}`)
                .setColor('Orange')
                .setDescription(invList);

            return interaction.reply({ embeds: [embed] });
        }
    }
};

