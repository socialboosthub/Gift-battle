import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  TikTokLiveClient,
  EventType
} from "piratetok-live-js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

const TIKTOK_USERNAME =
  process.env.TIKTOK_USERNAME || "yaboysavage_";

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
    clients: io.engine.clientsCount,
    tiktokConnected: tiktokConnected
  });
});

// ==========================================
// SOCKET.IO
// ==========================================

io.on("connection", (socket) => {

  console.log(
    "Mortal Kombat page connected:",
    socket.id
  );

  socket.emit("serverStatus", {
    connected: true,
    tiktokUsername: TIKTOK_USERNAME
  });

  socket.emit("tiktokStatus", {
    connected: tiktokConnected
  });

  socket.on("disconnect", () => {

    console.log(
      "Mortal Kombat page disconnected:",
      socket.id
    );

  });

});

// ==========================================
// SEND COMMAND TO GAME
// ==========================================

function sendGameCommand(command) {

  console.log(
    "🎮 GAME COMMAND:",
    JSON.stringify(command)
  );

  io.emit(
    "gameCommand",
    command
  );

}

// ==========================================
// TIKTOK CONNECTION
// ==========================================

let tiktokConnected = false;

let tiktokClient = null;

async function connectTikTok() {

  try {

    console.log("");
    console.log("------------------------------------");
    console.log("Connecting to TikTok LIVE...");
    console.log(
      "Username:",
      TIKTOK_USERNAME
    );
    console.log("------------------------------------");

    tiktokClient =
      new TikTokLiveClient(
        TIKTOK_USERNAME
      );

    // ======================================
    // CONNECTED
    // ======================================

    tiktokClient.on(
      EventType.connected,
      (data) => {

        tiktokConnected = true;

        console.log(
          "===================================="
        );

        console.log(
          "✅ TIKTOK LIVE CONNECTED!"
        );

        console.log(
          "Username:",
          TIKTOK_USERNAME
        );

        console.log(
          "===================================="
        );

        io.emit(
          "tiktokStatus",
          {
            connected: true
          }
        );

      }
    );

    // ======================================
    // DISCONNECTED
    // ======================================

    tiktokClient.on(
      EventType.disconnected,
      () => {

        tiktokConnected = false;

        console.log(
          "🔴 TikTok LIVE disconnected."
        );

        io.emit(
          "tiktokStatus",
          {
            connected: false
          }
        );

      }
    );

    // ======================================
    // GIFTS
    // ======================================

    tiktokClient.on(
      EventType.gift,
      (data) => {

        console.log(
          "===================================="
        );

        console.log(
          "🎁 RAW GIFT EVENT"
        );

        console.log(
          JSON.stringify(data)
        );

        console.log(
          "===================================="
        );

        // ==================================
        // USER
        // ==================================

        const username =
          data.user?.uniqueId ||
          data.user?.nickname ||
          "Unknown";

        const nickname =
          data.user?.nickname ||
          username;

        // ==================================
        // GIFT
        // ==================================

        const giftName =
          data.gift?.name ||
          "";

        // ==================================
        // GIFT COUNT
        // ==================================

        // TikTok already tells us the actual
        // number of gifts in repeatCount.
        //
        // Example:
        // Rose x1  -> repeatCount = 1
        // Rose x5  -> repeatCount = 5
        // Rose x31 -> repeatCount = 31
        // Rose x50 -> repeatCount = 50

        const giftCount =
          Number(data.repeatCount) || 1;

        const isFinal =
          data.repeatEnd === 1;

        console.log(
          `🎁 ${username} sent ${giftName}`
        );

        console.log(
          "Gift count:",
          giftCount
        );

        console.log(
          "Final:",
          isFinal
        );

        // ==================================
        // WAIT FOR COMBO TO FINISH
        // ==================================

        // Only wait for gifts that are actually
        // combo/streak gifts.
        //
        // Normal gifts are processed immediately.
        //
        // Combo example:
        // x1 -> wait
        // x2 -> wait
        // x3 -> wait
        // ...
        // final event -> process

        if (
          data.gift?.combo === true &&
          data.repeatEnd !== 1
        ) {

          console.log(
            "⏳ Gift streak still running - waiting for final event..."
          );

          return;
        }

        // ==================================
        // NORMALIZE
        // ==================================

        const normalizedGift =
          giftName
            .trim()
            .toLowerCase();

        // ==================================
        // ROSE
        // GIRL NORMAL ATTACK
        // ==================================

        if (
          normalizedGift === "rose"
        ) {

          sendGameCommand({

            type: "attack",

            side: "girl",

            brutality: false,

            power: 1,

            username: username,

            nickname: nickname,

            gift: giftName,

            repeatCount:
              giftCount

          });

          return;
        }

        // ==================================
        // ROSA
        // GIRL BRUTALITY
        // ==================================

        if (
          normalizedGift === "rosa"
        ) {

          sendGameCommand({

            type: "attack",

            side: "girl",

            brutality: true,

            power: 10,

            username: username,

            nickname: nickname,

            gift: giftName,

            repeatCount:
              giftCount

          });

          return;
        }

        // ==================================
        // TIKTOK
        // BOY NORMAL ATTACK
        // ==================================

        if (
          normalizedGift === "tiktok"
        ) {

          sendGameCommand({

            type: "attack",

            side: "boy",

            brutality: false,

            power: 1,

            username: username,

            nickname: nickname,

            gift: giftName,

            repeatCount:
              giftCount

          });

          return;
        }

        // ==================================
        // MIND BLOWN
        // BOY BRUTALITY
        // ==================================

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

            repeatCount:
              giftCount

          });

          return;
        }

        // ==================================
        // LIKE-POP
        // GIRL SWITCH
        // ==================================

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

            repeatCount:
              giftCount

          });

          return;
        }

        // ==================================
        // PAPER CRANE
        // BOY SWITCH
        // ==================================

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

            repeatCount:
              giftCount

          });

          return;
        }

        // ==================================
        // UNKNOWN GIFT
        // ==================================

        console.log(
          "ℹ️ No action configured for:",
          giftName
        );

      }
    );

    // ======================================
    // CONNECT
    // ======================================

    await tiktokClient.connect();

  } catch (error) {

    tiktokConnected = false;

    console.error(
      "❌ FAILED TO CONNECT TO TIKTOK LIVE"
    );

    console.error(error);

    io.emit(
      "tiktokStatus",
      {
        connected: false,
        error: String(error)
      }
    );

    console.log(
      "Retrying in 10 seconds..."
    );

    setTimeout(
      connectTikTok,
      10000
    );

  }

}

// ==========================================
// START SERVER
// ==========================================

server.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "===================================="
    );

    console.log(
      "MORTAL KOMBAT TIKTOK SERVER"
    );

    console.log(
      "===================================="
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `TikTok: @${TIKTOK_USERNAME}`
    );

    console.log(
      "===================================="
    );

    console.log("");

    connectTikTok();

  }
);
