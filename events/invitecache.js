// Simpan di folder events lu dengan nama ready.js
// File ini gunanya buat nyatet semua invite link pas bot pertama kali idup, biar ada perbandingan nanti.

module.exports = {
    name: 'ready',
    once: true, // Cuma jalan sekali pas bot nyala
    async execute(client) {
        console.log(`[BOT] Yoman, bot ${client.user.tag} udah nongkrong!`);

        // Bikin tempat nyimpen cache invite di object client biar bisa diakses dari file lain
        client.invites = new Map();

        // Ambil data invite dari semua server tempat bot ini nongkrong
        client.guilds.cache.forEach(async (guild) => {
            try {
                const firstInvites = await guild.invites.fetch();
                client.invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
            } catch (err) {
                console.log(`[ERROR] Gak dapet akses fetch invite di server ${guild.name} nih bro.`);
            }
        });
    },
};

