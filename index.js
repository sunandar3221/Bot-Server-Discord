const fs = require('node:fs');
const path = require('node:path');
const startOAuthServer = require('./server.js');
// [FIX 1] Tambah 'Partials' di sini
const { Client, Collection, Events, GatewayIntentBits, REST, Routes, Partials } = require('discord.js');
require('dotenv').config();

// --- SETUP CLIENT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Buat Auto Role & Welcome
        GatewayIntentBits.GuildMessages, // BIAR BISA BACA PESAN (Wajib buat Leveling/AI)
        GatewayIntentBits.MessageContent, // BIAR TAU ISI PESANNYA APA (Wajib buat Leveling/AI)
        // [FIX 2] Tambah ini biar bot bisa dengerin DM
 GatewayIntentBits.GuildMessageReactions,
        
GatewayIntentBits.GuildInvites,
     GatewayIntentBits.DirectMessages,
        
GatewayIntentBits.GuildVoiceStates
    ],
    // [FIX 3] Tambah Partials (Wajib buat fitur Modmail/DM)
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction
    ]
});

client.commands = new Collection();
const commandsArray = [];

// --- 1. LOAD COMMANDS (Versi Smart) ---
// Script ini bisa baca file command baik yang di dalam folder maupun yang langsung ditaruh di folder 'commands'
const foldersPath = path.join(__dirname, 'commands');

// Cek folder commands ada gak
if (fs.existsSync(foldersPath)) {
    const commandItems = fs.readdirSync(foldersPath);

    for (const item of commandItems) {
        const itemPath = path.join(foldersPath, item);
        const stat = fs.statSync(itemPath);

        // A. Kalau dia FOLDER (Subfolder)
        if (stat.isDirectory()) {
            const commandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(itemPath, file);
                try {
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        commandsArray.push(command.data.toJSON());
                    } else {
                        console.log(`[WARNING] Command di ${filePath} kurang properti 'data' atau 'execute'.`);
                    }
                } catch (error) {
                    console.error(`[ERROR] Gagal load command di folder ${item}:`, error);
                }
            }
        } 
        // B. Kalau dia FILE LANGSUNG (Tanpa folder)
        else if (item.endsWith('.js')) {
            try {
                const command = require(itemPath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    commandsArray.push(command.data.toJSON());
                } else {
                    console.log(`[WARNING] Command ${item} kurang properti 'data' atau 'execute'.`);
                }
            } catch (error) {
                console.error(`[ERROR] Gagal load command file ${item}:`, error);
            }
        }
    }
} else {
    console.log('[INFO] Folder "commands" gak ketemu bro, bikin dulu gih.');
}

// --- 2. LOAD EVENTS ---
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        try {
            const event = require(filePath);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        } catch (err) {
            console.error(`[ERROR] Gagal load event ${file}:`, err);
        }
    }
}

// --- 3. FUNGSI DEPLOY ---
const rest = new REST().setToken(process.env.TOKEN);
async function deployCommands() {
    try {
        console.log(`⏳ Refreshing ${commandsArray.length} slash commands...`);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandsArray },
        );
        console.log(`✅ Success deploy commands!`);
    } catch (error) {
        console.error('❌ Gagal deploy commands:', error);
    }
}

// --- 4. CORE EVENTS ---
client.once(Events.ClientReady, async (readyClient) => {
    await deployCommands();
    console.log(`🚀 Bot online sebagai ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const msg = { content: '❌ Error saat menjalankan command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
        else await interaction.reply(msg);
    }
});

client.login(process.env.TOKEN);
startOAuthServer();

