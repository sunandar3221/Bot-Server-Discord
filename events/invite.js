const { Events } = require('discord.js');

// Map buat nyimpen cache invite, ibaratnya ini ingatan sementara si bot
const invitesCache = new Map();

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        if (!client.invites) client.invites = new Map();

        const fetchAllInvites = async () => {
            for (const [guildId, guild] of client.guilds.cache) {
                try {
                    const invites = await guild.invites.fetch();
                    const codeUses = new Map();
                    invites.forEach(inv => codeUses.set(inv.code, inv.uses));
                    client.invites.set(guildId, codeUses);
                } catch (err) {
                    console.log(`[Invite Tracker] Info: Bot tidak memiliki akses invite di server ${guild.name}.`);
                }
            }
        };

        await fetchAllInvites();
        console.log('[Invite Tracker] Data invite berhasil di-cache!');

        // Update cache saat bot di-invite ke server baru
        client.on(Events.GuildCreate, async (guild) => {
            try {
                const invites = await guild.invites.fetch();
                const codeUses = new Map();
                invites.forEach(inv => codeUses.set(inv.code, inv.uses));
                client.invites.set(guild.id, codeUses);
            } catch (err) {
                console.log(`[Invite Tracker] Gagal cache server baru: ${guild.name}`);
            }
        });

        // Update cache saat ada invite baru dibuat
        client.on(Events.InviteCreate, (invite) => {
            const guildInvites = client.invites.get(invite.guild.id);
            if (guildInvites) {
                guildInvites.set(invite.code, invite.uses);
            }
        });

        // Update cache saat invite dihapus
        client.on(Events.InviteDelete, (invite) => {
            const guildInvites = client.invites.get(invite.guild.id);
            if (guildInvites) {
                guildInvites.delete(invite.code);
            }
        });
    }
};


