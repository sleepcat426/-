// --- 1. 驚喜禮物資料庫 ---
const giftsData = [
  { 
    icon: '🎫', 
    title: '大餐兌換券', 
    desc: '憑此券可免費兌換「帶妳去吃妳最想吃的大餐」一次！無效期限制 🍽️' 
  },
  { 
    icon: '💌', 
    title: '專屬告白', 
    desc: '遇見妳是今年最幸運的事，願以後的每個聖誕節都有我陪在妳身邊 ❤️' 
  },
  { 
    icon: '🎬', 
    title: '電影約會券', 
    desc: '憑此券可指派我陪妳看任意你想看的電影，並附贈爆米花與飲料 🍿' 
  }
];

// --- 2. 繪製金藍光纖粒子螺旋聖誕樹 (Canvas) ---
const treeCanvas = document.getElementById('tree-canvas');
if (treeCanvas) {
  const ctx = treeCanvas.getContext('2d');
  let treeAngle = 0;

  function drawTree() {
    ctx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);
    
    const cx = treeCanvas.width / 2;
    const cy = treeCanvas.height - 70;
    const height = 300;
    const maxRadius = 110;
    const layers = 600;

    const shadowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
    shadowGrad.addColorStop(0, 'rgba(0, 180, 255, 0.4)');
    shadowGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 120, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < layers; i++) {
      const progress = i / layers;
      const y = cy - progress * height;
      const radius = (1 - progress) * maxRadius;
      
      const angle = progress * Math.PI * 24 + treeAngle;
      const x = cx + Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const size = (1.5 + (z / maxRadius) * 0.8) * (1.2 - progress * 0.4);
      const alpha = 0.5 + (z / maxRadius) * 0.4;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);

      if (i % 7 === 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
      } else if (i % 3 === 0) {
        ctx.fillStyle = `rgba(135, 206, 250, ${alpha})`;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
      }

      ctx.fill();
    }

    const starY = cy - height;
    const starGrad = ctx.createRadialGradient(cx, starY, 2, cx, starY, 35);
    starGrad.addColorStop(0, '#ffffff');
    starGrad.addColorStop(0.2, '#ffe57f');
    starGrad.addColorStop(0.6, 'rgba(255, 215, 0, 0.6)');
    starGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = starGrad;
    ctx.beginPath();
    ctx.arc(cx, starY, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 235, 150, 0.8)';
    ctx.lineWidth = 2;
    for (let a = 0; a < 4; a++) {
      const rot = (a * Math.PI / 4) + (treeAngle * 0.5);
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(rot) * 45, starY - Math.sin(rot) * 45);
      ctx.lineTo(cx + Math.cos(rot) * 45, starY + Math.sin(rot) * 45);
      ctx.stroke();
    }

    treeAngle += 0.015;
    requestAnimationFrame(drawTree);
  }
  drawTree();
}

// --- 3. 背景雪花系統 (Canvas) ---
const snowCanvas = document.getElementById('snow-canvas');
if (snowCanvas) {
  const sCtx = snowCanvas.getContext('2d');
  let flakes = [];
  let isSnowing = true;

  function resizeSnow() {
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeSnow);
  resizeSnow();

  for (let i = 0; i < 80; i++) {
    flakes.push({
      x: Math.random() * snowCanvas.width,
      y: Math.random() * snowCanvas.height,
      r: Math.random() * 3 + 1,
      d: Math.random() + 0.5,
      gold: Math.random() > 0.7
    });
  }

  function drawSnow() {
    sCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    if (!isSnowing) return;

    flakes.forEach(f => {
      sCtx.beginPath();
      sCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      if (f.gold) {
        sCtx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        sCtx.shadowColor = '#ffd700';
        sCtx.shadowBlur = 5;
      } else {
        sCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        sCtx.shadowColor = '#ffffff';
        sCtx.shadowBlur = 3;
      }
      sCtx.fill();

      f.y += f.d;
      f.x += Math.sin(f.y * 0.02) * 0.5;

      if (f.y > snowCanvas.height) {
        f.y = -10;
        f.x = Math.random() * snowCanvas.width;
      }
    });

    requestAnimationFrame(drawSnow);
  }
  drawSnow();

  const snowBtn = document.getElementById('snow-toggle-btn');
  if (snowBtn) {
    snowBtn.addEventListener('click', () => {
      isSnowing = !isSnowing;
      if (isSnowing) drawSnow();
    });
  }
}

// --- 4. 音效與音樂控制 ---
function playBellSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

const bgMusic = new Audio('christmas-music.mp3');
bgMusic.loop = true;
let isPlayingMusic = false;

const musicBtn = document.getElementById('music-btn');
if (musicBtn) {
  musicBtn.addEventListener('click', () => {
    if (isPlayingMusic) {
      bgMusic.pause();
      musicBtn.textContent = '🎵 播放背景音樂';
    } else {
      bgMusic.play().then(() => {
        musicBtn.textContent = '⏸️ 暫停背景音樂';
      }).catch(err => console.log("Music play blocked", err));
    }
    isPlayingMusic = !isPlayingMusic;
  });
}

// --- 5. 禮物彈窗邏輯 ---
const giftModal = document.getElementById('gift-modal');
const modalIcon = document.getElementById('modal-gift-icon');
const modalTitle = document.getElementById('modal-gift-title');
const modalDesc = document.getElementById('modal-gift-desc');
const closeModalBtn = document.getElementById('close-modal-btn');

document.querySelectorAll('.present').forEach(p => {
  p.addEventListener('click', () => {
    playBellSound();
    const index = p.getAttribute('data-gift');
    const data = giftsData[index];
    if (data) {
      if (modalIcon) modalIcon.textContent = data.icon;
      if (modalTitle) modalTitle.textContent = data.title;
      if (modalDesc) modalDesc.textContent = data.desc;
      if (giftModal) giftModal.classList.remove('hidden');
    }
  });
});

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    if (giftModal) giftModal.classList.add('hidden');
  });
}

// --- 6. 點擊封面 ➔ 企鵝踱步登場送禮 ➔ 禮物落地流程 ---
const welcomeOverlay = document.getElementById('welcome-overlay');
const openCardBtn = document.getElementById('open-card-btn');
const presentsGroup = document.getElementById('presents-group');
const penguin = document.getElementById('santa-sleigh');

if (openCardBtn) {
  openCardBtn.addEventListener('click', () => {
    playBellSound();
    
    // 淡出封面
    if (welcomeOverlay) {
      welcomeOverlay.classList.add('fade-out');
    }

    // 嘗試播放音樂（若失敗不卡死流程）
    bgMusic.play().then(() => {
      isPlayingMusic = true;
      if (musicBtn) musicBtn.textContent = '⏸️ 暫停背景音樂';
    }).catch(err => console.log("Autoplay prevented:", err));

    // 1. 企鵝登場
    setTimeout(() => {
      if (penguin) {
        penguin.classList.add('walk-animation');
      }
    }, 300);

    // 2. 企鵝於 4.8 秒抵達樹下並高興跳躍時，彈出禮物
    setTimeout(() => {
      if (presentsGroup) {
        presentsGroup.classList.add('show-presents');
      }
      playBellSound();
    }, 4800);
  });
}