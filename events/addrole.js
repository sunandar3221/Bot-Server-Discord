const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageReactionAdd, // Nama eventnya
    async execute(reaction, user) {
        // Abaikan kalau yang react itu bot
        if (user.bot) return;

        // Handle pesan lama (Partial Fetching)
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Gagal fetch pesan partial:', error);
                return;
            }
        }

        const message = reaction.message;
        
        // Kita ambil client langsung dari object message, biar gak error "client not defined"
        const client = message.client; 

        // Cek apakah pesan ini buatan bot kita dan punya embed
        if (message.author.id !== client.user.id) return;
        if (message.embeds.length === 0) return;

        // Cek Footer Embed buat nyari ID Role
        const footerText = message.embeds[0].footer?.text;
        if (!footerText || !footerText.startsWith('Role ID:')) return;

        // Ambil ID Role dari text footer
        const roleId = footerText.split(' ')[2];
        
        const guild = message.guild;
        
        // Fetch member dan role
        try {
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(roleId);

            // Kasih role kalau rolenya valid
            if (role && member) {
                await member.roles.add(role);
                console.log(`Berhasil nambahin role ${role.name} ke ${user.tag}`);
            }
        } catch (err) {
            console.log('Gagal proses add role:', err);
        }
    },
};

