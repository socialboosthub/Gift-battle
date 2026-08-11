(function () {

  const socket = io();

  socket.on("connect", () => {
    console.log("✅ Connected to TikTok game server");
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from TikTok game server");
  });

  socket.on("tiktokStatus", (status) => {

    if (status.connected) {
      console.log("🟢 TikTok LIVE connected");
    } else {
      console.log("🔴 TikTok LIVE disconnected");
    }

  });

  socket.on("gameCommand", (command) => {

    console.log("🎮 TikTok command:", command);

    // ==========================================
    // ATTACK
    // ==========================================

    if (command.type === "attack") {

      attack(
        command.side,
        command.brutality,
        command.username,
        command.gift
      );

      return;
    }

    // ==========================================
    // SWITCH CHARACTER
    // ==========================================

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
