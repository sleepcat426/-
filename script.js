// --- 1. Canvas 雪花飄落 ---
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

let isSnowing = true;
const numFlakes = 120;
const flakes = [];

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

class Snowflake {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * -height;
    this.size = Math.random() * 3.5 + 1;
    this.speedY = Math.random() * 1.5 + 0.8;
    this.speedX = Math.random() * 0.8 - 0.4;
    this.opacity = Math.random() * 0.7 + 0.3;
  }
  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    if (this.y > height) { this.reset(); this.y = 0; }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fill();
  }
}

for (let i = 0; i < numFlakes; i++) flakes.push(new Snowflake());

function animateSnow() {
  ctx.clearRect(0, 0, width, height);
  if (isSnowing) {
    flakes.forEach(flake => { flake.update(); flake.draw(); });
  }
  requestAnimationFrame(animateSnow);
}
animateSnow();

const snowBtn = document.getElementById('snow-toggle-btn');
snowBtn.addEventListener('click', () => {
  isSnowing = !isSnowing;
  snowBtn.textContent = isSnowing ? '❄️ 關閉飄雪' : '❄️ 開啟飄雪';
});

// --- 2. 聖誕樹點擊粒子 ---
const treeContainer = document.getElementById('tree-container');
treeContainer.addEventListener('click', (e) => {
  if (e.target.closest('.present')) return;
  const rect = treeContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  for (let i = 0; i < 15; i++) createSparkle(clickX, clickY);
  playBellSound();
});

function createSparkle(x, y) {
  const sparkle = document.createElement('div');
  sparkle.innerText = '✦';
  sparkle.style.position = 'absolute';
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  sparkle.style.color = ['#ffd700', '#ff4500', '#00ffff', '#ffffff'][Math.floor(Math.random() * 4)];
  sparkle.style.fontSize = `${Math.random() * 15 + 10}px`;
  sparkle.style.pointerEvents = 'none';
  sparkle.style.zIndex = '20';
  sparkle.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';

  treeContainer.appendChild(sparkle);

  const destX = (Math.random() - 0.5) * 120;
  const destY = (Math.random() - 0.5) * 120;

  requestAnimationFrame(() => {
    sparkle.style.transform = `translate(${destX}px, ${destY}px) scale(0)`;
    sparkle.style.opacity = '0';
  });

  setTimeout(() => sparkle.remove(), 800);
}

// --- 3. 禮物盒開箱與彈窗系統 ---
const giftsData = [
  { icon: '🐧', title: '妳最愛的企鵝Pingu', desc: '獲得一隻超可愛的企鵝Pingu！願它陪你度過每一個溫暖的冬夜。' },
  { icon: '🎉', title: '聖誕幸運星', desc: '恭喜獲得「幸運光環」！新的一年所有好運與美夢都會實現。' },
  { icon: '☕', title: '熱可可與棉花糖', desc: '送你一杯濃郁熱可可加滿滿棉花糖！甜蜜溫暖一整冬。' }
];

const modal = document.getElementById('gift-modal');
const modalIcon = document.getElementById('modal-gift-icon');
const modalTitle = document.getElementById('modal-gift-title');
const modalDesc = document.getElementById('modal-gift-desc');
const closeModalBtn = document.getElementById('close-modal-btn');

document.querySelectorAll('.present').forEach((present) => {
  present.addEventListener('click', (e) => {
    e.stopPropagation();
    const giftIndex = present.getAttribute('data-gift');
    const gift = giftsData[giftIndex];

    present.classList.add('open');
    playBellSound();

    setTimeout(() => {
      modalIcon.textContent = gift.icon;
      modalTitle.textContent = gift.title;
      modalDesc.textContent = gift.desc;
      modal.classList.remove('hidden');
    }, 400);
  });
});

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  document.querySelectorAll('.present').forEach(p => p.classList.remove('open'));
});

// --- 4. 點擊清脆鈴鐺音效 ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playBellSound() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200 + Math.random() * 400, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

// --- 5. MP3 背景音樂播放器 ---
const bgMusic = new Audio('christmas-music.mp3');
bgMusic.loop = true; // 設定循環播放
let isPlayingMusic = false;

const musicBtn = document.getElementById('music-btn');
musicBtn.addEventListener('click', () => {
  if (isPlayingMusic) {
    bgMusic.pause();
    isPlayingMusic = false;
    musicBtn.textContent = '🎵 播放背景音樂';
  } else {
    bgMusic.play().then(() => {
      isPlayingMusic = true;
      musicBtn.textContent = '⏸️ 暫停背景音樂';
    }).catch(err => {
      console.log('播放失敗，請確認資料夾內是否有 christmas-music.mp3 檔案。', err);
    });
  }
});
// --- 點擊開啟卡片：觸發聖誕老人送禮物動畫 ---
const welcomeOverlay = document.getElementById('welcome-overlay');
const openCardBtn = document.getElementById('open-card-btn');
const santaSleigh = document.getElementById('santa-sleigh');
const presentsGroup = document.getElementById('presents-group');

openCardBtn.addEventListener('click', () => {
  // 1. 播放開卡鈴聲
  playBellSound();

  // 2. 封面淡出隱藏
  welcomeOverlay.classList.add('fade-out');

  // 3. 自動播放背景音樂
  if (typeof bgMusic !== 'undefined') {
    bgMusic.play().then(() => {
      isPlayingMusic = true;
      const musicBtn = document.getElementById('music-btn');
      if (musicBtn) musicBtn.textContent = '⏸️ 暫停背景音樂';
    }).catch(err => console.log(err));
  }

  // 4. 觸發聖誕老人飛越畫面動畫 (延遲 0.3 秒啟動)
  setTimeout(() => {
    santaSleigh.classList.add('fly-animation');
  }, 300);

  // 5. 聖誕老人飛到樹上方時（約 1.5 秒），禮物盒降落在樹下並伴隨鈴聲
  setTimeout(() => {
    presentsGroup.classList.add('show-presents');
    playBellSound();
  }, 1600);
});