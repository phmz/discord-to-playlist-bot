// TODO ask permission to use youtube the first time then save the refresh_token

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// Import winston logger & create logger
var winston = require('winston');
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: './logs/bot_log.log'
        })
    ]
});

// Import async and create a queue object with no concurrency in order to avoid
// issue with Youtube API V3.0
var async = require('async');
var q = async.queue(function(task, callback) {
    youtube.playlistItems.insert({
        "part": 'snippet',
        "resource": {
            "snippet": {
                "playlistId": credentials.playlist.id,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": task.name
                }
            }
        }
    }, function(err, data) {
        if (err) {
            logger.log("error", "YOUTUBE: Could not add " + task.name + ". Reason: " + err.errors[0].reason);
            callback();
        } else {
            logger.log("info", "YOUTUBE: " + task.name + " correctly added to the playlist");
            callback();
        }
    });
}, 1);
// Callback
q.drain = function() {
    logger.log("debug", "YOUTUBE: All items have been processed")
};

// Get credentials from credentials.json
try {
    var credentials = require("../credentials.json");
} catch (e) {
    logger.log("error", "YOUTUBE: Could not find credentials.json");
    process.exit();
}

var oauth2Client = new OAuth2(
    credentials.youtube.client_id,
    credentials.youtube.client_secret,
    "https://localhost:5000/oauth2callback"
);

oauth2Client.setCredentials(credentials.oauth2Client);

// Initialize the Youtube API library
var youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
});

module.exports = {
    // Add the video with id in the playlist
    addVideoToPlaylist: function(videoID) {
        q.push({
            name: videoID
        }, function(err, result) {
            if (err) {
                return callback(err);
            }
        });
    }
}
