const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');

// Fungsi buat ngacak peluru (Fix Array)
function spinCylinder(capacity = 6) {
    // FIX 1: Array-nya tadi kosong, sekarang diisi kemungkinan jumlah peluru (1 sampai 4)
    const possibleRealBullets = [1, 2, 3, 4, 5, 6];
    const bulletCount = possibleRealBullets[Math.floor(Math.random() * possibleRealBullets.length)];
    const blankCount = capacity - bulletCount;
    let cylinder = Array(capacity).fill(false);
    
    for (let i = 0; i < bulletCount; i++) cylinder[i] = true;
    
    // Shuffle
    for (let i = cylinder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cylinder[i], cylinder[j]] = [cylinder[j], cylinder[i]];
    }
    return { cylinder, bulletCount, blankCount };
}

// AI buat milih target
function botLogic(bot, players, cylinder, difficulty) {
    const aliveEnemies = players.filter(p => p.id !== bot.id && p.health > 0);
    const bulletsLeft = cylinder.filter(c => c === true).length;
    const blanksLeft = cylinder.length - bulletsLeft;
    
    let target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

    if (difficulty === 'easy') {
        if (Math.random() < 0.5) target = bot;
    } else if (difficulty === 'normal') {
        if (Math.random() < 0.2) target = bot;
    } else if (difficulty === 'hard') {
        if (blanksLeft > bulletsLeft) {
            target = bot;
        } else {
            target = aliveEnemies.reduce((prev, current) => (prev.health > current.health) ? prev : current);
        }
    }
    return target;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi pembuat UI Embed In-Game (Semua Emoji pakai Unicode)
function createGameEmbed(players, gameInfo) {
    const playerStatus = players.map(p => {
        const icon = p.health > 0 ? (p.isBot ? '\uD83E\uDD16' : '\uD83D\uDC64') : '\uD83D\uDC80';
        const isDeadText = p.health <= 0 ? '**(TEWAS)**' : '';
        return `${icon} **${p.name}** | HP: ${p.health}/100 ${isDeadText}`;
    }).join('\n');

    const embed = new EmbedBuilder()
        .setTitle('\uD83D\uDD2B TONGKRONGAN ROULETTE')
        .setColor(gameInfo.currentColor || '#2b2d31')
        .setDescription(`**Monitor Kejadian:**\n> ${gameInfo.actionLog}`)
        .addFields(
            { name: '\uD83D\uDC65 Status Pemain', value: playerStatus, inline: false },
            { 
                name: '\uD83D\uDEE0\uFE0F Info Silinder Pistol', 
                value: `Jumlah peluru yang ada isinya: **${gameInfo.currentReal}**\nJumlah peluru yang kosong: **${gameInfo.currentBlank}**\nPerbandingan Awal: **${gameInfo.initialReal} Asli / ${gameInfo.initialBlank} Kosong**`, 
                inline: false 
            }
        )
        .setFooter({ text: 'Pantengin monitor ini terus bro, gilirannya gantian!' });

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Main Russian Roulette gaya tongkrongan.')
        .addSubcommand(subcommand =>
            subcommand.setName('lobby').setDescription('Buka tongkrongan buat main game ini.')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('help').setDescription('Cek aturan mainnya di mari.')
        ),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'help') {
                const helpEmbed = new EmbedBuilder()
                    .setTitle('\uD83D\uDD2B Aturan Main Roulette Tongkrongan')
                    .setColor('#ff0000')
                    .setDescription(`
Yo bro! Di sini lu **harus bunuh** temen lu buat menang!
**\uD83D\uDD25 RULES:**
1. Maksimal 6 player. Darah awal: **100**, Damage: **30**.
2. Bandar ngacak peluru di awal. Semua aksi ditampilin di satu layar monitor aja.
3. Lu milih: **Nembak Kawan** (buat ngebunuh) atau **Nembak Diri Sendiri** (kalau yakin peluru kosong buat skip giliran).
4. Sisa 1 orang yang idup, dia juaranya!
                    `);
                return interaction.reply({ embeds: [helpEmbed] });
            }

            if (subcommand === 'lobby') {
                let players = [{ id: interaction.user.id, name: interaction.user.username, isBot: false, health: 100 }];
                let botCount = 0;
                let gameStarted = false;

                const updateLobbyEmbed = () => {
                    const playerList = players.map((p, i) => `${i + 1}. ${p.name} ${p.isBot ? '\uD83E\uDD16' : '\uD83D\uDC64'} (HP: 100)`).join('\n');
                    return new EmbedBuilder()
                        .setTitle('\uD83D\uDEAC Lobby Roulette Dibuka!')
                        .setColor('#2b2d31')
                        .setDescription(`Woy yang mau ikutan, buruan join! Maksimal 6 orang ya.\n\n**Player Masuk (${players.length}/6):**\n${playerList}`);
                };

                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('join').setLabel('Join Tongkrongan').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('start').setLabel('Gass Mulai!').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('cancel').setLabel('Batalin').setStyle(ButtonStyle.Secondary)
                );

                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('bot_easy').setLabel('+ Bot Cupu').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('bot_normal').setLabel('+ Bot Biasa').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('bot_hard').setLabel('+ Bot Jago').setStyle(ButtonStyle.Primary)
                );

                const response = await interaction.reply({ embeds: [updateLobbyEmbed()], components: [row1, row2], fetchReply: true });
                const lobbyCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                lobbyCollector.on('collect', async (i) => {
                    try {
                        if (i.customId === 'cancel') {
                            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Lu bukan host!', ephemeral: true });
                            await i.update({ content: 'Lobby dibubarin.', embeds: [], components: [] });
                            lobbyCollector.stop('cancelled');
                            return;
                        }

                        if (i.customId === 'start') {
                            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Cuma host yang bisa start!', ephemeral: true });
                            if (players.length < 2) return i.reply({ content: 'Minimal 2 orang bro!', ephemeral: true });
                            
                            gameStarted = true;
                            await i.update({ components: [] }); 
                            lobbyCollector.stop('started');
                            return; 
                        }

                        if (players.length >= 6) return i.reply({ content: 'Lobby penuh!', ephemeral: true });

                        if (i.customId === 'join') {
                            if (players.some(p => p.id === i.user.id)) return i.reply({ content: 'Lu udah masuk!', ephemeral: true });
                            players.push({ id: i.user.id, name: i.user.username, isBot: false, health: 100 });
                        } else if (i.customId.startsWith('bot_')) {
                            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Cuma host yang nambah bot!', ephemeral: true });
                            const difficultyStr = String(i.customId).replace('bot_', ''); 
                            botCount++;
                            players.push({ id: `bot_${botCount}`, name: `Bot ${difficultyStr.toUpperCase()} ${botCount}`, isBot: true, difficulty: difficultyStr, health: 100 });
                        }

                        await i.update({ embeds: [updateLobbyEmbed()], components: [row1, row2] });
                    } catch (err) {}
                });

                lobbyCollector.on('end', async (_, reason) => {
                    if (reason === 'time') await interaction.editReply({ content: 'Kelamaan, bubar.', embeds: [], components: [] }).catch(()=>{});
                    if (gameStarted) await startGame(interaction, players);
                });
            }
        } catch (error) {
            console.error(error);
        }
    },
};

// ==========================================
// LOGIC UTAMA GAME (ONE EMBED SYSTEM)
// ==========================================
async function startGame(interaction, players) {
    try {
        let { cylinder, bulletCount, blankCount } = spinCylinder();
        let turnIndex = 0;
        
        let gameInfo = {
            initialReal: bulletCount,
            initialBlank: blankCount,
            currentReal: bulletCount,
            currentBlank: blankCount,
            actionLog: "\uD83D\uDD25 **GAME DIMULAI!** \uD83D\uDD25\nBandar udah ngisi pistol dan muter silindernya. Siap-siap dapet giliran...",
            currentColor: '#3498db'
        };

        let gameMsg = await interaction.fetchReply();
        await gameMsg.edit({ content: null, embeds: [createGameEmbed(players, gameInfo)], components: [] });
        
        await sleep(3500);

        while (players.filter(p => p.health > 0).length > 1) {
            let currentPlayer = players[turnIndex];
            
            if (currentPlayer.health <= 0) {
                turnIndex = (turnIndex + 1) % players.length;
                continue;
            }

            // Kalau silinder kosong, reload
            if (cylinder.length === 0) {
                const reloaded = spinCylinder();
                cylinder = reloaded.cylinder;
                
                gameInfo.initialReal = reloaded.bulletCount;
                gameInfo.initialBlank = reloaded.blankCount;
                gameInfo.currentReal = reloaded.bulletCount;
                gameInfo.currentBlank = reloaded.blankCount;
                gameInfo.currentColor = '#9b59b6';
                gameInfo.actionLog = `\uD83D\uDD04 **KLIK!** Pistolnya kosong cuy!\nBandar ngisi ulang peluru dan ngacak silinder lagi!`;
                
                await gameMsg.edit({ embeds: [createGameEmbed(players, gameInfo)], components: [] });
                await sleep(3500);
            }

            const alivePlayers = players.filter(p => p.health > 0);
            if (alivePlayers.length === 1) break;

            if (currentPlayer.isBot) {
                gameInfo.currentColor = '#e67e22';
                gameInfo.actionLog = `\uD83E\uDD16 Giliran **${currentPlayer.name}** lagi mikir mau nembak siapa...`;
                await gameMsg.edit({ embeds: [createGameEmbed(players, gameInfo)], components: [] });
                await sleep(2500);

                const target = botLogic(currentPlayer, alivePlayers, cylinder, currentPlayer.difficulty);
                await processShotFlow(gameMsg, currentPlayer, target, cylinder, players, gameInfo);
                
            } else {
                gameInfo.currentColor = '#2ecc71';
                gameInfo.actionLog = `\uD83D\uDC49 Woy <@${currentPlayer.id}>, giliran lu pegang pistol!\nPilih target lu di menu bawah bro.`;

                const options = alivePlayers.map(p => ({
                    label: p.id === currentPlayer.id ? `Nembak Diri Sendiri (${p.name})` : `Tembak ${p.name}`,
                    description: p.id === currentPlayer.id ? 'Nyekip giliran' : `HP Target: ${p.health}`,
                    value: String(p.id)
                }));

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('shoot_target')
                    .setPlaceholder('Pilih siapa yang mau lu dor!')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await gameMsg.edit({ embeds: [createGameEmbed(players, gameInfo)], components: [row] });

                let userInteraction = null;
                try {
                    const filter = i => i.customId === 'shoot_target' && i.user.id === currentPlayer.id;
                    userInteraction = await gameMsg.awaitMessageComponent({ filter, time: 30000 });
                } catch (err) {
                    userInteraction = null;
                }

                if (!userInteraction) {
                    gameInfo.currentColor = '#7f8c8d';
                    gameInfo.actionLog = `\uD83E\uDD2C <@${currentPlayer.id}> kelamaan mikir! Pistolnya disita dan giliran dilewatin.`;
                    await gameMsg.edit({ embeds: [createGameEmbed(players, gameInfo)], components: [] }).catch(()=>{});
                    await sleep(3000);
                    turnIndex = (turnIndex + 1) % players.length;
                    continue; 
                }

                try {
                    // FIX 2: Select Menu ngereturn array, jadi ambil index
                    const targetId = userInteraction.values[0];
                    const targetPlayer = players.find(p => String(p.id) === targetId);

                    await userInteraction.deferUpdate().catch(() => {}); 
                    await processShotFlow(gameMsg, currentPlayer, targetPlayer, cylinder, players, gameInfo);
                } catch (error) {
                    console.error(error);
                }
            }

            turnIndex = (turnIndex + 1) % players.length;
            await sleep(1500);
        }

        const winner = players.find(p => p.health > 0);
        
        gameInfo.currentColor = '#f1c40f';
        gameInfo.actionLog = `\uD83C\uDFC6 **TONGKRONGAN CLEAR!** \uD83C\uDFC6\nGila lu bro, pertumpahan darah selesai. \n**${winner.name}** menang dan sisa sendirian yang idup!`;
        
        await gameMsg.edit({ embeds: [createGameEmbed(players, gameInfo)], components: [] });

    } catch (error) {
        console.error(error);
    }
}

async function processShotFlow(gameMsg, shooter, target, cylinder, players, gameInfo) {
    const isSelf = shooter.id === target.id;
    
    gameInfo.currentColor = '#e74c3c'; 
    if (isSelf) {
        gameInfo.actionLog = `\uD83D\uDE30 **${shooter.name}** nekat ngarahin pistol ke kepalanya sendiri...`;
    } else {
        gameInfo.actionLog = `\uD83C\uDFAF Wah gelo! **${shooter.name}** ngunci target ke **${target.name}**...`;
    }
    await gameMsg.edit({ embeds: [createGameEmbed(players, gameInfo)], components: [] }).catch(()=>{});
    await sleep(3000); 

    const bullet = cylinder.shift(); 

    if (bullet === true) {
        gameInfo.currentReal -= 1; 
        target.health -= 30;
        if (target.health < 0) target.health = 0;

        let resultLog = isSelf 
            ? `\uD83D\uDCA5 **DOOOORRRR!!!**\nGoblok! Ternyata isinya peluru beneran wkwk! **${shooter.name}** kena tembak sendiri! (-30 HP)` 
            : `\uD83D\uDCA5 **DOOOORRRR!!!**\nMampus lu! **${target.name}** kena tembak telak! (-30 HP)`;

        if (target.health <= 0) {
            resultLog += `\n\uD83D\uDC80 Innalillahi... **${target.name}** udah tewas berlumuran darah.`;
        }
        
        gameInfo.actionLog = resultLog;

    } else {
        gameInfo.currentBlank -= 1; 
        gameInfo.currentColor = '#2ecc71'; 
        
        if (isSelf) {
            gameInfo.actionLog = `\uD83D\uDCA8 *Cetik!*\nHoki lu bro! Pelurunya kosong, **${shooter.name}** berhasil nyekip giliran dengan aman!`;
        } else {
            gameInfo.actionLog = `\uD83D\uDCA8 *Cetik!*\nPeluru kosong bro! **${target.name}** dikasih nafas lega sama tuhan, hoki parah!`;
        }
    }

    await gameMsg.edit({ embeds: [createGameEmbed(players, gameInfo)], components: [] }).catch(()=>{});
    await sleep(4000); 
}
// FIX 3: Ngapus kurung kurawal sisa di bawah yang bikin error syntax

