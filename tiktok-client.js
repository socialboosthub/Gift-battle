(function () {

  const SERVER_URL =
    "https://gift-battle-o0kv.onrender.com";

  const socket =
    io(SERVER_URL, {
      transports: [
        "websocket",
        "polling"
      ],
      reconnection: true
    });

  function showStatus(message) {

    console.log(message);

    let box =
      document.getElementById(
        "tiktok-debug"
      );

    if (!box) {

      box =
        document.createElement(
          "div"
        );

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

      document.body.appendChild(
        box
      );

    }

    box.innerText =
      message;

  }

  // ======================================
  // SERVER CONNECTED
  // ======================================

  socket.on(
    "connect",
    () => {

      showStatus(
        "🟢 GAME CONNECTED | SERVER ONLINE"
      );

    }
  );

  // ======================================
  // SERVER ERROR
  // ======================================

  socket.on(
    "connect_error",
    (error) => {

      showStatus(
        "🔴 SERVER ERROR: " +
        error.message
      );

    }
  );

  // ======================================
  // DISCONNECTED
  // ======================================

  socket.on(
    "disconnect",
    (reason) => {

      showStatus(
        "🔴 SERVER DISCONNECTED: " +
        reason
      );

    }
  );

  // ======================================
  // TIKTOK STATUS
  // ======================================

  socket.on(
    "tiktokStatus",
    (status) => {

      if (
        status.connected
      ) {

        showStatus(
          "🟢 TIKTOK LIVE CONNECTED"
        );

      } else {

        showStatus(
          "🟠 SERVER ONLINE / TIKTOK OFFLINE"
        );

      }

    }
  );

  // ======================================
  // GAME COMMAND
  // ======================================

  socket.on(
    "gameCommand",
    (command) => {

      showStatus(
        "🎁 " +
        command.username +
        " → " +
        command.gift +
        " ×" +
        (command.repeatCount || 1)
      );

      // ====================================
      // ATTACK
      // ====================================

      if (
        command.type === "attack"
      ) {

        const count =
          Math.max(
            1,
            Number(
              command.repeatCount
            ) || 1
          );

        console.log(
          `⚔️ ${command.gift} = ${count} attack(s) | power ${command.power || "default"}`
        );

        let attackNumber = 0;

        function doNextAttack() {

          if (
            attackNumber >= count
          ) {

            return;

          }

          attackNumber++;

          attack(
            command.side,
            command.brutality,
            command.username,
            command.gift,
            command.power,
            command.actionLabel || ""
          );

          // Stop if somebody has already won.
          if (
            typeof isMatchActive !==
              "undefined" &&
            !isMatchActive
          ) {

            return;

          }

          setTimeout(
            doNextAttack,
            command.brutality
              ? 80
              : 70
          );

        }

        doNextAttack();

        return;

      }

      // ====================================
      // CHARACTER SWITCH
      // ====================================

      if (
        command.type ===
        "switchCharacter"
      ) {

        const count =
          Math.max(
            1,
            Number(
              command.repeatCount
            ) || 1
          );

        let switchNumber = 0;

        function doNextSwitch() {

          if (
            switchNumber >= count
          ) {

            return;

          }

          switchNumber++;

          switchCharacter(
            command.side,
            command.username,
            command.gift
          );

          setTimeout(
            doNextSwitch,
            100
          );

        }

        doNextSwitch();

        return;

      }

    }
  );

})();
