const msgText = document.getElementById("msgText");
const commandWindow = document.getElementById("commandWindow");
const hpVal = document.getElementById("hpVal");
const mpVal = document.getElementById("mpVal");
const enemyHpBar = document.getElementById("enemyHpBar");
const enemyEl = document.getElementById("enemy");
const mainView = document.getElementById("mainView");

// ゲーム状態
let state = {
  hp: 100,
  maxHp: 100,
  mp: 30,
  maxMp: 30,
  enemyHp: 100,
  maxEnemyHp: 100,
  turn: "player", // player | enemy | wait | end
};

// コマンド定義
const rootCommands = [
  { label: "たたかう (説得)", action: "attack" },
  { label: "じゅもん (手口)", action: "magic_menu" },
  { label: "どうぐ (小道具)", action: "item_menu" },
  { label: "にげる (ガチャ切)", action: "run" }
];

const magicCommands = [
  { label: "ナキオトシ (5)", cost: 5, power: 25, msg: "ノガミは 泣き落とし をした！\n「俺だよ、母さん…！」" },
  { label: "ドウカツ (8)", cost: 8, power: 40, msg: "ノガミは 恫喝 をした！\n「裁判沙汰になるぞ！」" },
  { label: "センモンヨウゴ (4)", cost: 4, power: 15, msg: "ノガミは 専門用語 を並べた！\n「コンプライアンス的に…」" },
  { label: "もどる", action: "back" }
];

const itemCommands = [
  { label: "偽造書類", count: 1, power: 30, msg: "ノガミは 偽造書類 をFAXした！" },
  { label: "エナドリ", count: 2, heal: 30, msg: "ノガミは エナドリ を飲んだ！\nメンタルが回復した！" },
  { label: "もどる", action: "back" }
];

// 初期化
function init() {
  log("モブばあ が あらわれた！");
  log("電話がつながった！");
  renderCommands(rootCommands);
}

// メッセージ表示
function log(text) {
  const div = document.createElement("div");
  div.className = "msgLine";
  div.innerText = text;
  msgText.appendChild(div);
  msgText.scrollTop = msgText.scrollHeight;
}

// コマンド描画
function renderCommands(list) {
  commandWindow.innerHTML = "";
  list.forEach(cmd => {
    const btn = document.createElement("button");
    btn.innerText = cmd.label;
    
    // MP不足などのチェック
    if (cmd.cost && state.mp < cmd.cost) {
      btn.disabled = true;
    }

    btn.onclick = () => handleCommand(cmd, list);
    commandWindow.appendChild(btn);
  });
}

// コマンド処理
function handleCommand(cmd, currentList) {
  if (state.turn !== "player") return;

  // メニュー遷移
  if (cmd.action === "magic_menu") return renderCommands(magicCommands);
  if (cmd.action === "item_menu") return renderCommands(itemCommands);
  if (cmd.action === "back") return renderCommands(rootCommands);

  // 行動実行
  commandWindow.innerHTML = ""; // ボタンを消す
  
  if (cmd.action === "run") {
    log("ノガミは 電話をガチャ切りした！");
    setTimeout(() => {
      log("……逃げ出した。");
      endGame(false);
    }, 1000);
    return;
  }

  // 攻撃・スキル処理
  if (cmd.action === "attack") {
    log("ノガミの 説得！");
    log("「もしもし、俺だけど…」");
    attackEnemy(10 + Math.floor(Math.random() * 5));
  } else if (cmd.cost !== undefined) {
    // 呪文
    state.mp -= cmd.cost;
    updateStatus();
    log(cmd.msg);
    attackEnemy(cmd.power + Math.floor(Math.random() * 10));
  } else if (cmd.heal !== undefined) {
    // 回復アイテム
    state.hp = Math.min(state.maxHp, state.hp + cmd.heal);
    updateStatus();
    log(cmd.msg);
    nextTurn();
  } else if (cmd.power !== undefined) {
    // 攻撃アイテム
    log(cmd.msg);
    attackEnemy(cmd.power);
  }
}

// 敵へのダメージ処理
function attackEnemy(dmg) {
  setTimeout(() => {
    // エフェクト
    enemyEl.classList.add("shake");
    showDamage(dmg, enemyEl);
    
    // HP減少
    state.enemyHp = Math.max(0, state.enemyHp - dmg);
    enemyHpBar.style.width = (state.enemyHp / state.maxEnemyHp * 100) + "%";
    
    log(`モブばあ の警戒心が ${dmg} 下がった！`);

    setTimeout(() => {
      enemyEl.classList.remove("shake");
      if (state.enemyHp <= 0) {
        log("モブばあ を 完全に信じ込ませた！");
        endGame(true);
      } else {
        nextTurn();
      }
    }, 600);
  }, 500);
}

// ターン経過
function nextTurn() {
  state.turn = "enemy";
  setTimeout(enemyAction, 1000);
}

// 敵の行動
function enemyAction() {
  log("モブばあ の ターン！");
  
  setTimeout(() => {
    const act = Math.random();
    if (act < 0.3) {
      log("モブばあ は 疑っている！\n「声が違うんじゃない？」");
      damagePlayer(15);
    } else if (act < 0.6) {
      log("モブばあ は 警察の話をしだした！\n「交番のお巡りさんがね…」");
      damagePlayer(25);
    } else {
      log("モブばあ は ぼーっとしている。");
      state.turn = "player";
      renderCommands(rootCommands);
    }
  }, 1000);
}

// プレイヤーへのダメージ
function damagePlayer(dmg) {
  setTimeout(() => {
    mainView.classList.add("shake"); // 画面全体を揺らす
    state.hp = Math.max(0, state.hp - dmg);
    updateStatus();
    log(`ノガミの メンタルが ${dmg} 減った！`);

    setTimeout(() => {
      mainView.classList.remove("shake");
      if (state.hp <= 0) {
        log("ノガミは 心が折れてしまった…");
        endGame(false);
      } else {
        state.turn = "player";
        renderCommands(rootCommands);
      }
    }, 500);
  }, 500);
}

// ステータス更新
function updateStatus() {
  hpVal.innerText = state.hp;
  mpVal.innerText = state.mp;
}

// ダメージポップアップ
function showDamage(val, target) {
  const el = document.createElement("div");
  el.className = "damage";
  el.innerText = val;
  // ターゲットの中心付近に出す
  const rect = target.getBoundingClientRect();
  el.style.left = (rect.left + rect.width / 2) + "px";
  el.style.top = (rect.top + rect.height / 2) + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

// ゲーム終了
function endGame(win) {
  state.turn = "end";
  setTimeout(() => {
    if (win) {
      alert("詐欺成功！ 資金を獲得しました。");
    } else {
      alert("失敗…");
    }
    location.reload();
  }, 1000);
}

init();