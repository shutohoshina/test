const player = document.getElementById("player");
const gameArea = document.getElementById("gameArea");
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
const scoreVal = document.getElementById("scoreVal");
const gameOverScreen = document.getElementById("gameOver");
const skillBtn = document.getElementById("skillBtn");
const skillNameEl = document.getElementById("skillName");
const skillCoolEl = document.getElementById("skillCool");
const changeCharBtn = document.getElementById("changeCharBtn");

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
  enemies: [],
  bullets: [], // スキル弾など
  
  // キャラクター管理
  charId: "nogami",
  skillCoolTimer: 0, // 0なら使用可能
  maxSkillCool: 0
};

// キャラクター定義
const CHARACTERS = {
  nogami: {
    name: "ノガミ",
    icon: "😎",
    color: "#3b82f6",
    speed: 5,
    skillName: "オレオレ詐欺",
    skillCool: 180, // フレーム数 (約3秒)
    // スキル: 前方に「オレオレ！」弾を発射
    skillFunc: (s) => {
      spawnBullet(s.x, s.y, s.vx || 5, s.vy || 0, "オレオレ！", 8, 200);
    }
  },
  taki: {
    name: "タキ",
    icon: "😡",
    color: "#ef4444",
    speed: 4, // 遅い
    skillName: "恫喝",
    skillCool: 300, // 約5秒
    // スキル: 周囲の敵を吹き飛ばす
    skillFunc: (s) => {
      spawnShockwave(s.x, s.y, 150);
    }
  },
  akou: {
    name: "アコウ",
    icon: "🤓",
    color: "#10b981",
    speed: 6, // 速い
    skillName: "還付金詐欺",
    skillCool: 120, // 約2秒
    // スキル: 近くのターゲットに自動誘導弾
    skillFunc: (s) => {
      const target = findNearestTarget(s.x, s.y);
      if(target) {
        spawnHomingBullet(s.x, s.y, target, "還付金あります");
      } else {
        spawnBullet(s.x, s.y, 0, -5, "還付金…", 5, 100);
      }
    }
  }
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
  setCharacter("nogami");
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

// キャラ変更
function setCharacter(id) {
  state.charId = id;
  const char = CHARACTERS[id];
  player.textContent = char.icon;
  player.style.background = char.color;
  state.speed = char.speed;
  state.maxSkillCool = char.skillCool;
  state.skillCoolTimer = 0;
  skillNameEl.textContent = char.skillName;
  updateSkillUI();
}

changeCharBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // ジョイスティック反応防止
  const ids = Object.keys(CHARACTERS);
  const nextIdx = (ids.indexOf(state.charId) + 1) % ids.length;
  setCharacter(ids[nextIdx]);
});

// --- 入力イベント（ぷにコン風操作） ---
gameArea.addEventListener("pointerdown", e => {
  if(state.isGameOver) return;
  
  // スキルボタンやUI上のタップなら移動しない
  if (e.target.closest("button")) return;

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

// スキル発動
skillBtn.addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  if (state.skillCoolTimer > 0) return;
  
  const char = CHARACTERS[state.charId];
  char.skillFunc(state);
  state.skillCoolTimer = state.maxSkillCool;
  updateSkillUI();
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
  state.targets.forEach(t => {
    const dx = state.x - t.x;
    const dy = state.y - t.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // 接触判定（距離50px以内）
    if (dist < 60) {
      t.hp -= 2; // 接触中はHPが減る
      updateTargetView(t);
    } else {
      t.el.style.transform = `translate(-50%, -50%) scale(1)`;
    }
  });

  // ターゲットの死亡判定を一括処理
  checkTargetsDead();
  
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
  
  // 4. 弾（スキル）処理
  state.bullets.forEach(b => {
    if (!b.active) return;
    
    // 移動
    if (b.homing) {
      // 誘導弾
      const dx = b.target.x - b.x;
      const dy = b.target.y - b.y;
      const angle = Math.atan2(dy, dx);
      b.vx = Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
    }
    
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    
    b.el.style.left = b.x + "px";
    b.el.style.top = b.y + "px";
    
    // ターゲットとの当たり判定
    state.targets.forEach(t => {
      const dx = b.x - t.x;
      const dy = b.y - t.y;
      if (Math.sqrt(dx*dx + dy*dy) < 50) {
        t.hp -= 30; // 大ダメージ
        updateTargetView(t);
        b.life = 0; // 弾消滅
      }
    });
    
    // 寿命尽きたら消す
    if (b.life <= 0) {
      b.active = false;
      b.el.remove();
    }
  });
  state.bullets = state.bullets.filter(b => b.active);

  // 5. クールタイム処理
  if (state.skillCoolTimer > 0) {
    state.skillCoolTimer--;
    updateSkillUI();
  }

  requestAnimationFrame(loop);
}

// ターゲットの見た目更新＆死亡チェック
function updateTargetView(t) {
  const shake = Math.random() * 4 - 2;
  t.el.style.transform = `translate(calc(-50% + ${shake}px), -50%) scale(${0.5 + t.hp/200})`;
}

function checkTargetsDead() {
  for (let i = state.targets.length - 1; i >= 0; i--) {
    const t = state.targets[i];
    if (t.hp <= 0) {
      t.el.remove();
      state.targets.splice(i, 1);
      state.score += 100000;
      scoreVal.textContent = state.score.toLocaleString();
      spawnTarget();
      if(state.score % 300000 === 0) spawnEnemy();
    }
  }
}

// スキルUI更新
function updateSkillUI() {
  const pct = (state.skillCoolTimer / state.maxSkillCool) * 100;
  skillCoolEl.style.height = pct + "%";
  skillBtn.disabled = state.skillCoolTimer > 0;
}

// --- スキル用ヘルパー ---

// 通常弾発射
function spawnBullet(x, y, vx, vy, text, speed, life) {
  // 速度ベクトルがない場合は前方に
  if (vx === 0 && vy === 0) vx = 1;
  
  // 正規化してスピードを掛ける
  const len = Math.sqrt(vx*vx + vy*vy);
  vx = (vx / len) * speed;
  vy = (vy / len) * speed;

  const el = document.createElement("div");
  el.className = "skillEffect";
  el.textContent = text;
  gameArea.appendChild(el);
  
  state.bullets.push({ el, x, y, vx, vy, life, active: true });
}

// 誘導弾発射
function spawnHomingBullet(x, y, target, text) {
  const el = document.createElement("div");
  el.className = "skillEffect";
  el.textContent = text;
  el.style.color = "#10b981";
  gameArea.appendChild(el);
  
  state.bullets.push({ el, x, y, vx:0, vy:0, life:300, active:true, homing:true, target, speed:7 });
}

// 衝撃波（範囲攻撃）
function spawnShockwave(x, y, radius) {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.width = "10px";
  el.style.height = "10px";
  el.style.border = "4px solid #ef4444";
  el.style.borderRadius = "50%";
  el.style.transform = "translate(-50%, -50%)";
  el.style.transition = "all 0.3s ease-out";
  el.style.zIndex = "20";
  gameArea.appendChild(el);

  // アニメーション
  requestAnimationFrame(() => {
    el.style.width = (radius * 2) + "px";
    el.style.height = (radius * 2) + "px";
    el.style.opacity = "0";
  });
  setTimeout(() => el.remove(), 300);

  // 範囲内の敵にダメージ
  state.targets.forEach(t => {
    const dist = Math.sqrt((t.x - x)**2 + (t.y - y)**2);
    if (dist < radius) {
      t.hp -= 50;
      updateTargetView(t);
    }
  });
  
  // 警察を吹き飛ばす（簡易）
  state.enemies.forEach(e => {
    const dist = Math.sqrt((e.x - x)**2 + (e.y - y)**2);
    if (dist < radius) {
      const angle = Math.atan2(e.y - y, e.x - x);
      e.x += Math.cos(angle) * 100;
      e.y += Math.sin(angle) * 100;
    }
  });
}

// 一番近いターゲットを探す
function findNearestTarget(x, y) {
  let nearest = null;
  let minDist = Infinity;
  state.targets.forEach(t => {
    const dist = Math.sqrt((t.x - x)**2 + (t.y - y)**2);
    if (dist < minDist) {
      minDist = dist;
      nearest = t;
    }
  });
  return nearest;
}

init();