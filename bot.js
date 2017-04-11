/*
  Bot for Discord app that add youtube video linked in the servers text channels to a playlist.
*/

// Import the discord.js module
var discord = require('discord.js');
// Import the fs.js module
var fs = require('fs');
// Import winston logger & create logger
var dir = './logs';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
var winston = require('winston');
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: './logs/bot_log.log'
        })
    ]
});
// Import module
var yt = require('./modules/youtube.js');

// Get credentials from credentials.json
try {
    var credentials = require("./credentials.json");
} catch (e) {
    logger.log("error", "BOT: Could not find credentials.json");
    process.exit();
}
// Create an instance of a Discord Client, and call it bot
var bot = new discord.Client();
// More information here http://stackoverflow.com/questions/19377262/regex-for-youtube-url
var youtubeRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
// File containing the last messages ID for each channel
var lastMessagesPath = "./lastMessages.json";

try {
    var lastMessages = require("./lastMessages.json");
} catch (e) {
    logger.log("warn", "BOT: lastMessages does not exist");
    var lastMessages = {};
}

// the ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted.
bot.on('ready', () => {
    logger.log("info", "BOT: Logged-in as " + bot.user.username);
});

// Create an event listener for message
bot.on('message', message => {
    var youtubeID = getYoutubeID(message.content);
    if (youtubeID !== false) {
        yt.addVideoToPlaylist(youtubeID);
    }
});

// Log the bot in
if (credentials.discord.bot_token) {
    bot.login(credentials.discord.bot_token).then(loginSuccess).catch(loginErr);
} else {
    logger.log("error", "BOT: No discord token in credentials.json");
    process.exit();
}

function loginSuccess() {
    logger.log("info", "BOT: " + bot.user.username + " is online");
    checkNewMessages();
}

function loginErr(error) {
    logger.log("error", error);
    process.exit();
}

// Allow the bot to update the playlist if needed
function checkNewMessages() {
    bot.channels.forEach(function(key, value) {
        if (key.type === "text") {
            if (lastMessages[value] === undefined) {
                logger.log("info", "BOT: First time visiting channel: " + key.name);
                addChannelToJson(key, value);
                readLogs(key);
                updateLastMessagesJSON();
            } else if (lastMessages[value].lastMessageID !== key.lastMessageID) {
                logger.log("info", "BOT: New messages since last visit in channel: " + key.name);
                readNewMessages(key, lastMessages[value].lastMessageID);
                lastMessages[value].lastMessageID = key.lastMessageID;
                updateLastMessagesJSON();
            } else {
                logger.log("info", "BOT: No new message since last visit in channel: " + key.name);
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

function readLogs(channel) {
    var lastMessageID = channel.lastMessageID;
    channel.fetchMessages({
        limit: 50
    }).then(messages => {
        messages.forEach(function(elt) {
            var youtubeID = getYoutubeID(elt.content);
            if (youtubeID !== false) {
                yt.addVideoToPlaylist(youtubeID);
            }
            lastMessageID = elt.id;
        });
        readLogsRec(channel, lastMessageID);
    }).catch(console.error);
}

function readLogsRec(channel, lastMessageID) {
    channel.fetchMessages({
        limit: 50,
        before: lastMessageID
    }).then(messages => {
        if (messages.size === 0) {
            logger.log("info", "BOT: Finished reading logs for channel: " + channel.name);
            return;
        }
        messages.forEach(function(elt) {
            var youtubeID = getYoutubeID(elt.content);
            if (youtubeID !== false) {
                yt.addVideoToPlaylist(youtubeID);
            }
            lastMessageID = elt.id;
        });
        return readLogsRec(channel, lastMessageID);
    }).catch(console.error);
}

// If message is a youtube link then returns the ID, if not returns false
function getYoutubeID(message) {
    var match = message.match(youtubeRegex);
    if (match !== null && match[5].length === 11) {
        return match[5];
    }
    return false;
}

// Read every message since lastMessageID
// If the message is a youtube link the video will be added to the playlist
function readNewMessages(channel, lastMessageID) {
    channel.fetchMessages({
        after: lastMessageID
    }).then(messages => {
        if (messages.size === 0) {
            logger.log("info", "BOT: Finished reading logs for channel: " + channel.name);
            return;
        }
        messages.forEach(function(elt) {
            var youtubeID = getYoutubeID(elt.content);
            if (youtubeID !== false) {
                yt.addVideoToPlaylist(youtubeID);
            }
            lastMessageID = elt.id;
        });
        return readNewMessages(channel, lastMessageID);
    });
}

// Update the file containing the last messages ID for each channel
function updateLastMessagesJSON() {
    fs.writeFile(lastMessagesPath, JSON.stringify(lastMessages), function(err) {
        if (err) {
            logger.log("error", err);
            return;
        }
        logger.log("info", "BOT: lastMessages.json has been updated");
    });
}
