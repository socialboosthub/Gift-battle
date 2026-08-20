import express from "express";

import http from "http";

import {
  Server
} from "socket.io";

import {
  TikTokLiveClient,
  EventType,
  GiftStreakTracker,
  LikeAccumulator
} from "piratetok-live-js";


const app =
  express();


const server =
  http.createServer(
    app
  );


const io =
  new Server(
    server,
    {
      cors:{
        origin:"*"
      }
    }
  );


const PORT =
  process.env.PORT ||
  3000;


const TIKTOK_USERNAME =
  process.env.TIKTOK_USERNAME ||
  "wealthy_vibezz";


/* =========================
   BATTLE POWER
========================= */

const NORMAL_GIFT_POWER =
  5;

const BIG_GIFT_POWER =
  50;

const FOLLOW_POWER =
  1;

const LIKES_PER_POINT =
  100;

const LIKE_POWER =
  1;


/* =========================
   TIKTOK STATE
========================= */

let tiktokConnected =
  false;

let tiktokClient =
  null;


let giftStreakTracker =
  new GiftStreakTracker();


let likeAccumulator =
  new LikeAccumulator();


let lastLikeTotal =
  0;


let likeRemainder =
  0;


/* =========================
   DUPLICATE PROTECTION
========================= */

const processedMessageIds =
  new Map();


const MESSAGE_MEMORY_MS =
  60 * 1000;


function getMessageId(
  data
){

  return String(

    data?.common?.msgId ||

    data?.msgId ||

    ""

  );

}


function isDuplicateMessage(
  data
){

  const id =
    getMessageId(
      data
    );


  if(!id)
    return false;


  if(
    processedMessageIds.has(
      id
    )
  ){

    console.log(
      "🛑 DUPLICATE EVENT:",
      id
    );

    return true;

  }


  processedMessageIds.set(
    id,
    Date.now()
  );


  return false;

}


setInterval(
  function(){

    const now =
      Date.now();


    for(
      const [
        id,
        timestamp
      ]
      of processedMessageIds
    ){

      if(
        now - timestamp >
        MESSAGE_MEMORY_MS
      ){

        processedMessageIds.delete(
          id
        );

      }

    }

  },
  10000
);


/* =========================
   AVATAR
========================= */

function getAvatarUrl(
  data
){

  const user =
    data?.user || {};


  return String(

    user.avatarLarger ||

    user.avatarMedium ||

    user.avatarThumb ||

    user.avatar ||

    user.profilePicture ||

    user.profilePic ||

    data?.avatarUrl ||

    data?.avatar ||

    ""

  ).trim();

}


/* =========================
   USER DATA
========================= */

function getUserInfo(
  data
){

  const username =

    data?.user?.uniqueId ||

    data?.user?.nickname ||

    "Unknown";


  const nickname =

    data?.user?.nickname ||

    username;


  const avatarUrl =
    getAvatarUrl(
      data
    );


  return {

    username,

    nickname,

    avatarUrl

  };

}


/* =========================
   EXPRESS
========================= */

app.get(
  "/",
  (req,res) => {

    res.send(
      "TikTok Mortal Kombat server is running!"
    );

  }
);


app.get(
  "/status",
  (req,res) => {

    res.json({

      running:true,

      tiktokUsername:
        TIKTOK_USERNAME,

      clients:
        io.engine.clientsCount,

      tiktokConnected

    });

  }
);


/* =========================
   SOCKET.IO
========================= */

io.on(
  "connection",
  socket => {

    console.log(
      "Mortal Kombat page connected:",
      socket.id
    );


    socket.emit(
      "serverStatus",
      {

        connected:true,

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


    socket.on(
      "disconnect",
      () => {

        console.log(
          "Mortal Kombat page disconnected:",
          socket.id
        );

      }
    );

  }
);


/* =========================
   SEND GAME COMMAND
========================= */

function sendGameCommand(
  command
){

  console.log(
    "🎮 GAME COMMAND:",
    JSON.stringify(
      command
    )
  );


  io.emit(
    "gameCommand",
    command
  );

}


/* =========================
   PROCESS GIFTS
========================= */

function processGift(
  data
){

  if(
    isDuplicateMessage(
      data
    )
  ){

    return;

  }


  const {

    username,

    nickname,

    avatarUrl

  } =
    getUserInfo(
      data
    );


  const giftName =
    data?.gift?.name ||
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


  if(
    newGiftCount <= 0
  ){

    return;

  }


  console.log(
    `🎁 ${username} sent ${giftName} x${newGiftCount}`
  );


  const baseCommand = {

    username,

    nickname,

    avatarUrl,

    gift:
      giftName,

    repeatCount:
      newGiftCount

  };


  /* ======================
     ROSE
     GIRL +5
  ====================== */

  if(
    normalizedGift ===
    "rose"
  ){

    sendGameCommand({

      type:"attack",

      side:"girl",

      brutality:false,

      power:
        NORMAL_GIFT_POWER,

      ...baseCommand

    });

    return;

  }


  /* ======================
     ROSA
     GIRL +50
  ====================== */

  if(
    normalizedGift ===
    "rosa"
  ){

    sendGameCommand({

      type:"attack",

      side:"girl",

      brutality:true,

      power:
        BIG_GIFT_POWER,

      ...baseCommand

    });

    return;

  }


  /* ======================
     TIKTOK
     BOY +5
  ====================== */

  if(
    normalizedGift ===
    "tiktok"
  ){

    sendGameCommand({

      type:"attack",

      side:"boy",

      brutality:false,

      power:
        NORMAL_GIFT_POWER,

      ...baseCommand

    });

    return;

  }


  /* ======================
     NECKLACE
     BOY +50
  ====================== */

  if(

    normalizedGift ===
      "necklace" ||

    normalizedGift ===
      "friendship necklace" ||

    normalizedGift ===
      "friendshipnecklace"

  ){

    sendGameCommand({

      type:"attack",

      side:"boy",

      brutality:true,

      power:
        BIG_GIFT_POWER,

      ...baseCommand

    });

    return;

  }


  /* ======================
     BOUQUET
     SWITCH GIRL
  ====================== */

  if(
    normalizedGift ===
    "bouquet"
  ){

    sendGameCommand({

      type:
        "switchCharacter",

      side:
        "girl",

      ...baseCommand

    });

    return;

  }


  /* ======================
     CONFETTI
     SWITCH BOY
  ====================== */

  if(
    normalizedGift ===
    "confetti"
  ){

    sendGameCommand({

      type:
        "switchCharacter",

      side:
        "boy",

      ...baseCommand

    });

    return;

  }


  console.log(
    "ℹ️ No action configured for:",
    giftName
  );

}


/* =========================
   FOLLOW
========================= */

function processFollow(
  data
){

  if(
    isDuplicateMessage(
      data
    )
  ){

    return;

  }


  const {

    username,

    nickname,

    avatarUrl

  } =
    getUserInfo(
      data
    );


  sendGameCommand({

    type:
      "attack",

    side:
      "boy",

    brutality:
      false,

    power:
      FOLLOW_POWER,

    username,

    nickname,

    avatarUrl,

    gift:
      "Follow",

    actionLabel:
      "Follow",

    repeatCount:
      1

  });

}


/* =========================
   LIKES
========================= */

function processLike(
  data
){

  if(
    isDuplicateMessage(
      data
    )
  ){

    return;

  }


  const {

    username,

    nickname,

    avatarUrl

  } =
    getUserInfo(
      data
    );


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


  if(
    newLikes <= 0
  ){

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


  for(
    let i=0;
    i<pointCount;
    i++
  ){

    sendGameCommand({

      type:
        "attack",

      side:
        "girl",

      brutality:
        false,

      power:
        LIKE_POWER,

      username,

      nickname,

      avatarUrl,

      gift:
        "100 Likes",

      actionLabel:
        "100 Likes",

      repeatCount:
        1

    });

  }

}


/* =========================
   CONNECT TIKTOK
========================= */

async function connectTikTok(){

  try{

    console.log(
      "Connecting to TikTok LIVE..."
    );


    console.log(
      "Username:",
      TIKTOK_USERNAME
    );


    giftStreakTracker =
      new GiftStreakTracker();


    likeAccumulator =
      new LikeAccumulator();


    lastLikeTotal =
      0;


    likeRemainder =
      0;


    tiktokClient =
      new TikTokLiveClient(
        TIKTOK_USERNAME
      );


    /* CONNECTED */

    tiktokClient.on(

      EventType.connected,

      () => {

        tiktokConnected =
          true;


        console.log(
          "================================"
        );


        console.log(
          "✅ TIKTOK LIVE CONNECTED!"
        );


        console.log(
          "Username:",
          TIKTOK_USERNAME
        );


        console.log(
          "================================"
        );


        io.emit(
          "tiktokStatus",
          {
            connected:true
          }
        );

      }

    );


    /* DISCONNECTED */

    tiktokClient.on(

      EventType.disconnected,

      () => {

        tiktokConnected =
          false;


        console.log(
          "🔴 TikTok LIVE disconnected"
        );


        io.emit(
          "tiktokStatus",
          {
            connected:false
          }
        );

      }

    );


    /* GIFTS */

    tiktokClient.on(

      EventType.gift,

      data => {

        console.log(
          "🎁 RAW GIFT EVENT:",
          JSON.stringify(
            data
          )
        );


        processGift(
          data
        );

      }

    );


    /* FOLLOWS */

    tiktokClient.on(

      EventType.follow,

      data => {

        console.log(
          "👤 FOLLOW:",
          JSON.stringify(
            data
          )
        );


        processFollow(
          data
        );

      }

    );


    /* LIKES */

    tiktokClient.on(

      EventType.like,

      data => {

        console.log(
          "❤️ LIKE:",
          JSON.stringify(
            data
          )
        );


        processLike(
          data
        );

      }

    );


    await tiktokClient.connect();

  }


  catch(error){

    tiktokConnected =
      false;


    console.error(
      "❌ FAILED TO CONNECT TO TIKTOK LIVE",
      error
    );


    io.emit(
      "tiktokStatus",
      {

        connected:false,

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


/* =========================
   START
========================= */

server.listen(

  PORT,

  () => {

    console.log(
      "================================"
    );

    console.log(
      "MORTAL KOMBAT TIKTOK SERVER"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `TikTok: @${TIKTOK_USERNAME}`
    );

    console.log(
      "================================"
    );


    connectTikTok();

  }

);
