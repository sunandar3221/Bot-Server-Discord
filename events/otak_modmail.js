const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady, // Jalan pas bot 'ready'
    once: true,
    execute(client) {
        // Kita siapin memory di sini
        client.modmailTickets = new Map(); // User -> Mod
        client.modmailBusy = new Map();    // Mod -> User
        
        console.log('✅ Sistem Modmail udah siap nongkrong bro!');
    },
};

