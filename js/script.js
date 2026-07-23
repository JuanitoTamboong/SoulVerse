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
  General:  '✦', 
  Happy:    '😊', 
  Sad:      '😢', 
  Angry:    '😠', 
  Anxious:  '😰', 
  Excited:  '🤩', 
  Grateful: '🙏', 
  Hopeful:  '🌟', 
  Lonely:   '💔', 
  Love:     '❤️', 
  Peaceful: '🕊️',
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
  myStarIds: new Set(),
  isNewUser: true,
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
const commentsList = $('#comments-list');
const commentInput = $('#comment-input');
const commentSendBtn = $('#comment-send-btn');
const toastEl = $('#toast');
const btnBack = $('#btn-back');
const btnSound = $('#btn-sound');
const btnExplore = $('#btn-explore');
const btnMyStars = $('#btn-mystars');
const btnRefresh = $('#btn-refresh');
const mystarsPanel = $('#mystars-panel');
const mystarsBackdrop = $('#mystars-backdrop');
const mystarsCloseBtn = $('#mystars-close-btn');
const mystarsList = $('#mystars-list');
const mystarsCount = $('#mystars-count');
const loadingScreen = $('#loading-screen');

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

function loadMyStarIds() {
  try {
    const data = localStorage.getItem('emotionGalaxy_myStars');
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch { return new Set(); }
}

function saveMyStarIds() {
  try {
    localStorage.setItem('emotionGalaxy_myStars', JSON.stringify([...state.myStarIds]));
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
  1.2,
  0.6,
  0.1
);
composer.addPass(bloomPass);

// ============================================================
// BACKGROUND SPACE
// ============================================================
scene.fog = new THREE.FogExp2(0x000011, 0.0008);

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

  const light = new THREE.PointLight(0x7c3aed, 1.5, 100);
  light.position.set(0, 0, 0);
  scene.add(light);
  return core;
}
createGalaxyCore();

// ============================================================
// STAR SPRITE CREATION
// ============================================================
function createStarTexture(colorHex, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(colorHex);
  const cx = size/2, cy = size/2;
  const maxR = size/2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},1)`);
  grad.addColorStop(0.15, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.9)`);
  grad.addColorStop(0.4, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.5)`);
  grad.addColorStop(0.7, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.2)`);
  grad.addColorStop(1, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.25);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, '#ffffff');
  coreGrad.addColorStop(0.6, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.95)`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -maxR*0.9, 0, maxR*0.9);
    g.addColorStop(0, `rgba(255,255,255,0.4)`);
    g.addColorStop(0.2, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.4)`);
    g.addColorStop(0.5, `rgba(255,255,255,0.15)`);
    g.addColorStop(1, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-2, -maxR*0.9, 4, maxR*1.8);
    ctx.restore();
  }

  return new THREE.CanvasTexture(canvas);
}

function createUserStarTexture(colorHex, size = 192) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(colorHex);
  const cx = size/2, cy = size/2;
  const maxR = size/2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, `rgba(255,255,255,1)`);
  grad.addColorStop(0.05, `rgba(255,255,255,1)`);
  grad.addColorStop(0.15, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},1)`);
  grad.addColorStop(0.35, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.8)`);
  grad.addColorStop(0.6, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.4)`);
  grad.addColorStop(0.8, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.15)`);
  grad.addColorStop(1, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.3);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.2, '#ffffff');
  coreGrad.addColorStop(0.5, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.95)`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -maxR*0.95, 0, maxR*0.95);
    g.addColorStop(0, `rgba(255,255,255,0.7)`);
    g.addColorStop(0.1, `rgba(255,255,255,0.6)`);
    g.addColorStop(0.25, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.5)`);
    g.addColorStop(0.5, `rgba(255,255,255,0.2)`);
    g.addColorStop(1, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-3, -maxR*0.95, 6, maxR*1.9);
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI + Math.PI / 4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -maxR*0.6, 0, maxR*0.6);
    g.addColorStop(0, `rgba(255,255,255,0.35)`);
    g.addColorStop(0.3, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.2)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(-2, -maxR*0.6, 4, maxR*1.2);
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'screen';
  const ringGrad = ctx.createRadialGradient(cx, cy, maxR * 0.5, cx, cy, maxR);
  ringGrad.addColorStop(0, 'transparent');
  ringGrad.addColorStop(0.7, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.1)`);
  ringGrad.addColorStop(1, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},0.3)`);
  ctx.fillStyle = ringGrad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const textureCache = new Map();
const userTextureCache = new Map();

function getStarTexture(emotion) {
  const colorHex = COLORS[emotion] || COLORS.General;
  if (!textureCache.has(colorHex)) {
    textureCache.set(colorHex, createStarTexture(colorHex));
  }
  return textureCache.get(colorHex);
}

function getUserStarTexture(emotion) {
  const colorHex = COLORS[emotion] || COLORS.General;
  if (!userTextureCache.has(colorHex)) {
    userTextureCache.set(colorHex, createUserStarTexture(colorHex));
  }
  return userTextureCache.get(colorHex);
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
    comments: [],
  };
  state.messages.push(msg);
  state.myStarIds.add(msg.id);
  saveMessages();
  saveMyStarIds();
  buildStars();
  showToast('✦ Your emotion has become a star!');
  return msg;
}

// ============================================================
// BUILD / REBUILD STARS
// ============================================================
let starGroup = new THREE.Group();
scene.add(starGroup);

function buildStars() {
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
    if (state.currentFilter === '__mystars__') {
      if (!state.myStarIds.has(m.id)) return false;
    } else if (state.currentFilter) {
      if (m.emotion !== state.currentFilter) return false;
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const txt = (m.text + ' ' + m.name).toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  if (filteredMsgs.length === 0) {
    updateCounter();
    return;
  }

  filteredMsgs.forEach((msg, idx) => {
    const targetT = filteredMsgs.length > 1 ? idx / (filteredMsgs.length - 1) : 0.5;
    const angle = targetT * Math.PI * 2 * GALAXY_ARMS + (Math.random() - 0.5) * 0.2;
    const radius = targetT * GALAXY_RADIUS + (Math.random() - 0.5) * 5;
    msg._pos = {
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * 3,
      y: (Math.random() - 0.5) * GALAXY_THICKNESS * 0.5,
      z: Math.sin(angle) * radius + (Math.random() - 0.5) * 3,
    };
  });

  filteredMsgs.forEach((msg) => {
    const isMyStar = state.myStarIds.has(msg.id);
    const texture = isMyStar ? getUserStarTexture(msg.emotion) : getStarTexture(msg.emotion);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: isMyStar ? 1.0 : 0.9,
    });
    const sprite = new THREE.Sprite(mat);
    const baseScale = isMyStar
      ? 3.5 + Math.random() * 2.0
      : 1.2 + Math.random() * 1.2;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.position.set(msg._pos.x, msg._pos.y, msg._pos.z);
    sprite.userData = { msgId: msg.id, baseScale, phase: Math.random() * Math.PI * 2, isMyStar };
    starGroup.add(sprite);
    state.starMeshes.push(sprite);
    state.starDataMap.set(sprite.uuid, msg);
  });

  updateCounter();
}

// ============================================================
// UPDATE COUNTER
// ============================================================
function updateCounter() {
  const total = state.messages.length;
  const visible = state.starMeshes.length;
  const myStarsCount = state.messages.filter(m => state.myStarIds.has(m.id)).length;
  
  if (state.currentFilter === '__mystars__') {
    starCounter.textContent = `✦ ${visible} / ${myStarsCount} my stars`;
  } else if (state.currentFilter) {
    starCounter.textContent = `✦ ${visible} ${state.currentFilter} stars`;
  } else if (total === 0) {
    starCounter.textContent = `✦ 0 stars — Share your emotion!`;
  } else if (total === visible) {
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

  const myStarsCount = state.messages.filter(m => state.myStarIds.has(m.id)).length;
  const myStarsPill = document.createElement('button');
  myStarsPill.className = `filter-pill${state.currentFilter === '__mystars__' ? ' active' : ''}`;
  myStarsPill.textContent = `✦ My Stars (${myStarsCount})`;
  myStarsPill.dataset.emotion = '__mystars__';
  myStarsPill.addEventListener('click', () => setFilter('__mystars__'));
  filterPills.appendChild(myStarsPill);

  const emotions = Object.keys(COLORS);
  emotions.forEach(em => {
    const count = state.messages.filter(m => m.emotion === em).length;
    const pill = document.createElement('button');
    pill.className = `filter-pill${state.currentFilter === em ? ' active' : ''}`;
    pill.textContent = `${EMOTION_ICONS[em] || '✦'} ${em} (${count})`;
    pill.dataset.emotion = em;
    pill.addEventListener('click', () => setFilter(em));
    filterPills.appendChild(pill);
  });
}

// ============================================================
// SET FILTER
// ============================================================
function setFilter(emotion) {
  state.currentFilter = emotion || null;
  buildFilterPills();
  buildStars();
  
  if (emotion === '__mystars__' && state.messages.filter(m => state.myStarIds.has(m.id)).length === 0) {
    showToast('✦ You haven\'t created any stars yet. Share your emotion to create your first star!');
  }
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
  modalIcon.textContent = EMOTION_ICONS[msg.emotion] || '✦';
  modalLabel.textContent = msg.emotion;
  modalMessage.textContent = msg.text;
  modalName.textContent = msg.name;
  const date = new Date(msg.timestamp);
  modalTime.textContent = date.toLocaleString();
  modalLikeCount.textContent = msg.likes || 0;
  modalLikeBtn.classList.toggle('liked', (msg.likedBy || []).length > 0);
  renderComments(msg);
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

// ============================================================
// COMMENTS / CHAT
// ============================================================
function renderComments(msg) {
  if (!msg) return;
  commentsList.innerHTML = '';
  const comments = msg.comments || [];
  if (comments.length === 0) {
    commentsList.innerHTML = '<div class="comment-empty">No messages yet. Be the first to leave a kind thought!</div>';
    return;
  }
  comments.forEach(c => {
    const el = document.createElement('div');
    el.className = 'comment-item' + (c.isMine ? ' is-mine' : '');
    const date = new Date(c.timestamp);
    el.innerHTML = `
      <div class="comment-author">
        ${c.name}
        <span class="comment-time">${date.toLocaleString()}</span>
      </div>
      <div class="comment-text">${c.text}</div>
    `;
    commentsList.appendChild(el);
  });
  commentsList.scrollTop = commentsList.scrollHeight;
}

function addComment(starId, text) {
  if (!text.trim()) return;
  const msg = state.messages.find(m => m.id === starId);
  if (!msg) return;
  if (!msg.comments) msg.comments = [];
  const userName = nameInput.value.trim() || 'Anonymous';
  msg.comments.push({
    id: generateId(),
    text: text.trim(),
    name: userName,
    timestamp: Date.now(),
    isMine: state.myStarIds.has(starId),
  });
  saveMessages();
  renderComments(msg);
  showToast('✦ Message sent to star!');
}

commentSendBtn.addEventListener('click', () => {
  if (!currentModalMsgId) return;
  const text = commentInput.value.trim();
  if (!text) return;
  addComment(currentModalMsgId, text);
  commentInput.value = '';
});

commentInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    commentSendBtn.click();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ============================================================
// RAYCASTER
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
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const endPos = targetPos.clone().add(new THREE.Vector3(0, 5, 20));
      const endTarget = targetPos.clone();
      let t = 0;
      const duration = 60;

      function animateCamera() {
        t++;
        const p = Math.min(t / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
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
// SOUND ENGINE — MP3 Background Music
// ============================================================
let audioCtx = null;
let bgAudio = null;
let soundInitialized = false;

function initAudio() {
  if (soundInitialized) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    soundInitialized = true;
    startBgMusic();
  } catch {}
}

function startBgMusic() {
  if (!state.soundOn) return;
  stopBgMusic();
  try {
    bgAudio = new Audio('sound/sv-sound.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
    // Connect to AudioContext for Web Audio API integration
    const track = audioCtx.createMediaElementSource(bgAudio);
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    track.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    bgAudio.play().catch(() => {});
  } catch (e) {
    console.warn('Could not load background music:', e);
  }
}

function stopBgMusic() {
  if (bgAudio) {
    try { bgAudio.pause(); bgAudio.currentTime = 0; } catch {}
    bgAudio = null;
  }
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

btnSound.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  const textSpan = btnSound.querySelector('.btn-text');
  if (textSpan) {
    textSpan.textContent = state.soundOn ? 'Sound' : 'Mute';
  } else {
    btnSound.textContent = state.soundOn ? '🔊 Sound' : '🔇 Mute';
  }
  if (state.soundOn) {
    if (audioCtx) startBgMusic();
  } else {
    stopBgMusic();
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

  initAudio();
  addMessage(text, name, emotion);

  landingScreen.classList.add('hidden');
  hud.style.display = 'flex';
  state.isNewUser = false;

  input.value = '';
  nameInput.value = '';

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
  camera.position.set(0, 60, 140);
  controls.target.set(0, 0, 0);
  controls.update();
});

// ============================================================
// REFRESH BUTTON — Reset camera and rebuild galaxy
// ============================================================
btnRefresh.addEventListener('click', () => {
  closeModal();
  stopExplore();
  controls.autoRotate = true;
  camera.position.set(0, 60, 140);
  controls.target.set(0, 0, 0);
  controls.update();
  state.currentFilter = null;
  state.searchQuery = '';
  searchInput.value = '';
  buildFilterPills();
  buildStars();
  showToast('✦ Galaxy refreshed');
});

// ============================================================
// MY STARS MANAGEMENT PANEL
// ============================================================
function openMyStars() {
  closeModal();
  renderMyStars();
  mystarsPanel.classList.add('visible');
}

function closeMyStars() {
  mystarsPanel.classList.remove('visible');
}

function renderMyStars() {
  const myStars = state.messages.filter(m => state.myStarIds.has(m.id));
  mystarsCount.textContent = `${myStars.length} star${myStars.length !== 1 ? 's' : ''}`;
  mystarsList.innerHTML = '';

  if (myStars.length === 0) {
    mystarsList.innerHTML = '<div class="mystars-empty">You haven\'t created any stars yet. Share your emotion to create your first star!</div>';
    return;
  }

  myStars.sort((a, b) => b.timestamp - a.timestamp);

  myStars.forEach(msg => {
    const item = document.createElement('div');
    item.className = 'mystar-item';
    item.dataset.id = msg.id;

    const icon = EMOTION_ICONS[msg.emotion] || '✦';
    const date = new Date(msg.timestamp);
    const emotionLabel = msg.emotion;

    item.innerHTML = `
      <div class="mystar-item-icon">${icon}</div>
      <div class="mystar-item-body">
        <div class="mystar-item-text">${msg.text}</div>
        <div class="mystar-item-meta">
          <span>${emotionLabel}</span>
          <span>${date.toLocaleDateString()}</span>
          <span>✦ ${msg.likes || 0}</span>
        </div>
      </div>
      <div class="mystar-item-actions">
        <button class="mystar-edit-btn" title="Edit">✎</button>
        <button class="mystar-delete-btn" title="Delete">✕</button>
      </div>
    `;

    const editBtn = item.querySelector('.mystar-edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startEditStar(msg, item);
    });

    const deleteBtn = item.querySelector('.mystar-delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteStar(msg);
    });

    item.addEventListener('click', () => {
      closeMyStars();
      const sprite = state.starMeshes.find(s => s.userData.msgId === msg.id);
      if (sprite) {
        state.currentFilter = '__mystars__';
        buildFilterPills();
        buildStars();
        controls.autoRotate = false;
        state.transitioning = true;
        const targetPos = new THREE.Vector3().copy(sprite.position);
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const endPos = targetPos.clone().add(new THREE.Vector3(0, 5, 20));
        const endTarget = targetPos.clone();
        let t = 0;
        const duration = 50;
        function anim() {
          t++;
          const p = Math.min(t / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          camera.position.lerpVectors(startPos, endPos, ease);
          controls.target.lerpVectors(startTarget, endTarget, ease);
          controls.update();
          if (p < 1) requestAnimationFrame(anim);
          else { state.transitioning = false; openModal(msg); }
        }
        anim();
      }
    });

    mystarsList.appendChild(item);
  });
}

function startEditStar(msg, itemEl) {
  itemEl.classList.add('editing');
  const body = itemEl.querySelector('.mystar-item-body');
  const originalText = msg.text;

  body.innerHTML = `
    <input class="mystar-edit-input" type="text" value="${originalText}" maxlength="200">
    <div class="mystar-edit-actions">
      <button class="mystar-save-btn">Save</button>
      <button class="mystar-cancel-btn">Cancel</button>
    </div>
  `;

  const input = body.querySelector('.mystar-edit-input');
  input.focus();
  input.select();

  body.querySelector('.mystar-save-btn').addEventListener('click', () => {
    const newText = input.value.trim();
    if (newText && newText !== originalText) {
      msg.text = newText;
      saveMessages();
      buildStars();
      showToast('✎ Star updated!');
    }
    renderMyStars();
  });

  body.querySelector('.mystar-cancel-btn').addEventListener('click', () => {
    renderMyStars();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      body.querySelector('.mystar-save-btn').click();
    } else if (e.key === 'Escape') {
      body.querySelector('.mystar-cancel-btn').click();
    }
  });
}

function deleteStar(msg) {
  if (!confirm(`Delete this star?\n\n"${msg.text}"`)) return;
  state.messages = state.messages.filter(m => m.id !== msg.id);
  state.myStarIds.delete(msg.id);
  saveMessages();
  saveMyStarIds();
  buildStars();
  renderMyStars();
  showToast('✕ Star deleted');
}

btnMyStars.addEventListener('click', openMyStars);
mystarsBackdrop.addEventListener('click', closeMyStars);
mystarsCloseBtn.addEventListener('click', closeMyStars);

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

  state.starMeshes.forEach((sprite) => {
    const ud = sprite.userData;
    const msg = state.starDataMap.get(sprite.uuid);
    const isMyStar = ud.isMyStar && msg;

    if (isMyStar) {
      const floatY = Math.sin(state.animTime * 1.2 + ud.phase) * 2.0;
      if (msg && msg._pos) {
        sprite.position.y = msg._pos.y + floatY;
      }
      const pulse = 0.85 + 0.15 * Math.sin(state.animTime * 3 + ud.phase);
      sprite.material.opacity = pulse;
      
      if (hoveredStar === sprite) {
        sprite.scale.setScalar(ud.baseScale * 2.5);
        sprite.material.opacity = 1;
      } else {
        const targetScale = ud.baseScale * (0.85 + 0.15 * Math.sin(state.animTime * 4 + ud.phase));
        sprite.scale.setScalar(targetScale);
      }
    } else {
      const twinkle = 0.7 + 0.3 * Math.sin(state.animTime * 2 + ud.phase);
      sprite.material.opacity = twinkle * 0.9;
      const floatY = Math.sin(state.animTime * 0.8 + ud.phase) * 0.4;
      if (msg && msg._pos) {
        sprite.position.y = msg._pos.y + floatY;
      }
      if (hoveredStar === sprite) {
        sprite.scale.setScalar(ud.baseScale * 2.0);
        sprite.material.opacity = 1;
      } else {
        const targetScale = ud.baseScale * (0.9 + 0.1 * Math.sin(state.animTime * 3 + ud.phase));
        sprite.scale.setScalar(targetScale);
      }
    }
  });

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

  if (!modal.classList.contains('visible') && !state.transitioning) {
    controls.autoRotate = true;
  }

  controls.update();
  composer.render();
}

// ============================================================
// INITIALIZATION
// ============================================================
state.messages = loadMessages();
state.myStarIds = loadMyStarIds();

if (state.messages.length === 0) {
  landingScreen.classList.remove('hidden');
  hud.style.display = 'none';
  showToast('✦ Welcome! Share your emotion to create your first star!');
} else {
  landingScreen.classList.add('hidden');
  hud.style.display = 'flex';
}

buildStars();
buildFilterPills();

setTimeout(() => {
  loadingScreen.classList.add('hidden');
}, 1500);

animate();

document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });
