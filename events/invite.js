const { Events } = require('discord.js');

// Map buat nyimpen cache invite, ibaratnya ini ingatan sementara si bot
const invitesCache = new Map();

module.exports = async (client) => {
    // Fungsi buat narik semua data invite dari semua server tempat bot ini nongkrong
    const fetchAllInvites = async () => {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                // Tarik data invite langsung dari servernya
                const invites = await guild.invites.fetch();
                // Bikin map baru buat nyimpen kode sama jumlah pakenya
                const codeUses = new Map();
                invites.forEach(inv => codeUses.set(inv.code, inv.uses));
                
                // Masukin ke ingatan (cache)
                invitesCache.set(guildId, codeUses);
            } catch (err) {
                console.log(`[Invite Tracker] Wah bro, gagal narik data di server ${guild.name}. Pastiin botnya dikasih role yang ada permission 'Manage Server' yak!`);
            }
        }
    };

    // FIX 1: Kalau modul ini telat di-load tapi bot udah ready, langsung gas fetch!
    if (client.isReady()) {
        await fetchAllInvites();
        console.log('[Invite Tracker] Bot udah nyala duluan, data invite lama udah aman di-cache!');
    } else {
        // Kalau dari awal bot baru nyala, tungguin event Ready
        client.once(Events.ClientReady, async () => {
            await fetchAllInvites();
            console.log('[Invite Tracker] Mantap bro, sistem pelacak invite udah gaspol!');
        });
    }

    // FIX 2: Kalau bot lu di-invite ke server baru, jangan lupa cache juga server barunya
    client.on(Events.GuildCreate, async (guild) => {
        try {
            const invites = await guild.invites.fetch();
            const codeUses = new Map();
            invites.forEach(inv => codeUses.set(inv.code, inv.uses));
            invitesCache.set(guild.id, codeUses);
        } catch (err) {
            console.log(`[Invite Tracker] Gagal nge-cache server baru: ${guild.name}`);
        }
    });

    // Pas ada member bikin link invite baru
    client.on(Events.InviteCreate, (invite) => {
        const guildInvites = invitesCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.set(invite.code, invite.uses);
        }
    });

    // Pas link invite dihapus manual
    client.on(Events.InviteDelete, (invite) => {
        const guildInvites = invitesCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.delete(invite.code);
        }
    });

    // NAH INI INTINYA: Pas ada orang join ke server
    client.on(Events.GuildMemberAdd, async (member) => {
        const guild = member.guild;
        
        // GANTI ID INI PAKAI ID CHANNEL LOG LU YA BRO
        const logChannelId = '1249285908964970618'; 
        const logChannel = guild.channels.cache.get(logChannelId);

        if (!logChannel) return; // Kalau channelnya kaga ada, skip aja

        // Tarik data invite terbaru dari server
        const newInvites = await guild.invites.fetch().catch(() => null);
        // Tarik data lama dari cache ingatan bot
        const oldInvites = invitesCache.get(guild.id);

        if (!newInvites || !oldInvites) {
            return logChannel.send(`📥 ${member} join, tapi gua gagal muat data invite nih bro. Cek koneksi atau permission.`);
        }

        // Cari invite mana yang angkanya nambah
        let usedInvite = newInvites.find(inv => {
            const oldUses = oldInvites.get(inv.code) || 0;
            return inv.uses > oldUses;
        });

        // FIX 3: LOGIKA BUAT INVITE SEKALI PAKAI (SINGLE-USE)
        // Kalau gak ketemu yang nambah, berarti ada kemungkinan invitenya langsung expired/dihapus Discord
        // Kita cari invite mana yang ada di oldInvites (cache lama) TAPI hilang di newInvites (terbaru)
        if (!usedInvite) {
            oldInvites.forEach((oldUses, code) => {
                if (!newInvites.has(code)) {
                    // Fix, ini nih biang keroknya (invite sekali pakai)
                    usedInvite = { 
                        code: code, 
                        inviter: null, // Sayangnya kita gak bisa tau persis siapa inviternya kalau udah dihapus dari API
                        uses: oldUses + 1, 
                        isSingleUse: true 
                    };
                }
            });
        }

        // Update cache bot biar siap buat nangkep orang join berikutnya
        const updatedCache = new Map();
        newInvites.forEach(inv => updatedCache.set(inv.code, inv.uses));
        invitesCache.set(guild.id, updatedCache);

        // Kalau dapet nih datanya, langsung kirim ke channel
        if (usedInvite) {
            // Cek apakah dia pakai single use invite atau invite normal
            if (usedInvite.isSingleUse) {
                logChannel.send({
                    content: `📥 **${member.user.tag}** baru aja mendarat!\n` +
                             `🔗 Link yang dipakai: \`${usedInvite.code}\`\n` +
                             `⚠️ *Note: Link ini cuma bisa sekali pakai (single-use) dan udah otomatis hangus.*`
                });
            } else {
                const inviter = usedInvite.inviter;
                logChannel.send({
                    content: `📥 **${member.user.tag}** baru aja mendarat di tongkrongan!\n` +
                             `👤 Dibawa oleh: **${inviter ? inviter.tag : 'Gak kedeteksi'}**\n` +
                             `🔗 Pakai kode: \`${usedInvite.code}\`\n` +
                             `📊 Total link ini dipakai: **${usedInvite.uses} kali**`
                });
            }
        } else {
            // Kalau tetep gak ketemu juga (biasanya karena link custom Vanity URL level 3 / bot OAuth)
            logChannel.send(`📥 **${member.user.tag}** join! Tapi gua gak bisa lacak linknya bro (Mungkin dari Custom Link/Vanity URL server).`);
        }
    });
};


