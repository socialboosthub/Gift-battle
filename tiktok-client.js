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
  // 🎵 BACKGROUND MUSIC SYSTEM
  // ======================================

  const battleMusic = [
    {
      src: "sounds/song1.mp3",
      repeats: 3
    },

    {
      src: "sounds/song2.mp3",
      repeats: 3
    }
  ];

  let currentMusicIndex = 0;
  let currentMusicPlay = 0;
  let musicStarted = false;

  let musicPlayer = null;


  // ======================================
  // FIND MUSIC PLAYER
  // ======================================

  function getMusicPlayer() {

    if (!musicPlayer) {

      musicPlayer =
        document.getElementById(
          "battle-background-music"
        );

    }

    return musicPlayer;

  }


  // ======================================
  // LOAD SONG
  // ======================================

  function loadBattleSong() {

    const player =
      getMusicPlayer();

    if (!player) {

      console.log(
        "🎵 Music player not found."
      );

      return;

    }

    const song =
      battleMusic[
        currentMusicIndex
      ];

    player.src =
      song.src;

    player.volume =
      0.25;

    currentMusicPlay = 1;

    console.log(
      "🎵 Loading:",
      song.src
    );

  }


  // ======================================
  // START MUSIC
  // ======================================

  function startBattleMusic() {

    const player =
      getMusicPlayer();

    if (!player) {

      console.log(
        "🎵 Music player not found."
      );

      return;

    }


    if (!player.src) {

      loadBattleSong();

    }


    player.volume =
      0.25;


    const playPromise =
      player.play();


    if (
      playPromise &&
      typeof playPromise.catch ===
        "function"
    ) {

      playPromise.catch(
        error => {

          console.log(
            "🎵 Music could not start:",
            error
          );

        }
      );

    }


    musicStarted = true;

    console.log(
      "🎵 Background music started."
    );

  }


  // ======================================
  // SONG FINISHED
  // ======================================

  function setupMusicPlayer() {

    const player =
      getMusicPlayer();

    if (!player) {

      console.log(
        "🎵 Music player not found."
      );

      return;

    }


    player.addEventListener(
      "ended",
      function () {

        const song =
          battleMusic[
            currentMusicIndex
          ];


        // -------------------------------
        // REPEAT CURRENT SONG
        // -------------------------------

        if (
          currentMusicPlay <
          song.repeats
        ) {

          currentMusicPlay++;

          console.log(
            "🎵 Repeating song " +
            currentMusicPlay +
            "/" +
            song.repeats
          );


          player.currentTime =
            0;


          player.play()
            .catch(
              error => {

                console.log(
                  "🎵 Could not repeat song:",
                  error
                );

              }
            );


          return;

        }


        // -------------------------------
        // NEXT SONG
        // -------------------------------

        currentMusicIndex++;

        if (
          currentMusicIndex >=
          battleMusic.length
        ) {

          currentMusicIndex = 0;

        }


        console.log(
          "🎵 Moving to next song."
        );


        loadBattleSong();


        player.play()
          .catch(
            error => {

              console.log(
                "🎵 Could not play next song:",
                error
              );

            }
          );

      }
    );

  }


  // ======================================
  // INITIALIZE MUSIC
  // ======================================

  function initializeBattleMusic() {

    const player =
      getMusicPlayer();

    if (!player) {

      console.log(
        "🎵 Waiting for music player..."
      );

      setTimeout(
        initializeBattleMusic,
        100
      );

      return;

    }


    loadBattleSong();

    setupMusicPlayer();

  }


  window.startBattleMusic =
    startBattleMusic;


  initializeBattleMusic();


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
  // LIVE ANNOUNCER
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


        // FOLLOW

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


        // 100 LIKES

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


        // BRUTALITY

        else if (
          command.brutality === true
        ) {

          speakAnnouncement(
            side + "!",
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


        // NORMAL HIT

        else {

          speakAnnouncement(
            side + "!",
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
