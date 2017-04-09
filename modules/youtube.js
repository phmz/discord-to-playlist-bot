// TODO ask permission to use youtube the first time then save the refresh_token

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// Get credentials from credentials.json
try {
    var credentials = require("../credentials.json");
} catch (e) {
    console.log("Could not find credentials.json");
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
        if (!credentials.playlist.id) {
            return;
        }
        youtube.playlistItems.insert({
            "part": 'snippet',
            "resource": {
                "snippet": {
                    "playlistId": credentials.playlist.id,
                    "resourceId": {
                        "kind": "youtube#video",
                        "videoId": videoID
                    }
                }
            }
        }, function(err, data) {
            if (err) {
                console.log("Could not add " + videoID + ". Reason: " + err.errors[0].reason);
            } else {
                console.log(videoID + " correctly added to the playlist");
            }
        });
    }
}
