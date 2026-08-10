const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const { WebcastPushConnection } = require('tiktok-live-connector');

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;

// Enter your TikTok live username here
const tiktokUsername = "malikkhannilive3"; 

const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

tiktokLiveConnection.connect().then(state => {
    console.info(`Connected to TikTok Live! Room ID: ${state.roomId}`);
}).catch(err => {
    console.error('Failed to connect to TikTok Live:', err);
});

// Listen for TikTok Live Gifts
tiktokLiveConnection.on('gift', data => {
    const giftName = data.giftName.toLowerCase().trim();
    const repeatCount = data.repeatCount || 1;
    
    // Team Boys Gifts
    if (giftName === 'tiktok') {
        io.emit('action', { team: 'boys', type: 'move', damage: 1 * repeatCount });
    }
    if (giftName === 'mind blown') {
        io.emit('action', { team: 'boys', type: 'heavy', damage: 10 * repeatCount });
    }
    if (giftName === 'paper crane' || giftName === 'papercrane') {
        io.emit('action', { team: 'boys', type: 'switch' });
    }

    // Team Girls Gifts
    if (giftName === 'rose') {
        io.emit('action', { team: 'girls', type: 'move', damage: 1 * repeatCount });
    }
    if (giftName === 'rosa') {
        io.emit('action', { team: 'girls', type: 'heavy', damage: 10 * repeatCount });
    }
    if (giftName === 'like-pop' || giftName === 'like pop' || giftName === 'likepop') {
        io.emit('action', { team: 'girls', type: 'switch' });
    }
});

http.listen(PORT, () => {
    console.log(`MK Live Stream Server running on port ${PORT}`);
});
