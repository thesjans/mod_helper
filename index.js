const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const config = require('./config.json');

const prefix = config.prefix || "!";

// load settings
settingsData = JSON.parse(fs.readFileSync("settings.json"));
console.log("loaded settings: ", settingsData);

// moderator channel id where requests will be sent to
// set by '[prefix]setmodrole'
let modChannelId = settingsData.modChannelId;
// request channel id where requests will be taken from
// set by '[prefix]setrequestrole'
let requestChannelId = settingsData.requestChannelId;
// role which commands setmodrole, setrequestrole and setmodrole will be restricted to
//set by '[prefix]setmodrole @[role name]'
let modRoleId = settingsData.modRoleId;

let modChannel;

let requests = [];

function saveSettings() {
    let jsonData = JSON.stringify({modChannelId, requestChannelId, modRoleId});
    fs.writeFile("settings.json", jsonData, err => console.log(err));
}

client.once('ready', () => {
    modChannel = client.channels.get(modChannelId);
	console.log('Ready!');
});

client.on('message', message => {
    if (message.author.bot) return;
    if (!modRoleId || message.guild.member(message.author).roles.find((role) => role.id === modRoleId)) {
        if (message.content === prefix + "setmodchannel") {
            modChannel = message.channel;
            modChannelId = message.channel.id;
            saveSettings();
            message.react('✅');
            console.log("Set mod channel to ", message.channel.name);
            return;
        }
        if (message.content === prefix + "setrequestchannel") {
            requestChannelId = message.channel.id;
            saveSettings();
            message.react('✅');
            console.log("Set request channel to ", message.channel.name);
            return;
        }
        if (message.content === prefix + "settings") {
            message.channel.send(
                "request channel id: `" + requestChannelId + "`\n" + 
                "mod channel id: `" + modChannelId + "`\n" + 
                "mod role id: `" + modRoleId + "`"
            );
        }
        if (message.content.startsWith(prefix + "setmodrole")) {
            let role = message.guild.roles.find("id", message.mentions.roles.first().id);
            if (role) {
                modRoleId = role.id;
                saveSettings();
                message.react('✅');
                console.log("Set moderator role to ", role);
            } else {
                message.react('❌');
                message.channel.send("Couldn't find role!");
                console.log("Failed to set moderator role! Triggering message: ", message);
            }
            return;
        }
    }
    if (message.channel.id === requestChannelId ||  message.channel === message.author.dmChannel) {
        let isAnon = message.content.startsWith(prefix + "anon");
        let request = {
            userId: message.author.id,
            userTag: message.author.tag,
            content: isAnon ? message.content.slice(prefix.length + 4) : message.content,
            requestId: requests.length};
        requests.push(request)
        console.log("new request: ", request);
        modChannel.send(
            (isAnon ? "Anonymous user" : "User " + request.userTag) + 
            " sent following moderation request:\n> " + request.content.replace("\n", "\n> ") + 
            "\nUse requestId `" + request.requestId + "` when responding to this message");
        message.delete();
    }
    if (message.channel.id === modChannelId && (message.content.startsWith(prefix + "reply") || message.content.startsWith(prefix + "r"))) {
        let requestId = parseInt(message.content.slice(prefix.length).split(" ")[1], 10);
        if (isNaN(requestId) || requestId < 0 || requestId >= requests.length) {
            message.channel.send("Error: requestId is either missing or not valid.");
            return;
        }
        function forwardResponse(channel) {
            channel.send(message.content.slice(prefix.length).split(" ").slice(2).join(" "))
            .then(() => message.react('✅'))
            .catch(() => message.react('❌'));
        }
        client.fetchUser(requests[requestId].userId)
            .then(user => {
                if (user.dmChannel) {
                    forwardResponse(user.dmChannel);
                } else {
                    user.createDM()
                        .then(channel => forwardResponse(channel))
                        .catch(() => {
                            message.channel.send("Could not set response because DM with User could not be established.")
                        })
                }
            })
            .catch(err => {
                console.log(err);
                message.channel.send("Could not find user for the request!");
            })
    }

})

client.login(config.token);
