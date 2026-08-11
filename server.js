import express from "express";
import http from "http";
import { Server } from "socket.io";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

// ==========================================
// PUT YOUR TIKTOK USERNAME HERE
// ==========================================

const TIKTOK_USERNAME =
  process.env.TIKTOK_USERNAME || "lxkt16";

// ==========================================
// EXPRESS
// ==========================================

app.get("/", (req, res) => {
  res.send("TikTok Mortal Kombat server is running!");
});

app.get("/status", (req, res) => {
  res.json({
    running: true,
    tiktokUsername: TIKTOK_USERNAME,
    clients: io.engine.clientsCount
  });
});

// ==========================================
// SOCKET CONNECTIONS
// ==========================================

io.on("connection", (socket) => {
  console.log("Mortal Kombat page connected:", socket.id);

  socket.emit("serverStatus", {
    connected: true,
    tiktokUsername: TIKTOK_USERNAME
  });

  socket.on("disconnect", () => {
    console.log("Mortal Kombat page disconnected:", socket.id);
  });
});

// ==========================================
// SEND COMMAND TO THE GAME
// ==========================================

function sendGameCommand(command) {
  console.log("GAME COMMAND:", command);

  io.emit("gameCommand", command);
}

// ==========================================
// TIKTOK LIVE
// ==========================================

let tiktokConnection = null;

async function connectTikTok() {
  try {
    console.log("------------------------------------");
    console.log("Connecting to TikTok LIVE...");
    console.log("Username:", TIKTOK_USERNAME);
    console.log("------------------------------------");

    tiktokConnection = new TikTokLiveConnection(TIKTOK_USERNAME, {
  enableExtendedGiftInfo: true,
  processInitialData: false,
  signApiKey: process.env.EULER_API_KEY
});

    tiktokConnection.on(
      WebcastEvent.CONNECTED,
      (state) => {
        console.log("✅ TikTok LIVE connected!");
        console.log("Room ID:", state.roomId);

        io.emit("tiktokStatus", {
          connected: true,
          roomId: state.roomId
        });
      }
    );

    tiktokConnection.on(
      WebcastEvent.DISCONNECTED,
      () => {
        console.log("TikTok LIVE disconnected.");

        io.emit("tiktokStatus", {
          connected: false
        });
      }
    );

    tiktokConnection.on(
      WebcastEvent.ERROR,
      (error) => {
        console.error("TikTok error:", error);

        io.emit("tiktokStatus", {
          connected: false,
          error: String(error)
        });
      }
    );

    // ==========================================
    // TIKTOK GIFTS
    // ==========================================

    tiktokConnection.on(
      WebcastEvent.GIFT,
      (data) => {

        const giftName =
          data.giftDetails?.giftName ||
          data.giftName ||
          "";

        const username =
          data.user?.uniqueId ||
          data.uniqueId ||
          data.user?.nickname ||
          "Unknown";

        const nickname =
          data.user?.nickname ||
          username;

        const repeatCount =
          Number(data.repeatCount || 1);

        const giftType =
          data.giftDetails?.giftType ??
          data.giftType;

        const repeatEnd =
          data.repeatEnd;

        console.log(
          `🎁 ${username} sent ${giftName} x${repeatCount}`
        );

        // ========================================
        // IMPORTANT:
        // TikTok streak gifts can produce multiple
        // events. We only process the final event.
        // ========================================

        if (giftType === 1 && repeatEnd === false) {
          console.log(
            "Gift streak still running - waiting for final event..."
          );
          return;
        }

        // ========================================
        // NORMALIZE GIFT NAME
        // ========================================

        const normalizedGift =
          giftName
            .trim()
            .toLowerCase();

        // ========================================
        // ROSE
        // GIRL NORMAL ATTACK
        // ========================================

        if (normalizedGift === "rose") {

          sendGameCommand({
            type: "attack",
            side: "girl",
            brutality: false,
            power: 1,
            username: username,
            nickname: nickname,
            gift: giftName,
            repeatCount: repeatCount
          });

          return;
        }

        // ========================================
        // ROSA
        // GIRL BRUTALITY
        // ========================================

        if (normalizedGift === "rosa") {

          sendGameCommand({
            type: "attack",
            side: "girl",
            brutality: true,
            power: 10,
            username: username,
            nickname: nickname,
            gift: giftName,
            repeatCount: repeatCount
          });

          return;
        }

        // ========================================
        // TIKTOK
        // BOY NORMAL ATTACK
        // ========================================

        if (normalizedGift === "tiktok") {

          sendGameCommand({
            type: "attack",
            side: "boy",
            brutality: false,
            power: 1,
            username: username,
            nickname: nickname,
            gift: giftName,
            repeatCount: repeatCount
          });

          return;
        }

        // ========================================
        // MIND BLOWN
        // BOY BRUTALITY
        // ========================================

        if (
          normalizedGift === "mind blown" ||
          normalizedGift === "mindblown"
        ) {

          sendGameCommand({
            type: "attack",
            side: "boy",
            brutality: true,
            power: 10,
            username: username,
            nickname: nickname,
            gift: giftName,
            repeatCount: repeatCount
          });

          return;
        }

        // ========================================
        // LIKE-POP
        // SWITCH GIRL CHARACTER
        // ========================================

        if (
          normalizedGift === "like-pop" ||
          normalizedGift === "like pop" ||
          normalizedGift === "likepop"
        ) {

          sendGameCommand({
            type: "switchCharacter",
            side: "girl",
            username: username,
            nickname: nickname,
            gift: giftName,
            repeatCount: repeatCount
          });

          return;
        }

        // ========================================
        // PAPER CRANE
        // SWITCH BOY CHARACTER
        // ========================================

        if (
          normalizedGift === "paper crane" ||
          normalizedGift === "papercrane"
        ) {

          sendGameCommand({
            type: "switchCharacter",
            side: "boy",
            username: username,
            nickname: nickname,
            gift: giftName,
            repeatCount: repeatCount
          });

          return;
        }

        // ========================================
        // UNKNOWN GIFT
        // ========================================

        console.log(
          `ℹ️ Gift received but no action configured: ${giftName}`
        );
      }
    );

    await tiktokConnection.connect();

  } catch (error) {

    console.error(
      "❌ Failed to connect to TikTok LIVE:"
    );

    console.error(error);

    io.emit("tiktokStatus", {
      connected: false,
      error: String(error)
    });

    // Try again after 10 seconds
    setTimeout(connectTikTok, 10000);
  }
}

// ==========================================
// START SERVER
// ==========================================

server.listen(PORT, () => {

  console.log("");
  console.log("====================================");
  console.log("MORTAL KOMBAT TIKTOK SERVER");
  console.log("====================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`TikTok: @${TIKTOK_USERNAME}`);
  console.log("====================================");
  console.log("");

  connectTikTok();
});
