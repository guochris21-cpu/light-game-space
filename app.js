const gameGrid = document.getElementById("gameGrid");
const gameHost = document.getElementById("gameHost");
const controls = document.getElementById("controls");
const activeTitle = document.getElementById("activeTitle");
const activeDesc = document.getElementById("activeDesc");
const onlineBadge = document.getElementById("onlineBadge");
const netMode = document.getElementById("netMode");

const games = [
  { id: "snake", title: "贪吃蛇", desc: "方向键或按钮控制，吃食物变长" },
  { id: "jump", title: "跳跃小方块", desc: "点击/空格跳跃，躲避障碍" },
  { id: "2048", title: "2048", desc: "合并数字到 2048，支持滑动手势" },
];

const state = { currentGame: null, cleanup: null };

function setupNetworkAwareMode() {
  const updateOnline = () => {
    onlineBadge.textContent = navigator.onLine ? "在线" : "离线";
    onlineBadge.style.background = navigator.onLine ? "rgba(25,135,84,.25)" : "rgba(180,83,9,.3)";
  };

  const updateQuality = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    let mode = "标准模式";
    if (conn) {
      if (conn.saveData || ["slow-2g", "2g"].includes(conn.effectiveType)) {
        mode = "省流模式";
        document.body.classList.add("low-bandwidth");
      } else {
        document.body.classList.remove("low-bandwidth");
      }
    }
    netMode.textContent = mode;
  };

  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  if (navigator.connection) navigator.connection.addEventListener("change", updateQuality);

  updateOnline();
  updateQuality();
}

function renderCatalog() {
  gameGrid.innerHTML = "";
  games.forEach((g, index) => {
    const card = document.createElement("button");
    card.className = "card";
    card.innerHTML = `<h3>${g.title}</h3><p>${g.desc}</p>`;
    card.addEventListener("click", () => startGame(g.id));
    gameGrid.appendChild(card);
    if (index === 0) setTimeout(() => startGame(g.id), 60);
  });
}

function clearGame() {
  if (typeof state.cleanup === "function") state.cleanup();
  state.cleanup = null;
  controls.innerHTML = "";
  gameHost.innerHTML = "";
}

function startGame(id) {
  const game = games.find((g) => g.id === id);
  if (!game) return;
  clearGame();

  state.currentGame = id;
  activeTitle.textContent = game.title;
  activeDesc.textContent = game.desc;

  [...document.querySelectorAll(".card")].forEach((card) => {
    card.classList.toggle("active", card.querySelector("h3")?.textContent === game.title);
  });

  if (id === "snake") state.cleanup = mountSnake();
  if (id === "jump") state.cleanup = mountJump();
  if (id === "2048") state.cleanup = mount2048();
}

function addControl(label, onClick, alt = false) {
  const btn = document.createElement("button");
  btn.textContent = label;
  if (alt) btn.classList.add("alt");
  btn.addEventListener("click", onClick);
  controls.appendChild(btn);
}

function mountSnake() {
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 560;
  gameHost.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const grid = 20;
  let snake = [{ x: 10, y: 10 }];
  let dir = { x: 1, y: 0 };
  let food = { x: 15, y: 15 };
  let score = 0;
  let timer;

  const randomFood = () => {
    food = {
      x: Math.floor(Math.random() * grid),
      y: Math.floor(Math.random() * grid),
    };
  };

  const setDir = (x, y) => {
    if (snake.length > 1 && snake[0].x + x === snake[1].x && snake[0].y + y === snake[1].y) return;
    dir = { x, y };
  };

  const keyHandler = (e) => {
    if (e.key === "ArrowUp") setDir(0, -1);
    if (e.key === "ArrowDown") setDir(0, 1);
    if (e.key === "ArrowLeft") setDir(-1, 0);
    if (e.key === "ArrowRight") setDir(1, 0);
  };
  window.addEventListener("keydown", keyHandler);

  const draw = () => {
    ctx.fillStyle = "#0b1320";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= grid || head.y < 0 || head.y >= grid || snake.some((s) => s.x === head.x && s.y === head.y)) {
      clearInterval(timer);
      ctx.fillStyle = "#fff";
      ctx.font = "28px sans-serif";
      ctx.fillText(`游戏结束 分数: ${score}`, 120, 280);
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      randomFood();
    } else {
      snake.pop();
    }

    ctx.fillStyle = "#f94144";
    ctx.fillRect(food.x * 28, food.y * 28, 26, 26);

    ctx.fillStyle = "#2dd4bf";
    snake.forEach((s) => ctx.fillRect(s.x * 28, s.y * 28, 26, 26));

    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText(`分数: ${score}`, 12, 24);
  };

  addControl("上", () => setDir(0, -1));
  addControl("下", () => setDir(0, 1));
  addControl("左", () => setDir(-1, 0));
  addControl("右", () => setDir(1, 0));
  addControl("重开", () => startGame("snake"), true);

  timer = setInterval(draw, 130);

  return () => {
    clearInterval(timer);
    window.removeEventListener("keydown", keyHandler);
  };
}

function mountJump() {
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 320;
  gameHost.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let y = 250;
  let vy = 0;
  let obstacleX = 560;
  let score = 0;
  let dead = false;

  const jump = () => {
    if (!dead && y >= 249) vy = -12;
  };

  const keyHandler = (e) => {
    if (e.code === "Space") jump();
  };
  window.addEventListener("keydown", keyHandler);
  canvas.addEventListener("pointerdown", jump);

  addControl("跳跃", jump);
  addControl("重开", () => startGame("jump"), true);

  let rafId;
  const loop = () => {
    if (dead) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    vy += 0.6;
    y += vy;
    if (y > 250) {
      y = 250;
      vy = 0;
    }

    obstacleX -= 5;
    if (obstacleX < -28) {
      obstacleX = 580 + Math.random() * 180;
      score += 1;
    }

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 280, 560, 40);

    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(70, y, 30, 30);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(obstacleX, 248, 28, 32);

    if (obstacleX < 98 && obstacleX + 28 > 70 && y + 30 > 248) {
      dead = true;
      ctx.fillStyle = "#111827";
      ctx.font = "26px sans-serif";
      ctx.fillText(`撞到了，得分 ${score}`, 160, 140);
      return;
    }

    ctx.fillStyle = "#111827";
    ctx.font = "20px sans-serif";
    ctx.fillText(`得分: ${score}`, 16, 30);

    rafId = requestAnimationFrame(loop);
  };
  loop();

  return () => {
    window.removeEventListener("keydown", keyHandler);
    cancelAnimationFrame(rafId);
  };
}

function mount2048() {
  const boardEl = document.createElement("div");
  boardEl.className = "board-2048";
  gameHost.appendChild(boardEl);

  let board = Array.from({ length: 4 }, () => Array(4).fill(0));

  const colors = {
    0: "rgba(238,228,218,.35)",
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
  };

  const randomEmpty = () => {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!board[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  };

  const render = () => {
    boardEl.innerHTML = "";
    board.flat().forEach((n) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.style.background = colors[n] || "#3c3a32";
      tile.textContent = n ? String(n) : "";
      boardEl.appendChild(tile);
    });

    const max = Math.max(...board.flat());
    activeDesc.textContent = `当前最高: ${max}`;
  };

  const slide = (row) => {
    const arr = row.filter(Boolean);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        arr[i + 1] = 0;
      }
    }
    return arr.filter(Boolean).concat(Array(4 - arr.filter(Boolean).length).fill(0));
  };

  const moveLeft = () => {
    const old = JSON.stringify(board);
    board = board.map((r) => slide(r));
    if (JSON.stringify(board) !== old) randomEmpty();
    render();
  };

  const rotate = () => {
    board = board[0].map((_, i) => board.map((r) => r[i]).reverse());
  };

  const move = (dir) => {
    if (dir === "left") moveLeft();
    if (dir === "up") {
      rotate();
      moveLeft();
      rotate();
      rotate();
      rotate();
    }
    if (dir === "right") {
      rotate();
      rotate();
      moveLeft();
      rotate();
      rotate();
    }
    if (dir === "down") {
      rotate();
      rotate();
      rotate();
      moveLeft();
      rotate();
    }
  };

  const keyHandler = (e) => {
    if (e.key === "ArrowLeft") move("left");
    if (e.key === "ArrowRight") move("right");
    if (e.key === "ArrowUp") move("up");
    if (e.key === "ArrowDown") move("down");
  };

  let touchX = 0;
  let touchY = 0;
  boardEl.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });

  boardEl.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 8 ? "right" : "left");
    } else {
      move(dy > 8 ? "down" : "up");
    }
  }, { passive: true });

  window.addEventListener("keydown", keyHandler);

  addControl("上", () => move("up"));
  addControl("下", () => move("down"));
  addControl("左", () => move("left"));
  addControl("右", () => move("right"));
  addControl("重开", () => startGame("2048"), true);

  randomEmpty();
  randomEmpty();
  render();

  return () => {
    window.removeEventListener("keydown", keyHandler);
  };
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

setupNetworkAwareMode();
renderCatalog();
