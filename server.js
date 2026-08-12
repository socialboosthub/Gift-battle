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
// STATE
// ==========================================

let tiktokConnected = false;
let tiktokClient = null;

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
// NORMALIZE GIFT NAME
// ==========================================

function normalizeGiftName(name) {

  return String(name || "")
    .trim()
    .toLowerCase();

}

// ==========================================
// PROCESS GIFT
// ==========================================

function processGift(data) {

  const username =
    data.user?.uniqueId ||
    data.user?.nickname ||
    "Unknown";

  const nickname =
    data.user?.nickname ||
    username;

  const giftName =
    data.gift?.name ||
    "";

  const normalizedGift =
    normalizeGiftName(giftName);

  const giftType =
    Number(data.gift?.type || 0);

  const repeatCount =
    Math.max(
      1,
      Number(data.repeatCount || 1)
    );

  const repeatEnd =
    data.repeatEnd === true ||
    data.repeatEnd === 1 ||
    data.repeatEnd === "1";

  const isComboGift =
    data.gift?.combo === true ||
    data.gift?.combo === 1 ||
    giftType === 1;

  // ========================================
  // LOG
  // ========================================

  console.log(
    "===================================="
  );

  console.log(
    `🎁 ${username} sent ${giftName}`
  );

  console.log(
    "Gift type:",
    giftType
  );

  console.log(
    "Repeat count:",
    repeatCount
  );

  console.log(
    "Combo gift:",
    isComboGift
  );

  console.log(
    "Repeat end:",
    repeatEnd
  );

  // ========================================
  // STREAKABLE GIFTS
  // ========================================

  // For combo/streak gifts, only process
  // the final event.
  //
  // Example:
  //
  // Rose x1 -> repeatEnd false
  // Rose x2 -> repeatEnd false
  // Rose x10 -> repeatEnd true
  //
  // We only want the x10 event.

  if (isComboGift && !repeatEnd) {

    console.log(
      "⏳ Gift streak still running - waiting for final event..."
    );

    console.log(
      "===================================="
    );

    return;
  }

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

      repeatCount: repeatCount,

      username: username,

      nickname: nickname,

      gift: giftName

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

      repeatCount: repeatCount,

      username: username,

      nickname: nickname,

      gift: giftName

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

      repeatCount: repeatCount,

      username: username,

      nickname: nickname,

      gift: giftName

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

      repeatCount: repeatCount,

      username: username,

      nickname: nickname,

      gift: giftName

    });

    return;
  }

  // ========================================
  // LIKE-POP
  // GIRL CHARACTER SWITCH
  // ========================================

  if (
    normalizedGift === "like-pop" ||
    normalizedGift === "like pop" ||
    normalizedGift === "likepop"
  ) {

    sendGameCommand({

      type: "switchCharacter",

      side: "girl",

      repeatCount: repeatCount,

      username: username,

      nickname: nickname,

      gift: giftName

    });

    return;
  }

  // ========================================
  // PAPER CRANE
  // BOY CHARACTER SWITCH
  // ========================================

  if (
    normalizedGift === "paper crane" ||
    normalizedGift === "papercrane"
  ) {

    sendGameCommand({

      type: "switchCharacter",

      side: "boy",

      repeatCount: repeatCount,

      username: username,

      nickname: nickname,

      gift: giftName

    });

    return;
  }

  // ========================================
  // UNKNOWN GIFT
  // ========================================

  console.log(
    "ℹ️ No action configured for:",
    giftName
  );

}

// ==========================================
// TIKTOK CONNECTION
// ==========================================

async function connectTikTok() {

  try {

    console.log("");
    console.log(
      "------------------------------------"
    );

    console.log(
      "Connecting to TikTok LIVE..."
    );

    console.log(
      "Username:",
      TIKTOK_USERNAME
    );

    console.log(
      "------------------------------------"
    );

    tiktokClient =
      new TikTokLiveClient(
        TIKTOK_USERNAME
      );

    // ======================================
    // CONNECTED
    // ======================================

    tiktokClient.on(
      EventType.connected,
      () => {

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
          ""
        );

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

        processGift(data);

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
