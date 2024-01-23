require('./utils/ProcessHandlers.js')();

const { Client, ActivityType, Events, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        'Guilds',
        'GuildMembers',
        'GuildPresences'
    ]
});

client.config = require('./config.json');
client.logs = require('./utils/Logs.js');

require('./utils/Loader.js')(client);
require('./utils/Register.js')(client);

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
    client.logs.success(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ activities: [{ name: 'to testing', type: ActivityType.Watching }] })
    client.user.setStatus('DND')
});


async function InteractionHandler(interaction, type) {

    const args = interaction.customId?.split("_") ?? [];
    const name = args.shift();

    const command = client[type].get( name ?? interaction.commandName );
    if (!command) {
        await interaction.reply({
            content: `There was an error while executing this command!\n\`\`\`Command not found\`\`\``,
            ephemeral: true
        }).catch( () => {} );
        client.logs.error(`${type} not found: ${interaction.customId}`);
        return;
    }

    try {
        if (interaction.isAutocomplete()) {
            await command.autocomplete(interaction, client, args);
        } else {
            await command.execute(interaction, client, args);
        }
    } catch (error) {
        client.logs.error(error.stack);
        await interaction.deferReply({ ephemeral: true }).catch( () => {} );
        await interaction.editReply({
            content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
            ephemeral: true
        }).catch( () => {} );
    }

}

client.on('interactionCreate', async function(interaction) {
    if (!interaction.isCommand() && !interaction.isAutocomplete()) return;
    
    const subcommand = interaction.options._subcommand ?? "";
    const subcommandGroup = interaction.options._subcommandGroup ?? "";
    const commandArgs = interaction.options._hoistedOptions ?? [];
    const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);

    await InteractionHandler(interaction, 'commands');
});


client.on('interactionCreate', async function(interaction) {
    if (!interaction.isButton()) return;
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
    await InteractionHandler(interaction, 'buttons');
});


client.on('interactionCreate', async function(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId}>`);
    await InteractionHandler(interaction, 'menus');
});


client.on('interactionCreate', async function(interaction) {
    if (!interaction.isModalSubmit()) return;
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > {${interaction.customId}}`);
    await InteractionHandler(interaction, 'modals');
});




client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
    const inviteLink = '.gg/zerorp';
    const member = newPresence.member;
    const channelID = newPresence.guild.channels.cache.get('1199192931924451418');
    var presenceEmbed = new EmbedBuilder()
    .setColor('DarkRed')
    .setTitle('Vanity URL Added!')
    .setDescription(`<@${member.user.id}> has the *ZeroRP* vanity in their status. They have gained the *Vanity Prio* role.`)
    .setImage('https://cdn.discordapp.com/banners/1169818991028600962/916742923dc1cfab3e118d4fa6a53e53.png?size=256') //https://cdn.discordapp.com/banners/1169818991028600962/916742923dc1cfab3e118d4fa6a53e53.png?size=256
    .setFooter({ text: 'ZeroRP • 2024' })
  
    if (member) {
      const customStatus = member.presence.activities.find((activity) => activity.type === ActivityType.Custom);
  
      if (customStatus && customStatus.state.includes(inviteLink)) { 
            member.roles.add('1199192863112712374');
            channelID.send({ embeds: [presenceEmbed] })
            console.log(customStatus);
        }
      } else {
        if (!newPresence && oldPresence.state.includes(inviteLink)) {
            member.roles.remove('1199192863112712374')
            channelID.send({ content: `<@${member.user.id}> has removed *ZeroRP* vanity from their status. They have been removed from the *Vanity Prio* role.` })
        return;
         }
        }
    }
  });
  