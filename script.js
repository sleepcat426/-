// --- 1. 驚喜禮物資料庫 ---
const giftsData = [
  { 
    icon: '🐧', 
    title: '可愛企鵝兌換券', 
    desc: '憑此券獲得一隻超可愛的企鵝 Pingu！願它陪你度過每一個溫暖的冬夜。' 
  },
  { 
    icon: '💌', 
    title: '專屬告白', 
    desc: '遇見妳是今年最幸運的事，願以後的每個聖誕節都有我陪在妳身邊 ❤️' 
  },
  { 
    icon: '🍫', 
    title: '雪吻巧克力兌換券', 
    desc: '憑此券可獲得一份任何口味雪吻巧克力，甜蜜你的冬天！' 
  }
];

// --- 2. 互動 3D 星塵與照片聖誕樹引擎 ---
const maxFolderPhotos = 20;
const treeCanvas = document.getElementById('tree-canvas');

if (treeCanvas) {
  const ctx = treeCanvas.getContext('2d');

  // 互動狀態變數
  let treeAngle = 0;
  let targetSpread = 0;    // 0 = 聚合成聖誕樹, 1 = 散開成星海
  let currentSpread = 0;
  let isDragging = false;
  let dragMoved = false;
  let lastX = 0;
  let velocityX = 0.012;
  let initialPinchDist = null;
  let hoverPhotoIndex = -1;

  const loadedPhotos = [];
  let hasRealPhotos = false;

  // 產生預設精美聖誕卡圖片（資料夾尚未放入照片前墊檔用）
  function createFallbackCard(emoji, bgColor1, bgColor2) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 200;
    offCanvas.height = 200;
    const oCtx = offCanvas.getContext('2d');
    const grad = oCtx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, bgColor1);
    grad.addColorStop(1, bgColor2);
    oCtx.fillStyle = grad;
    oCtx.fillRect(0, 0, 200, 200);
    oCtx.font = '85px sans-serif';
    oCtx.textAlign = 'center';
    oCtx.textBaseline = 'middle';
    oCtx.fillText(emoji, 100, 105);
    const img = new Image();
    img.src = offCanvas.toDataURL();
    return img;
  }

  // 重新計算所有照片在「聖誕樹狀態」與「散開星海狀態」的完美不重疊座標
  function recalculatePhotoLayout() {
    const total = loadedPhotos.length;
    if (total === 0) return;

    // 計算散開時的網格行列數，確保每張照片有獨立空間、不重疊、不超出畫布
    const cols = Math.ceil(Math.sqrt(total * 1.1));
    const rows = Math.ceil(total / cols);

    // 散開時的安全可視範圍（以樹中心 cx 為基準，往上展開，絕不掉出底部）
    const areaWidth = 240;   // 左右寬度範圍 (-120 ~ +120)
    const areaHeight = 250;  // 上下高度範圍
    const centerOffsetY = -165; // 往上提，讓所有照片都在畫布正中央

    loadedPhotos.forEach((p, idx) => {
      // A. 聖誕樹狀態：黃金角螺旋分布
      p.progress = total === 1 ? 0.45 : 0.16 + (idx / (total - 1)) * 0.66;
      p.baseAngle = idx * 2.39996;

      // B. 散開星海狀態：均勻網格 + 微微自然錯落感（保證不重疊、不出界）
      const r = Math.floor(idx / cols);
      const c = idx % cols;

      // 最後一列如果沒滿，自動置中對齊
      const itemsInThisRow = (r === rows - 1) ? (total - r * cols) : cols;
      const colStep = itemsInThisRow > 1 ? areaWidth / (itemsInThisRow - 1) : 0;
      const rowStep = rows > 1 ? areaHeight / (rows - 1) : 0;

      const baseX = itemsInThisRow > 1 ? -areaWidth / 2 + c * colStep : 0;
      const baseY = rows > 1 ? centerOffsetY - areaHeight / 2 + r * rowStep : centerOffsetY;

      // 加入極小幅度的錯落（不超過 10px），保留星海漂浮感又不重疊
      const jitterX = ((idx * 17) % 15) - 7;
      const jitterY = ((idx * 23) % 15) - 7;

      p.scatterX = baseX + jitterX;
      p.scatterY = baseY + jitterY;
      p.scatterZ = ((idx % 3) - 1) * 25; // 輕微前後景深
    });
  }

  // 將照片加入聖誕樹
  function addPhotoToTree(imgElement, captionText = '', isReal = true) {
    if (isReal && !hasRealPhotos) {
      loadedPhotos.length = 0;
      hasRealPhotos = true;
    }

    loadedPhotos.push({
      img: imgElement,
      caption: captionText,
      progress: 0.2,
      baseAngle: 0,
      scatterX: 0,
      scatterY: -150,
      scatterZ: 0,
      screenX: 0,
      screenY: 0,
      screenSize: 0
    });

    recalculatePhotoLayout();
  }

  // 1. 先放上 5 張預設聖誕記憶卡（沒抓到真實照片前先墊檔）
  const defaultCards = [
    { emoji: '🎄', c1: '#1e3a8a', c2: '#3b82f6' },
    { emoji: '❤️', c1: '#881337', c2: '#f43f5e' },
    { emoji: '⛄', c1: '#0f766e', c2: '#2dd4bf' },
    { emoji: '✨', c1: '#78350f', c2: '#f59e0b' },
    { emoji: '🎁', c1: '#4c1d95', c2: '#8b5cf6' }
  ];
  defaultCards.forEach(item => {
    const fallbackImg = createFallbackCard(item.emoji, item.c1, item.c2);
    fallbackImg.onload = () => {
      if (!hasRealPhotos) addPhotoToTree(fallbackImg, '', false);
    };
  });

  // 2. 自動掃描「她的照片」資料夾內的 photo1 ~ photo20
  const photoFolder = '她的照片';
  const extensions = ['jpg', 'JPG', 'png', 'PNG', 'jpeg'];

  for (let i = 1; i <= maxFolderPhotos; i++) {
    let loadedForIndex = false;
    extensions.forEach(ext => {
      const img = new Image();
      img.src = `${photoFolder}/photo${i}.${ext}`;
      img.onload = () => {
        if (loadedForIndex) return;
        loadedForIndex = true;
        addPhotoToTree(img, '', true);
      };
    });
  }

  // 📸 網頁右上角「新增照片」按鈕
  const addPhotoBtn = document.getElementById('add-photo-btn');
  const photoUploadInput = document.getElementById('photo-upload-input');

  if (addPhotoBtn && photoUploadInput) {
    addPhotoBtn.addEventListener('click', () => {
      photoUploadInput.click();
    });

    photoUploadInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const userImg = new Image();
          userImg.src = event.target.result;
          userImg.onload = () => {
            addPhotoToTree(userImg, '', true);
          };
        };
        reader.readAsDataURL(file);
      });

      playBellSound();
      photoUploadInput.value = '';
    });
  }

  // 建立 550 顆 3D 粒子
  const particles = [];
  const totalParticles = 550;
  for (let i = 0; i < totalParticles; i++) {
    const progress = i / totalParticles;
    particles.push({
      progress,
      baseAngle: progress * Math.PI * 24,
      scatterX: (Math.random() - 0.5) * 320,
      scatterY: (Math.random() - 0.5) * 320 - 160, // 粒子散開也往上居中
      scatterZ: (Math.random() - 0.5) * 220,
      colorType: i % 7 === 0 ? 'white' : (i % 3 === 0 ? 'blue' : 'gold')
    });
  }

  // --- 手勢與滑鼠事件監聽 ---
  function getCanvasPos(clientX, clientY) {
    const rect = treeCanvas.getBoundingClientRect();
    const scaleX = treeCanvas.width / rect.width;
    const scaleY = treeCanvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function checkPhotoHit(x, y, isClick = false) {
    let hitIndex = -1;
    for (let i = loadedPhotos.length - 1; i >= 0; i--) {
      const p = loadedPhotos[i];
      const half = p.screenSize / 2 + 10;
      if (Math.abs(x - p.screenX) <= half && Math.abs(y - p.screenY) <= half) {
        hitIndex = i;
        break;
      }
    }
    hoverPhotoIndex = hitIndex;
    treeCanvas.style.cursor = hitIndex !== -1 ? 'pointer' : 'grab';

    if (isClick && hitIndex !== -1) {
      openPhotoModal(loadedPhotos[hitIndex]);
    }
  }

  // 滑鼠操作
  treeCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragMoved = false;
    lastX = e.clientX;
  });

  window.addEventListener('mousemove', (e) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    checkPhotoHit(pos.x, pos.y, false);

    if (!isDragging) return;
    const dx = e.clientX - lastX;
    if (Math.abs(dx) > 3) dragMoved = true;
    velocityX = dx * 0.008;
    treeAngle += velocityX;
    lastX = e.clientX;
  });

  window.addEventListener('mouseup', (e) => {
    if (isDragging && !dragMoved) {
      const pos = getCanvasPos(e.clientX, e.clientY);
      checkPhotoHit(pos.x, pos.y, true);
    }
    isDragging = false;
  });

  treeCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      targetSpread = Math.min(1, targetSpread + 0.25);
    } else {
      targetSpread = Math.max(0, targetSpread - 0.25);
    }
  }, { passive: false });

  treeCanvas.addEventListener('dblclick', () => {
    targetSpread = targetSpread > 0.5 ? 0 : 1;
    playBellSound();
  });

  // 手機觸控手勢
  let lastTapTime = 0;
  let touchStartPos = { x: 0, y: 0 };

  treeCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      dragMoved = false;
      lastX = e.touches[0].clientX;
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
    }
  }, { passive: false });

  treeCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - lastX;
      if (Math.abs(e.touches[0].clientX - touchStartPos.x) > 5) {
        dragMoved = true;
      }
      velocityX = dx * 0.01;
      treeAngle += velocityX;
      lastX = e.touches[0].clientX;
    } else if (e.touches.length === 2 && initialPinchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const diff = (currentDist - initialPinchDist) / 120;
      targetSpread = Math.max(0, Math.min(1, targetSpread + diff));
      initialPinchDist = currentDist;
    }
  }, { passive: false });

  treeCanvas.addEventListener('touchend', (e) => {
    if (isDragging && !dragMoved && e.changedTouches.length === 1) {
      const pos = getCanvasPos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      checkPhotoHit(pos.x, pos.y, true);

      const now = Date.now();
      if (now - lastTapTime < 300 && hoverPhotoIndex === -1) {
        targetSpread = targetSpread > 0.5 ? 0 : 1;
        playBellSound();
      }
      lastTapTime = now;
    }
    isDragging = false;
    initialPinchDist = null;
  });

  // --- 主繪圖動畫迴圈 ---
  function drawTree() {
    ctx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

    currentSpread += (targetSpread - currentSpread) * 0.08;
    if (!isDragging) {
      treeAngle += velocityX;
      velocityX += (0.012 - velocityX) * 0.05;
    }

    const cx = treeCanvas.width / 2;
    const cy = treeCanvas.height - 70;
    const height = 300;
    const maxRadius = 110;

    // 樹底光暈
    const baseGlowAlpha = 1 - currentSpread * 0.7;
    const shadowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
    shadowGrad.addColorStop(0, `rgba(0, 180, 255, ${0.4 * baseGlowAlpha})`);
    shadowGrad.addColorStop(0.5, `rgba(255, 215, 0, ${0.2 * baseGlowAlpha})`);
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 120, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. 繪製粒子
    particles.forEach(p => {
      const treeY = -p.progress * height;
      const radius = (1 - p.progress) * maxRadius;
      const angle = p.baseAngle + treeAngle;
      const treeX = Math.cos(angle) * radius;
      const treeZ = Math.sin(angle) * radius;

      const rotScatterX = p.scatterX * Math.cos(treeAngle * 0.6) - p.scatterZ * Math.sin(treeAngle * 0.6);
      const rotScatterZ = p.scatterX * Math.sin(treeAngle * 0.6) + p.scatterZ * Math.cos(treeAngle * 0.6);

      const x = cx + treeX * (1 - currentSpread) + rotScatterX * currentSpread;
      const y = cy + treeY * (1 - currentSpread) + p.scatterY * currentSpread;
      const z = treeZ * (1 - currentSpread) + rotScatterZ * currentSpread;

      const size = Math.max(0.8, (1.6 + (z / maxRadius) * 0.8) * (1.2 - p.progress * 0.3));
      const alpha = Math.max(0.2, Math.min(1, 0.55 + (z / maxRadius) * 0.4));

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);

      if (p.colorType === 'white') {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
      } else if (p.colorType === 'blue') {
        ctx.fillStyle = `rgba(135, 206, 250, ${alpha})`;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
      }
      ctx.fill();
    });

    // 2. 繪製照片掛飾（依 Z 軸深度排序）
    // 散開時只做輕微左右搖擺（不讓照片繞大圈互撞重疊）
    const swayX = Math.sin(treeAngle * 1.5) * 8;
    const swayY = Math.cos(treeAngle * 1.2) * 5;

    const renderList = loadedPhotos.map((photo, index) => {
      const treeY = -photo.progress * height;
      const radius = (1 - photo.progress) * (maxRadius * 0.92);
      const angle = photo.baseAngle + treeAngle;
      const treeX = Math.cos(angle) * radius;
      const treeZ = Math.sin(angle) * radius;

      const targetScatterX = photo.scatterX + swayX;
      const targetScatterY = photo.scatterY + swayY;

      const x = cx + treeX * (1 - currentSpread) + targetScatterX * currentSpread;
      const y = cy + treeY * (1 - currentSpread) + targetScatterY * currentSpread;
      const z = treeZ * (1 - currentSpread) + photo.scatterZ * currentSpread;

      return { photo, index, x, y, z };
    }).sort((a, b) => a.z - b.z);

    // 根據照片數量自動微調散開後的大小，照片多時也不會擠在一起
    const maxSpreadSize = loadedPhotos.length > 9 ? 46 : 56;

    renderList.forEach(({ photo, index, x, y, z }) => {
      const isHovered = (index === hoverPhotoIndex);
      const baseSize = 28 + currentSpread * (maxSpreadSize - 28);
      const size = isHovered ? baseSize * 1.25 : baseSize;
      const depthScale = 0.88 + (z / 220) * 0.2;
      const finalSize = size * depthScale;

      photo.screenX = x;
      photo.screenY = y;
      photo.screenSize = finalSize;

      ctx.save();
      ctx.translate(x, y);

      ctx.shadowColor = isHovered ? '#ffd700' : 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = isHovered ? 18 : 8;
      ctx.fillStyle = '#ffffff';
      const pad = 3;
      const bottomPad = 7;
      ctx.fillRect(-finalSize / 2 - pad, -finalSize / 2 - pad, finalSize + pad * 2, finalSize + pad + bottomPad);

      ctx.shadowBlur = 0;
      ctx.drawImage(photo.img, -finalSize / 2, -finalSize / 2, finalSize, finalSize);
      ctx.restore();
    });

    // 3. 樹頂閃耀星星
    const starY = cy - height * (1 - currentSpread * 0.35);
    const starScale = 1 - currentSpread * 0.4;
    const starGrad = ctx.createRadialGradient(cx, starY, 2, cx, starY, 35 * starScale);
    starGrad.addColorStop(0, '#ffffff');
    starGrad.addColorStop(0.2, '#ffe57f');
    starGrad.addColorStop(0.6, 'rgba(255, 215, 0, 0.6)');
    starGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = starGrad;
    ctx.beginPath();
    ctx.arc(cx, starY, 35 * starScale, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(drawTree);
  }
  drawTree();
}

// --- 3. 背景雪花系統 ---
const snowCanvas = document.getElementById('snow-canvas');
if (snowCanvas) {
  const sCtx = snowCanvas.getContext('2d');
  let flakes = [];
  let isSnowing = true;

  function resizeSnow() {
    snowCanvas.width = 1280;
    snowCanvas.height = 720;
  }
  window.addEventListener('resize', resizeSnow);
  resizeSnow();

  for (let i = 0; i < 110; i++) {
    flakes.push({
      x: Math.random() * snowCanvas.width,
      y: Math.random() * snowCanvas.height,
      r: Math.random() * 3.5 + 1,
      d: Math.random() * 1.2 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      gold: Math.random() > 0.8
    });
  }

  function drawSnow() {
    sCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    if (!isSnowing) return;

    flakes.forEach(f => {
      sCtx.beginPath();
      sCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      if (f.gold) {
        sCtx.fillStyle = `rgba(254, 240, 138, ${f.opacity})`;
        sCtx.shadowColor = '#fef08a';
        sCtx.shadowBlur = 8;
      } else {
        sCtx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        sCtx.shadowColor = '#ffffff';
        sCtx.shadowBlur = 5;
      }
      sCtx.fill();

      f.y += f.d;
      f.x += Math.sin(f.y * 0.015) * 0.6;

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
    console.log("Audio play prevented");
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

// --- 5. 禮物彈窗與拍立得照片彈窗邏輯 ---
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

// 📸 拍立得放大彈窗開啟與關閉
const photoModal = document.getElementById('photo-modal');
const modalPhotoImg = document.getElementById('modal-photo-img');
const modalPhotoCaption = document.getElementById('modal-photo-caption');
const closePhotoBtn = document.getElementById('close-photo-btn');

function openPhotoModal(photoData) {
  playBellSound();
  if (modalPhotoImg) modalPhotoImg.src = photoData.img.src;
  if (modalPhotoCaption) {
    if (photoData.caption && photoData.caption.trim() !== '') {
      modalPhotoCaption.textContent = photoData.caption;
      modalPhotoCaption.style.display = 'block';
    } else {
      modalPhotoCaption.textContent = '';
      modalPhotoCaption.style.display = 'none';
    }
  }
  if (photoModal) {
    photoModal.classList.remove('hidden');
  }
}

function closePhotoModal() {
  if (photoModal) {
    photoModal.classList.add('hidden');
  }
}

if (closePhotoBtn) {
  closePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePhotoModal();
  });
}

if (photoModal) {
  photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) {
      closePhotoModal();
    }
  });
}

// --- 6. 點擊封面卡片觸發動畫流程 ---
const welcomeOverlay = document.getElementById('welcome-overlay');
const openCardBtn = document.getElementById('open-card-btn');
const presentsGroup = document.getElementById('presents-group');
const penguin = document.getElementById('santa-sleigh');

if (openCardBtn) {
  openCardBtn.addEventListener('click', () => {
    playBellSound();
    if (welcomeOverlay) welcomeOverlay.classList.add('fade-out');

    bgMusic.play().then(() => {
      isPlayingMusic = true;
      if (musicBtn) musicBtn.textContent = '⏸️ 暫停背景音樂';
    }).catch(err => console.log("Autoplay blocked:", err));

    setTimeout(() => {
      if (penguin) penguin.classList.add('walk-animation');
    }, 300);

    setTimeout(() => {
      if (presentsGroup) presentsGroup.classList.add('show-presents');
      playBellSound();
    }, 4800);
  });
}

// --- 7. 螢幕等比例縮放引擎 ---
function fitScreenScale() {
  const winW = document.documentElement.clientWidth || window.innerWidth;
  const winH = document.documentElement.clientHeight || window.innerHeight;
  const baseHeight = 720;
  let baseWidth = winW > winH ? Math.max(1280, Math.round(baseHeight * (winW / winH))) : 1280;

  document.body.style.width = `${baseWidth}px`;
  document.body.style.minWidth = `${baseWidth}px`;
  document.body.style.height = `${baseHeight}px`;
  document.body.style.minHeight = `${baseHeight}px`;

  const sCanvas = document.getElementById('snow-canvas');
  if (sCanvas) {
    sCanvas.width = baseWidth;
    sCanvas.height = baseHeight;
  }

  const scale = Math.min(winW / baseWidth, winH / baseHeight);
  document.body.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', fitScreenScale);
window.addEventListener('load', fitScreenScale);
fitScreenScale();
setTimeout(fitScreenScale, 100);
setTimeout(fitScreenScale, 500);