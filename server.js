import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  TikTokLiveClient,
  EventType,
  GiftStreakTracker,
  LikeAccumulator
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
  process.env.TIKTOK_USERNAME || "wealthy_vibezz";

// ==========================================
// BATTLE SCORING
// ==========================================
//
// Normal gift / hit = 5
// Big gift / brutality = 50
// One follow = 1
// Every 100 new likes = 1
// Battle target = 100
// ==========================================

const NORMAL_GIFT_POWER = 5;
const BIG_GIFT_POWER = 50;

const FOLLOW_POWER = 1;

const LIKES_PER_POINT = 100;
const LIKE_POWER = 1;

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

let giftStreakTracker =
  new GiftStreakTracker();

// ==========================================
// LIKE TRACKING
// ==========================================

let likeAccumulator =
  new LikeAccumulator();

let lastLikeTotal = 0;

let likeRemainder = 0;

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

  const streak =
    giftStreakTracker.process(
      data
    );

  const newGiftCount =
    Number(
      streak?.eventGiftCount
    ) || 0;

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
  // 5 POINTS
  // ========================================

  if (
    normalizedGift === "rose"
  ) {

    sendGameCommand({
      type: "attack",
      side: "girl",
      brutality: false,
      power: NORMAL_GIFT_POWER,
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
  // 50 POINTS
  // ========================================

  if (
    normalizedGift === "rosa"
  ) {

    sendGameCommand({
      type: "attack",
      side: "girl",
      brutality: true,
      power: BIG_GIFT_POWER,
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
  // 5 POINTS
  // ========================================

  if (
    normalizedGift === "tiktok"
  ) {

    sendGameCommand({
      type: "attack",
      side: "boy",
      brutality: false,
      power: NORMAL_GIFT_POWER,
      username: username,
      nickname: nickname,
      gift: giftName,
      repeatCount: newGiftCount
    });

    return;

  }

  // ========================================
  // FRIENDSHIP NECKLACE
  // BOY BIG ATTACK
  // 50 POINTS
  // ========================================

  if (
    normalizedGift === "friendship necklace" ||
    normalizedGift === "friendshipnecklace"
  ) {

    sendGameCommand({
      type: "attack",
      side: "boy",
      brutality: true,
      power: BIG_GIFT_POWER,
      username: username,
      nickname: nickname,
      gift: giftName,
      repeatCount: newGiftCount
    });

    return;

  }

  // ========================================
  // BOUQUET
  // GIRL CHARACTER SWITCH
  // ========================================

  if (
    normalizedGift === "bouquet"
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
  // CONFETTI
  // BOY CHARACTER SWITCH
  // ========================================

  if (
    normalizedGift === "confetti"
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
// PROCESS FOLLOW
// ==========================================

function processFollow(data) {

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

  console.log(
    `👤 ${username} followed | BOYS +${FOLLOW_POWER}`
  );

  sendGameCommand({
    type: "attack",
    side: "boy",
    brutality: false,
    power: FOLLOW_POWER,
    username: username,
    nickname: nickname,
    gift: "Follow",
    actionLabel: "Follow",
    repeatCount: 1
  });

}

// ==========================================
// PROCESS LIKES
// ==========================================

function processLike(data) {

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

  const stats =
    likeAccumulator.process(
      data
    );

  const totalLikeCount =
    Number(
      stats?.totalLikeCount
    ) || 0;

  const newLikes =
    Math.max(
      0,
      totalLikeCount -
      lastLikeTotal
    );

  lastLikeTotal =
    Math.max(
      lastLikeTotal,
      totalLikeCount
    );

  if (
    newLikes <= 0
  ) {

    return;

  }

  likeRemainder +=
    newLikes;

  const pointCount =
    Math.floor(
      likeRemainder /
      LIKES_PER_POINT
    );

  likeRemainder =
    likeRemainder %
    LIKES_PER_POINT;

  console.log(
    `❤️ ${username} +${newLikes} likes`
  );

  console.log(
    `🎯 Girls gained ${pointCount} point(s)`
  );

  console.log(
    `📦 Likes carried over: ${likeRemainder}/${LIKES_PER_POINT}`
  );

  for (
    let i = 0;
    i < pointCount;
    i++
  ) {

    sendGameCommand({
      type: "attack",
      side: "girl",
      brutality: false,
      power: LIKE_POWER,
      username: username,
      nickname: nickname,
      gift: "100 Likes",
      actionLabel: "100 Likes",
      repeatCount: 1
    });

  }

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
    // RESET GIFT TRACKER
    // ======================================

    giftStreakTracker =
      new GiftStreakTracker();

    // ======================================
    // RESET LIKE TRACKER
    // ======================================

    likeAccumulator =
      new LikeAccumulator();

    lastLikeTotal = 0;

    likeRemainder = 0;

    // ======================================
    // CREATE TIKTOK CLIENT
    // ======================================

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
    // FOLLOWS
    // ======================================

    tiktokClient.on(
      EventType.follow,
      (data) => {

        console.log(
          "===================================="
        );

        console.log(
          "👤 RAW FOLLOW EVENT"
        );

        console.log(
          JSON.stringify(data)
        );

        console.log(
          "===================================="
        );

        processFollow(data);

      }
    );

    // ======================================
    // LIKES
    // ======================================

    tiktokClient.on(
      EventType.like,
      (data) => {

        console.log(
          "===================================="
        );

        console.log(
          "❤️ RAW LIKE EVENT"
        );

        console.log(
          JSON.stringify(data)
        );

        console.log(
          "===================================="
        );

        processLike(data);

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

