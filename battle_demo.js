const field = document.getElementById("field");
const persuadeBar = document.getElementById("persuadeBar");
const persuadeVal = document.getElementById("persuadeVal");
const hpBar = document.getElementById("hpBar");
const hpVal = document.getElementById("hpVal");
const attackBtn = document.getElementById("attackBtn");
const overlay = document.getElementById("overlay");
const resultTitle = document.getElementById("resultTitle");
const resultDesc = document.getElementById("resultDesc");

// ゲーム設定
const WORDS_LIST = ["怪しいわ", "警察呼ぶわよ", "本当に息子？", "声が違う", "詐欺でしょ", "帰って", "信じない", "誰なの？"];
const SPAWN_INTERVAL = 800; // 弾幕生成間隔(ms)
const FALL_SPEED = 2; // 落下速度

// 状態
let state = {
  hp: 100,
  persuade: 0,
  isGameOver: false,
  lastSpawn: 0,
  words: [] // { el, x, y, speed }
};

// 初期化
function init() {
  loop();
}

// 弾幕生成
function spawnWord() {
  const text = WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
  const el = document.createElement("div");
  el.className = "word";
  el.textContent = text;
  
  // 横位置ランダム (10%〜90%)
  const x = 10 + Math.random() * 80;
  el.style.left = x + "%";
  el.style.top = "-50px";
  
  // タップイベント（破壊）
  el.addEventListener("pointerdown", (e) => {
    if (state.isGameOver) return;
    e.stopPropagation(); // 下の要素に伝播させない
    destroyWord(el);
  });

  field.appendChild(el);
  
  state.words.push({
    el: el,
    y: -50,
    speed: FALL_SPEED + Math.random() * 2, // 速度にばらつき
    active: true
  });
}

// 弾幕破壊処理
function destroyWord(el) {
  const wordObj = state.words.find(w => w.el === el);
  if (wordObj && wordObj.active) {
    wordObj.active = false;
    el.classList.add("destroyed");
    setTimeout(() => el.remove(), 200);
    
    // エフェクト
    showEffect(el.offsetLeft, el.offsetTop, "論破！");
  }
}

// エフェクト表示
function showEffect(x, y, text) {
  const el = document.createElement("div");
  el.className = "effect";
  el.textContent = text;
  el.style.left = x + "px";
  el.style.top = y + "px";
  field.appendChild(el);
  setTimeout(() => el.remove(), 500);
}

// 攻撃（説得）ボタン
attackBtn.addEventListener("click", () => {
  if (state.isGameOver) return;
  
  // 説得ゲージ増加
  state.persuade += 4; // 連打が必要な量
  if (state.persuade >= 100) {
    state.persuade = 100;
    gameClear();
  }
  updateUI();
  
  // ボタン演出
  const rect = attackBtn.getBoundingClientRect();
  showEffect(rect.left + rect.width/2, rect.top, "+説得");
});

// ゲームループ
function loop(timestamp) {
  if (state.isGameOver) return;

  if (!state.lastSpawn) state.lastSpawn = timestamp;
  
  // 弾幕生成
  if (timestamp - state.lastSpawn > SPAWN_INTERVAL) {
    spawnWord();
    state.lastSpawn = timestamp;
  }

  // 弾幕移動 & 判定
  state.words.forEach((w, i) => {
    if (!w.active) return;
    
    w.y += w.speed;
    w.el.style.top = w.y + "px";
    
    // 画面下端に到達（ダメージ）
    if (w.y > field.clientHeight - 30) {
      w.active = false;
      w.el.remove();
      state.words.splice(i, 1);
      
      damagePlayer(15);
    }
  });

  // 配列の掃除（非アクティブなものを削除）
  state.words = state.words.filter(w => w.active);

  requestAnimationFrame(loop);
}

// ダメージ処理
function damagePlayer(amount) {
  state.hp -= amount;
  if (state.hp <= 0) {
    state.hp = 0;
    gameOver();
  }
  updateUI();
  
  // 画面揺れ
  document.body.style.transform = "translateX(5px)";
  setTimeout(() => document.body.style.transform = "none", 50);
}

// UI更新
function updateUI() {
  persuadeBar.style.width = state.persuade + "%";
  persuadeVal.textContent = Math.floor(state.persuade) + "%";
  
  hpBar.style.width = state.hp + "%";
  hpVal.textContent = Math.floor(state.hp) + "%";
}

// ゲームオーバー
function gameOver() {
  state.isGameOver = true;
  resultTitle.textContent = "論破された…";
  resultTitle.style.color = "#ef4444";
  resultDesc.textContent = "相手の疑念を晴らせませんでした。";
  overlay.style.display = "flex";
}

// ゲームクリア
function gameClear() {
  state.isGameOver = true;
  resultTitle.textContent = "説得成功！";
  resultTitle.style.color = "#3b82f6";
  resultDesc.textContent = "見事に信じ込ませました。";
  overlay.style.display = "flex";
}

init();