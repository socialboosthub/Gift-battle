const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const { WebcastPushConnection } = require('tiktok-live-connector');

// Serve your web files (HTML, CSS, JS, Images)
app.use(express.static(__dirname));

// The port Render assigns, or 3000 if testing locally
const PORT = process.env.PORT || 3000;

// TODO: CHANGE THIS TO YOUR ACTUAL TIKTOK USERNAME
const tiktokUsername = "malikkhannilive3"; 

// This allows you to connect to your live chat without needing credentials
const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

tiktokLiveConnection.connect().then(state => {
    console.info(`Connected to TikTok Live! Room ID: ${state.roomInfo.owner.display_id}`);
}).catch(err => {
    console.error('Failed to connect to TikTok Live', err);
});

// Listen for Gifts
tiktokLiveConnection.on('gift', data => {
    const giftName = data.giftName.toLowerCase();
    
    // Team Boys Gifts
    if (giftName === 'tiktok') io.emit('action', { team: 'boys', type: 'move' });
    if (giftName === 'mind blown') io.emit('action', { team: 'boys', type: 'heavy' });
    if (giftName === 'paper crane') io.emit('action', { team: 'boys', type: 'switch' });

    // Team Girls Gifts
    if (giftName === 'rose') io.emit('action', { team: 'girls', type: 'move' });
    if (giftName === 'rosa') io.emit('action', { team: 'girls', type: 'heavy' });
    if (giftName === 'like-pop' || giftName === 'like pop') io.emit('action', { team: 'girls', type: 'switch' });
});

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

