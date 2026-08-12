import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import { Server } from "socket.io";

import {
  TikTokLiveClient,
  EventType,
  GiftStreakTracker,
  LikeAccumulator
} from "piratetok-live-js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "*"
  }
});


const PORT =
  process.env.PORT || 3000;


const TIKTOK_USERNAME =
  process.env.TIKTOK_USERNAME || "lxkt16";


/* =========================================================
   STATIC GAME
========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});


/* =========================================================
   STATUS
========================================================= */

let tiktokConnected = false;


app.get("/status", (req, res) => {

  res.json({

    running: true,

    tiktokUsername:
      TIKTOK_USERNAME,

    clients:
      io.engine.clientsCount,

    tiktokConnected:
      tiktokConnected

  });

});


/* =========================================================
   SOCKET.IO
========================================================= */

io.on("connection", (socket) => {

  console.log(
    "🎮 Mortal Kombat page connected:",
    socket.id
  );


  socket.emit(
    "serverStatus",
    {
      connected: true,
      tiktokUsername:
        TIKTOK_USERNAME
    }
  );


  socket.emit(
    "tiktokStatus",
    {
      connected:
        tiktokConnected
    }
  );


  socket.on("disconnect", () => {

    console.log(
      "🎮 Game disconnected:",
      socket.id
    );

  });

});


/* =========================================================
   SEND COMMAND TO GAME
========================================================= */

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


/* =========================================================
   TIKTOK
========================================================= */

let tiktokClient = null;


const giftTracker =
  new GiftStreakTracker();


const likeTracker =
  new LikeAccumulator();


async function connectTikTok() {

  try {

    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      "Connecting to TikTok LIVE..."
    );
    console.log(
      "Username:",
      TIKTOK_USERNAME
    );
    console.log(
      "===================================="
    );


    tiktokClient =
      new TikTokLiveClient(
        TIKTOK_USERNAME
      );


    /* =====================================================
       CONNECTED
    ===================================================== */

    tiktokClient.on(
      EventType.connected,
      () => {

        tiktokConnected = true;


        console.log(
          "🟢 TIKTOK LIVE CONNECTED!"
        );


        io.emit(
          "tiktokStatus",
          {
            connected: true
          }
        );

      }
    );


    /* =====================================================
       DISCONNECTED
    ===================================================== */

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


    /* =====================================================
       ❤️ LIKES
       
       1 new like = 1 damage
    ===================================================== */

    tiktokClient.on(
      EventType.like,
      (data) => {

        try {

          const username =
            data.user?.uniqueId ||
            data.user?.nickname ||
            "Unknown";


          const nickname =
            data.user?.nickname ||
            username;


          /*
             LikeAccumulator gives us the
             number of NEW likes rather than
             repeatedly counting TikTok's
             cumulative total.
          */

          const stats =
            likeTracker.process(data);


          const newLikes =
            Number(
              stats.accumulatedCount || 0
            );


          if (newLikes <= 0) {
            return;
          }


          console.log(
            `❤️ ${username} sent ${newLikes} LIKE(S)`
          );


          sendGameCommand({

            type:
              "attack",

            side:
              "girl",

            damage:
              newLikes,

            power:
              newLikes,

            brutality:
              false,

            username:
              username,

            nickname:
              nickname,

            gift:
              "Like",

            repeatCount:
              newLikes

          });


        } catch (error) {

          console.error(
            "Like processing error:",
            error
          );

        }

      }
    );


    /* =====================================================
       👤 FOLLOW
       
       1 follow = 3 damage
    ===================================================== */

    tiktokClient.on(
      EventType.follow,
      (data) => {

        try {

          const username =
            data.user?.uniqueId ||
            data.user?.nickname ||
            "Unknown";


          const nickname =
            data.user?.nickname ||
            username;


          console.log(
            `👤 ${username} FOLLOWED`
          );


          sendGameCommand({

            type:
              "attack",

            side:
              "boy",

            damage:
              3,

            power:
              3,

            brutality:
              false,

            username:
              username,

            nickname:
              nickname,

            gift:
              "Follow",

            repeatCount:
              1

          });


        } catch (error) {

          console.error(
            "Follow processing error:",
            error
          );

        }

      }
    );


    /* =====================================================
       🎁 GIFTS
    ===================================================== */

    tiktokClient.on(
      EventType.gift,
      (data) => {

        try {

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


          const streak =
            giftTracker.process(data);


          /*
             Wait for the final streak event
             so a streak isn't counted multiple
             times.
          */

          if (!streak.isFinal) {

            console.log(
              "⏳ Waiting for gift streak..."
            );

            return;

          }


          const count =
            Number(
              streak.eventGiftCount || 1
            );


          const normalizedGift =
            giftName
              .trim()
              .toLowerCase()
              .replace(/[-_]/g, " ");


          console.log(
            `🎁 ${username} sent ${count}x ${giftName}`
          );


          /* ==============================================
             🌹 ROSE
             
             1 Rose = 5 damage
          ============================================== */

          if (
            normalizedGift === "rose"
          ) {

            sendGameCommand({

              type:
                "attack",

              side:
                "girl",

              damage:
                5 * count,

              power:
                5 * count,

              brutality:
                false,

              username:
                username,

              nickname:
                nickname,

              gift:
                giftName,

              repeatCount:
                count

            });

            return;

          }


          /* ==============================================
             💥 ROSA
             
             1 Rosa = 15 damage
          ============================================== */

          if (
            normalizedGift === "rosa"
          ) {

            sendGameCommand({

              type:
                "attack",

              side:
                "girl",

              damage:
                15 * count,

              power:
                15 * count,

              brutality:
                true,

              username:
                username,

              nickname:
                nickname,

              gift:
                giftName,

              repeatCount:
                count

            });

            return;

          }


          /* ==============================================
             🎵 TIKTOK
             
             1 TikTok = 5 damage
          ============================================== */

          if (
            normalizedGift === "tiktok"
          ) {

            sendGameCommand({

              type:
                "attack",

              side:
                "boy",

              damage:
                5 * count,

              power:
                5 * count,

              brutality:
                false,

              username:
                username,

              nickname:
                nickname,

              gift:
                giftName,

              repeatCount:
                count

            });

            return;

          }


          /* ==============================================
             🤯 MIND BLOWN
             
             1 Mind Blown = 15 damage
          ============================================== */

          if (
            normalizedGift === "mind blown" ||
            normalizedGift === "mindblown"
          ) {

            sendGameCommand({

              type:
                "attack",

              side:
                "boy",

              damage:
                15 * count,

              power:
                15 * count,

              brutality:
                true,

              username:
                username,

              nickname:
                nickname,

              gift:
                giftName,

              repeatCount:
                count

            });

            return;

          }


          console.log(
            "ℹ️ Gift has no configured action:",
            giftName
          );


        } catch (error) {

          console.error(
            "Gift processing error:",
            error
          );

        }

      }
    );


    /* =====================================================
       CONNECT
    ===================================================== */

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
        error:
          String(error)
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


/* =========================================================
   START SERVER
========================================================= */

server.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "===================================="
    );

    console.log(
      "🔥 MORTAL KOMBAT TIKTOK SERVER"
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

    connectTikTok();

  }
);
