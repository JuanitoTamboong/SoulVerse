// ============================================================
// EMOTION GALAXY — Main Application
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================
// CONFIG
// ============================================================
const COLORS = {
  Happy:     '#FFD700',
  Sad:       '#6A5ACD',
  Angry:     '#FF4500',
  Anxious:   '#00CED1',
  Excited:   '#FF69B4',
  Grateful:  '#32CD32',
  Hopeful:   '#FFA500',
  Lonely:    '#C0C0C0',
  Love:      '#FF1493',
  Peaceful:  '#87CEEB',
  General:   '#A78BFA',
};
const EMOTION_ICONS = {
  General:  '✨', Happy:  '😊', Sad:  '😢', Angry:  '😠',
  Anxious:  '😰', Excited:'🤩', Grateful:'🙏', Hopeful: '🌟',
  Lonely:   '💔', Love:   '💖', Peaceful:'☮️',
};
const PLACEHOLDERS = [
  "How are you feeling today?",
  "What's on your mind?",
  "What would you like to express?",
  "Share something beautiful...",
  "What's in your heart?",
];
const GALAXY_ARMS = 4;
const GALAXY_RADIUS = 180;
const GALAXY_THICKNESS = 20;

// ============================================================
// STATE
// ============================================================
const state = {
  messages: [],
  starMeshes: [],
  starDataMap: new Map(),
  selectedStarId: null,
  currentFilter: null,
  searchQuery: '',
  soundOn: true,
  isExploring: false,
  exploreTimer: null,
  animTime: 0,
  cameraTarget: null,
  cameraTargetPos: null,
  transitioning: false,
};

// DOM refs
const $ = (s) => document.querySelector(s);
const landingScreen = $('#landing-screen');
const galaxyView = $('#galaxy-view');
const hud = $('#hud');
const form = $('#emotion-form');
const input = $('#emotion-input');
const nameInput = $('#name-input');
const emotionCat = $('#emotion-category');
const starCounter = $('#star-counter');
const searchInput = $('#search-input');
const filterPills = $('#filter-pills');
const modal = $('#star-modal');
const modalBackdrop = $('#modal-backdrop');
const modalIcon = $('#modal-icon');
const modalLabel = $('#modal-label');
const modalMessage = $('#modal-message');
const modalName = $('#modal-name');
const modalTime = $('#modal-time');
const modalLikeBtn = $('#modal-like-btn');
const modalLikeCount = $('#modal-like-count');
const modalCloseBtn = $('#modal-close-btn');
const toastEl = $('#toast');
const btnBack = $('#btn-back');
const btnSound = $('#btn-sound');
const btnExplore = $('#btn-explore');

// ============================================================
// TOAST
// ============================================================
let toastTimeout;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('visible'), 3000);
}

// ============================================================
// LOCAL STORAGE
// ============================================================
function loadMessages() {
  try {
    const data = localStorage.getItem('emotionGalaxy_messages');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveMessages() {
  try {
    localStorage.setItem('emotionGalaxy_messages', JSON.stringify(state.messages));
  } catch {}
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getSpiralPosition(index, total) {
  const t = total > 1 ? index / total : 0.5;
  const angle = t * Math.PI * 2 * GALAXY_ARMS + (Math.random() - 0.5) * 0.3;
  const radius = t * GALAXY_RADIUS + (Math.random() - 0.5) * 8;
  return {
    x: Math.cos(angle) * radius + (Math.random() - 0.5) * 4,
    y: (Math.random() - 0.5) * GALAXY_THICKNESS * 0.6,
    z: Math.sin(angle) * radius + (Math.random() - 0.5) * 4,
  };
}

// ============================================================
// THREE.JS SETUP
// ============================================================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 60, 140);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
galaxyView.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 15;
controls.maxDistance = 350;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
controls.target.set(0, 0, 0);

// ============================================================
// POST-PROCESSING (Bloom)
// ============================================================
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6,  // strength
  0.4,  // radius
  0.2   // threshold
);
composer.addPass(bloomPass);

// ============================================================
// BACKGROUND SPACE
// ============================================================
scene.fog = new THREE.FogExp2(0x000011, 0.0008);

// Distant star particles
function createStarField() {
  const count = 8000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = 200 + Math.random() * 600;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.cos(phi) * 0.3;
    positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);

    const c = new THREE.Color().setHSL(0.65 + Math.random() * 0.2, 0.3, 0.5 + Math.random() * 0.4);
    colors[i*3]   = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    sizes[i] = 0.5 + Math.random() * 1.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  return stars;
}
createStarField();

// ============================================================
// GALAXY CORE GLOW
// ============================================================
function createGalaxyCore() {
  const count = 1500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.cos(phi) * 0.2;
    positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const c = new THREE.Color().setHSL(0.7 + Math.random()*0.15, 0.8, 0.6 + Math.random()*0.3);
    colors[i*3]   = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const core = new THREE.Points(geo, mat);
  scene.add(core);

  // Point light at core
  const light = new THREE.PointLight(0x7c3aed, 1.5, 100);
  light.position.set(0, 0, 0);
  scene.add(light);
  return core;
}
createGalaxyCore();

// ============================================================
// STAR SPRITE CREATION
// ============================================================
function createStarTexture(colorHex, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(colorHex);
  const cx = size/2, cy = size/2;
  const maxR = size/2;

  // Outer glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},1)`);
  grad.addColorStop(0.2, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.8)`);
  grad.addColorStop(0.5, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.3)`);
  grad.addColorStop(1, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Center bright core
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.3);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.4, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.9)`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, size, size);

  // Cross glow
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -maxR*0.8, 0, maxR*0.8);
    g.addColorStop(0, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.3)`);
    g.addColorStop(0.5, `rgba(255,255,255,0.1)`);
    g.addColorStop(1, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-1.5, -maxR*0.8, 3, maxR*1.6);
    ctx.restore();
  }

  return new THREE.CanvasTexture(canvas);
}

// Texture cache
const textureCache = new Map();

function getStarTexture(emotion) {
  const colorHex = COLORS[emotion] || COLORS.General;
  if (!textureCache.has(colorHex)) {
    textureCache.set(colorHex, createStarTexture(colorHex));
  }
  return textureCache.get(colorHex);
}

// ============================================================
// BUILD / REBUILD STARS
// ============================================================
let starGroup = new THREE.Group();
scene.add(starGroup);

function buildStars() {
  // Remove old stars
  while (starGroup.children.length) {
    const child = starGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    starGroup.remove(child);
  }
  state.starMeshes = [];
  state.starDataMap.clear();

  const msgs = state.messages;
  const filteredMsgs = msgs.filter(m => {
    if (state.currentFilter && m.emotion !== state.currentFilter) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const txt = (m.text + ' ' + m.name).toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  // Assign positions
  filteredMsgs.forEach((msg, idx) => {
    const targetT = filteredMsgs.length > 1 ? idx / (filteredMsgs.length - 1) : 0.5;
    const angle = targetT * Math.PI * 2 * GALAXY_ARMS;
    const radius = targetT * GALAXY_RADIUS;
    msg._pos = {
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * 3,
      y: (Math.random() - 0.5) * GALAXY_THICKNESS * 0.5,
      z: Math.sin(angle) * radius + (Math.random() - 0.5) * 3,
    };
  });

  filteredMsgs.forEach((msg) => {
    const texture = getStarTexture(msg.emotion);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    });
    const sprite = new THREE.Sprite(mat);
    const baseScale = 0.8 + Math.random() * 1.2;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.position.set(msg._pos.x, msg._pos.y, msg._pos.z);
    sprite.userData = { msgId: msg.id, baseScale, phase: Math.random() * Math.PI * 2 };
    starGroup.add(sprite);
    state.starMeshes.push(sprite);
    state.starDataMap.set(sprite.uuid, msg);
  });

  updateCounter();
}

// ============================================================
// ADD MESSAGE
// ============================================================
function addMessage(text, name, emotion) {
  const msg = {
    id: generateId(),
    text: text.trim(),
    name: (name && name.trim()) ? name.trim() : 'Anonymous',
    emotion: emotion || 'General',
    timestamp: Date.now(),
    likes: 0,
    likedBy: [],
  };
  state.messages.push(msg);
  saveMessages();
  buildStars();
  showToast('✦ Your emotion has become a star!');
  return msg;
}

// ============================================================
// UPDATE COUNTER
// ============================================================
function updateCounter() {
  const total = state.messages.length;
  const visible = state.starMeshes.length;
  if (total === visible) {
    starCounter.textContent = `✦ ${total} star${total !== 1 ? 's' : ''}`;
  } else {
    starCounter.textContent = `✦ ${visible} / ${total} stars`;
  }
}

// ============================================================
// FILTERS UI
// ============================================================
function buildFilterPills() {
  filterPills.innerHTML = '';
  const allPill = document.createElement('button');
  allPill.className = `filter-pill${!state.currentFilter ? ' active' : ''}`;
  allPill.textContent = 'All';
  allPill.dataset.emotion = '';
  allPill.addEventListener('click', () => setFilter(''));
  filterPills.appendChild(allPill);

  const emotions = Object.keys(COLORS);
  emotions.forEach(em => {
    const pill = document.createElement('button');
    pill.className = `filter-pill${state.currentFilter === em ? ' active' : ''}`;
    pill.textContent = `${EMOTION_ICONS[em] || '✨'} ${em}`;
    pill.dataset.emotion = em;
    pill.addEventListener('click', () => setFilter(em));
    filterPills.appendChild(pill);
  });
}

function setFilter(emotion) {
  state.currentFilter = emotion || null;
  buildFilterPills();
  buildStars();
}

// ============================================================
// SEARCH
// ============================================================
searchInput.addEventListener('input', () => {
  state.searchQuery = searchInput.value;
  buildStars();
});

// ============================================================
// MODAL
// ============================================================
let currentModalMsgId = null;

function openModal(msg) {
  if (!msg) return;
  currentModalMsgId = msg.id;
  modalIcon.textContent = EMOTION_ICONS[msg.emotion] || '✨';
  modalLabel.textContent = msg.emotion;
  modalMessage.textContent = msg.text;
  modalName.textContent = msg.name;
  const date = new Date(msg.timestamp);
  modalTime.textContent = date.toLocaleString();
  modalLikeCount.textContent = msg.likes || 0;
  modalLikeBtn.classList.toggle('liked', (msg.likedBy || []).length > 0);
  modal.classList.add('visible');
  controls.autoRotate = false;
}

function closeModal() {
  modal.classList.remove('visible');
  currentModalMsgId = null;
  controls.autoRotate = true;
}

modalBackdrop.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);

modalLikeBtn.addEventListener('click', () => {
  if (!currentModalMsgId) return;
  const msg = state.messages.find(m => m.id === currentModalMsgId);
  if (!msg) return;
  if (!msg.likedBy) msg.likedBy = [];
  const ipKey = 'local_user';
  if (msg.likedBy.includes(ipKey)) {
    msg.likes = Math.max(0, (msg.likes || 0) - 1);
    msg.likedBy = msg.likedBy.filter(x => x !== ipKey);
  } else {
    msg.likes = (msg.likes || 0) + 1;
    msg.likedBy.push(ipKey);
  }
  modalLikeCount.textContent = msg.likes;
  modalLikeBtn.classList.toggle('liked', msg.likedBy.includes(ipKey));
  saveMessages();
});

// Keyboard close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ============================================================
// RAYCASTER (Star interaction)
// ============================================================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredStar = null;

renderer.domElement.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('click', (e) => {
  if (state.transitioning) return;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(starGroup.children);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const msg = state.starDataMap.get(hit.uuid);
    if (msg) {
      state.transitioning = true;
      const targetPos = new THREE.Vector3().copy(hit.position);
      // Animate camera toward star
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const endPos = targetPos.clone().add(new THREE.Vector3(0, 5, 20));
      const endTarget = targetPos.clone();
      let t = 0;
      const duration = 60; // frames

      function animateCamera() {
        t++;
        const p = Math.min(t / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
        camera.position.lerpVectors(startPos, endPos, ease);
        controls.target.lerpVectors(startTarget, endTarget, ease);
        controls.update();
        if (p < 1) {
          requestAnimationFrame(animateCamera);
        } else {
          state.transitioning = false;
          openModal(msg);
        }
      }
      animateCamera();
    }
  }
});

// ============================================================
// SOUND ENGINE (Web Audio API)
// ============================================================
let audioCtx = null;
let ambientNodes = [];
let soundInitialized = false;

function initAudio() {
  if (soundInitialized) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    soundInitialized = true;
    startAmbientDrone();
  } catch {}
}

function startAmbientDrone() {
  if (!audioCtx || !state.soundOn) return;
  stopAmbientDrone();

  // Low rumble
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(55, audioCtx.currentTime);
  const gain1 = audioCtx.createGain();
  gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain1.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 2);

  // Pad
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(110, audioCtx.currentTime);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain2.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 3);

  // High shimmer
  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(220, audioCtx.currentTime);
  const gain3 = audioCtx.createGain();
  gain3.gain.setValueAtTime(0.03, audioCtx.currentTime);
  gain3.gain.linearRampToValueAtTime(0.015, audioCtx.currentTime + 4);

  const reverb = audioCtx.createConvolver();
  const reverbLen = 4;
  const reverbSampleRate = audioCtx.sampleRate;
  const reverbBuffer = audioCtx.createBuffer(2, reverbLen * reverbSampleRate, reverbSampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = reverbBuffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbSampleRate * 0.8));
    }
  }
  reverb.buffer = reverbBuffer;

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime);

  osc1.connect(gain1).connect(reverb);
  osc2.connect(gain2).connect(reverb);
  osc3.connect(gain3).connect(reverb);
  reverb.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  osc1.start();
  osc2.start();
  osc3.start();

  ambientNodes = [osc1, osc2, osc3, gain1, gain2, gain3, reverb, masterGain];
}

function stopAmbientDrone() {
  ambientNodes.forEach(n => {
    try { if (n.stop) n.stop(); else if (n.disconnect) n.disconnect(); } catch {}
  });
  ambientNodes = [];
}

function playChime() {
  if (!audioCtx || !state.soundOn) return;
  try {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 + Math.random() * 440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch {}
}

// Toggle sound
btnSound.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  btnSound.textContent = state.soundOn ? '🔊 Sound' : '🔇 Mute';
  if (state.soundOn && audioCtx) {
    startAmbientDrone();
  } else {
    stopAmbientDrone();
  }
});

// ============================================================
// EXPLORE MODE
// ============================================================
btnExplore.addEventListener('click', () => {
  if (state.isExploring) {
    stopExplore();
  } else {
    startExplore();
  }
});

function startExplore() {
  state.isExploring = true;
  btnExplore.textContent = '⏹ Stop';
  doExploreStep();
}

function stopExplore() {
  state.isExploring = false;
  btnExplore.textContent = '🎲 Explore';
  clearTimeout(state.exploreTimer);
}

function doExploreStep() {
  if (!state.isExploring) return;
  const visible = state.starMeshes.filter(s => s.visible);
  if (visible.length === 0) {
    stopExplore();
    return;
  }
  const star = visible[Math.floor(Math.random() * visible.length)];
  const msg = state.starDataMap.get(star.uuid);
  if (!msg) { scheduleExplore(); return; }

  // Camera fly to star
  state.transitioning = true;
  const targetPos = new THREE.Vector3().copy(star.position);
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = targetPos.clone().add(new THREE.Vector3(0, 5, 20));
  const endTarget = targetPos.clone();
  let t = 0;
  const duration = 50;

  function animExplore() {
    t++;
    const p = Math.min(t / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    controls.update();
    if (p < 1) {
      requestAnimationFrame(animExplore);
    } else {
      state.transitioning = false;
      openModal(msg);
      scheduleExplore();
    }
  }
  animExplore();
}

function scheduleExplore() {
  clearTimeout(state.exploreTimer);
  state.exploreTimer = setTimeout(() => {
    if (state.isExploring && !modal.classList.contains('visible')) {
      doExploreStep();
    } else {
      scheduleExplore();
    }
  }, 4000 + Math.random() * 3000);
}

// ============================================================
// PLACEHOLDER CYCLING
// ============================================================
let placeholderIdx = 0;
setInterval(() => {
  placeholderIdx = (placeholderIdx + 1) % PLACEHOLDERS.length;
  input.placeholder = PLACEHOLDERS[placeholderIdx];
}, 4000);

// ============================================================
// FORM SUBMIT
// ============================================================
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const name = nameInput.value.trim();
  const emotion = emotionCat.value;

  // Init audio on first interaction
  initAudio();

  addMessage(text, name, emotion);

  // Transition to galaxy
  landingScreen.classList.add('hidden');
  hud.style.display = 'flex';

  input.value = '';
  nameInput.value = '';

  // Play chime on first star
  if (state.messages.length === 1) {
    setTimeout(() => playChime(), 500);
  }
});

// ============================================================
// BACK BUTTON
// ============================================================
btnBack.addEventListener('click', () => {
  landingScreen.classList.remove('hidden');
  hud.style.display = 'none';
  closeModal();
  controls.autoRotate = true;
  // Reset camera
  camera.position.set(0, 60, 140);
  controls.target.set(0, 0, 0);
  controls.update();
});

// ============================================================
// WINDOW RESIZE
// ============================================================
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

// ============================================================
// ANIMATION LOOP
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  state.animTime += 0.005;

  // Star twinkling + floating
  state.starMeshes.forEach((sprite) => {
    const ud = sprite.userData;
    const twinkle = 0.7 + 0.3 * Math.sin(state.animTime * 2 + ud.phase);
    sprite.material.opacity = twinkle * 0.9;
    const floatY = Math.sin(state.animTime * 0.8 + ud.phase) * 0.4;
    const msg = state.starDataMap.get(sprite.uuid);
    if (msg && msg._pos) {
      sprite.position.y = msg._pos.y + floatY;
    }
    // Hover glow
    if (hoveredStar === sprite) {
      sprite.scale.setScalar(ud.baseScale * 1.8);
      sprite.material.opacity = 1;
    } else {
      const targetScale = ud.baseScale * (0.9 + 0.1 * Math.sin(state.animTime * 3 + ud.phase));
      sprite.scale.setScalar(targetScale);
    }
  });

  // Hover detection
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(starGroup.children);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hoveredStar !== hit) {
      hoveredStar = hit;
      renderer.domElement.style.cursor = 'pointer';
    }
  } else {
    if (hoveredStar) {
      hoveredStar = null;
      renderer.domElement.style.cursor = 'default';
    }
  }

  // Auto-rotate only when not interacting and modal closed
  if (!modal.classList.contains('visible') && !state.transitioning) {
    controls.autoRotate = true;
  }

  controls.update();
  composer.render();
}

// ============================================================
// LOAD EXISTING DATA
// ============================================================
state.messages = loadMessages();

// If there are existing messages, go straight to galaxy
if (state.messages.length > 0) {
  landingScreen.classList.add('hidden');
  hud.style.display = 'flex';
}

buildStars();
buildFilterPills();

// ============================================================
// HIDE LOADING SCREEN
// ============================================================
setTimeout(() => {
  document.getElementById('loading-screen').classList.add('hidden');
}, 1500);

// Start animation
animate();

// ============================================================
// INIT AUDIO ON ANY USER INTERACTION
// ============================================================
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });

console.log('🌌 Emotion Galaxy loaded! ✦');
console.log(`📊 ${state.messages.length} stars in the galaxy.`);

