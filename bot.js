/*
  Bot for Discord app that add youtube video linked in the servers text channels to a playlist.
*/

// Import the discord.js module
var Discord = require('discord.js');
// Import the fs.js module
var fs = require('fs');
// Get credentials from credentials.json
try {
    var credentials = require("./credentials.json");
} catch (e) {
    console.log(e.stack);
    process.exit();
}
// create an instance of a Discord Client, and call it bot
var bot = new Discord.Client();
// More information here http://stackoverflow.com/questions/19377262/regex-for-youtube-url
var youtubeRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
// File containing the last messages ID for each channel
var lastMessagesPath = "./lastMessages.json";

try {
    var lastMessages = require("./lastMessages.json");
} catch (e) {
    console.log("lastMessages does not exist");
    var lastMessages = {};
}

// the ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted.
bot.on('ready', () => {
    console.log('Logged-in as ' + bot.user.username);
    checkNewMessages();
});

// Create an event listener for message
bot.on('message', message => {
    var youtubeID = getYoutubeID(message.content);
    if (youtubeID !== false) {
        console.log(youtubeID);
        // addVideoToPlaylist(youtubeID);
    }
});

// Log the bot in
if (credentials.discord.bot_token) {
    bot.login(credentials.discord.bot_token).then(loginSuccess).catch(loginErr);
} else {
    console.log("no discord token");
    process.exit();
}

function loginSuccess() {
    console.log(bot.user.username + " is online");
}

function loginErr(error) {
    console.log(error);
}

// Allow the bot to update the playlist if needed
function checkNewMessages() {
    bot.channels.forEach(function(key, value) {
        if (key.type === "text") {
            console.log("channel: " + key.name);
            if (lastMessages[value] === undefined) {
                console.log("first time visiting this channel");
                addChannelToJson(key, value);
                updateLastMessagesJSON();
                // TODO fix readLogs
                //readLogs(key);
            } else if (lastMessages[value].lastMessageID !== key.lastMessageID) {
                console.log("new message since last visit");
                // TODO fix readNewMessages
                // readNewMessages(key, lastMessages[value].lastMessageID);
                lastMessages[value].lastMessageID = key.lastMessageID;
                updateLastMessagesJSON();
            } else {
                console.log("no new message since last visit");
                // do nothing for this channel
            }
        }
    });
}

// Add the channel to the file lastMessages.json
function addChannelToJson(key, value) {
    var elt = {
        "name": key.name,
        "lastMessageID": key.lastMessageID
    };
    lastMessages[value] = elt;
}

// FIXME readLogs & readLogsRec
function readLogs(channel) {
    // TODO read all messages from channel
    var lastMessageID = channel.lastMessageID;
    channel.fetchMessages({
        limit: 50
    }).then(messages => {
        messages.forEach(function(elt) {
            var youtubeID = getYoutubeID(elt.content);
            if (youtubeID !== false) {
                console.log(channel.name + " " + youtubeID);
                addVideoToPlaylist(youtubeID);
            }
            console.log("readLogs lastMessageID: " + elt.id);
            lastMessageID = elt.id;
        });
    });
    console.log("first lastMessageID " + lastMessageID);
    while (lastMessageID !== 0) {
        lastMessageID = readLogsRec(channel, lastMessageID);
    }
}

// FIXME readLogs & readLogsRec
function readLogsRec(channel, lastMessageID) {
    channel.fetchMessages({
        limit: 50,
        before: lastMessageID
    }).then(messages => {
        if (messages.size === 0) {
            return 0;
        }
        messages.forEach(function(elt) {
            var youtubeID = getYoutubeID(elt.content);
            if (youtubeID !== false) {
                console.log(channel.name + " " + youtubeID);
                // addVideoToPlaylist(youtubeID);
            }
            lastMessageID = elt.id;
        });
        return lastMessageID;
    }).catch(console.error);
}

// If message is a youtube link then returns the ID, if not returns false
function getYoutubeID(message) {
    var match = message.match(youtubeRegex);
    if (match !== null) {
        return match[5];
    }
    return false;
}

// Read every message since lastMessageID
// If the message is a youtube link the video will be added to the playlist
// FIXME will only work if there is 50 or less messages since lastMessageID
//
function readNewMessages(channel, lastMessageID) {
    channel.fetchMessages({
        after: lastMessageID
    }).then(messages => {
        messages.forEach(function(elt) {
            var youtubeID = getYoutubeID(elt.content);
            if (youtubeID !== false) {
                console.log(youtubeID);
                // addVideoToPlaylist(youtubeID);
            }
        });
    });
}

// Update the file containing the last messages ID for each channel
function updateLastMessagesJSON() {
    fs.writeFile(lastMessagesPath, JSON.stringify(lastMessages), function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("lastMessages.json updated");
    });
}
