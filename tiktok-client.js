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

  socket.on("connect", () => {

    showStatus(
      "🟢 GAME CONNECTED TO SERVER | Socket: " +
      socket.id
    );

  });

  socket.on("connect_error", (error) => {

    showStatus(
      "🔴 CONNECTION ERROR: " +
      error.message
    );

  });

  socket.on("disconnect", (reason) => {

    showStatus(
      "🔴 DISCONNECTED: " +
      reason
    );

  });

  socket.on("tiktokStatus", (status) => {

    if (status.connected) {

      showStatus(
        "🟢 SERVER + TIKTOK LIVE CONNECTED"
      );

    } else {

      showStatus(
        "🟠 SERVER CONNECTED BUT TIKTOK IS NOT CONNECTED"
      );

    }

  });

  socket.on("gameCommand", (command) => {

    showStatus(
      "🎁 RECEIVED: " +
      command.username +
      " → " +
      command.gift
    );

    if (command.type === "attack") {

      attack(
        command.side,
        command.brutality,
        command.username,
        command.gift
      );

      return;
    }

    if (command.type === "switchCharacter") {

      switchCharacter(
        command.side,
        command.username,
        command.gift
      );

      return;
    }

  });

})();
