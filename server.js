import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { TikTokLive } from "tiktok-live-events";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = "bokenroo";

app.use(express.static("."));

const clients = new Set();

wss.on("connection", (socket) => {
    console.log("🎮 Game connected");

    clients.add(socket);

    socket.send(JSON.stringify({
        type: "status",
        message: "Connected to gift server"
    }));

    socket.on("close", () => {
        clients.delete(socket);
    });
});

function sendToGame(data) {
    const message = JSON.stringify(data);

    for (const client of clients) {
        if (client.readyState === 1) {
            client.send(message);
        }
    }
}

console.log(`🎵 Starting TikTok listener for @${TIKTOK_USERNAME}`);

const live = new TikTokLive(TIKTOK_USERNAME);

live.on("connected", () => {
    console.log(`✅ Connected to @${TIKTOK_USERNAME}`);
    sendToGame({
        type: "status",
        message: `Connected to @${TIKTOK_USERNAME}`
    });
});

live.on("disconnected", () => {
    console.log("⚠️ TikTok connection disconnected");

    sendToGame({
        type: "status",
        message: "TikTok connection disconnected"
    });
});

live.on("gift", (event) => {

    const giftName = String(
        event.giftName ||
        event.gift?.name ||
        ""
    ).trim();

    const username =
        event.user?.uniqueId ||
        event.user?.nickname ||
        "Viewer";

    const repeatCount = Number(
        event.repeatCount ||
        event.repeat_count ||
        1
    );

    const normalized = giftName.toLowerCase();

    console.log(
        `🎁 @${username} sent ${giftName} x${repeatCount}`
    );

    /*
     * ROSE
     * Girls normal attack.
     *
     * If somebody sends 1 Rose:
     *     1 damage
     *
     * If somebody sends 10 Roses:
     *     10 damage
     */
    if (normalized === "rose") {

        sendToGame({
            type: "gift",
            action: "girlHit",
            username,
            gift: "Rose",
            count: repeatCount
        });

        return;
    }

    /*
     * TIKTOK
     * Boys normal attack.
     */
    if (
        normalized === "tiktok" ||
        normalized === "tiktok gift"
    ) {

        sendToGame({
            type: "gift",
            action: "boyHit",
            username,
            gift: "TikTok",
            count: repeatCount
        });

        return;
    }

    /*
     * MIND BLOWN
     * Boys special 10-damage attack.
     */
    if (
        normalized === "mind blown" ||
        normalized === "mindblown"
    ) {

        sendToGame({
            type: "gift",
            action: "boyBrutality",
            username,
            gift: "Mind Blown",
            count: 1
        });

        return;
    }

    /*
     * LIKE-POP
     * Switch girl character.
     */
    if (
        normalized === "like-pop" ||
        normalized === "like pop"
    ) {

        sendToGame({
            type: "gift",
            action: "switchGirl",
            username,
            gift: "Like-Pop",
            count: 1
        });

        return;
    }

    /*
     * PAPER CRANE
     * Switch boy character.
     */
    if (
        normalized === "paper crane" ||
        normalized === "papercrane"
    ) {

        sendToGame({
            type: "gift",
            action: "switchBoy",
            username,
            gift: "Paper Crane",
            count: 1
        });

        return;
    }

    console.log(`ℹ️ Gift ignored: ${giftName}`);
});

live.connect()
    .then(() => {
        console.log(`🚀 Listening to @${TIKTOK_USERNAME}`);
    })
    .catch((error) => {
        console.error("❌ TikTok connection failed:", error);
    });

server.listen(PORT, () => {
    console.log(`🌐 Game server running on port ${PORT}`);
});
