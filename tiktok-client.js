(function () {

  const SERVER_URL = "https://gift-battle-o0kv.onrender.com";

  const socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
    reconnection: true
  });

  function showStatus(message) {

    console.log(message);

    let box = document.getElementById("tiktok-debug");

    if (!box) {

      box = document.createElement("div");

      box.id = "tiktok-debug";

      box.style.position = "fixed";
      box.style.top = "5px";
      box.style.left = "5px";
      box.style.right = "5px";
      box.style.zIndex = "99999";
      box.style.padding = "8px";
      box.style.background = "rgba(0,0,0,0.9)";
      box.style.color = "#00ff00";
      box.style.fontFamily = "Arial";
      box.style.fontSize = "12px";
      box.style.border = "1px solid #00ff00";
      box.style.borderRadius = "5px";

      document.body.appendChild(box);
    }

    box.innerText = message;
  }


  // SERVER CONNECTED
  socket.on("connect", () => {

    showStatus(
      "🟢 GAME CONNECTED | SERVER ONLINE"
    );

  });


  // SERVER ERROR
  socket.on("connect_error", (error) => {

    showStatus(
      "🔴 SERVER ERROR: " +
      error.message
    );

  });


  // DISCONNECTED
  socket.on("disconnect", (reason) => {

    showStatus(
      "🔴 SERVER DISCONNECTED: " +
      reason
    );

  });


  // TIKTOK STATUS
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


  // GAME COMMAND
  socket.on("gameCommand", (command) => {

    showStatus(
      "🎁 " +
      command.username +
      " → " +
      command.gift
    );


      // ATTACK
    if (command.type === "attack") {

      attack(
        command.side,
        command.brutality,
        command.username,
        command.gift,
        command.repeatCount // <--- JUST ADD THIS LINE BRO
      );

      return;
    }



    // CHARACTER SWITCH
    if (command.type === "switchCharacter") {

      switchCharacter(
        command.side
      );

      addFeed(
        command.side,
        command.username,
        command.gift
      );

      return;
    }

  });

})();
