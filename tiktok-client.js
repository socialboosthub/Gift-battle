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


  // ======================================
  // VOICE SYSTEM
  // ======================================

  let voiceEnabled = true;

  let voiceQueue = [];

  let voiceSpeaking = false;


  // ======================================
  // SHOW STATUS
  // ======================================

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
  // 🔥 LIVE ANNOUNCER
  // ======================================

  function speakAnnouncement(
    message,
    options = {}
  ) {

    if (!voiceEnabled) {

      return;

    }

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {

      console.log(
        "🔊 Speech synthesis is not supported."
      );

      return;

    }


    // Prevent too many announcements
    // from stacking up during a busy LIVE.

    if (
      voiceQueue.length >= 3
    ) {

      voiceQueue.shift();

    }


    voiceQueue.push({

      message: message,

      rate:
        options.rate ?? 1.15,

      pitch:
        options.pitch ?? 1.0,

      volume:
        options.volume ?? 1.0

    });


    processVoiceQueue();

  }


  // ======================================
  // PROCESS VOICE QUEUE
  // ======================================

  function processVoiceQueue() {

    if (
      voiceSpeaking ||
      voiceQueue.length === 0
    ) {

      return;

    }


    const item =
      voiceQueue.shift();


    const speech =
      new SpeechSynthesisUtterance(
        item.message
      );


    speech.rate =
      item.rate;

    speech.pitch =
      item.pitch;

    speech.volume =
      item.volume;


    // Try to use an English voice
    // available on the phone.

    const voices =
      window.speechSynthesis
        .getVoices();


    const preferredVoice =
      voices.find(
        voice =>
          /en-US|en-GB/i.test(
            voice.lang
          ) &&
          /female|zira|samantha|google/i.test(
            voice.name
          )
      ) ||
      voices.find(
        voice =>
          /en-US|en-GB/i.test(
            voice.lang
          )
      );


    if (
      preferredVoice
    ) {

      speech.voice =
        preferredVoice;

    }


    voiceSpeaking =
      true;


    speech.onend =
      function () {

        voiceSpeaking =
          false;

        setTimeout(
          processVoiceQueue,
          80
        );

      };


    speech.onerror =
      function () {

        voiceSpeaking =
          false;

        processVoiceQueue();

      };


    window.speechSynthesis.speak(
      speech
    );

  }


  // ======================================
  // UNLOCK PHONE VOICE
  // ======================================
  //
  // Mobile browsers can block speech
  // until the user interacts with the page.
  //
  // We call this from the fullscreen
  // button because that is a user tap.
  // ======================================

  function unlockBattleVoice() {

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {

      return;

    }


    try {

      window.speechSynthesis.cancel();


      const unlock =
        new SpeechSynthesisUtterance(
          ""
        );


      unlock.volume =
        0;


      window.speechSynthesis.speak(
        unlock
      );


    } catch (error) {

      console.log(
        "Voice unlock error:",
        error
      );

    }

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
      // VOICE ANNOUNCEMENT
      // ====================================

      if (
        command.type === "attack"
      ) {


        const side =
          command.side === "boy"
            ? "BOYS"
            : "GIRLS";


        const action =
          String(
            command.actionLabel ||
            command.gift ||
            ""
          )
          .trim()
          .toLowerCase();


        // ==================================
        // 👤 FOLLOW
        // ==================================

        if (
          action === "follow"
        ) {

          speakAnnouncement(
            "THANK YOU FOR THE FOLLOW.",
            {
              rate: 1.08,
              pitch: 1.28,
              volume: 1.0
            }
          );

        }


        // ==================================
        // ❤️ 100 LIKES
        // ==================================

        else if (
          action === "100 likes"
        ) {

          speakAnnouncement(
            "GIRLS.",
            {
              rate: 1.18,
              pitch: 1.42,
              volume: 1.0
            }
          );

        }


        // ==================================
        // 💥 BRUTALITY
        // ==================================

        else if (
          command.brutality === true
        ) {

          speakAnnouncement(
            side +
            "!!! BRUTALITY!!!",
            {
              rate: 0.78,

              pitch:
                command.side === "boy"
                  ? 0.62
                  : 1.18,

              volume: 1.0
            }
          );

        }


        // ==================================
        // 👊 NORMAL HIT
        // ==================================

        else {

          speakAnnouncement(
            side +
            " HIT!!!",
            {
              rate: 1.28,

              pitch:
                command.side === "boy"
                  ? 0.78
                  : 1.28,

              volume: 1.0
            }
          );

        }

      }


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


  // ======================================
  // MAKE VOICE AVAILABLE TO index.html
  // ======================================
  //
  // The fullscreen button can call this.
  // ======================================

  window.unlockBattleVoice =
    unlockBattleVoice;


  window.setBattleVoice =
    function (enabled) {

      voiceEnabled =
        Boolean(enabled);


      if (
        !voiceEnabled &&
        "speechSynthesis" in window
      ) {

        window.speechSynthesis.cancel();

      }

    };


})();
