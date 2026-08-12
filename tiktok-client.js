(function () {

  const SERVER_URL = "https://gift-battle-o0kv.onrender.com";

  const socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
    reconnection: true
  });


  /* =========================
     DEBUG STATUS
  ========================= */

  function showStatus(message) {

    console.log(message);

    let box =
      document.getElementById("tiktok-debug");

    if (!box) {

      box = document.createElement("div");

      box.id = "tiktok-debug";

      box.style.position = "fixed";
      box.style.top = "5px";
      box.style.left = "5px";
      box.style.right = "5px";
      box.style.zIndex = "99999";
      box.style.padding = "8px";
      box.style.background =
        "rgba(0,0,0,0.9)";
      box.style.color = "#00ff00";
      box.style.fontFamily = "Arial";
      box.style.fontSize = "12px";
      box.style.border =
        "1px solid #00ff00";
      box.style.borderRadius = "5px";

      document.body.appendChild(box);
    }

    box.innerText = message;

  }


  /* =========================
     SERVER CONNECTION
  ========================= */

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


  /* =========================
     TIKTOK STATUS
  ========================= */

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


  /* =========================
     GAME COMMAND
  ========================= */

  socket.on("gameCommand", (command) => {

    console.log(
      "TikTok command received:",
      command
    );


    const username =
      command.username ||
      "Viewer";

    const giftName =
      command.gift ||
      command.giftName ||
      "Unknown";


    showStatus(
      "🎁 " +
      username +
      " → " +
      giftName
    );


    /* =========================
       CHARACTER SWITCH
    ========================= */

    if (
      command.type ===
      "switchCharacter"
    ) {

      switchCharacter(
        command.side,
        username,
        giftName
      );

      return;
    }


    /* =========================
       OLD ATTACK COMMAND
       → NEW GAME ENGINE
    ========================= */

    if (
      command.type === "attack"
    ) {

      const side =
        command.side;


      /*
         Convert gift name to
         our internal gift ID.
      */

      const giftId =
        normalizeGift(
          giftName
        );


      /*
         Send it into the
         NEW Gift Kombat engine.
      */

      handleTikTokGift({

        side: side,

        username: username,

        giftName: giftName,

        giftId: giftId,

        repeatCount:
          Number(
            command.repeatCount ||
            command.repeat ||
            1
          )

      });


      return;
    }


    /* =========================
       DIRECT GIFT COMMAND
       (future-proof)
    ========================= */

    if (
      command.type ===
      "gift"
    ) {

      handleTikTokGift({

        side:
          command.side,

        username:
          username,

        giftName:
          giftName,

        giftId:
          normalizeGift(giftName),

        repeatCount:
          Number(
            command.repeatCount ||
            1
          )

      });

    }

  });


  /* =========================
     NORMALIZE GIFT NAMES
  ========================= */

  function normalizeGift(name) {

    if (!name) {
      return "";
    }


    const clean =
      String(name)
        .toLowerCase()
        .trim();


    /*
       LIKES
    */

    if (
      clean === "like" ||
      clean === "likes" ||
      clean === "like-pop" ||
      clean === "likepop"
    ) {

      return "like";

    }


    /*
       FOLLOW
    */

    if (
      clean === "follow" ||
      clean === "follower" ||
      clean === "new follow"
    ) {

      return "follow";

    }


    /*
       ROSE
    */

    if (
      clean === "rose"
    ) {

      return "rose";

    }


    /*
       ROSA
    */

    if (
      clean === "rosa"
    ) {

      return "rosa";

    }


    /*
       TIKTOK
    */

    if (
      clean === "tiktok" ||
      clean === "tiktok logo"
    ) {

      return "tiktok";

    }


    /*
       MIND BLOWN
    */

    if (
      clean === "mind blown" ||
      clean === "mindblown"
    ) {

      return "mindblown";

    }


    /*
       FALLBACK
    */

    return clean
      .replace(/\s+/g, "");

  }


})();
