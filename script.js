// --- 1. 驚喜禮物資料庫 ---
const giftsData = [
  { 
    icon: '🐧', 
    title: '可愛企鵝兌換券', 
    desc: '頻此券獲得隻超可愛的企鵝Pingu！願它陪你度過每一個溫暖的冬夜。' 
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

// --- 2. 互動 3D 星塵與照片聖誕樹引擎（支援資料夾自動載入 ＋ 網頁即時上傳） ---

// 💡 1. 您只需要把照片放進資料夾，依序命名為 photo1.jpg, photo2.jpg, photo3.jpg ...（最多 20 張）
// 網頁會自動把有放入的照片全部掛上聖誕樹，不存在的編號會自動跳過！
const maxFolderPhotos = 20;

// 可選：幫特定編號的照片寫上專屬告白文字（沒寫的會自動套用預設浪漫文字）
const customCaptions = {
  1: '第一次一起過聖誕節的紀念 ✨',
  2: '跟妳在一起的每一天都很開心 ❤️',
  3: '最喜歡看妳笑起來的樣子 😊',
  4: '未來還要一起去更多地方看風景 🌟',
  5: 'Merry Christmas, 林妍儀 🎄'
};

const treeCanvas = document.getElementById('tree-canvas');
if (treeCanvas) {
  const ctx = treeCanvas.getContext('2d');

  // 互動狀態變數
  let treeAngle = 0;
  let targetSpread = 0;    // 0 = 聚合成聖誕樹, 1 = 散開成星海
  let currentSpread = 0;
  let isDragging = false;
  let lastX = 0;
  let velocityX = 0.012;
  let initialPinchDist = null;
  let hoverPhotoIndex = -1;

  // 動態存放所有成功載入的照片物件
  const loadedPhotos = [];

  // 共用函式：將一張圖片加入聖誕樹並重新均勻分布螺旋位置
  function addPhotoToTree(imgElement, captionText) {
    loadedPhotos.push({
      img: imgElement,
      caption: captionText,
      progress: 0.2,
      baseAngle: 0,
      scatterX: (Math.random() - 0.5) * 280,
      scatterY: (Math.random() - 0.5) * 280,
      scatterZ: (Math.random() - 0.5) * 180,
      screenX: 0,
      screenY: 0,
      screenSize: 0
    });

    // 每次新增照片後，自動重新計算所有照片在樹上的螺旋高度與角度，讓分布永遠均勻美觀
    const total = loadedPhotos.length;
    loadedPhotos.forEach((p, idx) => {
      p.progress = total === 1 ? 0.45 : 0.16 + (idx / (total - 1)) * 0.66;
      p.baseAngle = idx * 2.39996; // 使用黃金角 (137.5度) 螺旋分布，照片絕不互相重疊！
    });
  }

  // 自動掃描並載入資料夾內的 photo1.jpg ~ photo20.jpg
  for (let i = 1; i <= maxFolderPhotos; i++) {
    const img = new Image();
    img.src = `photo${i}.jpg`;
    img.onload = () => {
      const text = customCaptions[i] || `屬於我們的第 ${i} 個美好瞬間 ✨`;
      addPhotoToTree(img, text);
    };
    // 若資料夾裡沒有該編號的照片，onerror 會安靜略過，不會報錯或破圖
  }

  // 📸 讓使用者（林妍儀）也能自己從手機/電腦相簿上傳照片到聖誕樹上
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
            addPhotoToTree(userImg, '妳親手掛上的專屬聖誕回憶 💖');
          };
        };
        reader.readAsDataURL(file);
      });

      // 上傳完成後自動散開星海展示新照片，並響起聖誕鈴聲
      playBellSound();
      targetSpread = 1;
      photoUploadInput.value = ''; // 清空選擇器以便下次繼續新增
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
      scatterX: (Math.random() - 0.5) * 340,
      scatterY: (Math.random() - 0.5) * 360 - 150,
      scatterZ: (Math.random() - 0.5) * 240,
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
      const half = p.screenSize / 2 + 8;
      if (Math.abs(x - p.screenX) <= half && Math.abs(y - p.screenY) <= half) {
        hitIndex = i;
        break;
      }
    }
    hoverPhotoIndex = hitIndex;

    if (isClick && hitIndex !== -1 && currentSpread > 0.35) {
      openPhotoModal(loadedPhotos[hitIndex]);
    }
  }

  // 滑鼠操作
  treeCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    const pos = getCanvasPos(e.clientX, e.clientY);
    checkPhotoHit(pos.x, pos.y, true);
  });

  window.addEventListener('mousemove', (e) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    checkPhotoHit(pos.x, pos.y, false);

    if (!isDragging) return;
    const dx = e.clientX - lastX;
    velocityX = dx * 0.008;
    treeAngle += velocityX;
    lastX = e.clientX;
  });

  window.addEventListener('mouseup', () => {
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
  treeCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
      checkPhotoHit(pos.x, pos.y, true);

      const now = Date.now();
      if (now - lastTapTime < 300) {
        targetSpread = targetSpread > 0.5 ? 0 : 1;
        playBellSound();
      }
      lastTapTime = now;
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
      velocityX = dx * 0.01;
      treeAngle += velocityX;
      lastX = e.touches[0].clientX;

      const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
      checkPhotoHit(pos.x, pos.y, false);
    } else if (e.touches.length === 2 && initialPinchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const diff = (currentDist - initialPinchDist) / 120;
      targetSpread = Math.max(0, Math.min(1, targetSpread + diff));
      initialPinchDist = currentDist;
    }
  }, { passive: false });

  treeCanvas.addEventListener('touchend', () => {
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
    const renderList = loadedPhotos.map((photo, index) => {
      const treeY = -photo.progress * height;
      const radius = (1 - photo.progress) * (maxRadius * 0.85);
      const angle = photo.baseAngle + treeAngle;
      const treeX = Math.cos(angle) * radius;
      const treeZ = Math.sin(angle) * radius;

      const rotScatterX = photo.scatterX * Math.cos(treeAngle * 0.6) - photo.scatterZ * Math.sin(treeAngle * 0.6);
      const rotScatterZ = photo.scatterX * Math.sin(treeAngle * 0.6) + photo.scatterZ * Math.cos(treeAngle * 0.6);

      const x = cx + treeX * (1 - currentSpread) + rotScatterX * currentSpread;
      const y = cy + treeY * (1 - currentSpread) + photo.scatterY * currentSpread;
      const z = treeZ * (1 - currentSpread) + rotScatterZ * currentSpread;

      return { photo, index, x, y, z };
    }).sort((a, b) => a.z - b.z);

    renderList.forEach(({ photo, index, x, y, z }) => {
      const isHovered = (index === hoverPhotoIndex);
      const baseSize = 20 + currentSpread * 36;
      const size = isHovered ? baseSize * 1.35 : baseSize;
      const depthScale = 0.85 + (z / 200) * 0.25;
      const finalSize = size * depthScale;

      photo.screenX = x;
      photo.screenY = y;
      photo.screenSize = finalSize;

      ctx.save();
      ctx.translate(x, y);

      ctx.shadowColor = isHovered ? '#ffd700' : 'rgba(255, 255, 255, 0.8)';
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

// --- 6. 點擊封面卡片觸發動畫流程 ---
const welcomeOverlay = document.getElementById('welcome-overlay');
const openCardBtn = document.getElementById('open-card-btn');
const presentsGroup = document.getElementById('presents-group');
const penguin = document.getElementById('santa-sleigh');

if (openCardBtn) {
  openCardBtn.addEventListener('click', () => {
    playBellSound();
    
    if (welcomeOverlay) {
      welcomeOverlay.classList.add('fade-out');
    }

    bgMusic.play().then(() => {
      isPlayingMusic = true;
      if (musicBtn) musicBtn.textContent = '⏸️ 暫停背景音樂';
    }).catch(err => console.log("Autoplay blocked:", err));

    setTimeout(() => {
      if (penguin) {
        penguin.classList.add('walk-animation');
      }
    }, 300);

    setTimeout(() => {
      if (presentsGroup) {
        presentsGroup.classList.add('show-presents');
      }
      playBellSound();
    }, 4800);
  });
}

// --- 電腦無邊界滿版 ＋ 手機（含 LINE 瀏覽器）等比例撐滿寬度引擎 ---
function fitScreenScale() {
  // 同時取得多種視窗寬高來源，確保 LINE 內建瀏覽器也能抓到正確尺寸
  const winW = document.documentElement.clientWidth || window.innerWidth;
  const winH = document.documentElement.clientHeight || window.innerHeight;
  
  const baseHeight = 720;
  let baseWidth = 1280;

  if (winW > winH) {
    // 🖥️ 電腦 / 橫向螢幕：動態配合螢幕長寬比，100% 滿版無黑邊
    baseWidth = Math.max(1280, Math.round(baseHeight * (winW / winH)));
  } else {
    // 📱 手機直向螢幕：強制鎖定標準 1280x720 寬螢幕比例
    baseWidth = 1280;
  }

  // 強制鎖定畫布實際像素，不被手機壓縮
  document.body.style.width = `${baseWidth}px`;
  document.body.style.minWidth = `${baseWidth}px`;
  document.body.style.height = `${baseHeight}px`;
  document.body.style.minHeight = `${baseHeight}px`;

  const sCanvas = document.getElementById('snow-canvas');
  if (sCanvas) {
    sCanvas.width = baseWidth;
    sCanvas.height = baseHeight;
  }

  // 計算縮放倍率並套用（手機直立時會剛好撐滿 100% 手機螢幕左右寬度）
  const scale = Math.min(winW / baseWidth, winH / baseHeight);
  document.body.style.transform = `scale(${scale})`;
}

// 頁面載入、視窗變動，以及 LINE 瀏覽器動畫展開後（100ms、500ms）各執行一次確保精準
window.addEventListener('resize', fitScreenScale);
window.addEventListener('load', fitScreenScale);
fitScreenScale();
setTimeout(fitScreenScale, 100);
setTimeout(fitScreenScale, 500);