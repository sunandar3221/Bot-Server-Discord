const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Main Tic Tac Toe (XOXO) lawan teman')
        .addUserOption(option => 
            option.setName('lawan')
            .setDescription('Pilih lawan main')
            .setRequired(true)),
    
    async execute(interaction) {
        try {
            const p1 = interaction.user;
            const p2 = interaction.options.getUser('lawan');

            // Validasi lawan
            if (p1.id === p2.id) {
                return interaction.reply({ content: 'Gak bisa main lawan diri sendiri, cari teman dong! 🗿', ephemeral: true });
            }
            if (p2.bot) {
                return interaction.reply({ content: 'Bot gak bisa diajak main TicTacToe (mereka terlalu jago).', ephemeral: true });
            }

            // Board kosong (0-8)
            // Kita pakai null untuk kosong
            let board = Array(9).fill(null);
            let turn = p1; // P1 jalan duluan (X)
            let gameOver = false;

            // Fungsi membuat tampilan tombol
            const makeGrid = () => {
                const rows = [];
                for (let i = 0; i < 3; i++) {
                    const row = new ActionRowBuilder();
                    for (let j = 0; j < 3; j++) {
                        const index = i * 3 + j;
                        
                        // Tentukan style tombol
                        let style = ButtonStyle.Secondary;
                        let label = '\u200b'; // Karakter kosong valid (Zero Width Space)
                        
                        if (board[index] === 'X') {
                            style = ButtonStyle.Danger;
                            label = 'X';
                        } else if (board[index] === 'O') {
                            style = ButtonStyle.Primary;
                            label = 'O';
                        }

                        const btn = new ButtonBuilder()
                            .setCustomId(`ttt_${index}`)
                            .setStyle(style)
                            .setLabel(label)
                            .setDisabled(board[index] !== null || gameOver);
                        
                        row.addComponents(btn);
                    }
                    rows.push(row);
                }
                return rows;
            };

            // Logika cek kemenangan
            const checkWin = (b) => {
                const wins = [
                    [0,1,2], [3,4,5], [6,7,8], // Horizontal
                    [0,3,6], [1,4,7], [2,5,8], // Vertikal
                    [0,4,8], [2,4,6]           // Diagonal
                ];
                for (let c of wins) {
                    if (b[c[0]] && b[c[0]] === b[c[1]] && b[c[0]] === b[c[2]]) {
                        return b[c[0]];
                    }
                }
                return null;
            };

            // Kirim pesan awal
            const msg = await interaction.reply({
                content: `❌ **${p1.username}** vs ⭕ **${p2.username}**\nGiliran: **${turn.username}** (Pilih kotak!)`,
                components: makeGrid(),
                fetchReply: true
            });

            // Collector untuk menangkap klik tombol
            const collector = msg.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 60000 // 60 Detik timeout jika AFK
            });

            collector.on('collect', async i => {
                try {
                    // Cek giliran
                    if (i.user.id !== turn.id) {
                        // Jika yang klik bukan pemain yang sedang giliran
                        if (i.user.id !== p1.id && i.user.id !== p2.id) {
                            return i.reply({ content: 'Kamu penonton, jangan ikut campur! 😤', ephemeral: true });
                        }
                        return i.reply({ content: `Sabar bro, ini giliran **${turn.username}**!`, ephemeral: true });
                    }

                    // Update Board
                    const index = parseInt(i.customId.split('_')[1]);
                    board[index] = turn.id === p1.id ? 'X' : 'O';

                    // Cek Menang/Seri
                    const winner = checkWin(board);
                    const draw = board.every(x => x !== null);

                    if (winner || draw) {
                        gameOver = true;
                        
                        let text = '';
                        if (winner) {
                            text = `👑 **GAME OVER!**\nPemenangnya adalah **${winner === 'X' ? p1.username : p2.username}**! 🎉`;
                        } else {
                            text = '🤝 **SERI!**\nTidak ada yang menang, sama kuat.';
                        }

                        // Update pesan terakhir dan matikan tombol
                        await i.update({ content: text, components: makeGrid() });
                        collector.stop('finished');
                    } else {
                        // Ganti giliran
                        turn = turn.id === p1.id ? p2 : p1;
                        await i.update({ 
                            content: `❌ **${p1.username}** vs ⭕ **${p2.username}**\nGiliran: **${turn.username}**`, 
                            components: makeGrid() 
                        });
                    }
                } catch (err) {
                    console.error('Error saat handling tombol TTT:', err);
                    if (!i.replied) i.reply({ content: 'Terjadi kesalahan saat memproses langkah.', ephemeral: true });
                }
            });

            collector.on('end', (_, reason) => {
                if (reason !== 'finished') {
                    // Jika berakhir karena waktu habis
                    interaction.editReply({ 
                        content: '⏰ **Waktu Habis!** Game dibatalkan karena kelamaan mikir.', 
                        components: [] 
                    }).catch(e => console.log('Gagal edit reply timeout:', e));
                }
            });

        } catch (error) {
            console.error('Error command tictactoe:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Ada error saat memulai game!', ephemeral: true });
            }
        }
    }
};


