const screen = document.getElementById("screen");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const homeBtn = document.getElementById("homeBtn");
const topbarTitle = document.querySelector(".topbar .title");
const nav = document.querySelector(".nav");
const navItems = Array.from(document.querySelectorAll(".navItem"));

// --- MVPデータ（現実の再現にならないように抽象化） ---
const jobs = [
  { id: "empathy", name: "関係構築型", desc: "信頼を積むタイプ。リスクも積み上がる。", base: 1200 },
  { id: "urgency", name: "緊急誘導型", desc: "短期決着。成功しても不安定。", base: 900 },
  { id: "opportunity", name: "機会提示型", desc: "条件が噛み合うと伸びる。", base: 1000 },
  { id: "oreore", name: "オレオレ詐欺", desc: "タキが好む手法。オレオレと言いたいだけではないのか。", base: 1100 },
];

const targets = [
  { id: "t1", name: "ターゲットA", level: 1, risk: 1.1 },
  { id: "t2", name: "ターゲットB", level: 2, risk: 1.35 },
  { id: "t3", name: "ターゲットC", level: 3, risk: 1.6 },
];

const members = [
  { id: "m1", name: "メンバー①", level: 1, stability: 1.1 },
  { id: "m2", name: "メンバー②", level: 2, stability: 1.0 },
  { id: "m3", name: "メンバー③", level: 3, stability: 0.9 },
];

const oreoreMembers = [
  { id: "taki", name: "タキ", desc: "直情的な元リーダー" },
  { id: "akou", name: "アコウ", desc: "落ち着きがあるサブリーダー" },
  { id: "mob", name: "モブ", desc: "ただの下っ端" },
];

const oreoreTargets = [
  { id: "oldman", name: "モブじい", desc: "警戒心が薄い", assets: 2, vigilance: 1 },
  { id: "oldwoman", name: "モブばあ", desc: "話好き", assets: 5, vigilance: 3 },
  { id: "mob3", name: "モブさん", desc: "一般的", assets: 10, vigilance: 5 },
];

const oreoreTactics = [
  { id: "manual", name: "手順書通りに進めていけ", desc: "基本に忠実なアプローチ" },
  { id: "flexible", name: "柔軟に対応しろ", desc: "状況に応じたアドリブ" },
  { id: "push", name: "勢いで押し切れ", desc: "強引な突破" },
];

// --- 状態 ---
const defaultState = {
  tab: "home", // home / work / recruit / base / story
  step: 0,
  job: null,
  target: null,
  member: null,
  headMember: null,
  tactic: null,
  waitSec: 0,
  timer: null,
  startedAt: null,
  earned: 0,
  wallet: 0, // 所持金（累計）
  orgLevel: 1, // ★追加
  storyOpen: null, // "main" or "sub"
  storyPlaying: null, // 再生中のストーリーID
  storyIndex: 0,      // 現在の台詞インデックス
};

// 起動時にロード
let state = { ...defaultState };

// --- 効果音（assets/coin.mp3 を置いたら鳴る） ---
let coinAudio = null;
try {
  coinAudio = new Audio("assets/coin.mp3");
  coinAudio.preload = "auto";
} catch (_) {}

// --- ユーティリティ ---
function setStep(n){
  state.step = n;
  render();
}

function formatYen(n){
  return "¥" + Math.round(n).toLocaleString("ja-JP");
}

function clearTimer(){
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

function playCoin(){
  if (!coinAudio) return;
  coinAudio.currentTime = 0;
  coinAudio.play().catch(()=>{ /* スマホは最初のタップ後にOK */ });
}

// --- 描画部品 ---
function card(title, bodyHtml){
  return `
    <section class="card">
      <div class="h1">${title}</div>
      ${bodyHtml}
    </section>
  `;
}

function renderChoices(items, selectedId, onClickName, containerClass = "row"){
  const html = items.map(it => {
    const meta = it.desc ?? (it.level !== undefined ? `Lv.${it.level}` : "");
    return `
    <div class="choice ${selectedId===it.id ? "selected":""}" data-id="${it.id}" data-on="${onClickName}">
      <div class="name">${it.name}</div>
      ${meta ? `<div class="meta">${meta}</div>` : ""}
      ${it.level ? `<div class="meta">レベル: <b style="color:#e8e9ee">Lv.${it.level}</b></div>` : ``}
    </div>
  `}).join("");
  return `<div class="${containerClass}">${html}</div>`;
}

// --- 画面レンダリング ---
function render(){
  topbarTitle.textContent = `資金：${state.wallet.toLocaleString("ja-JP")}円`;

  navItems.forEach(b => b.classList.toggle("active", b.dataset.tab === state.tab));

  clearTimerIfLeavingWait();

  // ストーリー再生中なら最優先でプレイヤーを表示
  if (state.storyPlaying) return renderStoryPlayer();

  if (state.tab === "home") return renderHomeNew();
  if (state.tab === "recruit") return renderPlaceholder("人事", "準備中！メンバーを増やす機能をここに作る。");
  if (state.tab === "base") return renderPlaceholder("拠点", "準備中！組織レベルや強化要素をここに作る。");
  if (state.tab === "story") return renderStory();

  if (state.tab === "work"){
    // オレオレ詐欺ルート
    if (state.job?.id === "oreore") {
      switch (state.step) {
        case 1: return renderStep1();
        case 2: return renderOreoreStep2();
        case 3: return renderOreoreStep3();
        case 4: return renderOreoreStep4();
        case 5: return renderOreoreStep5();
        case 6: return renderOreoreStep6();
        default: return renderPlaceholder("オレオレ詐欺", "ここから先は実装待ちです。");
      }
    }

    switch (state.step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return setStep(1);
    }
  }
}


function clearTimerIfLeavingWait(){
  // wait中以外なら止める
  // タブがwork以外、または stepがタイマーを使う場面(2, 5)以外なら停止
  if (state.tab !== "work") {
    clearTimer();
    return;
  }
  if (state.step !== 2 && state.step !== 5) {
    clearTimer();
  }
}

function canGoNext(){
  if (state.step === 1) return !!state.job;
  if (state.step === 2) return true;
  if (state.step === 3) return !!state.target;
  if (state.step === 4) return !!state.member;
  if (state.step === 5) return false; // 待機中は自動遷移
  if (state.step === 6) return false; // 結果画面
  return false;
}

function renderHomeNew(){
  const body = `
    <div class="homeWrap">
      <section class="card" style="margin-top:0">
        <p class="p">組織の現在地</p>
        <div class="h1"><b>${getOrgStatusText()}</b></div>
      </section>
      <div style="flex:1"></div>

      <div class="homeBottom">
        <div class="bubble">
          <div class="nameTag">ノガミ</div>
          <div class="bubbleText">${getNogamiLine()}</div>
        </div>
      </div>
    </div>
  `;
  screen.innerHTML = body;
}

function getOrgStatusText(){
  // いまはレベル1固定（後でswitchに拡張）
  if (state.orgLevel === 1) {
    return "風で飛んでいく弱小グループ";
  }

  // 将来用（ダミー）
  if (state.orgLevel === 2) {
    return "寄せ集めだが、形になり始めた組織";
  }
  if (state.orgLevel === 3) {
    return "安定して回り始めた中規模組織";
  }
  if (state.orgLevel >= 4) {
    return "肥大化し、崩壊の影がちらつく組織";
  }

  return "";
}

function getNogamiLine(){
  if (state.orgLevel === 1) {
    return [
      "……このままじゃ、風が吹いたら終わりだ。",
      "まずは資金を作る。",
      "「仕事」だ。"
    ].join("\n");
  }

  return "……まだ先は長い。";
}

function renderPlaceholder(title, text){
  screen.innerHTML = card(title, `<p class="p">${text}</p>`);
}

// ストーリー画面
function renderStory() {
  const isOpenMain = state.storyOpen === "main";
  const isOpenSub = state.storyOpen === "sub";

  const body = `
    <div class="storyHeader" data-cat="main">
      <div>メインストーリー</div>
      <div style="font-size:12px; color:#9aa0c5">${isOpenMain ? "▲" : "▼"}</div>
    </div>
    ${isOpenMain ? `<div style="margin-top:10px">${renderChoices(stories.main, null, "readMain", "list")}</div>` : ""}
    
    <div style="height:10px"></div>

    <div class="storyHeader" data-cat="sub">
      <div>サブストーリー</div>
      <div style="font-size:12px; color:#9aa0c5">${isOpenSub ? "▲" : "▼"}</div>
    </div>
    ${isOpenSub ? `<div style="margin-top:10px">${renderChoices(stories.sub, null, "readSub", "list")}</div>` : ""}
  `;

  screen.innerHTML = card("ストーリー", body);
}

// ストーリー再生（ノベルパート）
function renderStoryPlayer(){
  const script = storyScripts[state.storyPlaying];
  
  // 終了判定（最後まで読んだら一覧に戻る）
  if (!script || state.storyIndex >= script.length) {
    state.storyPlaying = null;
    state.storyIndex = 0;
    render();
    return;
  }

  const line = script[state.storyIndex];
  
  const body = `
    <div class="storyView">
      <div class="storyBubble">
        ${line.speaker ? `<div class="storyName">${line.speaker}</div>` : ""}
        <div class="storyText">${line.text}</div>
        <div style="text-align:right; font-size:12px; color:#666; margin-top:8px;">▼</div>
      </div>
    </div>
  `;
  screen.innerHTML = body;
}

// Step 1: 案件選択
function renderStep1(){
  const body = `
    ${renderChoices(jobs, state.job?.id, "job", "list")}
    ${state.job ? `<div class="pill">選択中: <b>${state.job.name}</b></div>` : ``}
  `;
  const footer = state.job ? `<div class="row" style="margin-top:16px"><button class="btn" id="goNext">次へ</button></div>` : ``;
  screen.innerHTML = card("どの犯罪を行う？", body) + footer;
  if (state.job) {
    document.getElementById("goNext").addEventListener("click", () => setStep(2));
  }
}

// Step 2 (Oreore): ヘッドメンバー選択
function renderOreoreStep2(){
  const body = `
    ${renderChoices(oreoreMembers, state.headMember?.id, "headMember", "list")}
    ${state.headMember ? `<div class="pill">選択中: <b>${state.headMember.name}</b></div>` : ``}
  `;
  const footer = state.headMember ? `<div class="row" style="margin-top:16px"><button class="btn" id="goNext">次へ</button></div>` : ``;
  screen.innerHTML = card("ヘッドメンバー選択", body) + footer;
  if (state.headMember) {
    document.getElementById("goNext").addEventListener("click", () => setStep(3));
  }
}

// Step 3 (Oreore): ターゲット選択
function renderOreoreStep3(){
  // 表示用に情報を付加して表示
  const items = oreoreTargets.map(t => ({
    ...t,
    desc: `${t.desc} / 資産Lv${t.assets} 警戒Lv${t.vigilance}`
  }));
  const body = `
    ${renderChoices(items, state.target?.id, "oreoreTarget", "list")}
    ${state.target ? `<div class="pill">選択中: <b>${state.target.name}</b></div>` : ``}
  `;
  const footer = state.target ? `<div class="row" style="margin-top:16px"><button class="btn" id="goNext">次へ</button></div>` : ``;
  screen.innerHTML = card("ターゲット選択", body) + footer;
  if (state.target) {
    document.getElementById("goNext").addEventListener("click", () => setStep(4));
  }
}

// Step 4 (Oreore): ヘッドメンバーとの会話（指示選択）
function renderOreoreStep4(){
  const body = `
    <p class="p">ヘッドメンバー（${state.headMember?.name}）に指示を出します。</p>
    ${renderChoices(oreoreTactics, state.tactic?.id, "tactic", "list")}
    ${state.tactic ? `<div class="pill">選択中: <b>${state.tactic.name}</b></div>` : ``}
  `;
  const footer = state.tactic ? `<div class="row" style="margin-top:16px"><button class="btn" id="goNext">次へ</button></div>` : ``;
  screen.innerHTML = card("ヘッドメンバーとの会話", body) + footer;
  if (state.tactic) {
    document.getElementById("goNext").addEventListener("click", () => setStep(5));
  }
}

// Step 5 (Oreore): 待機
function renderOreoreStep5(){
  if (!state.startedAt) {
    state.waitSec = 3; // 3秒固定
    state.startedAt = Date.now();
  }

  const body = `
    <p class="p">実行中…</p>
    <div class="card" style="border-style:dashed">
      <div class="big" id="remain">--:--</div>
      <div class="kicker">結果を待っています</div>
      <div class="progressWrap"><div class="progressBar" id="pbar"></div></div>
    </div>
  `;
  // フッター領域（最初は空、完了後にボタン表示）
  const footer = `<div class="row" style="margin-top:16px" id="oreoreWaitFooter"></div>`;
  
  screen.innerHTML = card("待機", body) + footer;

  const remainEl = document.getElementById("remain");
  const pbar = document.getElementById("pbar");
  const footerEl = document.getElementById("oreoreWaitFooter");

  clearTimer();
  state.timer = setInterval(()=>{
    const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    const left = Math.max(0, state.waitSec - elapsed);

    const mm = String(Math.floor(left / 60)).padStart(2,"0");
    const ss = String(left % 60).padStart(2,"0");
    remainEl.textContent = `${mm}:${ss}`;

    const prog = Math.min(100, (elapsed / state.waitSec) * 100);
    pbar.style.width = prog + "%";

    if (left <= 0) {
      clearTimer();
      // 自動遷移
      resolveOreoreResult();
      setStep(6);
    }
  }, 200);
}

// Step 6 (Oreore): 結果表示
function renderOreoreStep6(){
  const body = `
    <p class="p">今回の成果です。</p>
    <div class="card" style="text-align:center">
      <div class="big">${formatYen(state.earned)}</div>
      <div class="kicker">チャリーン</div>
    </div>
    <div class="row">
      <button class="btn" id="retryBtn">もう一回</button>
    </div>
  `;
  screen.innerHTML = card("結果表示", body);
  document.getElementById("retryBtn").addEventListener("click", resetWorkState);
}

// Step 2: 演出（簡易マッチ）
function renderStep2(){
  const body = `
    <p class="p">簡易的な演出です。ここは後で好きなだけ盛れます。</p>
    <div class="card" style="border-style:dashed">
      <div class="p">…マッチング中…</div>
      <div class="progressWrap"><div class="progressBar" id="bar"></div></div>
      <div class="kicker" id="barText">0%</div>
    </div>
    <p class="p">「次へ」でターゲット選択に進みます。</p>
  `;
  const footer = `<div class="row" style="margin-top:16px"><button class="btn" id="goNext">次へ</button></div>`;
  screen.innerHTML = card("② 簡易演出", body) + footer;
  document.getElementById("goNext").addEventListener("click", () => setStep(3));

  // アニメ
  const bar = document.getElementById("bar");
  const barText = document.getElementById("barText");
  let p = 0;
  clearTimer();
  state.timer = setInterval(()=>{
    p += 4;
    bar.style.width = Math.min(p,100) + "%";
    barText.textContent = Math.min(p,100) + "%";
    if (p >= 100) clearTimer();
  }, 40);
}

// Step 3: ターゲット選択
function renderStep3(){
  const body = `
    <p class="p">ターゲットを選択します。Lvが高いほど期待値は上がりますが不安定です。</p>
    ${renderChoices(targets.map(t => ({...t, desc:`Lv.${t.level} / 不安定度 ${t.risk}` })), state.target?.id, "target")}
    ${state.target ? `<div class="pill">選択中: <b>${state.target.name}</b>（Lv.${state.target.level}）</div>` : ``}
  `;
  const footer = state.target ? `<div class="row" style="margin-top:16px"><button class="btn" id="goNext">次へ</button></div>` : ``;
  screen.innerHTML = card("③ ターゲットを選ぶ", body) + footer;
  if (state.target) {
    document.getElementById("goNext").addEventListener("click", () => setStep(4));
  }
}

// Step 4: メンバー選択
function renderStep4(){
  const body = `
    <p class="p">連絡担当のメンバーを選択します。Lvが高いほど期待値は上がりますが安定性は変動します。</p>
    ${renderChoices(members.map(m => ({...m, desc:`Lv.${m.level} / 安定係数 ${m.stability}` })), state.member?.id, "member")}
    ${state.member ? `<div class="pill">選択中: <b>${state.member.name}</b>（Lv.${state.member.level}）</div>` : ``}
  `;
  const footer = state.member ? `<div class="row" style="margin-top:16px"><button class="btn" id="goNext">次へ</button></div>` : ``;
  screen.innerHTML = card("④ メンバーを選ぶ", body) + footer;
  if (state.member) {
    document.getElementById("goNext").addEventListener("click", () => setStep(5));
  }
}

// Step 5: 待機（1〜3分）
function renderStep5(){
  // 待ち時間（Lvで少し変動）
  if (!state.startedAt) {
    state.waitSec = 3;      // ★ 一律3秒
    // 上記は「Lvで増える」だけの簡易式（現実の最適手順にならない）
    state.startedAt = Date.now();
  }

  const body = `
    <p class="p">待機中…（放置要素）</p>
    <div class="card" style="border-style:dashed">
      <div class="big" id="remain">--:--</div>
      <div class="kicker">しばらくすると結果が出ます</div>
      <div class="progressWrap"><div class="progressBar" id="pbar"></div></div>
    </div>
  `;
  screen.innerHTML = card("⑤ ちょっと待つ", body);

  const remainEl = document.getElementById("remain");
  const pbar = document.getElementById("pbar");

  clearTimer();
  state.timer = setInterval(()=>{
    const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    const left = Math.max(0, state.waitSec - elapsed);

    const mm = String(Math.floor(left / 60)).padStart(2,"0");
    const ss = String(left % 60).padStart(2,"0");
    remainEl.textContent = `${mm}:${ss}`;

    const prog = Math.min(100, (elapsed / state.waitSec) * 100);
    pbar.style.width = prog + "%";

    if (left <= 0) {
      clearTimer();
      resolveResult();
      setStep(6);
    }
  }, 200);
}

// Step 6: 結果（チャリーン）
function renderStep6(){
  const body = `
    <p class="p">結果です（ゲーム内通貨）。</p>
    <div class="card" style="text-align:center">
      <div class="big">${formatYen(state.earned)}</div>
      <div class="kicker">チャリーン（※ assets/coin.mp3 があると音が鳴ります）</div>
    </div>

    <div class="card">
      <div class="p">選択の内訳</div>
      <div class="pill">案件: <b>${state.job?.name ?? "-"}</b></div>
      <div class="pill">ターゲット: <b>${state.target?.name ?? "-"}</b></div>
      <div class="pill">メンバー: <b>${state.member?.name ?? "-"}</b></div>
    </div>

    <div class="row">
      <button class="btn" id="retryBtn">もう一回</button>
    </div>
  `;
  screen.innerHTML = card("⑥ 結果", body);

  const retryBtn = document.getElementById("retryBtn");
  retryBtn.addEventListener("click", resetWorkState, { once:true });
}

// --- 結果計算（ゲーム用の簡易式）---
function resolveResult(){
  // 基本報酬
  const base = state.job?.base ?? 1000;

  // 期待値：ターゲットLvとメンバーLvで上がる
  const tLv = state.target?.level ?? 1;
  const mLv = state.member?.level ?? 1;

  // 不安定要素：高Lvほど“失敗”が増える（最適解固定化を避ける）
  const risk = (state.target?.risk ?? 1.1);
  const stability = (state.member?.stability ?? 1.0);

  // 成功率（高Lvターゲットは下がる/メンバーで少し補正）
  const successProb = Math.max(0.15, Math.min(0.9, (0.85 / risk) * (1.0 / stability)));

  const success = Math.random() < successProb;

  if (!success) {
    // 失敗（報酬0〜少額）
    state.earned = Math.floor(base * 0.05 * Math.random());
    state.wallet += state.earned;   // ★追加
    return;
  }

  // 成功：Lvで伸びるが、ばらつきも大きい
  const multiplier = (1 + 0.6*(tLv-1)) * (1 + 0.4*(mLv-1));
  const variance = 0.7 + Math.random() * 0.9; // 0.7〜1.6
  state.earned = Math.floor(base * multiplier * variance);

  state.wallet += state.earned;     // ★追加
  // チャリーン
  playCoin();
}

// --- オレオレ詐欺の結果計算 ---
function resolveOreoreResult(){
  const t = state.target;
  if (!t) return;

  // 成功率: 基本100% - (警戒Lv * 10%)
  // 例: 警戒Lv1 -> 90%, Lv5 -> 50%
  const successRate = Math.max(0, 1.0 - (t.vigilance * 0.1));
  const isSuccess = Math.random() < successRate;
  
  if (isSuccess) {
    // 成功報酬: 資産Lv * 10万円 * ランダム(0.8~1.2)
    const base = t.assets * 100000;
    const variance = 0.8 + Math.random() * 0.4;
    state.earned = Math.floor(base * variance);
  } else {
    // 失敗
    state.earned = 0;
  }

  state.wallet += state.earned;
  playCoin();
}

// --- ワーク状態のリセット ---
function resetWorkState(){
  clearTimer();
  state.step = 1;
  state.job = null;
  state.target = null;
  state.member = null;
  state.headMember = null;
  state.tactic = null;
  state.startedAt = null;
  state.waitSec = 0;
  state.earned = 0;
  render();
}


// --- クリック処理（イベントデリゲーション） ---
screen.addEventListener("pointerup", (e)=> {
  // ストーリー再生中のタップ（次へ進む）
  if (state.storyPlaying) {
    state.storyIndex++;
    render();
    return;
  }

  // ストーリーヘッダー判定
  const header = e.target.closest(".storyHeader");
  if (header) {
    const cat = header.dataset.cat;
    if (state.storyOpen === cat) state.storyOpen = null; // 閉じる
    else state.storyOpen = cat; // 開く
    render();
    return;
  }

  const el = e.target.closest(".choice");
  if (!el) return;

  const id = el.dataset.id;
  const on = el.dataset.on;

  if (on === "job") state.job = jobs.find(x => x.id === id);
  if (on === "target") state.target = targets.find(x => x.id === id);
  if (on === "member") state.member = members.find(x => x.id === id);
  if (on === "headMember") state.headMember = oreoreMembers.find(x => x.id === id);
  if (on === "oreoreTarget") state.target = oreoreTargets.find(x => x.id === id);
  if (on === "tactic") state.tactic = oreoreTactics.find(x => x.id === id);
  
  if (on === "readMain") {
    if (storyScripts[id]) {
      state.storyPlaying = id;
      state.storyIndex = 0;
      render();
    } else {
      alert("このストーリーはまだ実装されていません。");
    }
  }

  render();
});

// --- ナビ ---
nav.addEventListener("click", (e) => {
  const btn = e.target.closest(".navItem");
  if (!btn) return;

  const tab = btn.dataset.tab;

  // どのタブでもまず切り替え
  state.tab = tab;

  if (tab === "work") {
    // 仕事に入ったら案件選択から（毎回リセット）
    resetWorkState();
  }

  // home / recruit / base / story はそのまま表示（準備中でもOK）
  render();
});

// --- ヘッダーホームボタン ---
homeBtn.addEventListener("click", () => {
  state.tab = "home";
  render();
});

state.tab = "home";
render();