(function () {

  const SERVER_URL =
    "https://gift-battle-o0kv.onrender.com";

  const socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
    reconnection: true
  });


  /* =========================================================
     DEBUG STATUS
  ========================================================= */

  function showStatus(message) {

    console.log(message);

    let box =
      document.getElementById("tiktok-debug");

    if (!box) {

      box =
        document.createElement("div");

      box.id =
        "tiktok-debug";

      box.style.position =
        "fixed";

      box.style.top =
        "5px";

      box.style.left =
        "5px";

      box.style.right =
        "5px";

      box.style.zIndex =
        "99999";

      box.style.padding =
        "8px";

      box.style.background =
        "rgba(0,0,0,0.9)";

      box.style.color =
        "#00ff00";

      box.style.fontFamily =
        "Arial";

      box.style.fontSize =
        "12px";

      box.style.border =
        "1px solid #00ff00";

      box.style.borderRadius =
        "5px";

      document.body.appendChild(box);

    }

    box.innerText =
      message;

  }


  /* =========================================================
     SERVER CONNECTION
  ========================================================= */

  socket.on("connect", () => {

    showStatus(
      "🟢 GAME CONNECTED | SERVER ONLINE"
    );

  });


  socket.on("connect_error", (error) => {

    showStatus(
      "🔴 SERVER ERROR: " +
      error.message
    );

  });


  socket.on("disconnect", (reason) => {

    showStatus(
      "🔴 SERVER DISCONNECTED: " +
      reason
    );

  });


  /* =========================================================
     TIKTOK STATUS
  ========================================================= */

  socket.on("tiktokStatus", (status) => {

    if (status.connected) {

      showStatus(
        "🟢 TIKTOK LIVE CONNECTED"
      );

    } else {

      showStatus(
        "🟠 SERVER ONLINE / TIKTOK OFFLINE"
      );

    }

  });


  /* =========================================================
     NORMALIZE GIFT NAME
  ========================================================= */

  function normalizeGift(gift) {

    return String(gift || "")
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/g, "");

  }


  /* =========================================================
     CONVERT SERVER COMMAND → V2 GAME
  ========================================================= */

  socket.on("gameCommand", (command) => {

    if (!command) return;


    const username =
      command.username ||
      "Viewer";

    const gift =
      command.gift ||
      "";

    const normalizedGift =
      normalizeGift(gift);


    showStatus(
      "🎁 " +
      username +
      " → " +
      gift
    );


    /* =======================================================
       CHARACTER SWITCH
    ======================================================= */

    if (
      command.type ===
      "switchCharacter"
    ) {

      switchCharacter(
        command.side,
        username,
        gift
      );

      return;

    }


    /* =======================================================
       FOLLOW
    ======================================================= */

    if (
      normalizedGift === "follow" ||
      normalizedGift === "followattack"
    ) {

      handleTikTokGift({

        side: "boy",

        username:
          username,

        giftName:
          gift || "Follow",

        giftId:
          "follow",

        repeatCount:
          1

      });

      return;

    }


    /* =======================================================
       LIKE
    ======================================================= */

    if (
      normalizedGift === "like" ||
      normalizedGift === "likes"
    ) {

      handleTikTokGift({

        side: "girl",

        username:
          username,

        giftName:
          gift || "Like",

        giftId:
          "like",

        repeatCount:
          1

      });

      return;

    }


    /* =======================================================
       ROSE
    ======================================================= */

    if (
      normalizedGift === "rose"
    ) {

      handleTikTokGift({

        side: "girl",

        username:
          username,

        giftName:
          gift,

        giftId:
          "rose",

        repeatCount:
          1

      });

      return;

    }


    /* =======================================================
       ROSA
    ======================================================= */

    if (
      normalizedGift === "rosa"
    ) {

      handleTikTokGift({

        side: "girl",

        username:
          username,

        giftName:
          gift,

        giftId:
          "rosa",

        repeatCount:
          1

      });

      return;

    }


    /* =======================================================
       TIKTOK GIFT
    ======================================================= */

    if (
      normalizedGift === "tiktok"
    ) {

      handleTikTokGift({

        side: "boy",

        username:
          username,

        giftName:
          gift,

        giftId:
          "tiktok",

        repeatCount:
          1

      });

      return;

    }


    /* =======================================================
       MIND BLOWN
    ======================================================= */

    if (
      normalizedGift === "mindblown"
    ) {

      handleTikTokGift({

        side: "boy",

        username:
          username,

        giftName:
          gift,

        giftId:
          "mindblown",

        repeatCount:
          1

      });

      return;

    }


    /* =======================================================
       OLD SERVER ATTACK COMMAND
       BACKWARD COMPATIBILITY
    ======================================================= */

    if (
      command.type ===
      "attack"
    ) {

      /*
         Instead of using the old attack()
         function, convert the command
         into the new V2 system.
      */

      let side =
        command.side;

      let giftId =
        normalizedGift;


      /*
         If the old server doesn't provide
         a recognizable gift name, use the
         side as a fallback.
      */

      if (
        !giftId ||
        ![
          "like",
          "likes",
          "rose",
          "rosa",
          "follow",
          "followattack",
          "tiktok",
          "mindblown"
        ].includes(giftId)
      ) {

        if (side === "girl") {

          giftId =
            command.brutality
            ? "rosa"
            : "rose";

        } else {

          giftId =
            command.brutality
            ? "mindblown"
            : "tiktok";

        }

      }


      handleTikTokGift({

        side:
          side,

        username:
          username,

        giftName:
          gift,

        giftId:
          giftId,

        repeatCount:
          1

      });

      return;

    }

  });


})();
