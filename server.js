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
// GIFT TRACKING
// ==========================================
//
// TikTok combo gifts can arrive like:
//
// x1
// x2
// x3
// x4
// ...
// x29
//
// repeatCount is a RUNNING TOTAL.
//
// Therefore:
//
// x1 -> +1
// x2 -> +1
// x3 -> +1
//
// Total = 3
//
// We also protect against the SAME raw
// TikTok message being delivered twice.
//
// ==========================================

const activeGiftCombos = new Map();

const processedMessageIds = new Map();

const completedCombos = new Map();

// How long duplicate message protection stays alive.
const MESSAGE_MEMORY_MS = 60 * 1000;

// How long a finished combo remains protected.
const COMPLETED_COMBO_MEMORY_MS = 60 * 1000;

// ==========================================
// CLEAN OLD TRACKING DATA
// ==========================================

function cleanupTracking() {

  const now = Date.now();

  // ----------------------------------------
  // Remove old processed message IDs
  // ----------------------------------------

  for (const [id, timestamp] of processedMessageIds) {

    if (
      now - timestamp >
      MESSAGE_MEMORY_MS
    ) {

      processedMessageIds.delete(id);

    }

  }

  // ----------------------------------------
  // Remove old completed combos
  // ----------------------------------------

  for (const [key, timestamp] of completedCombos) {

    if (
      now - timestamp >
      COMPLETED_COMBO_MEMORY_MS
    ) {

      completedCombos.delete(key);

    }

  }

}

setInterval(
  cleanupTracking,
  10 * 1000
);

// ==========================================
// GET USER ID
// ==========================================

function getUserId(data) {

  return String(
    data.user?.id ||
    data.user?.uniqueId ||
    data.user?.nickname ||
    "unknown-user"
  );

}

// ==========================================
// GET GIFT ID
// ==========================================

function getGiftId(data) {

  return String(
    data.gift?.id ||
    data.giftId ||
    data.gift?.name ||
    "unknown-gift"
  );

}

// ==========================================
// GET COMBO KEY
// ==========================================
//
// groupId identifies a particular TikTok
// gift streak.
//
// This is better than using only username
// + gift because separate gifts must remain
// separate.
//

function getComboKey(data) {

  const userId =
    getUserId(data);

  const giftId =
    getGiftId(data);

  const groupId =
    data.groupId;

  if (
    groupId !== undefined &&
    groupId !== null &&
    String(groupId) !== ""
  ) {

    return `${userId}:${giftId}:group:${groupId}`;

  }

  // Fallback for gifts without groupId.
  return `${userId}:${giftId}:nogroup`;

}

// ==========================================
// GET RAW MESSAGE ID
// ==========================================

function getMessageId(data) {

  return String(
    data.common?.msgId ||
    data.msgId ||
    ""
  );

}

// ==========================================
// GET GIFT COUNT
// ==========================================

function getGiftCount(data) {

  const repeatCount =
    Number(data.repeatCount);

  if (
    Number.isFinite(repeatCount) &&
    repeatCount > 0
  ) {

    return repeatCount;

  }

  const comboCount =
    Number(data.comboCount);

  if (
    Number.isFinite(comboCount) &&
    comboCount > 0
  ) {

    return comboCount;

  }

  // A gift event with no repeatCount is
  // treated as exactly ONE gift.
  return 1;

}

// ==========================================
// CHECK DUPLICATE RAW EVENT
// ==========================================

function isDuplicateMessage(data) {

  const messageId =
    getMessageId(data);

  // If there is no message ID, we cannot
  // perform this particular check.
  if (!messageId) {

    return false;

  }

  if (
    processedMessageIds.has(messageId)
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
// CALCULATE NEW GIFTS
// ==========================================

function calculateNewGiftCount(data) {

  const currentCount =
    getGiftCount(data);

  const key =
    getComboKey(data);

  // ----------------------------------------
  // If this combo was already completed,
  // ignore late duplicate events.
  // ----------------------------------------

  if (
    completedCombos.has(key)
  ) {

    console.log(
      "🛑 COMPLETED COMBO EVENT IGNORED:",
      key
    );

    return 0;

  }

  // ----------------------------------------
  // Get previous running total
  // ----------------------------------------

  const previousCount =
    activeGiftCombos.get(key) || 0;

  // ----------------------------------------
  // Calculate DELTA
  // ----------------------------------------

  const newGiftCount =
    currentCount - previousCount;

  console.log(
    `📊 Combo ${key}`
  );

  console.log(
    `Previous total: ${previousCount}`
  );

  console.log(
    `Current total: ${currentCount}`
  );

  console.log(
    `NEW gifts: ${newGiftCount}`
  );

  // ----------------------------------------
  // IMPORTANT:
  //
  // NEVER turn 0 into 1.
  //
  // 0 means the event was already counted.
  // ----------------------------------------

  if (newGiftCount <= 0) {

    console.log(
      "🛑 No new gifts in this event."
    );

    // Still remember the highest count.
    if (
      currentCount >
      previousCount
    ) {

      activeGiftCombos.set(
        key,
        currentCount
      );

    }

    return 0;

  }

  // ----------------------------------------
  // Save newest running total
  // ----------------------------------------

  activeGiftCombos.set(
    key,
    currentCount
  );

  // ----------------------------------------
  // If this is the final event, remember
  // that the combo has already been finished.
  // ----------------------------------------

  if (
    Number(data.repeatEnd) === 1
  ) {

    completedCombos.set(
      key,
      Date.now()
    );

    activeGiftCombos.delete(
      key
    );

    console.log(
      "🏁 COMBO FINISHED:",
      key,
      "Final total:",
      currentCount
    );

  }

  return newGiftCount;

}

// ==========================================
// PROCESS GIFT
// ==========================================

function processGift(data) {

  // ========================================
  // FIRST:
  // Ignore duplicate raw TikTok messages.
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
  // CALCULATE ONLY THE NEW GIFTS
  // ========================================

  const newGiftCount =
    calculateNewGiftCount(data);

  // ========================================
  // ZERO = ALREADY COUNTED
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
    `📦 New gift units: ${newGiftCount}`
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
  // GIRL BRUTALITY
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
// TIKTOK CONNECTION
// ==========================================

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
