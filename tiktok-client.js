(() => {

  // ============================================================
  // 🔥 GIFT BATTLE - TIKTOK CLIENT
  // ============================================================

  const SERVER_URL = "https://gift-battle-o0kv.onrender.com";

  const socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500
  });


  // ============================================================
  // 🎵 BACKGROUND MUSIC
  // ============================================================

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
  let currentMusicPlay = 1;
  let musicPlayer = null;
  let musicEventsReady = false;

  // ============================================================
  // 🔊 SOFTWARE AUDIO BOOST
  // ============================================================
  // The <audio> element is kept at 100%, then routed through a
  // compressor + gain stage. This makes the signal louder before
  // Android/TikTok screen capture receives it.
  //
  // IMPORTANT: Browser code cannot bypass Android's physical/media
  // volume. If Android volume is exactly 0, the device may still
  // produce/capture no audible media signal.
  let audioContext = null;
  let musicSourceNode = null;
  let musicGainNode = null;
  let musicCompressorNode = null;

  function setupAudioBoost() {
    const player = getMusicPlayer();
    if (!player) return false;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        console.log("🔊 Web Audio is not supported; using normal audio.");
        player.volume = 1.0;
        return false;
      }

      if (!audioContext) {
        audioContext = new AudioContextClass();

        musicSourceNode =
          audioContext.createMediaElementSource(player);

        musicGainNode =
          audioContext.createGain();

        musicCompressorNode =
          audioContext.createDynamicsCompressor();

        // Strong software boost while the compressor controls clipping.
        musicGainNode.gain.value = 2.2;

        musicCompressorNode.threshold.value = -18;
        musicCompressorNode.knee.value = 18;
        musicCompressorNode.ratio.value = 8;
        musicCompressorNode.attack.value = 0.003;
        musicCompressorNode.release.value = 0.18;

        musicSourceNode
          .connect(musicGainNode)
          .connect(musicCompressorNode)
          .connect(audioContext.destination);

        console.log("🔊 Software audio boost initialized.");
      }

      player.volume = 1.0;

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(error => {
          console.log("🔊 Audio resume error:", error);
        });
      }

      return true;

    } catch (error) {
      console.log("🔊 Audio boost setup error:", error);
      player.volume = 1.0;
      return false;
    }
  }

  window.enableBattleAudioBoost = setupAudioBoost;


  function getMusicPlayer() {

    if (!musicPlayer) {
      musicPlayer =
        document.getElementById("battle-background-music");
    }

    return musicPlayer;
  }


  function loadBattleSong() {

    const player = getMusicPlayer();

    if (!player) return;

    const song =
      battleMusic[currentMusicIndex];

    player.src = song.src;
    player.volume = 1.0;

    currentMusicPlay = 1;

    console.log("🎵 Loading:", song.src);
  }


  function startBattleMusic() {

    const player = getMusicPlayer();

    if (!player) return;

    if (!player.src) {
      loadBattleSong();
    }

    setupAudioBoost();
    player.volume = 1.0;

    const promise = player.play();

    if (promise && promise.catch) {

      promise.catch(error => {
        console.log(
          "🎵 Music could not start:",
          error
        );
      });

    }
  }


  function setupMusicPlayer() {

    const player = getMusicPlayer();

    if (!player || musicEventsReady) return;

    setupAudioBoost();
    musicEventsReady = true;

    player.addEventListener(
      "ended",
      () => {

        const song =
          battleMusic[currentMusicIndex];

        if (
          currentMusicPlay <
          song.repeats
        ) {

          currentMusicPlay++;

          player.currentTime = 0;

          player.play().catch(
            error => console.log(
              "Music repeat error:",
              error
            )
          );

          return;
        }

        currentMusicIndex++;

        if (
          currentMusicIndex >=
          battleMusic.length
        ) {

          currentMusicIndex = 0;

        }

        loadBattleSong();

        player.play().catch(
          error => console.log(
            "Next song error:",
            error
          )
        );

      }
    );
  }


  function initializeBattleMusic() {

    const player =
      getMusicPlayer();

    if (!player) {

      setTimeout(
        initializeBattleMusic,
        200
      );

      return;
    }

    loadBattleSong();
    setupAudioBoost();
    setupMusicPlayer();
  }


  window.startBattleMusic =
    startBattleMusic;


  // ============================================================
  // 🔊 VOICE SYSTEM
  // ============================================================

  let voiceEnabled = true;
  let voiceQueue = [];
  let voiceSpeaking = false;


  function speakAnnouncement(
    message,
    options = {}
  ) {

    if (!voiceEnabled) return;

    if (
      !("speechSynthesis" in window)
    ) return;

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
        options.pitch ?? 1,

      volume:
        options.volume ?? 1

    });

    processVoiceQueue();
  }


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
          )
      );

    if (preferredVoice) {
      speech.voice =
        preferredVoice;
    }

    voiceSpeaking = true;

    speech.onend = () => {

      voiceSpeaking = false;

      setTimeout(
        processVoiceQueue,
        80
      );

    };

    speech.onerror = () => {

      voiceSpeaking = false;

      processVoiceQueue();

    };

    window.speechSynthesis
      .speak(speech);
  }


  function unlockBattleVoice() {

    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }

    try {

      window.speechSynthesis.cancel();

      const unlock =
        new SpeechSynthesisUtterance("");

      unlock.volume = 0;

      window.speechSynthesis
        .speak(unlock);

    } catch (error) {

      console.log(
        "Voice unlock error:",
        error
      );

    }
  }


  window.unlockBattleVoice =
    unlockBattleVoice;


  window.setBattleVoice =
    function(enabled) {

      voiceEnabled =
        Boolean(enabled);

      if (
        !voiceEnabled &&
        "speechSynthesis" in window
      ) {

        window.speechSynthesis.cancel();

        voiceQueue = [];

      }

    };


  // ============================================================
  // 🟢 STATUS BOX
  // ============================================================

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
        "999999";

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


  // ============================================================
  // 🧹 CLEAN GIFT NAME
  // ============================================================

  function cleanGiftName(value) {

    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }


  // ============================================================
  // 🎁 GET GIFT NAME
  // ============================================================

  function getGiftName(command) {

    return String(

      command.gift ||

      command.giftName ||

      command.name ||

      command.actionLabel ||

      ""

    ).trim();
  }


  // ============================================================
  // 👤 GET USERNAME
  // ============================================================

  function getUsername(command) {

    return String(

      command.username ||

      command.uniqueId ||

      command.user ||

      "Unknown"

    ).trim();
  }


  // ============================================================
  // 👤 GET GIFTER PROFILE PICTURE
  // ============================================================

  function getProfilePic(command) {

    const user = command && command.user;

    const candidates = [
      command && command.profilePic,
      command && command.avatarUrl,
      user && user.avatarLarge,
      user && user.avatarMedium,
      user && user.avatarThumb,
      user && user.avatarLarger,
      user && user.profilePicture,
      user && user.profilePictureUrl,
      user && user.avatar && user.avatar.urlList,
      user && user.avatarThumb && user.avatarThumb.urlList,
      user && user.avatarMedium && user.avatarMedium.urlList,
      user && user.avatarLarge && user.avatarLarge.urlList
    ];

    function findUrl(value) {
      if (!value) return null;
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        for (const item of value) {
          const found = findUrl(item);
          if (found) return found;
        }
      }
      if (typeof value === "object") {
        for (const key of ["urlList","url","uri","url_list"]) {
          if (value[key]) {
            const found = findUrl(value[key]);
            if (found) return found;
          }
        }
      }
      return null;
    }

    for (const candidate of candidates) {
      const url = findUrl(candidate);
      if (url) return url;
    }

    return null;
  }


  // ============================================================
  // 💐 DETECT CHARACTER SWITCH
  // ============================================================

  function detectSwitch(command) {

    const gift =
      cleanGiftName(
        getGiftName(command)
      );


    // 💐 BOUQUET = GIRL SWITCH

    if (
      gift === "bouquet" ||
      gift.includes("bouquet")
    ) {

      return "girl";

    }


    // 🎉 CONFETTI = BOY SWITCH

    if (
      gift === "confetti" ||
      gift.includes("confetti")
    ) {

      return "boy";

    }


    return null;
  }


  // ============================================================
  // ⚔️ DETECT ATTACK
  // ============================================================

  function detectAttack(command) {

    const gift =
      cleanGiftName(
        getGiftName(command)
      );


    // GIRLS

    if (
      gift === "rose"
    ) {

      return {
        side: "girl",
        power: 5,
        brutal: false
      };

    }


    if (
      gift === "rosa"
    ) {

      return {
        side: "girl",
        power: 50,
        brutal: true
      };

    }


    if (
      gift === "100 likes" ||
      gift === "100x likes"
    ) {

      return {
        side: "girl",
        power: 1,
        brutal: false
      };

    }


    // BOYS

    if (
      gift === "follow"
    ) {

      return {
        side: "boy",
        power: 1,
        brutal: false
      };

    }


    if (
      gift === "tiktok"
    ) {

      return {
        side: "boy",
        power: 5,
        brutal: false
      };

    }


    if (
      gift === "necklace"
    ) {

      return {
        side: "boy",
        power: 50,
        brutal: true
      };

    }


    return null;
  }


  // ============================================================
  // 🔢 REPEAT COUNT
  // ============================================================

  function getRepeatCount(command) {

    const count =
      Number(
        command.repeatCount ||
        command.repeat ||
        1
      );

    return Math.max(
      1,
      count || 1
    );
  }


  // ============================================================
  // 🔌 SOCKET CONNECTED
  // ============================================================

  socket.on(
    "connect",
    () => {

      showStatus(
        "🟢 TIKTOK LIVE CONNECTED"
      );

      console.log(
        "Socket connected:",
        socket.id
      );

    }
  );


  // ============================================================
  // 🔴 CONNECTION ERROR
  // ============================================================

  socket.on(
    "connect_error",
    error => {

      showStatus(
        "🔴 SERVER ERROR: " +
        error.message
      );

    }
  );


  // ============================================================
  // 🔴 DISCONNECTED
  // ============================================================

  socket.on(
    "disconnect",
    reason => {

      showStatus(
        "🔴 SERVER DISCONNECTED: " +
        reason
      );

    }
  );


  // ============================================================
  // 🎥 TIKTOK STATUS
  // ============================================================

  socket.on(
    "tiktokStatus",
    status => {

      if (
        status &&
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


  // ============================================================
  // 🎁 MAIN GIFT HANDLER
  // ============================================================

  socket.on(
    "gameCommand",
    command => {

      if (
        !command ||
        typeof command !== "object"
      ) {

        console.log(
          "Invalid command:",
          command
        );

        return;
      }


      const gift =
        getGiftName(command);

      const username =
        getUsername(command);

      const profilePic =
        getProfilePic(command);

      const giftClean =
        cleanGiftName(gift);


      console.log(
        "🎁 TIKTOK EVENT:",
        command
      );


      showStatus(
        "🎁 " +
        username +
        " → " +
        gift +
        " ×" +
        getRepeatCount(command)
      );


      // ========================================================
      // 💐🎉 CHARACTER SWITCH
      // ========================================================

      const switchSide =
        detectSwitch(command);


      if (switchSide) {

        console.log(
          "🔥 SWITCH GIFT:",
          gift,
          "SIDE:",
          switchSide
        );


        const count =
          getRepeatCount(command);

        let number = 0;


        function doSwitch() {

          if (
            number >= count
          ) {
            return;
          }


          number++;


          // Call the function from index.html

          if (
            typeof switchCharacter ===
            "function"
          ) {

            switchCharacter(
              switchSide,
              username,
              gift,
              profilePic
            );

          } else {

            console.error(
              "❌ switchCharacter() is missing!"
            );

          }


          setTimeout(
            doSwitch,
            150
          );

        }


        doSwitch();


        // Voice

        speakAnnouncement(

          switchSide === "girl"
            ? "GIRLS SWITCH!"
            : "BOYS SWITCH!",

          {
            rate: 1,
            pitch:
              switchSide === "girl"
                ? 1.25
                : 0.75
          }

        );


        return;
      }


      // ========================================================
      // ⚔️ ATTACK GIFTS
      // ========================================================

      const attackData =
        detectAttack(command);


      if (attackData) {

        const count =
          getRepeatCount(command);


        let power =
          attackData.power;


        let brutal =
          attackData.brutal;


        console.log(
          "⚔️ ATTACK",
          gift,
          attackData.side,
          power,
          "x",
          count
        );


        // ======================================================
        // 🔊 VOICE
        // ======================================================

        if (
          giftClean === "follow"
        ) {

          speakAnnouncement(
            "THANK YOU FOR THE FOLLOW!",
            {
              rate: 1.08,
              pitch: 1.28
            }
          );

        }

        else if (
          giftClean === "100 likes" ||
          giftClean === "100x likes"
        ) {

          speakAnnouncement(
            "GIRLS!",
            {
              rate: 1.18,
              pitch: 1.42
            }
          );

        }

        else {

          speakAnnouncement(

            attackData.side === "girl"
              ? "GIRLS!"
              : "BOYS!",

            {
              rate:
                brutal
                  ? 0.78
                  : 1.28,

              pitch:
                attackData.side === "boy"
                  ? 0.78
                  : 1.28
            }

          );

        }


        // ======================================================
        // ⚔️ PERFORM ATTACKS
        // ======================================================

        let attackNumber = 0;


        function doAttack() {

          if (
            attackNumber >= count
          ) {

            return;

          }


          if (
            typeof isMatchActive !==
            "undefined" &&
            !isMatchActive
          ) {

            return;

          }


          attackNumber++;


          if (
            typeof attack ===
            "function"
          ) {

            attack(

              attackData.side,

              brutal,

              username,

              gift,

              power,

              gift

            );

          } else {

            console.error(
              "❌ attack() is missing!"
            );

          }


          setTimeout(
            doAttack,
            brutal ? 80 : 70
          );

        }


        doAttack();


        return;
      }


      // ========================================================
      // COMPATIBILITY WITH OLD SERVER COMMANDS
      // ========================================================

      if (
        command.type ===
        "switchCharacter"
      ) {

        const side =
          command.side === "boy"
            ? "boy"
            : "girl";


        switchCharacter(
          side,
          username,
          gift,
          profilePic
        );


        return;
      }


      if (
        command.type ===
        "attack"
      ) {

        const side =
          command.side === "boy"
            ? "boy"
            : "girl";


        attack(

          side,

          Boolean(
            command.brutality
          ),

          username,

          gift,

          Number(
            command.power
          ) || 5,

          command.actionLabel ||
          gift

        );


        return;
      }


      // ========================================================
      // UNKNOWN GIFT
      // ========================================================

      console.log(
        "ℹ️ No action matched for gift:",
        gift,
        command
      );

    }
  );


  // ============================================================
  // 🚀 START
  // ============================================================

  initializeBattleMusic();

})();
