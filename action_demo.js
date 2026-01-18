const player = document.getElementById("player");
const gameArea = document.getElementById("gameArea");
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
const scoreVal = document.getElementById("scoreVal");
const gameOverScreen = document.getElementById("gameOver");

// ゲーム状態
let state = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  vx: 0,
  vy: 0,
  speed: 5, // プレイヤーの移動速度
  score: 0,
  isGameOver: false,
  targets: [],
  enemies: []
};

// 入力状態
let input = {
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0
};

// 初期化
function init() {
  spawnTarget(); // 最初のターゲット
  spawnEnemy();  // 最初の敵
  loop();
}

// ターゲット（カモ）生成
function spawnTarget() {
  const el = document.createElement("div");
  el.className = "char target";
  el.textContent = "👴";
  // 画面内のランダムな位置
  const x = Math.random() * (window.innerWidth - 100) + 50;
  const y = Math.random() * (window.innerHeight - 100) + 50;
  el.style.left = x + "px";
  el.style.top = y + "px";
  gameArea.appendChild(el);
  
  state.targets.push({ el, x, y, hp: 100 });
}

// 敵（警察）生成
function spawnEnemy() {
  const el = document.createElement("div");
  el.className = "char enemy";
  el.textContent = "🚓";
  // 画面外から出現させる
  const x = Math.random() < 0.5 ? -60 : window.innerWidth + 60;
  const y = Math.random() * window.innerHeight;
  el.style.left = x + "px";
  el.style.top = y + "px";
  gameArea.appendChild(el);
  
  // 速度はランダム
  state.enemies.push({ el, x, y, speed: 1.5 + Math.random() });
}

// --- 入力イベント（ぷにコン風操作） ---
gameArea.addEventListener("pointerdown", e => {
  if(state.isGameOver) return;
  input.active = true;
  input.startX = e.clientX;
  input.startY = e.clientY;
  input.currentX = e.clientX;
  input.currentY = e.clientY;
  
  // ジョイスティックを表示
  joystickBase.style.display = "block";
  joystickBase.style.left = e.clientX + "px";
  joystickBase.style.top = e.clientY + "px";
  joystickKnob.style.transform = `translate(-50%, -50%)`;
});

gameArea.addEventListener("pointermove", e => {
  if (!input.active) return;
  input.currentX = e.clientX;
  input.currentY = e.clientY;
  
  // 引っ張った距離と角度を計算
  const dx = input.currentX - input.startX;
  const dy = input.currentY - input.startY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const maxDist = 50; // ジョイスティックの可動範囲
  
  // ノブの表示位置を制限
  const angle = Math.atan2(dy, dx);
  const clampDist = Math.min(dist, maxDist);
  const knobX = Math.cos(angle) * clampDist;
  const knobY = Math.sin(angle) * clampDist;
  
  joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
  
  // プレイヤーの移動ベクトルを設定（少し遊びを持たせる）
  if (dist > 10) {
    state.vx = Math.cos(angle) * state.speed;
    state.vy = Math.sin(angle) * state.speed;
  } else {
    state.vx = 0;
    state.vy = 0;
  }
});

gameArea.addEventListener("pointerup", () => {
  input.active = false;
  state.vx = 0;
  state.vy = 0;
  joystickBase.style.display = "none";
});

// --- ゲームループ ---
function loop() {
  if (state.isGameOver) return;
  
  // 1. プレイヤー移動
  state.x += state.vx;
  state.y += state.vy;
  // 画面外に出ないように制限
  state.x = Math.max(25, Math.min(window.innerWidth - 25, state.x));
  state.y = Math.max(25, Math.min(window.innerHeight - 25, state.y));
  player.style.left = state.x + "px";
  player.style.top = state.y + "px";
  
  // 2. ターゲット処理（接触でHPを削る）
  state.targets.forEach((t, i) => {
    const dx = state.x - t.x;
    const dy = state.y - t.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // 接触判定（距離50px以内）
    if (dist < 60) {
      t.hp -= 2; // 接触中はHPが減る
      // 振動演出
      const shake = Math.random() * 4 - 2;
      t.el.style.transform = `translate(calc(-50% + ${shake}px), -50%) scale(${0.5 + t.hp/200})`;
      
      if (t.hp <= 0) {
        // 説得完了（撃破）
        t.el.remove();
        state.targets.splice(i, 1);
        state.score += 100000; // 10万円
        scoreVal.textContent = state.score.toLocaleString();
        
        // 次のターゲット出現
        spawnTarget();
        // スコアに応じて敵が増える
        if(state.score % 300000 === 0) spawnEnemy();
      }
    } else {
      t.el.style.transform = `translate(-50%, -50%) scale(1)`;
    }
  });
  
  // 3. 敵処理（プレイヤーを追尾）
  state.enemies.forEach(e => {
    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const angle = Math.atan2(dy, dx);
    
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;
    
    e.el.style.left = e.x + "px";
    e.el.style.top = e.y + "px";
    
    // 接触判定（ゲームオーバー）
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 45) {
      state.isGameOver = true;
      gameOverScreen.style.display = "flex";
    }
  });
  
  requestAnimationFrame(loop);
}

init();