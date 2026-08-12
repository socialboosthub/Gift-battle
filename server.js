import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  TikTokLiveClient,
  EventType,
  GiftStreakTracker
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

const giftTracker =
  new GiftStreakTracker();

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

        // ==========================================
    // TIKTOK GIFT RECEIVED
    // ==========================================

    tiktokClient.on(
      EventType.gift,
      (data) => {

        const username =
          data.uniqueId ||
          data.nickname ||
          "Supporter";

        const giftName =
          data.giftName ||
          data.giftDetails?.giftName ||
          "Gift";

        // Read how many gifts were sent in this combo
        const count = data.repeatCount || data.combo || 1;

        console.log(
          `🎁 ${username} sent ${giftName} (Count: ${count})`
        );

        // Function that loops 'count' times so every gift triggers individually
        const triggerAttack = (side, brutality) => {
          for (let i = 0; i < count; i++) {
            io.emit("gameCommand", {
              type: "attack",
              side: side,
              brutality: brutality,
              username: username,
              gift: giftName
            });
          }
        };

        // ==================================
        // GIRL GIFTS (Left Side)
        // ==================================

        if (giftName === "Rose" || giftName === "Rosa") {
          triggerAttack("girl", false);
          return;
        }

        if (giftName === "Paper Crane" || giftName === "Finger Heart") {
          triggerAttack("girl", true);
          return;
        }

        // ==================================
        // BOY GIFTS (Right Side)
        // ==================================

        if (
          giftName === "TikTok" ||
          giftName === "Ice Cream" ||
          giftName === "GG"
        ) {
          triggerAttack("boy", false);
          return;
        }

        if (
          giftName === "Doughnut" ||
          giftName === "Mind Blown" ||
          giftName === "Cap"
        ) {
          triggerAttack("boy", true);
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
