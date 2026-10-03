(function(){
"use strict";

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const createEl = (tag, opts = {}) => Object.assign(document.createElement(tag), opts);

/* ============================================================
   ⚙️ PREFERENCES MANAGER
   ============================================================ */
const PREFS_KEY = 'cfmb_prefs_v1';
const DEFAULT_PREFS = {
  sound: true,
  haptic: true,
  animations: true,
  music: false,
  mascot: true,
  dark: false
};
let PREFS = { ...DEFAULT_PREFS };

function loadPrefs(){
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) PREFS = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch (e) { PREFS = { ...DEFAULT_PREFS }; }
  applyPrefs();
}
function savePrefs(){
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(PREFS)); } catch (e) {}
}
function applyPrefs(){
  Sound.enabled = PREFS.sound;
  Haptic.enabled = PREFS.haptic;
  document.body.classList.toggle('no-animations', !PREFS.animations);
  applyTheme(PREFS.dark ? 'dark' : 'light');
  const mascot = $('mascot');
  if (mascot) mascot.style.display = PREFS.mascot ? 'flex' : 'none';
  const musicBtn = $('musicBtn');
  if (musicBtn) musicBtn.style.display = PREFS.music ? 'flex' : 'none';
  if (PREFS.music && !Music.playing) Music.start();
  if (!PREFS.music && Music.playing) Music.stop();
  const set = (id, v) => { const el = $(id); if (el) el.checked = v; };
  set('prefSound', PREFS.sound);
  set('prefHaptic', PREFS.haptic);
  set('prefAnimations', PREFS.animations);
  set('prefMusic', PREFS.music);
  set('prefMascot', PREFS.mascot);
  set('prefDark', PREFS.dark);
}
function updatePref(key, value){
  PREFS[key] = value;
  savePrefs();
  applyPrefs();
  Sound.click();
  Haptic.light();
}

/* ============================================================
   🔊 SOUND ENGINE
   ============================================================ */
const Sound = {
  ctx: null, enabled: true,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.enabled = false; }
  },
  _tone(freq, dur, type = 'sine', vol = 0.15, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  correct() { this.init(); this._tone(523.25,0.15,'sine',0.18,0); this._tone(659.25,0.15,'sine',0.18,0.08); this._tone(783.99,0.20,'sine',0.18,0.16); this._tone(1046.50,0.30,'sine',0.20,0.24); },
  wrong() { this.init(); this._tone(392.00,0.20,'sine',0.14,0); this._tone(329.63,0.35,'sine',0.14,0.15); },
  click() { this.init(); this._tone(880,0.05,'sine',0.06); },
  milestone() { this.init(); [523.25,659.25,783.99,1046.50,783.99,1046.50].forEach((f,i)=>this._tone(f,0.22,'triangle',0.16,i*0.13)); },
  chapterDone() { this.init(); [523.25,659.25,783.99,1046.50].forEach((f,i)=>this._tone(f,0.3,'sine',0.18,i*0.14)); this._tone(1318.51,0.6,'triangle',0.18,0.6); }
};

const Haptic = {
  enabled: true,
  light() { if (this.enabled && navigator.vibrate) navigator.vibrate(20); },
  medium() { if (this.enabled && navigator.vibrate) navigator.vibrate(50); },
  success() { if (this.enabled && navigator.vibrate) navigator.vibrate([30, 40, 30]); },
  error() { if (this.enabled && navigator.vibrate) navigator.vibrate([80, 40, 80]); },
  celebrate() { if (this.enabled && navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]); }
};

/* ============================================================
   🏅 ACHIEVEMENTS
   ============================================================ */
const ACHIEVEMENTS = {
  first_correct: { emoji: '🎯', name: 'የመጀመሪያ ትክክል!', desc: 'የመጀመሪያ ጥያቄዎን በትክክል መልሰዋል' },
  streak_3:      { emoji: '🔥', name: '3 ጊዜ በተከታታይ ትክክል!',    desc: '3 ጥያቄዎችን በተከታታይ በትክክል መልሰዋል' },
  streak_5:      { emoji: '⚡', name: '5 ጊዜ በተከታታይ ትክክል!',    desc: '5 ጥያቄዎችን በተከታታይ በትክክል መልሰዋል' },
  streak_10:     { emoji: '👑', name: '10 ጊዜ በተከታታይ ትክክል!',   desc: '10 ጥያቄዎችን በተከታታይ በትክክል መልሰዋል' },
  perfect_chapter:{ emoji: '💯', name: 'አስደናቂ ውጤት!',   desc: 'ምዕራፉን በ100% አጠናቀዋል' },
  first_chapter: { emoji: '📖', name: 'የመጀመሪያ ምዕራፍ!', desc: 'የመጀመሪያ ምዕራፍዎን አጠናቀዋል' },
  chapter_master:{ emoji: '🏆', name: 'የሙሉ ምዕራፍ ተሸላሚ!', desc: 'ሁሉንም ምዕራፎች አጠናቀዋል' },
  week_warrior:  { emoji: '⭐', name: 'የሳምንቱ ኮከብ አጥኚ!',  desc: '7 ቀናት በተከታታይ አጥንተዋል' },
  scripture_scholar:{ emoji: '🎓', name: 'የቃሉ ናፍቆት ታታሪ!', desc: '50 ጥያቄዎችን መልሰዋል' }
};
function getUnlockedAchievements(){ try { const raw = localStorage.getItem('cfmb_achievements'); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } }
function saveUnlockedAchievements(obj){ try { localStorage.setItem('cfmb_achievements', JSON.stringify(obj)); } catch (e) {} }
function unlockAchievement(key){
  const unlocked = getUnlockedAchievements();
  if (unlocked[key]) return false;
  unlocked[key] = { date: new Date().toISOString() };
  saveUnlockedAchievements(unlocked);
  const ach = ACHIEVEMENTS[key];
  if (ach) showAchievementPopup(ach.emoji, ach.name);
  return true;
}
function showAchievementPopup(emoji, name){
  const popup = $('achievementPopup');
  if (!popup) return;
  $('achEmoji').textContent = emoji;
  $('achName').textContent = name;
  popup.classList.add('show');
  Sound.milestone(); Haptic.celebrate();
  setTimeout(() => popup.classList.remove('show'), 3500);
}
function checkAchievements(isCorrect){
  const unlocked = getUnlockedAchievements();
  const stats = getStats();
  if (isCorrect && !unlocked.first_correct) unlockAchievement('first_correct');
  if (STATE.correctStreak === 3 && !unlocked.streak_3) unlockAchievement('streak_3');
  if (STATE.correctStreak === 5 && !unlocked.streak_5) unlockAchievement('streak_5');
  if (STATE.correctStreak === 10 && !unlocked.streak_10) unlockAchievement('streak_10');
  if (stats.totalAnswered >= 50 && !unlocked.scripture_scholar) unlockAchievement('scripture_scholar');
  const hour = new Date().getHours();
  if (hour >= 22 && !unlocked.night_owl) unlockAchievement('night_owl');
  if (hour < 6 && !unlocked.early_bird) unlockAchievement('early_bird');
  if (STATE.completedChapters.size >= 1 && !unlocked.first_chapter) unlockAchievement('first_chapter');
  if (STATE.completedChapters.size >= ALL_CHAPTERS.length && ALL_CHAPTERS.length > 0) {
    if (!unlocked.chapter_master) unlockAchievement('chapter_master');
  }
  if (STATE.streak >= 7 && !unlocked.week_warrior) unlockAchievement('week_warrior');
}

function getStats(){
  let totalAnswered = 0, totalCorrect = 0;
  ALL_CHAPTERS.forEach(c => {
    const store = STATE.exerciseAnswers[c.id] || {};
    Object.keys(store).forEach(k => {
      if (store[k] && store[k].checked) { totalAnswered++; if (store[k].correct) totalCorrect++; }
    });
  });
  return { totalAnswered, totalCorrect };
}

function renderWeeklyChart(){
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--){
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toDateString();
    days.push({ date: d, label: ['እሁድ','ሰኞ','ማክሰኞ','ረቡዕ','ሐሙስ','አርብ','ቅዳሜ'][d.getDay()], count: STATE.readingHistory[key] || 0, isToday: i === 0 });
  }
  const max = Math.max(1, ...days.map(d => d.count));
  let html = '<div class="weekly-chart"><div class="weekly-chart-title">📈 የሳምንት ንባብ ሂደትዎ</div><div class="weekly-bars">';
  days.forEach(d => {
    const h = Math.round((d.count / max) * 100);
    html += `<div class="weekly-bar-wrap"><div class="weekly-bar-value">${d.count}</div><div class="weekly-bar${d.isToday ? ' today' : ''}" style="height:${h}%"></div><div class="weekly-bar-label">${d.label}</div></div>`;
  });
  html += '</div></div>';
  return html;
}

function renderAchievementsGrid(){
  const unlocked = getUnlockedAchievements();
  let html = '<div class="weekly-chart"><div class="weekly-chart-title">🏅 የጥናት ስኬቶችዎ</div><div class="achievements-grid">';
  Object.keys(ACHIEVEMENTS).forEach(key => {
    const a = ACHIEVEMENTS[key];
    const isUnlocked = !!unlocked[key];
    html += `<div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}" title="${a.desc}"><span class="ach-icon">${a.emoji}</span><div class="ach-lbl">${a.name}</div>${isUnlocked ? `<div class="ach-date">${new Date(unlocked[key].date).toLocaleDateString('am-ET')}</div>` : ''}</div>`;
  });
  html += '</div></div>';
  return html;
}

const MASCOT_LINES = {
  idle: ['ሰላም! ዛሬ ለጥናት ዝግጁ ነህ? 📖','ቃሉ እንደማር ይጣፍጣል! ✨','በእምነት ጸንተህ ቀጥል! 💪','እግዚአብሔር ይወድሃል! 💗','ዛሬም መንፈስ ቅዱስ ይረዳሃል! 🎯'],
  correct: ['ዋው! 🎉','ግሩም ነው! ⭐','በጣም ጥሩ! 👏','እጅግ በጣም ጥሩ! 🔥','በጣም አሪፍ! 💎','ድንቅ ነው! 🌟'],
  wrong: ['አይዞህ! 💪','አይዞህ ሞክር! 🌱','ተስፋ አትቁረጥ! ✨','አይዞህ ቀጥል! 📖','አይዞህ በርታ! 🙏'],
  celebrate: ['ግሩም ውጤት! 🏆','ድንቅ ሥራ! 👑','ጎበዝ! 🎊','እጅግ በጣም ጥሩ! 💯']
};
let mascotTimer = null;
function showMascotBubble(text, duration = 2500){
  if (!PREFS.mascot) return;
  const bubble = $('mascotBubble'); if (!bubble) return;
  bubble.textContent = text; bubble.classList.add('show');
  clearTimeout(mascotTimer);
  mascotTimer = setTimeout(() => bubble.classList.remove('show'), duration);
}
function mascotCheer(){ if (!PREFS.mascot || !PREFS.animations) return; const m = $('mascot'); if (!m) return; m.classList.remove('sad', 'celebrating'); m.classList.add('cheering'); const l = MASCOT_LINES.correct[Math.floor(Math.random()*MASCOT_LINES.correct.length)]; showMascotBubble(l, 2200); setTimeout(() => m.classList.remove('cheering'), 900); }
function mascotSad(){ if (!PREFS.mascot || !PREFS.animations) return; const m = $('mascot'); if (!m) return; m.classList.remove('cheering', 'celebrating'); m.classList.add('sad'); const l = MASCOT_LINES.wrong[Math.floor(Math.random()*MASCOT_LINES.wrong.length)]; showMascotBubble(l, 2500); setTimeout(() => m.classList.remove('sad'), 1100); }
function mascotCelebrate(){ if (!PREFS.mascot || !PREFS.animations) return; const m = $('mascot'); if (!m) return; m.classList.remove('cheering', 'sad'); m.classList.add('celebrating'); const l = MASCOT_LINES.celebrate[Math.floor(Math.random()*MASCOT_LINES.celebrate.length)]; showMascotBubble(l, 3200); setTimeout(() => m.classList.remove('celebrating'), 3500); }
function initMascot(){
  const m = $('mascot'); if (!m) return;
  m.addEventListener('click', () => { const l = MASCOT_LINES.idle[Math.floor(Math.random()*MASCOT_LINES.idle.length)]; showMascotBubble(l, 2500); Sound.click(); Haptic.light(); });
  setInterval(() => { if (!document.hidden && Math.random() < 0.15 && PREFS.mascot) { const l = MASCOT_LINES.idle[Math.floor(Math.random()*MASCOT_LINES.idle.length)]; showMascotBubble(l, 3000); } }, 45000);
}

const Music = {
  ctx: null, playing: false, nodes: [],
  init(){ if (this.ctx) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
  start(){
    if (!PREFS.sound) return;
    this.init(); if (!this.ctx || this.playing) return; this.playing = true;
    const chords = [[261.63,329.63,392.00],[220.00,261.63,329.63],[174.61,220.00,261.63],[196.00,246.94,293.66]];
    let chordIdx = 0;
    const playChord = () => {
      if (!this.playing) return;
      const chord = chords[chordIdx % chords.length]; chordIdx++;
      const t = this.ctx.currentTime;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.025, t + 1.5); gain.gain.linearRampToValueAtTime(0, t + 5);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(t); osc.stop(t + 5.2);
        this.nodes.push({ osc, gain });
      });
      setTimeout(playChord, 5000);
    };
    playChord();
  },
  stop(){ this.playing = false; this.nodes.forEach(n => { try { n.osc.stop(); } catch(e){} }); this.nodes = []; },
  toggle(){ if (this.playing) { this.stop(); return false; } else { this.start(); return true; } }
};
function initMusic(){
  const btn = $('musicBtn'); if (!btn) return;
  btn.addEventListener('click', () => {
    const isPlaying = Music.toggle();
    btn.classList.toggle('playing', isPlaying);
    $('musicIco').textContent = isPlaying ? '🎶' : '🎵';
    showToast(isPlaying ? '🎵 ሙዚቃው ጀመረ' : '🔇 ሙዚቃው አቆመ');
    Haptic.light();
  });
}

function createCelebrationOverlay(){ if (!$('celebrationOverlay')) { const o = createEl('div', { id: 'celebrationOverlay' }); document.body.appendChild(o); } }
function launchConfetti(count = 60){
  if (!PREFS.animations) return;
  createCelebrationOverlay(); const overlay = $('celebrationOverlay');
  const colors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE'];
  const shapes = ['■','●','▲','★','♦','⬟'];
  for (let i = 0; i < count; i++){
    const p = createEl('div', { className: 'confetti-piece' });
    const color = colors[Math.floor(Math.random()*colors.length)];
    const shape = shapes[Math.floor(Math.random()*shapes.length)];
    p.style.left = Math.random()*100+'vw'; p.style.backgroundColor = color; p.style.color = color;
    p.style.animationDelay = Math.random()*1.5+'s'; p.style.animationDuration = (2+Math.random()*1.5)+'s';
    p.style.width = (6+Math.random()*8)+'px'; p.style.height = (6+Math.random()*8)+'px'; p.textContent = shape;
    if (Math.random() > 0.5) p.style.borderRadius = '50%';
    overlay.appendChild(p); setTimeout(() => p.remove(), 4500);
  }
}
function showCartoonPop(emoji, x, y){ if (!PREFS.animations) return; createCelebrationOverlay(); const overlay = $('celebrationOverlay'); const el = createEl('div', { className: 'cartoon-pop', textContent: emoji }); el.style.left = (x || window.innerWidth/2)+'px'; el.style.top = (y || window.innerHeight/2)+'px'; el.style.transform = 'translate(-50%, -50%)'; overlay.appendChild(el); setTimeout(() => el.remove(), 2000); }
function showCartoonFloat(emoji, x, y){ if (!PREFS.animations) return; createCelebrationOverlay(); const overlay = $('celebrationOverlay'); const el = createEl('div', { className: 'cartoon-float', textContent: emoji }); el.style.left = (x || Math.random()*window.innerWidth)+'px'; el.style.top = (y || window.innerHeight*0.7)+'px'; overlay.appendChild(el); setTimeout(() => el.remove(), 2800); }
function showSparkleBurst(x, y){
  if (!PREFS.animations) return;
  createCelebrationOverlay(); const overlay = $('celebrationOverlay');
  const sparkles = ['✨','⭐','🌟','💫','⚡','🎇'];
  for (let i = 0; i < 8; i++){
    const el = createEl('div', { className: 'sparkle-burst', textContent: sparkles[Math.floor(Math.random()*sparkles.length)] });
    const angle = (Math.PI*2*i)/8; const dist = 40+Math.random()*80;
    el.style.left = (x+Math.cos(angle)*dist)+'px'; el.style.top = (y+Math.sin(angle)*dist)+'px'; el.style.animationDelay = (i*0.05)+'s';
    overlay.appendChild(el); setTimeout(() => el.remove(), 1500);
  }
}
function showPraiseBubble(text, x, y){ if (!PREFS.animations) return; createCelebrationOverlay(); const overlay = $('celebrationOverlay'); const el = createEl('div', { className: 'praise-bubble', textContent: text }); el.style.left = (x || window.innerWidth/2)+'px'; el.style.top = (y || window.innerHeight/2)+'px'; el.style.transform = 'translate(-50%, -50%)'; el.style.background = 'linear-gradient(135deg, #FFD700, #FF8C00)'; el.style.color = '#3e2723'; overlay.appendChild(el); setTimeout(() => el.remove(), 2500); }
function showPraiseBubbleCustom(text, bg, color, x, y){ if (!PREFS.animations) return; createCelebrationOverlay(); const overlay = $('celebrationOverlay'); const el = createEl('div', { className: 'praise-bubble', textContent: text }); el.style.left = (x || window.innerWidth/2)+'px'; el.style.top = (y || window.innerHeight/2)+'px'; el.style.transform = 'translate(-50%, -50%)'; el.style.background = bg; el.style.color = color || '#fff'; overlay.appendChild(el); setTimeout(() => el.remove(), 2500); }
function emojiRain(emoji, count = 20){
  if (!PREFS.animations) return;
  createCelebrationOverlay(); const overlay = $('celebrationOverlay');
  for (let i = 0; i < count; i++){
    const el = createEl('div', { className: 'emoji-rain', textContent: emoji });
    el.style.left = Math.random()*100+'vw'; el.style.animationDelay = Math.random()*2+'s'; el.style.animationDuration = (2.5+Math.random()*2)+'s'; el.style.fontSize = (1.5+Math.random()*1.5)+'rem';
    overlay.appendChild(el); setTimeout(() => el.remove(), 5500);
  }
}
function showMilestoneBadge(emoji, text){ if (!PREFS.animations) return; createCelebrationOverlay(); const overlay = $('celebrationOverlay'); const el = createEl('div', { className: 'milestone-badge' }); el.innerHTML = `<div class="milestone-inner"><span class="milestone-emoji">${emoji}</span>${text}</div>`; overlay.appendChild(el); setTimeout(() => el.remove(), 3200); }
function triggerCorrectCelebration(){
  const praiseMessages = [
    { text: '🎉 ጥሩ!', emoji: '🌟' }, { text: '👏 በጣም ጥሩ!', emoji: '🎯' },
    { text: '🔥 ትክክል!', emoji: '⭐' }, { text: '💪 ጎበዝ!', emoji: '🏆' },
    { text: '🙌 አሪፍ!', emoji: '✨' }, { text: '🌟 እጅግ በጣም ጥሩ!', emoji: '💫' },
    { text: '🎉 ድንቅ ነው!', emoji: '🎊' }, { text: '👑 ጀግና!', emoji: '👑' },
    { text: '🚀 ኮከብ!', emoji: '🌠' }, { text: '💎 ግሩም!', emoji: '💎' }
  ];
  const pick = praiseMessages[Math.floor(Math.random()*praiseMessages.length)];
  const x = window.innerWidth/2 + (Math.random()-0.5)*200;
  const y = window.innerHeight/2 + (Math.random()-0.5)*100;
  launchConfetti(50); showPraiseBubble(pick.text, x, y);
  setTimeout(() => showCartoonPop(pick.emoji, x+60, y-60), 200);
  setTimeout(() => showCartoonFloat(pick.emoji, x-80, y+40), 400);
  setTimeout(() => showSparkleBurst(x, y), 300);
  setTimeout(() => emojiRain(['🎉','⭐','✨','🌟','💫'][Math.floor(Math.random()*5)], 12), 500);
  STATE.correctStreak++; STATE.totalCorrect++; STATE.totalAnswered++;
  if (STATE.correctStreak === 3) setTimeout(() => showMilestoneBadge('🔥', '3 ጊዜ በተከታታይ ትክክል!'), 1500);
  else if (STATE.correctStreak === 5) setTimeout(() => showMilestoneBadge('⚡', '5 ጊዜ በተከታታይ ትክክል! ድንቅ ነው!'), 1500);
  else if (STATE.correctStreak === 10) setTimeout(() => showMilestoneBadge('👑', '10 ጊዜ በተከታታይ ትክክል! ጀግና!'), 1500);
  if (STATE.correctStreak >= 3) showStreakFire();
}
function triggerWrongAnswer(){
  STATE.correctStreak = 0; STATE.totalAnswered++;
  const wrongMessages = [
    { text: '💪 አይዞን!', emoji: '🌱' }, { text: '📖 በርታ!', emoji: '📚' },
    { text: '✨ ተስፋ አትቁረጥ!', emoji: '🌟' }, { text: '🙏 ሞክር!', emoji: '💗' }
  ];
  const pick = wrongMessages[Math.floor(Math.random()*wrongMessages.length)];
  showPraiseBubbleCustom(pick.text+' '+pick.emoji, 'linear-gradient(135deg, #ef9a9a, #e57373)', '#fff', window.innerWidth/2, window.innerHeight/2-50);
}
function showStreakFire(){
  if (!PREFS.animations) return;
  const existing = document.querySelector('.streak-fire'); if (existing) existing.remove();
  createCelebrationOverlay(); const overlay = $('celebrationOverlay');
  const el = createEl('div', { className: 'streak-fire', textContent: '🔥' }); overlay.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 4000);
}
function showChapterCompletionCelebration(pct){
  launchConfetti(100); emojiRain('🎉', 20);
  setTimeout(() => emojiRain('⭐', 15), 300);
  setTimeout(() => emojiRain('✨', 12), 600);
  if (pct >= 90) showMilestoneBadge('🏆', 'እጅግ በጣም ጥሩ 90%+ ውጤት!');
  else if (pct >= 75) showMilestoneBadge('🎉', 'በጣም ጥሩ! 75%+ ውጤት!');
  else if (pct >= 60) showMilestoneBadge('👍', 'ጥሩ ሥራ! 60%+ ውጤት!');
  else showMilestoneBadge('🌱', 'ጥሩ ጅምር ነው! ይቀጥሉ!');
  for (let i = 0; i < 6; i++){ setTimeout(() => { showCartoonPop(['🎉','🎊','🏆','⭐','✨','🌟'][i], Math.random()*window.innerWidth, Math.random()*window.innerHeight*0.7); }, i*250); }
}
function triggerMilestoneCelebration(){
  const allDone = ALL_CHAPTERS.every(c => STATE.completedChapters.has(c.id));
  if (allDone) setTimeout(() => { launchConfetti(150); emojiRain('🏆', 25); showMilestoneBadge('👑', 'ሁሉንም ምዕራፎች ጨርሰዋል! ጀግና!'); }, 1000);
}

function toEthiopian(date){
  const d = new Date(date);
  const ethMonthNames = ['መስከረም','ጥቅምት','ኅዳር','ታኅሣሥ','ጥር','የካቲት','መጋቢት','ሚያዝያ','ግንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜን'];
  const gYear = d.getFullYear(); const gMonth = d.getMonth()+1; const gDay = d.getDate();
  let ethYear; if (gMonth > 9 || (gMonth === 9 && gDay >= 11)) ethYear = gYear-7; else ethYear = gYear-8;
  const dayOfYear = Math.floor((d - new Date(gYear, 0, 0)) / 86400000);
  let ethDayOfYear; if (gMonth > 9 || (gMonth === 9 && gDay >= 11)) ethDayOfYear = dayOfYear-253; else ethDayOfYear = dayOfYear+112;
  const ethMonth = Math.min(Math.floor(ethDayOfYear/30), 12);
  const ethDay = (ethDayOfYear % 30)+1;
  return `${ethMonthNames[ethMonth]} ${ethDay}፣ ${ethYear} ዓ.ም`;
}

const STATE = {
  theme: 'light', email: '', fullName: '', isLoggedIn: false,
  chapterIndex: 0, completedChapters: new Set(), exerciseAnswers: {},
  streak: 0, lastActiveDate: null, sessionStart: Date.now(), sessionElapsed: 0,
  timerId: null, readingHistory: {}, isRecording: false, speakDone: false,
  slideIndex: 0, lastQuizResult: null, recognition: null, focusReturnEl: null,
  waitTimerId: null, waitSecondsLeft: 0, waitTotalSeconds: 30,
  inStudy: false, selectedChapterIndex: 0, correctStreak: 0, totalCorrect: 0, totalAnswered: 0
};
const STORAGE_KEY = 'cfmb_v11';
let ALL_BOOKS = [];
let ALL_CHAPTERS = [];
const STEP_DEFS = [
  { key: 'explanation', title: '📘 የምዕራፉ ማብራሪያ', field: 'explanation' },
  { key: 'background',  title: '🏛️ የታሪኩ ዳራ ባክግራውንድ',  field: 'background' },
  { key: 'keywords',    title: '🔑 ቁልፍ ቃላት',        field: 'keywords' },
  { key: 'crossref',    title: '🔗 ተዛማጅ ጥቅሶች',     field: 'crossref' },
  { key: 'theology',    title: '🎓 ሥነ-መለኮታዊ ትንታኔ', field: 'theology' },
  { key: 'application', title: '🌱 ልንተገብረው የሚገባ ዕውነት', field: 'application' },
  { key: 'rhema',       title: '✨ የሬማ መልእክትና ጸሎት', field: 'rhema' }
];
const TOTAL_DESC_STEPS = STEP_DEFS.length;
const getChapter = () => ALL_CHAPTERS[STATE.chapterIndex];
const getExercises = () => (getChapter()?.exercises) || [];
const getQuestionSlideStart = () => 1 + TOTAL_DESC_STEPS;
const getSpeakSlide = () => getQuestionSlideStart() + getExercises().length;
const getDashboardSlide = () => getSpeakSlide() + 1;
const getTotalSlides = () => getDashboardSlide() + 1;
const isLastChapter = () => STATE.chapterIndex === ALL_CHAPTERS.length - 1;

async function loadData(){
  try {
    // 1. Load the book index (books metadata)
    // ✅ FIX: Changed the URL to point to the correct location on the server.
    const booksRes = await fetch('data/books.json', { cache: 'no-cache' });
    if (!booksRes.ok) throw new Error('books.json not found');
    const booksData = await booksRes.json();
    ALL_BOOKS = booksData.books || [];

    // 2. Load chapter files from the root directory as well.
    ALL_CHAPTERS = [];
    // This loop is now simpler because we assume chapters are in the root.
    const chapterPromises = [];
    for (const book of ALL_BOOKS) {
      if (!book.active) continue;
      for (let ch = 1; ch <= book.chapters; ch++) {
        const num = String(ch).padStart(2, '0');
        // ✅ FIX: Simplified the URL to correctly fetch the chapter files.
        const url = `data/${book.id}/chapter-${num}.json`;
        // Since we only have chapters for genesis, let's check for them.
        if (book.id === 'genesis') {
          const promise = fetch(url, { cache: 'no-cache' })
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch ${url}`);
              return res.json();
            })
            .catch(err => {
              console.warn(`⚠️ Could not load ${url}:`, err.message);
              return null; // Return null on failure so Promise.all doesn't reject
            });
          chapterPromises.push(promise);
        }
      }
    }
    
    const chapterResults = await Promise.all(chapterPromises);
    ALL_CHAPTERS = chapterResults.filter(ch => ch !== null); // Filter out any failed loads

    if (!ALL_CHAPTERS.length) {
      console.warn('⚠️ No chapter files were loaded.');
    } else {
      console.log(`✅ Loaded ${ALL_CHAPTERS.length} chapter(s).`);
    }
  } catch (err) {
    console.error('❌ Failed to load data:', err);
    ALL_BOOKS = [];
    ALL_CHAPTERS = [];
  }
}
function saveProgress(){
  if (!STATE.email) return;
  try {
    const payload = { email: STATE.email, fullName: STATE.fullName, completedIds: [...STATE.completedChapters], exerciseAnswers: STATE.exerciseAnswers, streak: STATE.streak, lastActiveDate: STATE.lastActiveDate, chapterIndex: STATE.chapterIndex, readingHistory: STATE.readingHistory };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) { }
}
function loadProgress(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
    const d = JSON.parse(raw);
    if (d.email) STATE.email = d.email;
    if (d.fullName) STATE.fullName = d.fullName;
    if (Array.isArray(d.completedIds)) STATE.completedChapters = new Set(d.completedIds);
    if (d.exerciseAnswers) STATE.exerciseAnswers = d.exerciseAnswers;
    if (typeof d.streak === 'number') STATE.streak = d.streak;
    if (d.lastActiveDate) STATE.lastActiveDate = d.lastActiveDate;
    if (typeof d.chapterIndex === 'number') STATE.chapterIndex = d.chapterIndex;
    if (d.readingHistory) STATE.readingHistory = d.readingHistory;
  } catch (e) { }
}
function resetAllChapters(){
  STATE.completedChapters = new Set(); STATE.exerciseAnswers = {}; STATE.streak = 0;
  STATE.lastActiveDate = null; STATE.readingHistory = {}; STATE.sessionStart = Date.now(); STATE.sessionElapsed = 0;
  STATE.chapterIndex = 0; STATE.slideIndex = 0; STATE.correctStreak = 0; STATE.totalCorrect = 0; STATE.totalAnswered = 0;
  try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
  saveProgress();
  if (STATE.timerId) clearInterval(STATE.timerId);
  $('chapterTimer').textContent = '⏱️ 00:00';
  showToast('♻️ ሁሉም ምዕራፎች ተጠፍተዋል!');
  if (STATE.inStudy) goHome();
  populateChapters($('selBook').value);
  updateStartBtn();
}
function resetSelectedChapter(){
  const c = getChapter(); if (!c) { showToast('⚠️ ምንም የተመረጠ ምዕራፍ የለም።'); return; }
  STATE.completedChapters.delete(c.id); delete STATE.exerciseAnswers[c.id];
  saveProgress();
  if (STATE.inStudy) { STATE.slideIndex = 0; renderSlide(); }
  showToast(`♻️ ምዕራፍ ${c.chapter} ጠፍቷል!`);
  populateChapters($('selBook').value); updateStartBtn();
}
function recordActivity(){
  const today = new Date().toDateString();
  if (!STATE.readingHistory[today]) STATE.readingHistory[today] = 0;
  STATE.readingHistory[today]++;
  if (STATE.lastActiveDate !== today){
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    STATE.streak = (STATE.lastActiveDate === yesterday) ? STATE.streak+1 : 1;
    STATE.lastActiveDate = today;
  }
  saveProgress();
}

function renderDashboard(){
  const completedBooksCount = ALL_BOOKS.filter(b => { const ch = ALL_CHAPTERS.filter(c => c.bookId === b.id); return ch.length > 0 && ch.every(c => STATE.completedChapters.has(c.id)); }).length;
  const totalBooks = ALL_BOOKS.filter(b => b.active).length;
  const bookPct = totalBooks > 0 ? Math.round((completedBooksCount/totalBooks)*100) : 0;
  const currentBook = getChapter()?.bookId;
  const bookChapters = ALL_CHAPTERS.filter(c => c.bookId === currentBook);
  const completedChaptersCount = bookChapters.filter(c => STATE.completedChapters.has(c.id)).length;
  const chapterPct = bookChapters.length > 0 ? Math.round((completedChaptersCount/bookChapters.length)*100) : 0;
  let totalAnswered = 0; let totalQuestions = 0;
  ALL_CHAPTERS.forEach(c => { const ex = c.exercises || []; totalQuestions += ex.length; const store = STATE.exerciseAnswers[c.id] || {}; totalAnswered += Object.keys(store).filter(k => store[k] && store[k].checked).length; });
  const questionPct = totalQuestions > 0 ? Math.round((totalAnswered/totalQuestions)*100) : 0;
  const today = new Date().toDateString();
  const todayVisits = STATE.readingHistory[today] || 0;
  const todaySeconds = STATE.sessionElapsed;
  const todayMinutes = Math.floor(todaySeconds/60);
  const todayHours = Math.floor(todayMinutes/60);
  const remainMin = todayMinutes % 60;
  const dwellDisplay = todayHours > 0 ? `${todayHours} ሰዓት ${remainMin} ደቂቃ` : `${todayMinutes} ደቂቃ`;
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  const setW = (id, v) => { const el = $(id); if (el) el.style.width = v+'%'; };
  set('dashBooks', `${completedBooksCount} / ${totalBooks}`); setW('dashBooksBar', bookPct);
  set('dashChapters', `${completedChaptersCount} / ${bookChapters.length}`); setW('dashChaptersBar', chapterPct);
  set('dashQuestions', `${totalAnswered} / ${totalQuestions}`); setW('dashQuestionsBar', questionPct);
  set('dashDwell', dwellDisplay); set('dashStreak', STATE.streak);
  set('dashTodayVisits', todayVisits); set('dashOverall', bookPct+'%'); setW('dashOverallBar', bookPct);
}

function trapFocus(container){
  const selectors = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const nodes = container.querySelectorAll(selectors);
  if (!nodes.length) return () => {};
  const first = nodes[0]; const last = nodes[nodes.length-1];
  function handler(e){
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}
function openPopup(popupEl){
  STATE.focusReturnEl = document.activeElement;
  popupEl.classList.add('show');
  const modal = popupEl.querySelector('.popup-modal') || popupEl.querySelector('.cert-modal');
  const cleanup = trapFocus(modal); popupEl._focusCleanup = cleanup;
  const focusable = modal.querySelector('button, [href], input'); if (focusable) focusable.focus();
  const escHandler = (e) => { if (e.key === 'Escape'){ e.preventDefault(); closePopup(popupEl); } };
  document.addEventListener('keydown', escHandler); popupEl._escHandler = escHandler;
}
function closePopup(popupEl){
  popupEl.classList.remove('show');
  if (popupEl._focusCleanup) popupEl._focusCleanup();
  if (popupEl._escHandler) document.removeEventListener('keydown', popupEl._escHandler);
  if (STATE.focusReturnEl && STATE.focusReturnEl.focus) STATE.focusReturnEl.focus();
}
function renderProgressPips(){
  const pips = $('slideProgress'); pips.innerHTML = '';
  const total = getTotalSlides();
  for (let i = 0; i < total; i++){
    const p = createEl('div', { className: 'pip' + (i === STATE.slideIndex ? ' active' : (i < STATE.slideIndex ? ' completed' : '')) });
    pips.appendChild(p);
  }
}
function announceSlide(title){ const a = $('slideAnnouncer'); if (a) a.textContent = title; }
function getNextButtonLabel(){ if (STATE.slideIndex === getDashboardSlide()) return isLastChapter() ? '🏆 የምስክር ወረቀት' : 'ወደ ሚቀጥለው ምዕራፍ →'; return 'ወደ ሚቀጥለው ገጽ →'; }

function renderIntroSlide(cardClass){
  const c = getChapter();
  return `<div class="${cardClass}"><div class="slide-step-badge">📖 መግቢያ ጥቅስ</div><div class="verse-slide"><span class="reference">📖 ${c.refAm}</span><div class="verse-text">${c.verseAm}</div></div><div class="slide-nav"><span class="spacer"></span><button class="nav-btn-main" id="nextSlideBtn">${getNextButtonLabel()}</button></div></div>`;
}
function renderDescriptionSlide(stepIdx, cardClass){
  const c = getChapter(); const def = STEP_DEFS[stepIdx];
  let bodyHTML;
  if (def.key === 'rhema') bodyHTML = `<div class="rhema-content">${c.rhema || ''}</div><div class="prayer-content">${c.prayer || ''}</div>`;
  else bodyHTML = `<div class="study-content">${c[def.field] || '<p>—</p>'}</div>`;
  return `<div class="${cardClass}"><div class="slide-step-badge">ደረጃ ${stepIdx+1} ከ ${TOTAL_DESC_STEPS}</div><h2 class="slide-title">${def.title}</h2>${bodyHTML}<div class="slide-nav"><button class="nav-btn-sm" id="prevSlideBtn">← ወደኋላ</button><span class="spacer"></span><button class="nav-btn-main" id="nextSlideBtn" disabled>⏳ ጥቂት ቆይ 30 ሰከንድ...</button><button class="nav-btn-sm" id="skipWaitBtn" style="margin-left:6px;background:var(--surface-3);color:var(--text-medium);border-color:var(--border-wood);">ገጹን ለመዝለል ⏭️</button></div></div>`;
}
function renderQuestionSlide(qi, cardClass){
  const ex = getExercises()[qi];
  return `<div class="${cardClass}"><div class="slide-step-badge">❓ ጥያቄ ${qi+1} ከ ${getExercises().length}</div>${buildQuestionHTML(ex, qi)}<div class="slide-nav"><button class="nav-btn-sm" id="prevSlideBtn">← ወደኋላ</button><span class="spacer"></span><button class="nav-btn-main" id="nextSlideBtn">${getNextButtonLabel()}</button></div></div>`;
}
function renderSpeakSlide(cardClass){
  const c = getChapter();
  return `<div class="${cardClass}"><div class="slide-step-badge">📢 ማወጅ</div><h2 class="slide-title">📢 የዕለቱን የሬማ ቃል በእምነት ያውጁ</h2><p style="font-size:.85rem;color:var(--text-medium);margin-bottom:12px;">የዛሬውን የእግዚአብሔር ቃል በሕይወትዎ ላይ ለመናገር በእምነት ይዘጋጁ።</p><div class="speak-area"><div class="speak-target"><div class="proclaim-label">📢 የዕለቱ ቃል</div><div class="proclaim-verse">${c.proclaimWord || ''}</div><div class="hint">${c.proclaimHint || ''}</div></div><div class="proclaim-instruction">🗣️ “በኢየሱስ ክርስቶስ ስም አውጃለሁ፦ …”</div><button class="mic-btn" id="micBtn" aria-label="የድምጽ ቀረጻ ጀምር">🎤</button><div class="mic-label" id="micLabel" aria-live="polite">ለማወጅ ይንኩ</div><div class="transcript-box hidden" id="transcriptBox"><div class="label">🎯 የእርስዎ አዋጅ</div><div id="transcriptText"></div></div><button class="speak-done-btn" id="speakDoneBtn">✅ ቃሉን አውጄያለሁ</button></div><div class="slide-nav"><button class="nav-btn-sm" id="prevSlideBtn">← ወደኋላ</button><span class="spacer"></span><button class="nav-btn-main" id="nextSlideBtn">${getNextButtonLabel()}</button></div></div>`;
}
function renderDashboardSlide(cardClass){
  const allDone = ALL_CHAPTERS.every(c => STATE.completedChapters.has(c.id));
  const certBtn = allDone ? `<button class="nav-btn-main" id="certBtn" style="background:linear-gradient(135deg,#c5a059,#8a5c0a);">🏆 የምስክር ወረቀት</button>` : '';
  return `<div class="${cardClass}"><div class="slide-step-badge">📊 ማጠቃለያ</div><h2 class="slide-title">📊 የጥናት ሂደትዎ ማጠቃለያ</h2><div class="dashboard-grid"><div class="dash-item"><div class="dash-num" id="dashBooks">0 / 1</div><div class="dash-lbl">📚 የተጠናቀቁ መጻሕፍት</div><div class="dash-bar-wrap"><div class="dash-bar success" id="dashBooksBar" style="width:0%"></div></div></div><div class="dash-item"><div class="dash-num" id="dashChapters">0 / 2</div><div class="dash-lbl">📖 የተጠናቀቁ ምዕራፎች</div><div class="dash-bar-wrap"><div class="dash-bar info" id="dashChaptersBar" style="width:0%"></div></div></div><div class="dash-item"><div class="dash-num" id="dashQuestions">0 / 0</div><div class="dash-lbl">❓ የተመለሱ ጥያቄዎች</div><div class="dash-bar-wrap"><div class="dash-bar warning" id="dashQuestionsBar" style="width:0%"></div></div></div><div class="dash-item"><div class="dash-num" id="dashDwell">0 ደቂቃ</div><div class="dash-lbl">⏱️ የቆይታ ጊዜ (ዛሬ)</div></div><div class="dash-item"><div class="dash-num" id="dashStreak">0</div><div class="dash-lbl">🔥 ተከታታይ ቀናት</div></div><div class="dash-item"><div class="dash-num" id="dashTodayVisits">0</div><div class="dash-lbl">📅 የዛሬ ጉብኝትዎ</div></div><div class="dash-item" style="grid-column:1/-1;"><div class="dash-num" id="dashOverall">0%</div><div class="dash-lbl">🎯 አጠቃላይ ሂደት</div><div class="dash-bar-wrap"><div class="dash-bar" id="dashOverallBar" style="width:0%"></div></div></div></div>${renderWeeklyChart()}${renderAchievementsGrid()}<div class="slide-nav"><button class="nav-btn-sm" id="prevSlideBtn">← ወደኋላ</button><span class="spacer"></span>${certBtn}<button class="nav-btn-main" id="finishChapterBtn">🎉 ምዕራፉን ጨርስ</button></div></div>`;
}

function renderSlide(direction){
  const container = $('slideContent');
  const cardClass = 'slide-card' + (direction === 'back' ? ' back' : '') + (!PREFS.animations ? ' no-anim' : '');
  const idx = STATE.slideIndex;
  if (!getChapter()) { container.innerHTML = '<div class="slide-card"><p>⚠️ ምዕራፉ አልተጫነም።</p></div>'; return; }
  const qStart = getQuestionSlideStart();
  const qCount = getExercises().length;
  const speakSlide = getSpeakSlide();
  const dashSlide = getDashboardSlide();
  const bottomNav = $('bottomNav');
  if (bottomNav) { if (idx === dashSlide) bottomNav.classList.remove('hidden'); else bottomNav.classList.add('hidden'); }
  renderProgressPips();
  let html = ''; let announce = '';
  if (idx === 0){ html = renderIntroSlide(cardClass); announce = 'መግቢያ ጥቅስ'; }
  else if (idx >= 1 && idx <= TOTAL_DESC_STEPS){ html = renderDescriptionSlide(idx-1, cardClass); announce = STEP_DEFS[idx-1].title; }
  else if (idx >= qStart && idx < qStart+qCount){ html = renderQuestionSlide(idx-qStart, cardClass); announce = `ጥያቄ ${idx-qStart+1} ከ ${qCount}`; }
  else if (idx === speakSlide){ html = renderSpeakSlide(cardClass); announce = 'በቃል የምታውጀው ክፍል'; }
  else if (idx === dashSlide){ html = renderDashboardSlide(cardClass); announce = 'የማጠቃለያ ሪፖርት'; }
  container.innerHTML = html;
  announceSlide(announce);
  if (STATE.waitTimerId) clearInterval(STATE.waitTimerId);
  const nextBtn = $('nextSlideBtn');
  if (nextBtn) nextBtn.addEventListener('click', () => { if (STATE.slideIndex === getDashboardSlide()){ if (isLastChapter()) showCertificate(); else goToChapter(STATE.chapterIndex+1); } else goToSlide(STATE.slideIndex+1, 'forward'); });
  const prevBtn = $('prevSlideBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(STATE.slideIndex-1, 'back'));
  const skipBtn = $('skipWaitBtn');
  if (skipBtn) skipBtn.addEventListener('click', () => { if (STATE.waitTimerId) clearInterval(STATE.waitTimerId); goToSlide(STATE.slideIndex+1, 'forward'); });
  if (idx >= 1 && idx <= TOTAL_DESC_STEPS && nextBtn && nextBtn.disabled) startWaitTimer(nextBtn, skipBtn);
  if (idx >= qStart && idx < qStart+qCount){ bindQuestionEvents(getExercises()[idx-qStart], idx-qStart); restoreQuestionState(idx-qStart); }
  else if (idx === speakSlide){ bindMic(); bindSpeakDone(); }
  else if (idx === dashSlide){
    renderDashboard();
    const fb = $('finishChapterBtn');
    if (fb) fb.addEventListener('click', () => {
      const r = STATE.lastQuizResult || { correct: 0, total: getExercises().length, pct: 0 };
      showChapterCompletionCelebration(r.pct);
      setTimeout(() => showChapterPopup(r.correct, r.total, r.pct), 800);
      const bn = $('bottomNav'); if (bn) { bn.classList.remove('hidden'); bn.scrollIntoView({ behavior: 'smooth', block: 'end' }); }
    });
    const certBtn = $('certBtn');
    if (certBtn) certBtn.addEventListener('click', showCertificate);
  }
}
function startWaitTimer(nextBtn, skipBtn){
  STATE.waitSecondsLeft = STATE.waitTotalSeconds;
  const update = () => {
    if (STATE.waitSecondsLeft <= 0){ clearInterval(STATE.waitTimerId); nextBtn.disabled = false; nextBtn.textContent = getNextButtonLabel(); if (skipBtn) skipBtn.style.display = 'none'; return; }
    nextBtn.textContent = `⏳ ጥቂት ቆይ ${STATE.waitSecondsLeft} ሰከንድ...`; STATE.waitSecondsLeft--;
  };
  update();
  STATE.waitTimerId = setInterval(update, 1000);
}
function goToSlide(newIdx, direction){
  const total = getTotalSlides();
  if (newIdx < 0 || newIdx >= total) return;
  if (STATE.waitTimerId) clearInterval(STATE.waitTimerId);
  STATE.slideIndex = newIdx;
  renderSlide(direction || 'forward');
  recordActivity();
  const stage = document.querySelector('.slide-stage');
  if (stage) stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function buildQuestionHTML(ex, qi){
  const typeLabel = ex.type === 'mcq' ? '🔘 ምርጫ' : ex.type === 'tf' ? '✅ እውነት ወይም ሐሰት' : ex.type === 'match' ? '🔗 አዛምድ' : '✍️ ክፍት ጥያቄ';
  let html = `<div class="question-block" data-qindex="${qi}">`;
  html += `<div class="q-number">📝 ጥያቄ ${qi+1} <span class="q-type">${typeLabel}</span></div>`;
  html += `<div class="q-text">${ex.qAm}</div>`;
  if (ex.type === 'mcq'){
    html += `<div class="options" data-qindex="${qi}" role="radiogroup" aria-label="ምርጫዎች">`;
    ex.optsAm.forEach((opt, oi) => { html += `<button type="button" class="option-btn" data-optindex="${oi}" data-qindex="${qi}" role="radio" aria-checked="false"><span class="opt-letter" aria-hidden="true">${String.fromCharCode(65+oi)}</span><span>${opt}</span></button>`; });
    html += `</div>`;
    html += `<div class="question-feedback" id="feedback-${qi}" role="status" aria-live="polite"></div>`;
  } else if (ex.type === 'tf'){
    html += `<div class="tf-buttons" data-qindex="${qi}"><button type="button" class="tf-btn" data-tf="true" data-qindex="${qi}">✅ እውነት</button><button type="button" class="tf-btn" data-tf="false" data-qindex="${qi}">❌ ሐሰት</button></div>`;
    html += `<div class="question-feedback" id="feedback-${qi}" role="status" aria-live="polite"></div>`;
  } else if (ex.type === 'match'){
    html += `<div class="match-container" data-qindex="${qi}"><div class="match-col">`;
    ex.pairs.forEach((p, pi) => { html += `<button type="button" class="match-item" data-side="left" data-pair="${pi}" data-qindex="${qi}">${p.left}</button>`; });
    html += `</div><div class="match-col">`;
    const rightItems = ex.pairs.map((p, pi) => ({ text: p.right, pair: pi }));
    rightItems.sort(() => Math.random()-0.5);
    rightItems.forEach(item => { html += `<button type="button" class="match-item" data-side="right" data-pair="${item.pair}" data-qindex="${qi}">${item.text}</button>`; });
    html += `</div></div>`;
    html += `<div class="question-feedback" id="feedback-${qi}" role="status" aria-live="polite"></div>`;
  } else if (ex.type === 'open'){
    html += `<textarea class="open-input" data-qindex="${qi}" aria-label="የእርስዎ መልስ" placeholder="✍️ ከዛሬው ትምህርት በመነሳት የእርስዎን ሐሳብ በነጻነት እዚህ ይጻፉ..."></textarea>`;
    html += `<button type="button" class="reveal-btn" data-qindex="${qi}">💡 መልሱን ለማየት</button>`;
    html += `<div class="sample-answer" id="sample-${qi}"><div class="label">📖 ምሳሌ መልስ (ያነጻጽሩት)</div><div>${ex.sampleAm}</div></div>`;
  }
  html += `</div>`;
  return html;
}
function getChapterAnswerStore(){ const c = getChapter(); if (!c) return {}; if (!STATE.exerciseAnswers[c.id]) STATE.exerciseAnswers[c.id] = {}; return STATE.exerciseAnswers[c.id]; }

function restoreQuestionState(qi){
  const store = getChapterAnswerStore();
  const saved = store[qi]; if (!saved) return;
  const ex = getExercises()[qi];
  if (ex.type === 'mcq' && typeof saved.selected === 'number'){
    const btns = $$(`.option-btn[data-qindex="${qi}"]`);
    btns.forEach((b, oi) => {
      b.disabled = true;
      if (oi === ex.correct) b.classList.add('correct');
      else if (oi === saved.selected) b.classList.add('incorrect');
      if (oi === saved.selected) b.classList.add('selected');
    });
    const fb = $(`feedback-${qi}`);
    if (fb){ fb.className = 'question-feedback show ' + (saved.correct ? 'correct' : 'incorrect'); fb.innerHTML = (saved.correct ? '✅ <strong>ትክክል!</strong> ' : '❌ <strong>ትክክል አይደለም።</strong> ') + ex.explAm; }
  } else if (ex.type === 'tf' && typeof saved.selected === 'boolean'){
    const btns = $$(`.tf-btn[data-qindex="${qi}"]`);
    btns.forEach(b => {
      b.disabled = true;
      const bVal = b.dataset.tf === 'true';
      if (bVal === ex.correct) b.classList.add('correct');
      else if (bVal === saved.selected) b.classList.add('incorrect');
    });
    const fb = $(`feedback-${qi}`);
    if (fb){ fb.className = 'question-feedback show ' + (saved.correct ? 'correct' : 'incorrect'); fb.innerHTML = (saved.correct ? '✅ <strong>ትክክል!</strong> ' : '❌ <strong>ትክክል አይደለም።</strong> ') + ex.explAm; }
  } else if (ex.type === 'open' && saved.checked){
    const sample = $(`sample-${qi}`);
    const rb = document.querySelector(`.reveal-btn[data-qindex="${qi}"]`);
    if (sample) sample.classList.add('show');
    if (rb) rb.textContent = '🙈 መልሱን ደብቅ';
  }
}
function bindQuestionEvents(ex, qi){
  if (ex.type === 'mcq') bindMCQ(ex, qi);
  else if (ex.type === 'tf') bindTF(ex, qi);
  else if (ex.type === 'match') bindMatch(ex, qi);
  else if (ex.type === 'open') bindOpen(ex, qi);
}
function bindMCQ(ex, qi){
  const btns = $$(`.option-btn[data-qindex="${qi}"]`);
  btns.forEach(btn => {
    btn.addEventListener('click', function(){
      if (this.disabled) return;
      const selIdx = parseInt(this.dataset.optindex, 10);
      const isCorrect = selIdx === ex.correct;
      btns.forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-checked', 'false'); });
      this.classList.add('selected'); this.setAttribute('aria-checked', 'true');
      btns.forEach((b, oi) => {
        b.disabled = true;
        if (oi === ex.correct) b.classList.add('correct');
        else if (oi === selIdx) b.classList.add('incorrect');
      });
      const fb = $(`feedback-${qi}`);
      fb.className = 'question-feedback show ' + (isCorrect ? 'correct' : 'incorrect');
      fb.innerHTML = (isCorrect ? '✅ <strong>ትክክል!</strong> ' : '❌ <strong>ትክክል አይደለም።</strong> ') + ex.explAm;
      getChapterAnswerStore()[qi] = { selected: selIdx, correct: isCorrect, checked: true };
      markExerciseDone(qi, isCorrect);
      if (isCorrect){
        const rect = this.getBoundingClientRect();
        triggerCorrectCelebration();
        showSparkleBurst(rect.left + rect.width/2, rect.top + rect.height/2);
        Sound.correct(); Haptic.success(); mascotCheer(); checkAchievements(true);
      } else {
        triggerWrongAnswer();
        if (PREFS.animations){ this.classList.add('wrong-shake'); setTimeout(() => this.classList.remove('wrong-shake'), 600); }
        Sound.wrong(); Haptic.error(); mascotSad(); checkAchievements(false);
      }
    });
  });
}
function bindTF(ex, qi){
  const btns = $$(`.tf-btn[data-qindex="${qi}"]`);
  btns.forEach(btn => {
    btn.addEventListener('click', function(){
      const selected = this.dataset.tf === 'true';
      const isCorrect = selected === ex.correct;
      btns.forEach(b => {
        b.disabled = true;
        const bVal = b.dataset.tf === 'true';
        if (bVal === ex.correct) b.classList.add('correct');
        else if (bVal === selected) b.classList.add('incorrect');
      });
      const fb = $(`feedback-${qi}`);
      fb.className = 'question-feedback show ' + (isCorrect ? 'correct' : 'incorrect');
      fb.innerHTML = (isCorrect ? '✅ <strong>ትክክል!</strong> ' : '❌ <strong>ትክክል አይደለም።</strong> ') + ex.explAm;
      getChapterAnswerStore()[qi] = { selected, correct: isCorrect, checked: true };
      markExerciseDone(qi, isCorrect);
      if (isCorrect){
        triggerCorrectCelebration();
        const rect = this.getBoundingClientRect();
        showSparkleBurst(rect.left + rect.width/2, rect.top + rect.height/2);
        Sound.correct(); Haptic.success(); mascotCheer(); checkAchievements(true);
      } else {
        triggerWrongAnswer();
        if (PREFS.animations){ this.classList.add('wrong-shake'); setTimeout(() => this.classList.remove('wrong-shake'), 600); }
        Sound.wrong(); Haptic.error(); mascotSad(); checkAchievements(false);
      }
    });
  });
}
function bindMatch(ex, qi){
  const items = $$(`.match-item[data-qindex="${qi}"]`);
  items.forEach(item => {
    item.addEventListener('click', function(){
      if (this.classList.contains('matched')) return;
      const side = this.dataset.side;
      const existing = document.querySelector(`.match-item[data-qindex="${qi}"][data-side="${side}"].selected`);
      if (existing) existing.classList.remove('selected');
      this.classList.add('selected');
      const leftSel = document.querySelector(`.match-item[data-qindex="${qi}"][data-side="left"].selected`);
      const rightSel = document.querySelector(`.match-item[data-qindex="${qi}"][data-side="right"].selected`);
      if (leftSel && rightSel){
        if (leftSel.dataset.pair === rightSel.dataset.pair){
          leftSel.classList.add('matched'); leftSel.classList.remove('selected');
          rightSel.classList.add('matched'); rightSel.classList.remove('selected');
          const lRect = leftSel.getBoundingClientRect();
          showSparkleBurst(lRect.left + lRect.width/2, lRect.top + lRect.height/2);
          showCartoonPop('✨', lRect.left + lRect.width/2, lRect.top);
          Sound.click(); Haptic.light();
          checkMatchComplete(qi);
        } else {
          leftSel.classList.add('wrong'); rightSel.classList.add('wrong');
          setTimeout(() => { leftSel.classList.remove('wrong', 'selected'); rightSel.classList.remove('wrong', 'selected'); }, 500);
          Sound.wrong(); Haptic.error();
        }
      }
    });
  });
}
function checkMatchComplete(qi){
  const lefts = document.querySelectorAll(`.match-item[data-qindex="${qi}"][data-side="left"]`);
  const matched = document.querySelectorAll(`.match-item[data-qindex="${qi}"][data-side="left"].matched`);
  if (lefts.length === matched.length){
    const fb = $(`feedback-${qi}`);
    fb.className = 'question-feedback show correct';
    fb.innerHTML = '✅ <strong>ትክክል!</strong> ሁሉንም በትክክል አዛምደዋል! 🎉';
    getChapterAnswerStore()[qi] = { correct: true, checked: true };
    markExerciseDone(qi, true);
    triggerCorrectCelebration();
    launchConfetti(40); emojiRain('🎯', 10);
    Sound.correct(); Haptic.success(); mascotCheer(); checkAchievements(true);
  }
}
function bindOpen(ex, qi){
  const rb = document.querySelector(`.reveal-btn[data-qindex="${qi}"]`);
  if (!rb) return;
  rb.addEventListener('click', function(){
    const sample = $(`sample-${qi}`);
    if (sample.classList.contains('show')){ sample.classList.remove('show'); this.textContent = '💡 መልስ አሳይ'; }
    else {
      sample.classList.add('show'); this.textContent = '🙈 መልሱን ደብቅ';
      getChapterAnswerStore()[qi] = { correct: true, checked: true };
      markExerciseDone(qi, true);
      const rect = this.getBoundingClientRect();
      showSparkleBurst(rect.left + rect.width/2, rect.top);
      showCartoonPop('💡', rect.left + rect.width/2, rect.top - 20);
      Sound.click(); Haptic.light();
    }
  });
  const ta = document.querySelector(`.open-input[data-qindex="${qi}"]`);
  if (ta) ta.addEventListener('input', () => { const store = getChapterAnswerStore(); store[qi] = store[qi] || {}; store[qi].text = ta.value; saveProgress(); });
}
function markExerciseDone(qi, isCorrect){
  const total = getExercises().length;
  const store = getChapterAnswerStore();
  const done = Object.keys(store).filter(k => store[k] && store[k].checked).length;
  if (done === total){
    const correct = Object.keys(store).filter(k => store[k] && store[k].correct).length;
    const pct = total > 0 ? Math.round((correct/total)*100) : 0;
    if (pct >= 60 && !STATE.completedChapters.has(getChapter().id)){
      STATE.completedChapters.add(getChapter().id);
      recordActivity(); saveProgress(); triggerMilestoneCelebration();
    }
    STATE.lastQuizResult = { correct, total, pct };
    if (pct >= 100) unlockAchievement('perfect_chapter');
  }
  saveProgress();
}
function bindMic(){ const mb = $('micBtn'); if (!mb) return; mb.addEventListener('click', () => { if (STATE.isRecording) stopRecording(); else startRecording(); }); }
function startRecording(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR){ alert('⚠️ የንግግር መሳርያው አይሰራም። እባክዎ Chrome ወይም Edge ይጠቀሙ።'); return; }
  const r = new SR(); r.lang = 'am-ET'; r.interimResults = false;
  STATE.isRecording = true;
  const mb = $('micBtn'); if (mb) mb.classList.add('recording');
  const ml = $('micLabel'); if (ml) ml.textContent = '🎧 በማዳመጥ ላይ...';
  const tb = $('transcriptBox'); if (tb) tb.classList.remove('hidden');
  const tt = $('transcriptText'); if (tt) tt.innerHTML = '<em>🎤 አሁን በቃልዎ ያውጁ...</em>';
  r.onresult = (e) => { const txt = e.results[0][0].transcript; const tEl = $('transcriptText'); if (tEl) tEl.innerHTML = '🎯 <strong>የእርስዎ ዐዋጅ:</strong> ' + txt; const lEl = $('micLabel'); if (lEl) lEl.textContent = '✅ ተጠናቅቋል! ለመድገም ይንኩ።'; };
  r.onerror = () => { const lEl = $('micLabel'); if (lEl) lEl.textContent = '⚠️ ስህተት። ለመድገም ይንኩ።'; STATE.isRecording = false; const mb2 = $('micBtn'); if (mb2) mb2.classList.remove('recording'); };
  r.onend = () => { STATE.isRecording = false; const mb2 = $('micBtn'); if (mb2) mb2.classList.remove('recording'); };
  r.start(); STATE.recognition = r;
}
function stopRecording(){ if (STATE.recognition) STATE.recognition.stop(); STATE.isRecording = false; const mb = $('micBtn'); if (mb) mb.classList.remove('recording'); }
function bindSpeakDone(){
  const btn = $('speakDoneBtn'); if (!btn) return;
  btn.addEventListener('click', function(){
    if (STATE.speakDone) return;
    STATE.speakDone = true;
    this.classList.add('done');
    this.textContent = '✅ ተጠናቅቋል — እግዚአብሔር ይባርክዎ!';
    this.disabled = true;
    showToast('✅ ያወጁት የቃል አዋጅ ተመዝግቧል!');
    launchConfetti(30);
    showCartoonPop('🕊️', window.innerWidth/2, window.innerHeight/2);
    Sound.correct(); Haptic.celebrate();
  });
}
function showToast(msg){ const t = createEl('div', { textContent: msg }); t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2e7d32;color:#fff;padding:10px 22px;border-radius:30px;font-weight:700;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,.3);font-size:.9rem;'; document.body.appendChild(t); setTimeout(() => t.remove(), 2000); }

function renderChapter(){
  const c = getChapter(); if (!c) return;
  $('curriculumUnit').textContent = `${c.bookNameAm} · ምዕራፍ ${c.chapter}`;
  $('curriculumTitle').textContent = '📖 ' + c.titleAm;
  $('curriculumFocus').textContent = '🎯 ' + c.focusAm;
  $('navChapterLabel').textContent = `${c.bookNameAm} · ምዕራፍ ${c.chapter}`;
  STATE.slideIndex = 0; STATE.speakDone = false; STATE.lastQuizResult = null; STATE.correctStreak = 0;
  STATE.sessionStart = Date.now(); STATE.sessionElapsed = 0;
  if (STATE.timerId) clearInterval(STATE.timerId);
  startTimer();
  $('chapterTimer').classList.add('visible');
  $('nextBtn').textContent = isLastChapter() ? '🏆 የምስክር ወረቀት' : 'ወደ ሚቀጥለው ምዕራፍ →';
  renderSlide(); recordActivity(); saveProgress();
}
function goToChapter(idx){
  if (idx < 0) idx = 0;
  if (idx >= ALL_CHAPTERS.length) idx = ALL_CHAPTERS.length - 1;
  STATE.chapterIndex = idx;
  renderChapter();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function populateTestament(){ const sel = $('selTestament'); sel.innerHTML = '<option value="">— ይምረጡ —</option><option value="OT">📖 ብሉይ ኪዳን</option><option value="NT">✝️ አዲስ ኪዳን</option>'; }
function populateBooks(testament){
  const sel = $('selBook');
  sel.innerHTML = '<option value="">— መጽሐፉን ይምረጡ —</option>';
  if (!testament){ sel.disabled = true; return; }
  ALL_BOOKS.filter(b => b.testament === testament).forEach(b => { const o = createEl('option', { value: b.id, textContent: (b.active ? '📗 ' : '📖 ') + b.nameAm + ' (' + b.chapters + ')' }); sel.appendChild(o); });
  sel.disabled = false;
}
function populateChapters(bookId){
  const sel = $('selChapter');
  sel.innerHTML = '<option value="">— ምዕራፉን ይምረጡ —</option>';
  if (!bookId){ sel.disabled = true; return; }
  const book = ALL_BOOKS.find(b => b.id === bookId);
  if (!book){ sel.disabled = true; return; }
  for (let i = 1; i <= book.chapters; i++){
    const idx = ALL_CHAPTERS.findIndex(v => v.bookId === bookId && v.chapter === i);
    const done = idx >= 0 && STATE.completedChapters.has(ALL_CHAPTERS[idx].id);
    const hasContent = idx >= 0;
    const icon = hasContent ? (done ? '✅' : '📄') : '🔒';
    const o = createEl('option', { value: idx >= 0 ? String(idx) : '', textContent: `${icon} ምዕራፍ ${i}${done ? ' ✅' : (hasContent ? '' : ' (በቅርቡ)')}` });
    if (!hasContent) o.disabled = true;
    sel.appendChild(o);
  }
  sel.disabled = false;
}
function updateStartBtn(){ const btn = $('startStudyBtn'); if (!btn) return; btn.disabled = $('selChapter').value === ''; }
function showChapterPopup(correct, total, pct){
  const c = getChapter();
  let icon, title, text;
  if (pct >= 90){ icon = '🏆'; title = 'ግሩም ውጤት! በጣም ጥሩ!'; text = 'እጅግ በጣም ጥሩ ውጤት አግኝተዋል! 🌟'; }
  else if (pct >= 75){ icon = '🎉'; title = 'በጣም ጥሩ!'; text = 'በጣም ጥሩ ውጤት ነው! 📖'; }
  else if (pct >= 60){ icon = '👍'; title = 'ጥሩ!'; text = 'ጥሩ ውጤት ነው! 💪'; }
  else { icon = '🌱'; title = 'ጥሩ ጅምር!'; text = 'ይህ ጅምር ነው። ተስፋ ሳይቆርጡ ይሞክሩ! 🙏'; }
  $('popupIcon').textContent = icon;
  $('popupTitle').textContent = title;
  $('popupText').textContent = `${text} — 📖 ምዕራፍ "${c.titleAm}"`;
  $('popupCorrect').textContent = correct;
  $('popupTotal').textContent = total;
  $('popupScore').textContent = pct + '%';
  $('popupVerse').textContent = '"ቃልህ ለእግሬ መብራት፥ ለመንገዴም ብርሃን ነው።" — መዝሙር 119:105';
  openPopup($('chapterPopup'));
}
function showCertificate(){
  const email = STATE.email || 'ተማሪ';
  const name = STATE.fullName || email.split('@')[0];
  const book = ALL_BOOKS.find(b => b.id === getChapter().bookId);
  const date = toEthiopian(new Date());
  $('certName').textContent = name;
  $('certBook').textContent = book ? book.nameAm : 'መጽሐፍ ቅዱስ';
  $('certDate').textContent = 'የተሰጠበት ቀን፡ ' + date;
  launchConfetti(80); emojiRain('🏆', 15);
  Sound.chapterDone(); Haptic.celebrate();
  openPopup($('certOverlay'));
}
function openSharePopup(){
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent('የቃሉ ናፍቆት የመጽሐፍ ቅዱስ ጥናት መተግበርያ — ይህን ይጠቀሙ!');
  const full = text + '%20' + url;
  $('shareTelegram').href = `https://t.me/share/url?url=${url}&text=${text}`;
  $('shareWhatsapp').href = `https://wa.me/?text=${full}`;
  $('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  $('shareEmail').href    = `mailto:?subject=${encodeURIComponent('የቃሉ ናፍቆት')}&body=${full}`;
  $('shareSms').href      = `sms:?&body=${full}`;
  openPopup($('sharePopup'));
}
function doLogin(){
  const email = $('emailInput').value.trim();
  if (!email || email.indexOf('@') === -1){ alert('⚠️ እባክዎ ትክክለኛ ኢሜይል ያስገቡ።'); return; }
  STATE.email = email; STATE.isLoggedIn = true;
  try { localStorage.setItem('cfmb_email_v8', email); } catch (e) {}
  loadProgress(); showHome();
  launchConfetti(20); showToast('🎉 እንኳን ወደ የቃሉ ናፍቆት የመጽሐፍ ቅዱስ ጥናት በደህና መጡ!');
  Sound.correct(); Haptic.success();
}
function doLogout(){
  if (!confirm('መውጣት?')) return;
  saveProgress(); STATE.isLoggedIn = false; STATE.email = '';
  try { localStorage.removeItem('cfmb_email_v8'); } catch (e) {}
  $('mainSection').classList.add('hidden');
  $('homeSection').classList.remove('visible');
  $('loginSection').classList.remove('hidden');
  $('hamburgerBtn').classList.add('hidden');
  $('exitBtn').classList.add('hidden');
  $('appHeader').classList.remove('visible');
  $('chapterTimer').classList.remove('visible');
  closeDrawer();
}
function showHome(){
  $('loginSection').classList.add('hidden');
  $('mainSection').classList.add('hidden');
  $('homeSection').classList.add('visible');
  $('hamburgerBtn').classList.remove('hidden');
  $('exitBtn').classList.remove('hidden');
  $('appHeader').classList.add('visible');
  $('chapterTimer').classList.remove('visible');
  populateTestament();
  $('selTestament').value = 'OT';
  populateBooks('OT');
  $('selBook').value = getChapter()?.bookId || 'genesis';
  populateChapters($('selBook').value);
  $('selChapter').value = String(STATE.chapterIndex);
  updateStartBtn();
  $('dateDisplay').textContent = toEthiopian(new Date());
  updateDrawerUser();
}
function updateDrawerUser(){
  const email = STATE.email || '';
  const name = STATE.fullName || (email ? email.split('@')[0] : 'ተማሪ');
  $('drawerUserName').textContent = name;
  $('drawerUserEmail').textContent = email || '—';
  $('drawerUserAvatar').textContent = name.charAt(0).toUpperCase() || '👤';
}
function startStudy(){
  const chapterVal = $('selChapter').value;
  if (chapterVal === ''){ alert('⚠️ እባክዎ መጽሐፉንና ምዕራፉን ይምረጡ።'); return; }
  const chosenIdx = parseInt(chapterVal, 10);
  const chosenChapter = ALL_CHAPTERS[chosenIdx];
  if (!chosenChapter) return;
  $('bibleReadRef').textContent = chosenChapter.refAm || `${chosenChapter.bookNameAm} ${chosenChapter.chapter}`;
  STATE.selectedChapterIndex = chosenIdx;
  openPopup($('bibleReadPopup'));
}
function proceedToStudy(){
  STATE.chapterIndex = STATE.selectedChapterIndex;
  STATE.inStudy = true;
  closePopup($('bibleReadPopup'));
  $('homeSection').classList.remove('visible');
  $('mainSection').classList.remove('hidden');
  renderChapter();
  startTimer();
  setTimeout(() => $('mainSection').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}
function goHome(){
  saveProgress();
  STATE.inStudy = false;
  if (STATE.timerId) clearInterval(STATE.timerId);
  $('mainSection').classList.add('hidden');
  $('homeSection').classList.add('visible');
  $('chapterTimer').classList.remove('visible');
  showHome();
  closeDrawer();
}
function startTimer(){
  if (STATE.timerId) clearInterval(STATE.timerId);
  STATE.timerId = setInterval(() => {
    STATE.sessionElapsed = Math.floor((Date.now() - STATE.sessionStart) / 1000);
    const m = String(Math.floor(STATE.sessionElapsed/60)).padStart(2, '0');
    const s = String(STATE.sessionElapsed % 60).padStart(2, '0');
    const el = $('chapterTimer'); if (el) el.textContent = `⏱️ ${m}:${s}`;
  }, 1000);
}
function applyTheme(theme){
  STATE.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('cfmb_theme', theme); } catch (e) {}
}

function openDrawer(){
  $('drawer').classList.add('show');
  $('drawerOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeDrawer(){
  $('drawer').classList.remove('show');
  $('drawerOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

function attachEvents(){
  $('loginBtn').addEventListener('click', doLogin);
  $('emailInput').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });

  $('hamburgerBtn').addEventListener('click', openDrawer);
  $('exitBtn').addEventListener('click', () => {
    if (confirm('ከመተግበርያ መውጣት ይፈልጋሉ?')) {
       doLogout();
    }
  });
  $('drawerCloseBtn').addEventListener('click', closeDrawer);
  $('drawerOverlay').addEventListener('click', closeDrawer);

  $('drawerHomeBtn').addEventListener('click', goHome);
  $('drawerSaveBtn').addEventListener('click', () => { saveProgress(); showToast('💾 ተቀምጧል!'); closeDrawer(); });
  $('drawerNameBtn').addEventListener('click', () => { $('fullNameInput').value = STATE.fullName || ''; closeDrawer(); setTimeout(() => openPopup($('namePopup')), 200); });
  $('drawerShareBtn').addEventListener('click', () => { closeDrawer(); setTimeout(openSharePopup, 200); });
  $('drawerHelpBtn').addEventListener('click', () => { closeDrawer(); setTimeout(() => openPopup($('helpPopup')), 200); });
  $('drawerResetBtn').addEventListener('click', () => { closeDrawer(); setTimeout(() => openPopup($('resetPopup')), 200); });
  $('drawerLogoutBtn').addEventListener('click', () => { closeDrawer(); setTimeout(doLogout, 200); });

  $('prefSound').addEventListener('change', function(){ updatePref('sound', this.checked); });
  $('prefHaptic').addEventListener('change', function(){ updatePref('haptic', this.checked); });
  $('prefAnimations').addEventListener('change', function(){ updatePref('animations', this.checked); });
  $('prefMusic').addEventListener('change', function(){ updatePref('music', this.checked); });
  $('prefMascot').addEventListener('change', function(){ updatePref('mascot', this.checked); });
  $('prefDark').addEventListener('change', function(){ updatePref('dark', this.checked); });

  $('resetCancelBtn').addEventListener('click', () => closePopup($('resetPopup')));
  $('resetAllChaptersBtn').addEventListener('click', () => { if (confirm('⚠️ የሁሉንም ምዕራፎች ማስታወሻዎች ማጥፋት ይፈልጋሉ? ይህ ከጠፋ አይመለስም።')) { resetAllChapters(); closePopup($('resetPopup')); } });
  $('resetSelectedChapterBtn').addEventListener('click', () => { if (confirm('⚠️ የተመረጠውን ምዕራፍ ማስታወሻዎች ብቻ ማጥፋት ይፈልጋሉ?')) { resetSelectedChapter(); closePopup($('resetPopup')); } });

  $('helpCloseBtn').addEventListener('click', () => closePopup($('helpPopup')));

  $('nameCancelBtn').addEventListener('click', () => closePopup($('namePopup')));
  $('nameSaveBtn').addEventListener('click', () => { STATE.fullName = $('fullNameInput').value.trim(); saveProgress(); updateDrawerUser(); closePopup($('namePopup')); });

  $('bibleReadConfirmBtn').addEventListener('click', proceedToStudy);
  $('bibleReadCancelBtn').addEventListener('click', () => closePopup($('bibleReadPopup')));

  $('selTestament').addEventListener('change', function(){ populateBooks(this.value); $('selChapter').innerHTML = '<option value="">— ምዕራፉን ይምረጡ —</option>'; $('selChapter').disabled = true; updateStartBtn(); });
  $('selBook').addEventListener('change', function(){ if (this.value) populateChapters(this.value); updateStartBtn(); });
  $('selChapter').addEventListener('change', updateStartBtn);

  $('startStudyBtn').addEventListener('click', startStudy);
  $('homeBtn').addEventListener('click', goHome);

  $('shareCloseBtn').addEventListener('click', () => { closePopup($('sharePopup')); $('qrContainer').classList.add('hidden'); });
  $('shareSms').addEventListener('click', e => { const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); if (isMobile){ e.preventDefault(); window.location.href = 'sms:?&body=' + encodeURIComponent('የቃሉ ናፍቆት — ' + window.location.href); } });
  $('shareQr').addEventListener('click', () => { const box = $('qrContainer'); if (!box.classList.contains('hidden')){ box.classList.add('hidden'); return; } const url = window.location.href; $('qrCode').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" alt="QR Code" width="200" height="200">`; box.classList.remove('hidden'); });
  $('shareNative').addEventListener('click', async () => { if (navigator.share){ try { await navigator.share({ title: 'የቃሉ ናፍቆት የመጽሃፍ ቅዱስ ጥናት መተግበርያ', text: 'ይህን መተግበርያ ይጠቀሙ!', url: window.location.href }); } catch (e) {} } else { alert('ይህ አማራጭ በዚህ መሳሪያ አይሰራም።'); } });

  $('nextBtn').addEventListener('click', () => { if (isLastChapter()) showCertificate(); else goToChapter(STATE.chapterIndex+1); });
  $('popupCloseBtn').addEventListener('click', () => { closePopup($('chapterPopup')); goHome(); });

  $('certCloseBtn').addEventListener('click', () => closePopup($('certOverlay')));
  $('certPrintBtn').addEventListener('click', () => {
    const w = window.open('', '_blank');
    const html = `<html><head><title>Certificate</title><style>body{font-family:serif;text-align:center;padding:60px;}h1{color:#3e2723;font-size:2.5rem;}h2{color:#c5a059;font-size:3rem;border-bottom:3px solid #c5a059;display:inline-block;padding:0 20px 10px;}.stamp{width:120px;height:120px;border-radius:50%;border:4px solid #c5a059;display:flex;align-items:center;justify-content:center;margin:20px auto;font-weight:800;color:#c5a059;font-size:1.2rem;transform:rotate(-15deg);opacity:.85;}.footer{font-size:.8rem;color:#a8b8c8;margin-top:30px;}</style></head><body><h1>🏆 የምስክር ወረቀት</h1><p>Certificate of Completion</p><h2>${$('certName').textContent}</h2><p>የተሰጠው የመጽሐፍ ቅዱስ ጥናት ሙሉ በሙሉ ስላጠናቀቁ ነው።</p><h3 style="color:#2e7d32;">${$('certBook').textContent}</h3><p>${$('certDate').textContent}</p><div class="stamp">✨ ተጠናቅቋል ✨</div><div class="footer">የቃሉ ናፍቆት · የመጽሐፍ ቅዱስ ጥናት መተግበርያ</div></body></html>`;
    w.document.write(html); w.document.close(); w.print();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){
      if ($('drawer').classList.contains('show')) { closeDrawer(); return; }
      if ($('bibleReadPopup').classList.contains('show')) closePopup($('bibleReadPopup'));
      else if ($('chapterPopup').classList.contains('show')) closePopup($('chapterPopup'));
      else if ($('sharePopup').classList.contains('show')) closePopup($('sharePopup'));
      else if ($('helpPopup').classList.contains('show')) closePopup($('helpPopup'));
      else if ($('namePopup').classList.contains('show')) closePopup($('namePopup'));
      else if ($('certOverlay').classList.contains('show')) closePopup($('certOverlay'));
      else if ($('resetPopup').classList.contains('show')) closePopup($('resetPopup'));
    }
  });
  window.addEventListener('beforeunload', saveProgress);
}
function initEnhancements(){ initMascot(); initMusic(); setTimeout(() => showMascotBubble('እንኳን ደህና መጡ! 🕊️', 3500), 1500); }

async function init(){
  loadPrefs();

  await loadData();
  if (!ALL_CHAPTERS.length){ document.body.innerHTML = '<p style="padding:40px;text-align:center;font-family:sans-serif;">⚠️ የመረጃ ጫና አልተሳካም። እባክዎ ገጹን ዳግም ይጫኑ።</p>'; return; }
  if (STATE.chapterIndex >= ALL_CHAPTERS.length) STATE.chapterIndex = 0;
  attachEvents();
  let savedEmail = null;
  try { savedEmail = localStorage.getItem('cfmb_email_v8'); } catch (e) {}
  if (savedEmail){
    STATE.email = savedEmail; STATE.isLoggedIn = true;
    $('emailInput').value = savedEmail;
    loadProgress();
    if (STATE.chapterIndex >= ALL_CHAPTERS.length) STATE.chapterIndex = 0;
    showHome();
    updateDrawerUser();
  } else {
    $('loginSection').classList.remove('hidden');
    $('homeSection').classList.remove('visible');
    $('mainSection').classList.add('hidden');
    $('hamburgerBtn').classList.add('hidden');
    $('exitBtn').classList.add('hidden');
    $('appHeader').classList.remove('visible');
    $('chapterTimer').classList.remove('visible');
  }
  $('dateDisplay').textContent = toEthiopian(new Date());
  initEnhancements();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();