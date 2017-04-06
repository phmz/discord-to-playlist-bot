var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// Get credentials from credentials.json
try {
    var credentials = require("./credentials.json");
} catch (e) {
    console.log(e.stack);
    process.exit();
}

var oauth2Client = new OAuth2(
    credentials.youtube.client_id,
    credentials.youtube.client_secret,
    "http://localhost:5000/oauth2callback"
);

oauth2Client.setCredentials(credentials.oauth2Client);

// Initialize the Youtube API library
var youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
});

// Add the video with id in the playlist
function addVideoToPlaylist(videoID) {
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
    });
}
