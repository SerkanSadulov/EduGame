const BOARD_PATH = [
  0, 1, 2, 3, 4,
  9, 14, 19, 24,
  23, 22, 21, 20,
  15, 10, 5
];

const TILE_TYPES = {
  0: "start",
  2: "key",
  4: "door",
  9: "treasure",
  14: "key",
  19: "door",
  24: "treasure",
  23: "key",
  21: "door",
  15: "treasure"
};

const CARD_LABELS = {
  key: "Карта: Ключ 🔑",
  door: "Карта: Врата 🚪",
  treasure: "Карта: Съкровище 💰",
  start: "Начална клетка"
};

const PAWN_ICONS = ["🐠", "🐢", "🐙", "🦀"];

const DEFAULT_QUESTIONS = {
  level1: {
    any: [
      "Колко е 3 + 4?",
      "Иван има 2 бонбона и получава още 5. Колко са общо?",
      "Колко е 9 - 3?",
      "Елена има 6 ябълки и изяжда 1. Колко остават?"
    ],
    key: [
      "Колко е 5 + 2?",
      "Мартин има 1 молив и получава още 4. Общо?",
      "Колко е 8 - 4?"
    ],
    door: [
      "Колко е 7 + 1?",
      "В кутия има 9 топчета. Взимаме 2. Колко остават?",
      "Колко е 10 - 5?"
    ],
    treasure: [
      "Колко е 4 + 4?",
      "Деси има 3 балона и получава още 6. Колко са общо?",
      "Колко е 9 - 2?"
    ]
  },
  level2: {
    any: [
      "Колко е 12 + 3?",
      "Петър има 15 бонбона и дава 4. Колко остават?",
      "Колко е 18 - 6?",
      "Колко е 9 + 8?"
    ],
    key: [
      "Колко е 11 + 5?",
      "В кутия има 20 топчета. Взимаме 7. Колко остават?",
      "Колко е 14 - 5?"
    ],
    door: [
      "Колко е 16 - 7?",
      "Колко е 10 + 9?",
      "Мария има 13 леденца и получава още 3. Колко са общо?"
    ],
    treasure: [
      "Колко е 17 - 8?",
      "Колко е 9 + 9?",
      "В кутия има 18 бонбона. Дани дава 5. Колко са останали?"
    ]
  }
};

let questionsData = null;


let players = [];
let currentPlayerIndex = 0;
let isAnimating = false;
let diceMode = "auto";
let level = 1;
let gameOver = false;

const boardEl = document.getElementById("board");
const scoreboardEl = document.getElementById("scoreboard");
const playerCountEl = document.getElementById("playerCount");
const levelSelectEl = document.getElementById("levelSelect");
const diceModeEl = document.getElementById("diceMode");
const newGameBtn = document.getElementById("newGameBtn");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const currentPlayerNameEl = document.getElementById("currentPlayerName");
const diceResultEl = document.getElementById("diceResult");
const diceVisualEl = document.getElementById("diceVisual");
const diceNumberEl = document.getElementById("diceNumber");
const manualDiceBoxEl = document.getElementById("manualDiceBox");
const manualDiceInputEl = document.getElementById("manualDiceInput");
const applyManualDiceBtn = document.getElementById("applyManualDice");
const messageBarEl = document.getElementById("messageBar");
const questionModalEl = document.getElementById("questionModal");
const modalTitleEl = document.getElementById("modalTitle");
const cardTypeLabelEl = document.getElementById("cardTypeLabel");
const questionTextEl = document.getElementById("questionText");
const correctBtn = document.getElementById("correctBtn");
const wrongBtn = document.getElementById("wrongBtn");

const winnerModalEl = document.getElementById("winnerModal");
const winnerTextEl = document.getElementById("winnerText");
const closeWinnerBtn = document.getElementById("closeWinnerBtn");


let audioCtx = null;

function ensureAudioContext() {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function setMessage(text) {
  if (messageBarEl) {
    messageBarEl.textContent = text;
  }
}

function playHitSound() {
  ensureAudioContext();
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "square";
  osc2.type = "square";

  osc1.frequency.setValueAtTime(280, now);
  osc2.frequency.setValueAtTime(180, now);

  osc1.frequency.exponentialRampToValueAtTime(120, now + 0.18);
  osc2.frequency.exponentialRampToValueAtTime(90, now + 0.18);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.6, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.3);
  osc2.stop(now + 0.3);
}



function playFeedbackSound(isCorrect) {
  ensureAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const now = audioCtx.currentTime;
  const variants = isCorrect
    ? [600, 720, 840, 900]
    : [200, 260, 320, 380];

  const freq = variants[Math.floor(Math.random() * variants.length)];
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

function playDiceThrowSound() {
  ensureAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;

  osc.type = "triangle";
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.linearRampToValueAtTime(220, now + 0.25);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}


async function loadQuestions() {
  try {
    const res = await fetch("questions.json");
    if (!res.ok) {
      throw new Error("HTTP error " + res.status);
    }
    const data = await res.json();
    questionsData = data;
    console.log("Questions loaded from JSON:", data);
  } catch (err) {
    console.warn("Не успях да заредя questions.json, ползвам вградените въпроси.", err);
    questionsData = DEFAULT_QUESTIONS;
  }
}

function getRandomQuestion(tileType) {
  if (!questionsData) {
    questionsData = DEFAULT_QUESTIONS;
  }

  const levelKey = level === 1 ? "level1" : "level2";
  const levelObj = questionsData[levelKey] || {};

  let list = (levelObj[tileType] || []);

  if (!list || list.length === 0) {
    list = levelObj["any"] || [];
  }

  if (!list || list.length === 0) {
    return "Няма дефинирани въпроси в JSON за това ниво.";
  }

  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}


function setDiceResultDisplay(value) {
  const display = (value == null ? "-" : value);
  if (diceResultEl) {
    diceResultEl.textContent = display;
  }
  if (diceNumberEl) {
    diceNumberEl.textContent = display;
  }
}


function createBoard() {
  boardEl.innerHTML = "";

  for (let i = 0; i < 25; i++) {
    const cell = document.createElement("div");
    cell.classList.add("board-cell");
    cell.dataset.index = i;

    const isOnPath = BOARD_PATH.includes(i);
    if (isOnPath) {
      cell.classList.add("path-cell");

      const stepIndex = BOARD_PATH.indexOf(i) + 1;
      const label = document.createElement("div");
      label.classList.add("cell-index");
      label.textContent = stepIndex;
      cell.appendChild(label);
    }

    const type = TILE_TYPES[i];
    if (type) {
      cell.classList.add("special", type);

      if (type === "start") cell.title = "Начало – Морска звезда";
      if (type === "key") cell.title = "Клетка с Ключ 🔑";
      if (type === "door") cell.title = "Клетка с Врата 🚪";
      if (type === "treasure") cell.title = "Клетка със Съкровище 💰";

      const icon = document.createElement("div");
      icon.classList.add("cell-icon");
      if (type === "start") icon.textContent = "⭐";
      if (type === "key") icon.textContent = "🔑";
      if (type === "door") icon.textContent = "🚪";
      if (type === "treasure") icon.textContent = "💰";
      cell.appendChild(icon);
    }

    boardEl.appendChild(cell);
  }
}

function getCellElementByBoardIndex(boardIndex) {
  return boardEl.querySelector(`.board-cell[data-index="${boardIndex}"]`);
}

function getBoardIndexForPathIndex(pathIndex) {
  return BOARD_PATH[pathIndex];
}


function createPlayers(count) {
  players = [];
  for (let i = 0; i < count; i++) {
    players.push({
      id: i,
      name: `Отбор ${i + 1}`,
      pathIndex: 0,
      keys: 0,
      doors: 0,
      treasures: 0
    });
  }
}

function renderScoreboard() {
  scoreboardEl.innerHTML = "";
  players.forEach((p, index) => {
    const row = document.createElement("div");
    row.classList.add("player-row");
    if (index === currentPlayerIndex && !gameOver) {
      row.classList.add("active");
    }

    const nameEl = document.createElement("div");
    nameEl.classList.add("player-name");

    const dot = document.createElement("div");
    dot.classList.add("color-dot", `color-${p.id}`);

    const nameText = document.createElement("span");
    nameText.textContent = p.name;

    nameEl.appendChild(dot);
    nameEl.appendChild(nameText);

    const statsEl = document.createElement("div");
    statsEl.classList.add("stats");
    statsEl.innerHTML = `
            <span>🔑 ${p.keys}</span>
            <span>🚪 ${p.doors}</span>
            <span>💰 ${p.treasures}</span>
        `;

    row.appendChild(nameEl);
    row.appendChild(statsEl);

    scoreboardEl.appendChild(row);
  });
}

function placeAllPawns() {
  document.querySelectorAll(".pawn").forEach(el => el.remove());

  players.forEach(player => {
    updatePawnPosition(player);
  });
}

function updatePawnPosition(player, animateJump = false) {
  document.querySelectorAll(`.pawn[data-player-id="${player.id}"]`).forEach(el => el.remove());

  const boardIndex = getBoardIndexForPathIndex(player.pathIndex);
  const cell = getCellElementByBoardIndex(boardIndex);
  if (!cell) return;

  const pawn = document.createElement("div");
  pawn.classList.add("pawn", `player-${player.id}`);
  pawn.dataset.playerId = player.id;
  pawn.textContent = PAWN_ICONS[player.id] || (player.id + 1);

  cell.appendChild(pawn);

  if (animateJump && window.gsap) {
    gsap.fromTo(
      pawn,
      { y: -20, scale: 0.6, rotation: -10 },
      {
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "bounce.out"
      }
    );
  }
}

function setTurnInfo() {
  if (gameOver || players.length === 0) {
    currentPlayerNameEl.textContent = "—";
    setDiceResultDisplay(null);
    return;
  }
  currentPlayerNameEl.textContent = players[currentPlayerIndex].name;
}

function setDiceModeUI() {
  if (diceMode === "manual") {
    manualDiceBoxEl.classList.remove("hidden");
  } else {
    manualDiceBoxEl.classList.add("hidden");
  }
}

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollDiceAnimated(onFinish) {
  if (!diceVisualEl) {
    const value = rollDice();
    setDiceResultDisplay(value);
    onFinish(value);
    return;
  }

  diceVisualEl.classList.add("rolling");
  playDiceThrowSound();

  let elapsed = 0;
  const duration = 700;
  const interval = 90;

  const timer = setInterval(() => {
    elapsed += interval;

    const temp = rollDice();
    setDiceResultDisplay(temp);

    if (elapsed >= duration) {
      clearInterval(timer);

      const finalValue = rollDice();
      setDiceResultDisplay(finalValue);

      diceVisualEl.classList.remove("rolling");
      onFinish(finalValue);
    }
  }, interval);
}

function moveCurrentPlayer(steps) {
  const player = players[currentPlayerIndex];
  isAnimating = true;
  rollDiceBtn.disabled = true;
  applyManualDiceBtn.disabled = true;

  let remaining = steps;

  function step() {
    if (remaining <= 0) {
      isAnimating = false;
      rollDiceBtn.disabled = false;
      applyManualDiceBtn.disabled = false;
      onPlayerLanded(player);
      return;
    }

    player.pathIndex = (player.pathIndex + 1) % BOARD_PATH.length;
    updatePawnPosition(player, true);
    remaining--;

    setTimeout(step, 320);
  }

  step();
}

function onPlayerLanded(player) {
  const others = players.filter(p => p.id !== player.id && p.pathIndex === player.pathIndex);
  if (others.length > 0) {
    const victim = others[0];
    setMessage(`${player.name} настъпи ${victim.name}! ${victim.name} се връща на ⭐ Начало! 💥`);
    playHitSound();
    const victimPawn = document.querySelector(`.pawn[data-player-id="${victim.id}"]`);
    const attackerPawn = document.querySelector(`.pawn[data-player-id="${player.id}"]`);

    if (victimPawn) {
      victimPawn.classList.add("hit");
    }
    if (attackerPawn) {
      attackerPawn.classList.add("hit");
    }

    victim.pathIndex = 0;
    setTimeout(() => {
      if (victimPawn) victimPawn.classList.remove("hit");
      if (attackerPawn) attackerPawn.classList.remove("hit");
      updatePawnPosition(victim, true);
    }, 400);
  }

  const boardIndex = getBoardIndexForPathIndex(player.pathIndex);
  const type = TILE_TYPES[boardIndex];

  if (type === "key" || type === "door" || type === "treasure") {
    showQuestionModal(player, type, boardIndex);
  } else {
    endTurn();
  }
}

function endTurn() {
  if (gameOver) return;
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  renderScoreboard();
  setTurnInfo();
}

function spawnConfetti() {
  const confettiCount = 40;
  const duration = 1600;

  for (let i = 0; i < confettiCount; i++) {
    const conf = document.createElement("div");
    conf.classList.add("confetti-piece");

    conf.style.left = Math.random() * 100 + "vw";

    const size = 6 + Math.random() * 8;
    conf.style.width = size + "px";
    conf.style.height = size + "px";

    const colors = ["#ff4757", "#ffa502", "#2ed573", "#1e90ff", "#eccc68", "#ff6b81", "#70a1ff"];
    conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    const fallTime = 1 + Math.random();
    conf.style.animationDuration = fallTime + "s";

    document.body.appendChild(conf);

    setTimeout(() => conf.remove(), duration);
  }
}

let activeQuestion = null;

function showQuestionModal(player, tileType, boardIndex) {
  activeQuestion = { playerId: player.id, tileType, boardIndex };
  const question = getRandomQuestion(tileType);

  modalTitleEl.textContent = `Въпрос за ${player.name}`;
  cardTypeLabelEl.textContent = CARD_LABELS[tileType] || "";
  questionTextEl.textContent = question;

  const cell = getCellElementByBoardIndex(boardIndex);
  if (cell) {
    cell.classList.add("highlight-correct");
    setTimeout(() => {
      cell.classList.remove("highlight-correct");
    }, 900);
  }

  questionModalEl.classList.remove("hidden");

  if (window.gsap) {
    const modalContent = questionModalEl.querySelector(".modal-content");
    const backdrop = questionModalEl.querySelector(".modal-backdrop");

    if (backdrop) {
      gsap.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power1.out" }
      );
    }

    if (modalContent) {
      gsap.fromTo(
        modalContent,
        {
          scale: 0.6,
          y: -40,
          opacity: 0,
          rotation: -8
        },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 0.45,
          ease: "back.out(1.8)"
        }
      );
    }

    if (boardEl) {
      gsap.fromTo(
        boardEl,
        { rotation: -4, scale: 0.97 },
        {
          rotation: 0,
          scale: 1,
          duration: 0.45,
          ease: "elastic.out(1, 0.5)"
        }
      );
    }
  }
}

function hideQuestionModal() {
  questionModalEl.classList.add("hidden");
  activeQuestion = null;
}

function onQuestionResult(isCorrect) {
  if (!activeQuestion) return;
  const { playerId, tileType } = activeQuestion;
  const player = players.find(p => p.id === playerId);
  if (!player) return;

  hideQuestionModal();
  playFeedbackSound(isCorrect);

  if (isCorrect) {
    spawnConfetti();
    const praises = [
      "Браво! Чудесен отговор! 🎉",
      "Страхотна работа! ⭐",
      "Браво, продължавайте така! 🙌",
      "Отлично! Много сте добри! 🌟"
    ];

    const msg = praises[Math.floor(Math.random() * praises.length)];
    setMessage(`${player.name}: ${msg}`);

    if (tileType === "key") {
      player.keys++;
    } else if (tileType === "door") {
      player.doors++;
    } else if (tileType === "treasure") {
      if (player.keys > 0) {
        player.keys--;
        player.treasures++;
      } else {
        const tryAgain = [
          "Нищо, следващият път ще стане! 😊",
          "Почти! Опитайте отново следващия ход! 💪",
          "Грешките помагат да научим повече! 📚"
        ];
        const msg = tryAgain[Math.floor(Math.random() * tryAgain.length)];
        setMessage(`${player.name}: ${msg}`);
      }
    }
    renderScoreboard();
    checkWinCondition(player);
  }

  if (!gameOver) {
    endTurn();
  }
}

function checkWinCondition(player) {
  const WIN_TREASURES = 5;
  const WIN_DOORS = 3;

  if (player.treasures >= WIN_TREASURES || player.doors >= WIN_DOORS) {
    gameOver = true;
    showWinner(player);
  }
}

function showWinner(player) {
  winnerTextEl.textContent = `${player.name} събра достатъчно съкровища / врати и печели играта!`;
  winnerModalEl.classList.remove("hidden");
  spawnConfetti();
  setMessage(`🏆 ${player.name} печели играта! Браво на всички играчи! 🎉`);
}

function hideWinnerModal() {
  winnerModalEl.classList.add("hidden");
}


function startNewGame() {
  const count = parseInt(playerCountEl.value, 10) || 2;
  level = parseInt(levelSelectEl.value, 10) || 1;
  diceMode = diceModeEl.value;
  setDiceModeUI();

  gameOver = false;
  currentPlayerIndex = 0;
  setDiceResultDisplay(null);

  createBoard();
  createPlayers(count);
  renderScoreboard();
  placeAllPawns();
  setTurnInfo();
  setMessage(`Играта започва! Ред е на ${players[currentPlayerIndex].name}. 🎲`);
}

newGameBtn.addEventListener("click", () => {
  startNewGame();
});

diceModeEl.addEventListener("change", () => {
  diceMode = diceModeEl.value;
  setDiceModeUI();
});

rollDiceBtn.addEventListener("click", () => {
  if (isAnimating || gameOver || players.length === 0) return;
  if (diceMode === "manual") return;

  rollDiceBtn.disabled = true;
  applyManualDiceBtn.disabled = true;

  rollDiceAnimated(value => {
    moveCurrentPlayer(value);
  });
});

if (diceVisualEl) {
  diceVisualEl.addEventListener("click", () => {
    if (diceMode === "auto") {
      rollDiceBtn.click();
    }
  });
}

applyManualDiceBtn.addEventListener("click", () => {
  if (isAnimating || gameOver || players.length === 0) return;
  const val = parseInt(manualDiceInputEl.value, 10);
  if (!val || val < 1 || val > 6) {
    manualDiceInputEl.focus();
    return;
  }

  rollDiceBtn.disabled = true;
  applyManualDiceBtn.disabled = true;

  if (diceVisualEl) {
    diceVisualEl.classList.add("rolling");
    playDiceThrowSound();

    setTimeout(() => {
      diceVisualEl.classList.remove("rolling");
      setDiceResultDisplay(val);
      moveCurrentPlayer(val);
    }, 500);
  } else {
    setDiceResultDisplay(val);
    moveCurrentPlayer(val);
  }
});

correctBtn.addEventListener("click", () => onQuestionResult(true));
wrongBtn.addEventListener("click", () => onQuestionResult(false));

closeWinnerBtn.addEventListener("click", () => {
  hideWinnerModal();
  startNewGame();
});

window.addEventListener("load", async () => {
  await loadQuestions();
  startNewGame();
});
