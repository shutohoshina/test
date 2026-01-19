// c:\Users\shuto.hoshina\Desktop\test\battle.js

// バトル用の状態管理
const battleState = {
  active: false,
  ally: null,
  enemy: null,
  logs: [],
  turn: "player" // "player" | "enemy" | "end"
};

// 描画用ヘルパー（main.jsと同じもの）
function card(title, bodyHtml){
  return `
    <section class="card">
      <div class="h1">${title}</div>
      ${bodyHtml}
    </section>
  `;
}

// バトル開始（テスト用）
function startBattleTest() {
  // テスト用キャラクターデータ
  battleState.ally = { name: "ノガミ", hp: 100, maxHp: 100, atk: 20, def: 5, image: "assets/nogami.png" };
  battleState.enemy = { name: "チンピラ", hp: 80, maxHp: 80, atk: 15, def: 2, image: "assets/enemy.png" };
  
  battleState.logs = [`${battleState.enemy.name} が現れた！`];
  battleState.turn = "player";
  battleState.active = true;

  // main.js の state を操作して画面切り替え
  state.tab = "battle";
  render();
}

// バトル画面の描画
function renderBattle() {
  // バトル未開始時の表示
  if (!battleState.active) {
    const body = `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:60px; margin-bottom:16px;">⚔️</div>
        <div class="p" style="margin-bottom:24px;">路地裏でチンピラに絡まれるかもしれない。</div>
        <button class="btn" id="startBattleBtn" style="background:linear-gradient(135deg, #ef4444, #b91c1c); border:none;">
          戦闘を開始する
        </button>
      </div>
    `;
    const screen = document.getElementById("screen");
    screen.innerHTML = card("バトル", body);
    document.getElementById("startBattleBtn").onclick = startBattleTest;
    return;
  }

  const { ally, enemy, logs, turn } = battleState;
  const isPlayerTurn = turn === "player";

  // バトルフィールド（左右対峙レイアウト）
  const battleFieldHtml = `
    <div style="position:relative; flex:1; background:#1a1e2e; border-radius:8px; margin-bottom:16px; overflow:hidden;">
      
      <!-- キャラクター配置エリア -->
      <div style="display:flex; justify-content:space-between; align-items:center; height:100%; padding:20px 10px 80px 10px;">
        
        <!-- 味方エリア（左側） -->
        <div style="text-align:center; width:45%; display:flex; flex-direction:column; align-items:center;">
          <!-- キャラクター画像 -->
          <img id="allyVisual" src="${ally.image}" style="width:100%; max-width:200px; height:auto; max-height:220px; object-fit:contain; margin-bottom:8px; filter: drop-shadow(0 0 8px rgba(0,0,0,0.6));">
          
          <div style="width:100%;">
            <div style="font-size:13px; font-weight:bold; margin-bottom:2px; text-shadow:1px 1px 2px #000;">${ally.name}</div>
            <div style="background:#333; height:6px; border-radius:3px; overflow:hidden; width:100%;">
              <div style="width:${(ally.hp / ally.maxHp) * 100}%; background:#4ade80; height:100%; transition: width 0.3s;"></div>
            </div>
            <div style="font-size:11px; margin-top:2px; color:#aaa;">${ally.hp} / ${ally.maxHp}</div>
          </div>
        </div>

        <!-- 敵エリア（右側） -->
        <div style="text-align:center; width:45%; display:flex; flex-direction:column; align-items:center;">
          <!-- キャラクター画像 -->
          <img id="enemyVisual" src="${enemy.image}" style="width:100%; max-width:200px; height:auto; max-height:220px; object-fit:contain; margin-bottom:8px; filter: drop-shadow(0 0 8px rgba(0,0,0,0.6));">
          
          <div style="width:100%;">
            <div style="font-size:13px; font-weight:bold; margin-bottom:2px; text-shadow:1px 1px 2px #000;">${enemy.name}</div>
            <div style="background:#333; height:6px; border-radius:3px; overflow:hidden; width:100%;">
              <div style="width:${(enemy.hp / enemy.maxHp) * 100}%; background:#fb7185; height:100%; transition: width 0.3s;"></div>
            </div>
            <div style="font-size:11px; margin-top:2px; color:#aaa;">${enemy.hp} / ${enemy.maxHp}</div>
          </div>
        </div>

      </div>

      <!-- ログエリア（下部オーバーレイ） -->
      <div style="position:absolute; bottom:0; left:0; width:100%; height:70px; background:rgba(0,0,0,0.7); padding:8px 12px; overflow-y:auto; font-size:12px; color:#eee; border-top:1px solid #444;">
        ${[...logs].reverse().map(l => `<div style="margin-bottom:2px;">${l}</div>`).join("")}
      </div>

    </div>
  `;

  // コマンドボタン
  const btnStyle = `
    flex: 1;
    height: 64px;
    font-size: 14px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 2px;
    transition: transform 0.1s;
  `;
  
  // ボタンの無効化スタイル
  const disabledStyle = "opacity: 0.5; cursor: not-allowed; filter: grayscale(100%);";

  const commandsHtml = `
    <div style="display:flex; gap:8px;">
      <button id="cmdFight" style="${btnStyle} background:linear-gradient(135deg, #ef4444, #b91c1c); ${!isPlayerTurn ? disabledStyle : ''}" ${!isPlayerTurn ? 'disabled' : ''}>
        <span style="font-size:18px">⚔️</span> 戦闘
      </button>
      <button id="cmdSkill" style="${btnStyle} background:linear-gradient(135deg, #3b82f6, #1d4ed8); ${!isPlayerTurn ? disabledStyle : ''}" ${!isPlayerTurn ? 'disabled' : ''}>
        <span style="font-size:18px">✨</span> 技能
      </button>
      <button id="cmdRun" style="${btnStyle} background:linear-gradient(135deg, #a3a3a3, #525252); ${!isPlayerTurn ? disabledStyle : ''}" ${!isPlayerTurn ? 'disabled' : ''}>
        <span style="font-size:18px">💨</span> 逃走
      </button>
    </div>
  `;

  const body = `
    <div style="display:flex; flex-direction:column; height:68vh;">
      ${battleFieldHtml}
      ${commandsHtml}
    </div>
  `;

  // main.js の screen 要素と card 関数を使用
  const screen = document.getElementById("screen");
  screen.innerHTML = card("バトル", body);

  // イベントリスナー設定
  if (isPlayerTurn) {
    document.getElementById("cmdFight").onclick = () => execBattleAction("fight");
    document.getElementById("cmdSkill").onclick = () => execBattleAction("skill");
    document.getElementById("cmdRun").onclick = () => execBattleAction("run");
  }
}

// プレイヤー行動処理
function execBattleAction(type) {
  if (battleState.turn !== "player") return;

  const { ally, enemy } = battleState;

  if (type === "fight") {
    // 攻撃計算
    const variance = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1倍
    const dmg = Math.floor((ally.atk * variance) - (enemy.def / 2));
    const finalDmg = Math.max(1, dmg);
    
    enemy.hp = Math.max(0, enemy.hp - finalDmg);
    battleState.logs.push(`⚔️ ${ally.name}の攻撃！ ${enemy.name}に${finalDmg}のダメージ！`);

  } else if (type === "skill") {
    // 技能（今回は回復固定）
    const heal = 30;
    const oldHp = ally.hp;
    ally.hp = Math.min(ally.maxHp, ally.hp + heal);
    const actualHeal = ally.hp - oldHp;
    battleState.logs.push(`✨ ${ally.name}は技能を使った！ HPが${actualHeal}回復した！`);

  } else if (type === "run") {
    // 逃走
    battleState.logs.push(`💨 ${ally.name}は一目散に逃げ出した！`);
    battleState.turn = "end";
    renderBattle();
    setTimeout(() => {
      battleState.active = false;
      render();
    }, 1200);
    return;
  }

  // 勝利判定
  if (enemy.hp <= 0) {
    battleState.logs.push(`🎉 ${enemy.name}を倒した！`);
    battleState.turn = "end";
    renderBattle();
    setTimeout(() => {
      alert("勝利！ 報酬として1000円を手に入れた。");
      state.wallet += 1000;
      battleState.active = false;
      state.tab = "home";
      render();
    }, 1500);
    return;
  }

  // 敵ターンへ移行
  battleState.turn = "enemy";
  renderBattle();
  
  if (type === "fight") animateAttack("player");

  setTimeout(execEnemyTurn, 1000);
}

// 敵行動処理
function execEnemyTurn() {
  if (battleState.turn !== "enemy") return;
  const { ally, enemy } = battleState;

  // 敵の攻撃
  const variance = 0.9 + Math.random() * 0.2;
  const dmg = Math.floor((enemy.atk * variance) - (ally.def / 2));
  const finalDmg = Math.max(1, dmg);

  ally.hp = Math.max(0, ally.hp - finalDmg);
  battleState.logs.push(`👾 ${enemy.name}の攻撃！ ${ally.name}に${finalDmg}のダメージ！`);

  // アニメーションのために一旦描画
  renderBattle();
  animateAttack("enemy");

  // 敗北判定
  if (ally.hp <= 0) {
    setTimeout(() => {
      battleState.logs.push(`💀 ${ally.name}は力尽きた...`);
      battleState.turn = "end";
      render();
      setTimeout(() => {
        alert("敗北しました...");
        battleState.active = false;
        state.tab = "home";
        render();
      }, 1500);
    }, 800);
    return;
  }

  // プレイヤーターンへ戻る
  setTimeout(() => {
    battleState.turn = "player";
    renderBattle();
  }, 800);
}

// 攻撃アニメーション
function animateAttack(attacker) {
  const allyEl = document.getElementById("allyVisual");
  const enemyEl = document.getElementById("enemyVisual");
  if (!allyEl || !enemyEl) return;

  if (attacker === "player") {
    // 味方の攻撃アクション（右へタックル）
    allyEl.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(30px)' }, 
      { transform: 'translateX(0)' }
    ], { duration: 200, easing: 'ease-out' });

    // 敵のダメージ（揺れ）
    enemyEl.animate([
      { transform: 'translate(0, 0)' },
      { transform: 'translate(5px, 0)' },
      { transform: 'translate(-5px, 0)' },
      { transform: 'translate(5px, 0)' },
      { transform: 'translate(-5px, 0)' },
      { transform: 'translate(0, 0)' }
    ], { duration: 400, delay: 100 });

  } else {
    // 敵の攻撃アクション（左へタックル）
    enemyEl.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-30px)' },
      { transform: 'translateX(0)' }
    ], { duration: 200, easing: 'ease-out' });

    // 味方のダメージ（揺れ）
    allyEl.animate([
      { transform: 'translate(0, 0)' },
      { transform: 'translate(5px, 0)' },
      { transform: 'translate(-5px, 0)' },
      { transform: 'translate(5px, 0)' },
      { transform: 'translate(-5px, 0)' },
      { transform: 'translate(0, 0)' }
    ], { duration: 400, delay: 100 });
  }
}