const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minesweeper')
        .setDescription('Minesweeper Anti-Error (Fixed Label)'),

    async execute(interaction) {
        // --- KONFIGURASI ---
        const rows = 5;
        const cols = 5;
        const totalBombs = 5;

        // --- STATE GAME ---
        let grid = [];
        let gameStarted = false; 
        let gameOver = false;

        // 1. Buat Grid Kosong
        for (let r = 0; r < rows; r++) {
            const rowData = [];
            for (let c = 0; c < cols; c++) {
                // Tiap kotak menyimpan koordinat dan statusnya
                rowData.push({ r, c, isBomb: false, revealed: false, count: 0 });
            }
            grid.push(rowData);
        }

        // --- FUNGSI-FUNGSI LOGIKA ---

        // Mengambil kotak-kotak di sekitar (Tetangga)
        const getNeighbors = (r, c) => {
            const neighbors = [];
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue; // Jangan ambil diri sendiri
                    const nr = r + i, nc = c + j;
                    // Pastikan koordinat valid (gak keluar batas 5x5)
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        neighbors.push(grid[nr][nc]);
                    }
                }
            }
            return neighbors;
        };

        // Taruh Bom (Dipanggil setelah klik pertama biar gak sial)
        const placeBombs = (safeR, safeC) => {
            let placed = 0;
            // Loop sampai 5 bom terpasang
            while (placed < totalBombs) {
                const r = Math.floor(Math.random() * rows);
                const c = Math.floor(Math.random() * cols);
                
                // Area Aman: Kotak yang diklik + sekelilingnya (3x3 area)
                // Biar pas mulai langsung kebuka agak banyak
                const isSafeZone = Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1;

                if (!grid[r][c].isBomb && !isSafeZone) {
                    grid[r][c].isBomb = true;
                    placed++;
                }
            }

            // Hitung angka petunjuk (Hint)
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (grid[r][c].isBomb) continue;
                    const neighbors = getNeighbors(r, c);
                    // Hitung berapa tetangga yang punya bom
                    const bombCount = neighbors.filter(n => n.isBomb).length;
                    grid[r][c].count = bombCount;
                }
            }
        };

        // Buka kotak (Rekursif / Flood Fill)
        const revealCell = (r, c) => {
            const cell = grid[r][c];
            if (cell.revealed) return; // Kalau udah kebuka, skip

            cell.revealed = true;

            // Kalau kotaknya kosong (0), buka tetangganya otomatis
            if (cell.count === 0 && !cell.isBomb) {
                const neighbors = getNeighbors(r, c);
                neighbors.forEach(n => {
                    if (!n.revealed && !n.isBomb) {
                        revealCell(n.r, n.c);
                    }
                });
            }
        };

        // --- RENDER TAMPILAN (UI) ---
        const renderBoard = (revealAll = false) => {
            const components = [];
            for (let r = 0; r < rows; r++) {
                const row = new ActionRowBuilder();
                for (let c = 0; c < cols; c++) {
                    const cell = grid[r][c];
                    const btn = new ButtonBuilder().setCustomId(`ms_${r}_${c}`);

                    // LOGIKA LABEL TOMBOL
                    // Masalah sebelumnya: Label spasi ' ' bikin error.
                    // Solusi: Pakai '\u200b' (Zero Width Space) atau Emoji.

                    if (revealAll) {
                        // KONDISI: Game Berakhir (Tampilkan Semua)
                        if (cell.isBomb) {
                            btn.setStyle(ButtonStyle.Danger).setLabel('💣');
                        } else {
                            const labels = ['\u200b', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
                            btn.setStyle(ButtonStyle.Secondary)
                               .setLabel(labels[cell.count]) 
                               .setDisabled(true);
                        }
                        btn.setDisabled(true); // Matikan tombol
                    } else if (cell.revealed) {
                        // KONDISI: Kotak Terbuka
                        if (cell.isBomb) {
                            btn.setStyle(ButtonStyle.Danger).setLabel('💥');
                        } else {
                            btn.setStyle(ButtonStyle.Success); // Hijau = Aman
                            const labels = ['\u200b', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
                            // \u200b adalah karakter kosong ajaib yang valid
                            btn.setLabel(labels[cell.count]);
                        }
                        btn.setDisabled(true); 
                    } else {
                        // KONDISI: Masih Tertutup
                        btn.setStyle(ButtonStyle.Secondary).setLabel('⬛');
                    }
                    row.addComponents(btn);
                }
                components.push(row);
            }
            return components;
        };

        // --- MULAI GAME ---
        const msg = await interaction.reply({
            content: `💣 **MINESWEEPER**\nCari **${totalBombs}** bom! Klik di mana saja untuk mulai.`,
            components: renderBoard(),
            fetchReply: true
        });

        // --- EVENT LISTENER (COLLECTOR) ---
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 Menit
        });

        collector.on('collect', async i => {
            // Cek pemilik game
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Bikin game sendiri gih! 😤', ephemeral: true });
            }

            try {
                // Ambil koordinat dari ID tombol (ms_0_1)
                const parts = i.customId.split('_');
                const r = parseInt(parts[1]);
                const c = parseInt(parts[2]);

                // 1. KLIK PERTAMA (Generate Map)
                if (!gameStarted) {
                    placeBombs(r, c);
                    gameStarted = true;
                }

                const cell = grid[r][c];

                // 2. LOGIKA KLIK
                if (cell.isBomb) {
                    // --- KALAH ---
                    collector.stop('lose');
                    cell.revealed = true; // Buka bom yang diinjak
                    await i.update({
                        content: `💥 **DUAR!!** Kamu kalah bro!\nBom meledak di baris ${r+1} kolom ${c+1}.`,
                        components: renderBoard(true) // True = Buka semua
                    });
                } else {
                    // --- AMAN ---
                    revealCell(r, c);

                    // Cek Menang: Hitung sisa kotak aman yang belum dibuka
                    let safeClosed = 0;
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (!grid[r][c].isBomb && !grid[r][c].revealed) safeClosed++;
                        }
                    }

                    if (safeClosed === 0) {
                        // --- MENANG ---
                        collector.stop('win');
                        await i.update({
                            content: `🎉 **SELAMAT!** Semua area aman sudah bersih!`,
                            components: renderBoard(true)
                        });
                    } else {
                        // --- LANJUT ---
                        await i.update({
                            content: `💣 **Minesweeper** | Sisa kotak aman: **${safeClosed}**`,
                            components: renderBoard(false) // False = Jangan buka semua
                        });
                    }
                }
            } catch (err) {
                console.log("Error Minesweeper:", err);
                // Kalau error update, biarin aja biar bot gak mati
                if (!i.replied) i.reply({ content: 'Waduh error render, coba lagi!', ephemeral: true });
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                interaction.editReply({ 
                    content: '⏰ **Waktu Habis!** Game berakhir.', 
                    components: [] // Hapus tombol biar gak nyampah
                }).catch(() => {});
            }
        });
    }
};


