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
// IMPORTANT:
// Tracks the current TikTok gift combo.
// TikTok sends repeatCount as a CUMULATIVE number.
//
// Example:
//
// Event 1 = repeatCount 1
// Event 2 = repeatCount 2
// Event 3 = repeatCount 3
// Event 4 = repeatCount 4
//
// We calculate the difference so the game
// receives exactly one attack for each gift.
//
// A direct ×50 gift gives repeatCount 50,
// so it produces 50 attacks.
// ==========================================

const activeGiftCombos = new Map();

function getComboKey(data) {

  const userId =
    data.user?.id ||
    data.user?.uniqueId ||
    data.user?.nickname ||
    "unknown";

  const giftId =
    data.gift?.id ||
    data.giftId ||
    data.gift?.name ||
    "unknown";

  const groupId =
    data.groupId ||
    "no-group";

  return `${userId}:${giftId}:${groupId}`;
}

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

  return 1;
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
    giftName
      .trim()
      .toLowerCase();

  const currentCount =
    getGiftCount(data);

  const key =
    getComboKey(data);

  // ========================================
  // Calculate how many NEW gifts arrived
  // ========================================

  const previousCount =
    activeGiftCombos.get(key) || 0;

  let newGiftCount =
    currentCount - previousCount;

  // If TikTok sends an unusual reset,
  // treat it as one new gift rather than
  // accidentally sending a negative number.
  if (newGiftCount < 1) {
    newGiftCount = 1;
  }

  activeGiftCombos.set(
    key,
    currentCount
  );

  // ========================================
  // Clean finished combo
  // ========================================

  if (data.repeatEnd === 1) {

    setTimeout(() => {

      const savedCount =
        activeGiftCombos.get(key);

      if (
        savedCount === currentCount
      ) {
        activeGiftCombos.delete(key);
      }

    }, 1000);

  }

  console.log(
    `🎁 ${username} sent ${giftName}`
  );

  console.log(
    `📦 TikTok repeatCount: ${currentCount}`
  );

  console.log(
    `➕ NEW gifts this event: ${newGiftCount}`
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
