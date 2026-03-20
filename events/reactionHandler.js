const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageReactionRemove, // Nama eventnya
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
        const client = message.client; // Ambil client dari sini

        // Cek apakah pesan ini buatan bot kita
        if (message.author.id !== client.user.id) return;
        if (message.embeds.length === 0) return;

        const footerText = message.embeds[0].footer?.text;
        if (!footerText || !footerText.startsWith('Role ID:')) return;

        const roleId = footerText.split(' ')[2];
        
        const guild = message.guild;

        try {
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(roleId);

            // Hapus role
            if (role && member) {
                await member.roles.remove(role);
                console.log(`Berhasil cabut role ${role.name} dari ${user.tag}`);
            }
        } catch (err) {
            console.log('Gagal proses remove role:', err);
        }
    },
};

