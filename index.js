const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

const prefix = config.prefix || "!";

let modChannel;
let requestChannel;

let requests = [];

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
    if (message.author.bot) return;
    if (message.content === prefix + "setmodchannel") {
        modChannel = message.channel;
        message.react('✅');
        console.log("Set mod channel to ", message.channel.name);
        return;
    }
    if (message.content === prefix + "setrequestchannel") {
        requestChannel = message.channel;
        message.react('✅');
        console.log("Set request channel to ", message.channel.name);
        return;
    }
    if (message.channel === requestChannel ||  message.channel === message.author.dmChannel) {
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
            " sent following moderation request:\n> " + request.content + 
            "\nUse requestId `" + request.requestId + "` when responding to this message");
        message.delete();
    }
    if (message.channel === modChannel && (message.content.startsWith(prefix + "reply") || message.content.startsWith(prefix + "r"))) {
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
