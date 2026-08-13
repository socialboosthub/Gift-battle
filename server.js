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

// ==========================================
// GIFT STREAK TRACKING
// ==========================================
//
// PirateTok's GiftStreakTracker handles TikTok's
// cumulative repeatCount values.
//
// Example:
//
// TikTok: x1 -> x2 -> x3 -> x4 -> x5
//
// Game receives:
//
// +1 -> +1 -> +1 -> +1 -> +1
//
// Total = exactly 5 gifts.
//
// ==========================================

let giftStreakTracker =
  new GiftStreakTracker();

// ==========================================
// DUPLICATE MESSAGE PROTECTION
// ==========================================

const processedMessageIds =
  new Map();

const MESSAGE_MEMORY_MS =
  60 * 1000;

function cleanupTracking() {

  const now = Date.now();

  for (
    const [id, timestamp]
    of processedMessageIds
  ) {

    if (
      now - timestamp >
      MESSAGE_MEMORY_MS
    ) {

      processedMessageIds.delete(id);

    }

  }

}

setInterval(
  cleanupTracking,
  10 * 1000
);

// ==========================================
// GET MESSAGE ID
// ==========================================

function getMessageId(data) {

  return String(
    data.common?.msgId ||
    data.msgId ||
    ""
  );

}

// ==========================================
// DUPLICATE CHECK
// ==========================================

function isDuplicateMessage(data) {

  const messageId =
    getMessageId(data);

  if (!messageId) {

    return false;

  }

  if (
    processedMessageIds.has(
      messageId
    )
  ) {

    console.log(
      "🛑 DUPLICATE TIKTOK EVENT IGNORED:",
      messageId
    );

    return true;

  }

  processedMessageIds.set(
    messageId,
    Date.now()
  );

  return false;

}

// ==========================================
// PROCESS GIFT
// ==========================================

function processGift(data) {

  // ========================================
  // Ignore duplicate raw messages
  // ========================================

  if (
    isDuplicateMessage(data)
  ) {

    return;

  }

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
    giftName
      .trim()
      .toLowerCase();

  // ========================================
  // USE PIRATETOK STREAK TRACKER
  // ========================================

  const streak =
    giftStreakTracker.process(
      data
    );

  const newGiftCount =
    Number(
      streak?.eventGiftCount
    ) || 0;

  // ========================================
  // NOTHING NEW
  // ========================================

  if (
    newGiftCount <= 0
  ) {

    console.log(
      `🛑 ${username} ${giftName} produced no new gifts.`
    );

    return;

  }

  console.log(
    "===================================="
  );

  console.log(
    `🎁 ${username} sent ${giftName}`
  );

  console.log(
    `📦 NEW GIFT UNITS: ${newGiftCount}`
  );

  console.log(
    `📊 TikTok running total: ${
      data.repeatCount || 1
    }`
  );

  console.log(
    `🏁 Final event: ${
      Number(data.repeatEnd) === 1
    }`
  );

  console.log(
    "===================================="
  );

  // ========================================
  // ROSE
  // GIRL NORMAL ATTACK
  // ========================================

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

      repeatCount: newGiftCount

    });

    return;

  }

  // ========================================
  // ROSA
  // GIRL BIG ATTACK
  // ========================================

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

      repeatCount: newGiftCount

    });

    return;

  }

  // ========================================
  // TIKTOK
  // BOY NORMAL ATTACK
  // ========================================

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

      repeatCount: newGiftCount

    });

    return;

  }

  // ========================================
  // MIND BLOWN
  // BOY BIG ATTACK
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

      repeatCount: newGiftCount

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

      username: username,

      nickname: nickname,

      gift: giftName,

      repeatCount: newGiftCount

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

      username: username,

      nickname: nickname,

      gift: giftName,

      repeatCount: newGiftCount

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
// CONNECT TO TIKTOK
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

    // ======================================
    // RESET TRACKER FOR NEW CONNECTION
    // ======================================

    giftStreakTracker =
      new GiftStreakTracker();

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

    console.error(
      error
    );

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
