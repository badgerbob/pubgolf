const holes = [
  { hole: 1, pub: "Bamburgh", rule: "No first names", drink: "Beer", par: 4, shotOption: false, image: "images/pubs/bamburgh.webp" },
  { hole: 2, pub: "New Crown", rule: "Dice rule", drink: "Spirit Mixer", par: 3, shotOption: false, image: "images/pubs/new-crown.jpg" },
  { hole: 3, pub: "Sanddancer", rule: "Forbidden word", drink: "Wine", par: 3, shotOption: true, image: "images/pubs/sanddancer.jpg" },
  { hole: 4, pub: "Rattler", rule: "Left hand", drink: "Spirit Mixer", par: 3, shotOption: false, image: "images/pubs/rattler.jpg" },
  { hole: 5, pub: "Sundial", rule: "No swearing", drink: "Cocktail", par: 3, shotOption: false, image: "images/pubs/sundial.jpg" },
  { hole: 6, pub: "Marine", rule: "Number ban", drink: "Spirit Mixer", par: 3, shotOption: false, image: "images/pubs/marine.jpg" },
  { hole: 7, pub: "Hogarths", rule: "No laughing", drink: "Spirit Mixer", par: 3, shotOption: false, image: "images/pubs/hogarths.jpg" },
  { hole: 8, pub: "Spoons", rule: "No eye contact", drink: "Pitcher", par: 10, shotOption: true, image: "images/pubs/spoons.jpg" }
];

const penalties = [
  { key: "spill", label: "Spill drink", points: 2 },
  { key: "unfinished", label: "Not finishing drink", points: 3 },
  { key: "sick", label: "Being sick", points: 3 },
  { key: "cheating", label: "Cheating", points: 2 },
  { key: "breaking", label: "Breaking rules", points: 1 }
];

const STORAGE_KEY = "pub-golf-pwa-state-v1";
const coursePar = holes.reduce((sum, h) => sum + h.par, 0);
const STROKE_OPTIONS = Array.from({ length: 26 }, (_, index) => index - 5);
const PENALTY_COUNT_OPTIONS = Array.from({ length: 11 }, (_, index) => index);

function createPlayerCardDefaults() {
  return holes.map(h => ({
    strokes: h.par,
    penalties: { spill: 0, unfinished: 0, sick: 0, cheating: 0, breaking: 0 }
  }));
}

function defaultState() {
  return {
    players: ["Issy", "Georgia"],
    selectedPlayer: "Issy",
    scores: {
      "Issy": createPlayerCardDefaults(),
      "Georgia": createPlayerCardDefaults()
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return defaultState();
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function holePenaltyTotal(entry) {
  return penalties.reduce((sum, p) => sum + (entry.penalties[p.key] || 0) * p.points, 0);
}

function holeTotal(entry) {
  return Number(entry.strokes || 0) + holePenaltyTotal(entry);
}

function playerTotal(name) {
  return (state.scores[name] || []).reduce((sum, entry) => sum + holeTotal(entry), 0);
}

function leaderboardData() {
  return state.players.map(name => ({
    name,
    total: playerTotal(name),
    toPar: playerTotal(name) - coursePar
  })).sort((a, b) => a.total - b.total);
}

function el(id) {
  return document.getElementById(id);
}

function renderSelectOptions(options, selectedValue) {
  return options.map(value => (
    `<option value="${value}"${value === selectedValue ? " selected" : ""}>${value}</option>`
  )).join("");
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      el(btn.dataset.tab).classList.add("active");
    };
  });
}

function renderPlayers() {
  const wrap = el("playerChips");
  wrap.innerHTML = "";
  state.players.forEach(name => {
    const outer = document.createElement("div");
    outer.className = "player-chip";

    const select = document.createElement("button");
    select.textContent = name;
    if (state.selectedPlayer === name) select.classList.add("selected");
    select.onclick = () => {
      state.selectedPlayer = name;
      saveState();
      render();
    };

    const remove = document.createElement("button");
    remove.className = "ghost remove";
    remove.textContent = "×";
    remove.onclick = () => {
      if (state.players.length === 1) return;
      state.players = state.players.filter(p => p !== name);
      delete state.scores[name];
      if (state.selectedPlayer === name) state.selectedPlayer = state.players[0];
      saveState();
      render();
    };

    outer.appendChild(select);
    outer.appendChild(remove);
    wrap.appendChild(outer);
  });
}

function renderSummary() {
  el("coursePar").textContent = coursePar;
  const board = leaderboardData();
  const leader = board[0];
  const loser = board[board.length - 1];
  el("leaderName").textContent = leader ? leader.name : "—";
  el("leaderScore").textContent = leader ? `${leader.total} strokes` : "0 strokes";
  el("loserName").textContent = loser ? loser.name : "—";
}

function renderLeaderboard() {
  const wrap = el("leaderboardList");
  wrap.innerHTML = "";
  leaderboardData().forEach((row, i) => {
    const node = document.createElement("div");
    node.className = "leader-row";
    node.innerHTML = `
      <div class="leader-left">
        <div class="rank">${i + 1}</div>
        <div>
          <strong>${row.name}</strong>
          <div class="muted">${row.toPar === 0 ? "Level par" : row.toPar > 0 ? "+" + row.toPar : row.toPar}</div>
        </div>
      </div>
      <div style="text-align:right">
        <strong style="font-size:28px;display:block">${row.total}</strong>
        <span class="muted">Total</span>
      </div>
    `;
    wrap.appendChild(node);
  });
}

function renderRules() {
  const wrap = el("rulesList");
  wrap.innerHTML = "";
  penalties.forEach(rule => {
    const node = document.createElement("div");
    node.className = "rule-item";
    node.innerHTML = `<strong>${rule.label}</strong><div class="muted">Penalty: +${rule.points}</div>`;
    wrap.appendChild(node);
  });
}

function renderHoles() {
  const wrap = el("holesContainer");
  wrap.innerHTML = "";
  const selected = state.selectedPlayer;
  const entries = state.scores[selected] || [];

  const activeBanner = document.createElement("div");
  activeBanner.className = "active-player-banner";
  activeBanner.innerHTML = `
    <span class="active-player-label">Scoring now</span>
    <strong>${selected}</strong>
  `;
  wrap.appendChild(activeBanner);

  holes.forEach((hole, index) => {
    const entry = entries[index];
    const penTotal = holePenaltyTotal(entry);
    const total = holeTotal(entry);
    const diff = total - hole.par;

    const card = document.createElement("div");
    card.className = "hole-card";
    const strokeOptions = renderSelectOptions(STROKE_OPTIONS, entry.strokes);

    const penaltyHtml = penalties.map(p => `
      <div class="penalty-row">
        <div>
          <strong>${p.label}</strong>
          <div class="muted">+${p.points} each</div>
        </div>
        <select data-hole="${index}" data-penalty="${p.key}" class="penalty-input">
          ${renderSelectOptions(PENALTY_COUNT_OPTIONS, entry.penalties[p.key] || 0)}
        </select>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="hole-media">
        <img class="hole-photo" src="${hole.image}" alt="${hole.pub} in South Shields" loading="lazy" />
      </div>

      <div class="hole-header">
        <div>
          <div class="hole-meta">Hole ${hole.hole}</div>
          <h3>${hole.pub}</h3>
          <div class="hole-subtle">${hole.rule}</div>
        </div>
        <div style="text-align:right">
          <div class="badge">${hole.drink}</div>
          <div class="hole-meta" style="margin-top:8px">Par ${hole.par}</div>
        </div>
      </div>

      <div class="hole-grid">
        <div class="mini">
          <span class="muted">Strokes</span>
          <select data-hole="${index}" class="stroke-input" style="margin-top:8px">
            ${strokeOptions}
          </select>
        </div>
        <div class="mini">
          <span class="muted">Penalties</span>
          <strong>+${penTotal}</strong>
        </div>
        <div class="mini">
          <span class="muted">Hole total</span>
          <strong>${total}</strong>
          <div class="muted">${diff === 0 ? "Level par" : diff > 0 ? "+" + diff + " vs par" : diff + " vs par"}</div>
        </div>
      </div>

      <div class="penalty-list">${penaltyHtml}</div>

      ${hole.shotOption ? `<div class="shot-note">A shot can be taken instead of a <strong>-1</strong> at this hole.</div>` : ``}
    `;
    wrap.appendChild(card);
  });

  document.querySelectorAll(".stroke-input").forEach(input => {
    input.onchange = (e) => {
      const holeIndex = Number(e.target.dataset.hole);
      state.scores[state.selectedPlayer][holeIndex].strokes = Number(e.target.value || 0);
      saveState();
      render();
    };
  });

  document.querySelectorAll(".penalty-input").forEach(input => {
    input.onchange = (e) => {
      const holeIndex = Number(e.target.dataset.hole);
      const penaltyKey = e.target.dataset.penalty;
      state.scores[state.selectedPlayer][holeIndex].penalties[penaltyKey] = Number(e.target.value || 0);
      saveState();
      render();
    };
  });
}

function wireActions() {
  el("addPlayerBtn").onclick = () => {
    const input = el("newPlayer");
    const name = input.value.trim();
    if (!name || state.players.includes(name)) return;
    state.players.push(name);
    state.scores[name] = createPlayerCardDefaults();
    state.selectedPlayer = name;
    input.value = "";
    saveState();
    render();
  };

  el("resetBtn").onclick = () => {
    const currentPlayers = [...state.players];
    state = defaultState();
    state.players = currentPlayers;
    state.selectedPlayer = currentPlayers[0];
    state.scores = {};
    currentPlayers.forEach(name => state.scores[name] = createPlayerCardDefaults());
    saveState();
    render();
  };
}

function setupInstallPrompt() {
  let deferredPrompt = null;
  const installBtn = el("installBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove("hidden");
  });

  installBtn.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add("hidden");
  };
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function render() {
  renderPlayers();
  renderSummary();
  renderLeaderboard();
  renderRules();
  renderHoles();
}

renderTabs();
wireActions();
setupInstallPrompt();
registerSW();
render();
