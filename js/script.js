// ============================================================
// EMOTION GALAXY — Main Application with Supabase
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';

// ============================================================
// SUPABASE CONFIG
// ============================================================
const SUPABASE_URL = 'https://apeicnafzeoplkveypdq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZWljbmFmemVvcGxrdmV5cGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NTIwMTUsImV4cCI6MjEwMDMyODAxNX0.gNWBR2xLgLZ7P3LpgA8Fjn_duhhVM4S7NZcbjaGJR1Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// CONFIG
// ============================================================
const COLORS = {
  Happy: '#FFD700',
  Sad: '#6A5ACD',
  Angry: '#FF4500',
  Anxious: '#00CED1',
  Excited: '#FF69B4',
  Grateful: '#32CD32',
  Hopeful: '#FFA500',
  Lonely: '#C0C0C0',
  Love: '#FF1493',
  Peaceful: '#87CEEB',
  General: '#A78BFA',
};

const EMOTION_ICONS = {
  General: '✦',
  Happy: '😊',
  Sad: '😢',
  Angry: '😠',
  Anxious: '😰',
  Excited: '🤩',
  Grateful: '🙏',
  Hopeful: '🌟',
  Lonely: '💔',
  Love: '❤️',
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
// FALLING STARS CONFIG
// ============================================================
const FALLING_STAR_CONFIG = {
  spawnMinInterval: 2000,    // ms
  spawnMaxInterval: 5000,    // ms
  lifetime: 3.5,             // seconds before fully faded
  speed: 2.5,               // units per frame at 60fps
  trailLength: 18,          // number of trail particles
  headSize: 4.0,            // sprite scale for the head
  trailSize: 1.2,           // sprite scale for trail dots
  spreadAngle: 0.15,        // radians of spread from main direction
};

// ============================================================
// STATE
// ============================================================
const state = {
  messages: [],
  starMeshes: [],
  starDataMap: new Map(),
  selectedStarId: null,
  currentFilter: null,
  soundOn: true,
  searchQuery: '',
  // Chat state
  chatConversations: [],
  chatMessages: [],
  currentConvId: null,
  chatPartnerName: '',
  chatPartnerId: '',
  unreadCount: 0,
  isExploring: false,
  exploreTimer: null,
  animTime: 0,
  cameraTarget: null,
  cameraTargetPos: null,
  transitioning: false,
  myStarIds: new Set(),
  exploredStarIds: new Set(),
  isNewUser: true,
  loading: false,
  sessionId: null,
  lastKnownStarTimestamp: null,
  newStarPollTimer: null,
};

// Generate session ID
function getSessionId() {
  let id = localStorage.getItem('soulverse_session_id');
  if (!id) {
    id = 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('soulverse_session_id', id);
  }
  return id;
}
state.sessionId = getSessionId();

// Helper to get current user display name
function getUserDisplayName() {
  const nameVal = nameInput ? nameInput.value.trim() : '';
  return nameVal || 'Anonymous';
}

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
const skipBtn = $('#skip-btn');
// Chat DOM refs
const btnChat = $('#btn-chat');
const chatBadge = $('#chat-badge');
const chatPanel = $('#chat-panel');
const chatBackdrop = $('#chat-backdrop');
const chatCloseBtn = $('#chat-close-btn');
const chatConversationsList = $('#chat-conversations-list');
const chatDetail = $('#chat-detail');
const chatBackBtn = $('#chat-back-btn');
const chatDetailName = $('#chat-detail-name');
const chatMessages = $('#chat-messages');
const chatInput = $('#chat-input');
const chatSendBtn = $('#chat-send-btn');
const modalPmBtn = $('#modal-pm-btn');

// Delete confirm modal refs
const deleteConfirmModal = $('#delete-confirm-modal');
const deleteConfirmBackdrop = $('#delete-confirm-backdrop');
const deleteConfirmPreview = $('#delete-confirm-preview');
const deleteConfirmCancel = $('#delete-confirm-cancel');
const deleteConfirmDelete = $('#delete-confirm-delete');

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
// SUPABASE OPERATIONS
// ============================================================
async function loadMessages() {
  try {
    const { data, error } = await supabase
      .from('stars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    showToast('⚠️ Failed to load stars');
    return [];
  }
}

async function saveMessage(text, name, emotion) {
  try {
    if (!text || !text.trim()) {
      showToast('⚠️ Please enter a message');
      return null;
    }

    const newStar = {
      text: text.trim(),
      name: (name && name.trim()) ? name.trim() : 'Anonymous',
      emotion: emotion || 'General',
      user_id: state.sessionId,
      likes: 0,
      liked_by: []
    };

    const { data, error } = await supabase
      .from('stars')
      .insert([newStar])
      .select()
      .single();

    if (error) throw error;
    
    if (state.soundOn) playChime();
    showToast('✨ Star created! Your emotion is now in the galaxy.');
    return data;
  } catch (err) {
    showToast('⚠️ Failed to save star');
    return null;
  }
}

async function updateMessage(starId, text) {
  try {
    const { data, error } = await supabase
      .from('stars')
      .update({ text: text.trim() })
      .eq('id', starId)
      .select()
      .single();

    if (error) throw error;
    
    const index = state.messages.findIndex(m => m.id === starId);
    if (index !== -1) {
      state.messages[index].text = data.text;
    }
    
    return data;
  } catch (err) {
    showToast('⚠️ Failed to update star');
    return null;
  }
}

async function deleteMessage(starId) {
  try {
    const { error } = await supabase
      .from('stars')
      .delete()
      .eq('id', starId);

    if (error) throw error;
    
    state.messages = state.messages.filter(m => m.id !== starId);
    state.myStarIds.delete(starId);
    
    return true;
  } catch (err) {
    showToast('⚠️ Failed to delete star');
    return false;
  }
}

async function toggleLike(starId) {
  try {
    const { data, error } = await supabase.rpc('toggle_like', {
      star_id: starId,
      user_identifier: state.sessionId
    });

    if (error) throw error;
    
    const msg = state.messages.find(m => m.id === starId);
    if (msg) {
      msg.likes = data;
      const likedBy = msg.liked_by || [];
      const userLiked = likedBy.includes(state.sessionId);
      if (userLiked) {
        msg.liked_by = likedBy.filter(id => id !== state.sessionId);
      } else {
        msg.liked_by = [...likedBy, state.sessionId];
      }
    }
    
    return data;
  } catch (err) {
    showToast('⚠️ Failed to toggle like');
    return null;
  }
}

async function loadComments(starId) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('star_id', starId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

async function saveComment(starId, text, name) {
  try {
    const newComment = {
      star_id: starId,
      text: text.trim(),
      name: (name && name.trim()) ? name.trim() : 'Anonymous',
      user_id: state.sessionId,
      is_mine: true
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([newComment])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    showToast('⚠️ Failed to save comment');
    return null;
  }
}

// ============================================================
// PRIVATE MESSAGING SUPABASE OPERATIONS
// ============================================================
function getConversationId(userA, userB) {
  return [userA, userB].sort().join('_');
}

async function sendPrivateMessage(recipientId, recipientName, message) {
  try {
    const convId = getConversationId(state.sessionId, recipientId);
    const senderName = getUserDisplayName();
    
    const newMsg = {
      sender_id: state.sessionId,
      sender_name: senderName,
      recipient_id: recipientId,
      recipient_name: recipientName,
      message: message.trim(),
      is_read: false,
      conversation_id: convId
    };

    const { data, error } = await supabase
      .from('private_messages')
      .insert([newMsg])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    showToast('⚠️ Failed to send message');
    return null;
  }
}

async function loadPrivateMessages(conversationId) {
  try {
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

async function loadConversations() {
  try {
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(`sender_id.eq.${state.sessionId},recipient_id.eq.${state.sessionId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

async function markMessagesAsRead(conversationId) {
  try {
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', state.sessionId)
      .eq('is_read', false);
  } catch (err) {}
}

async function getUnreadCount() {
  try {
    const { count, error } = await supabase
      .from('private_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', state.sessionId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    return 0;
  }
}

// ============================================================
// PRIVATE MESSAGE DELETE & UPDATE (via Supabase RPC)
// ============================================================
async function deletePrivateMessage(messageId) {
  try {
    const { data, error } = await supabase.rpc('delete_private_message', {
      p_message_id: messageId,
      p_user_id: state.sessionId
    });
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    showToast('⚠️ Failed to delete message');
    return null;
  }
}

async function updatePrivateMessage(messageId, newMessage) {
  try {
    const { data, error } = await supabase.rpc('update_private_message', {
      p_message_id: messageId,
      p_new_message: newMessage.trim(),
      p_user_id: state.sessionId
    });
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    showToast('⚠️ Failed to edit message');
    return null;
  }
}

// ============================================================
// INITIALIZE
// ============================================================
async function initializeApp() {
  state.loading = true;
  
  const stars = await loadMessages();
  state.messages = stars;
  
  state.myStarIds = new Set();
  state.messages.forEach(msg => {
    if (msg.user_id === state.sessionId) {
      state.myStarIds.add(msg.id);
    }
  });

  if (stars.length > 0) {
    state.lastKnownStarTimestamp = new Date(stars[0].created_at).getTime();
  } else {
    state.lastKnownStarTimestamp = Date.now();
  }

  state.loading = false;

  // Check if user has dismissed the landing before
  const landingDismissed = localStorage.getItem('soulverse_landing_dismissed') === 'true';

  // Check if coming back from support-dev page (show landing again for new users)
  const urlParams = new URLSearchParams(window.location.search);
  const showLanding = urlParams.get('showLanding') === 'true';

  // Show landing for new users (no stars of their own) who haven't dismissed it,
  // OR if returning from support-dev page
  if ((state.myStarIds.size === 0 && !landingDismissed) || (state.myStarIds.size === 0 && showLanding)) {
    landingScreen.classList.remove('hidden');
    hud.style.display = 'none';
  } else {
    landingScreen.classList.add('hidden');
    hud.style.display = 'flex';
  }

  buildStars();
  buildFilterPills();
  await loadChatData();
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
renderer.toneMappingExposure = 1.5;
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
// POST-PROCESSING — ENHANCED BLOOM FOR GLOWING STARS
// ============================================================
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Enhanced bloom for stronger glow
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.8,  // intensity - increased for more glow
  0.8,  // radius - increased for wider glow spread
  0.15  // threshold - lower to catch more brightness
);
composer.addPass(bloomPass);

// ============================================================
// BACKGROUND
// ============================================================
scene.background = new THREE.Color(0x000011);

// ============================================================
// GALAXY CORE
// ============================================================
function createGalaxyCore() {
  const count = 1500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.2;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const c = new THREE.Color().setHSL(0.7 + Math.random() * 0.15, 0.8, 0.6 + Math.random() * 0.3);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
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
// STAR TEXTURES — ENHANCED FOR GLOWING EFFECT
// ============================================================
const textureCache = new Map();
const userTextureCache = new Map();

function createStarTexture(colorHex, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(colorHex);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},1)`);
  grad.addColorStop(0.1, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.95)`);
  grad.addColorStop(0.3, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.7)`);
  grad.addColorStop(0.6, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.35)`);
  grad.addColorStop(0.85, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.1)`);
  grad.addColorStop(1, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.3);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.2, '#ffffff');
  coreGrad.addColorStop(0.5, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.95)`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -maxR * 0.9, 0, maxR * 0.9);
    g.addColorStop(0, `rgba(255,255,255,0.5)`);
    g.addColorStop(0.15, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.4)`);
    g.addColorStop(0.4, `rgba(255,255,255,0.2)`);
    g.addColorStop(1, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-2, -maxR * 0.9, 4, maxR * 1.8);
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'screen';
  const ringGrad = ctx.createRadialGradient(cx, cy, maxR * 0.3, cx, cy, maxR);
  ringGrad.addColorStop(0, 'transparent');
  ringGrad.addColorStop(0.5, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.15)`);
  ringGrad.addColorStop(0.8, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.3)`);
  ringGrad.addColorStop(1, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.1)`);
  ctx.fillStyle = ringGrad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

function createUserStarTexture(colorHex, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(colorHex);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, `rgba(255,255,255,1)`);
  grad.addColorStop(0.05, `rgba(255,255,255,1)`);
  grad.addColorStop(0.15, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},1)`);
  grad.addColorStop(0.35, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.8)`);
  grad.addColorStop(0.6, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.5)`);
  grad.addColorStop(0.8, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.2)`);
  grad.addColorStop(1, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.35);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.15, '#ffffff');
  coreGrad.addColorStop(0.4, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.95)`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -maxR * 0.95, 0, maxR * 0.95);
    g.addColorStop(0, `rgba(255,255,255,0.8)`);
    g.addColorStop(0.1, `rgba(255,255,255,0.6)`);
    g.addColorStop(0.2, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.5)`);
    g.addColorStop(0.5, `rgba(255,255,255,0.2)`);
    g.addColorStop(1, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-3, -maxR * 0.95, 6, maxR * 1.9);
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI + Math.PI / 8;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -maxR * 0.6, 0, maxR * 0.6);
    g.addColorStop(0, `rgba(255,255,255,0.4)`);
    g.addColorStop(0.3, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.2)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(-2, -maxR * 0.6, 4, maxR * 1.2);
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'screen';
  const ringGrad = ctx.createRadialGradient(cx, cy, maxR * 0.4, cx, cy, maxR);
  ringGrad.addColorStop(0, 'transparent');
  ringGrad.addColorStop(0.5, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.15)`);
  ringGrad.addColorStop(0.75, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.35)`);
  ringGrad.addColorStop(1, `rgba(${color.r * 255 | 0},${color.g * 255 | 0},${color.b * 255 | 0},0.1)`);
  ctx.fillStyle = ringGrad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

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
// FALLING STAR TEXTURE
// ============================================================
let fallingStarHeadTexture = null;
let fallingStarTrailTexture = null;

function createFallingStarTextures() {
  const headCanvas = document.createElement('canvas');
  headCanvas.width = 128;
  headCanvas.height = 128;
  const hCtx = headCanvas.getContext('2d');
  const hc = 64;
  const hGrad = hCtx.createRadialGradient(hc, hc, 0, hc, hc, 64);
  hGrad.addColorStop(0, 'rgba(255,255,255,1)');
  hGrad.addColorStop(0.15, 'rgba(255,255,255,1)');
  hGrad.addColorStop(0.3, 'rgba(255,255,255,0.85)');
  hGrad.addColorStop(0.6, 'rgba(200,220,255,0.4)');
  hGrad.addColorStop(1, 'rgba(200,220,255,0)');
  hCtx.fillStyle = hGrad;
  hCtx.fillRect(0, 0, 128, 128);
  const hCore = hCtx.createRadialGradient(hc, hc, 0, hc, hc, 20);
  hCore.addColorStop(0, 'rgba(255,255,255,1)');
  hCore.addColorStop(0.5, 'rgba(200,220,255,0.8)');
  hCore.addColorStop(1, 'transparent');
  hCtx.fillStyle = hCore;
  hCtx.fillRect(0, 0, 128, 128);
  hCtx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI;
    hCtx.save();
    hCtx.translate(hc, hc);
    hCtx.rotate(angle);
    const g = hCtx.createLinearGradient(0, -60, 0, 60);
    g.addColorStop(0, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.4, 'rgba(200,220,255,0.3)');
    g.addColorStop(1, 'transparent');
    hCtx.fillStyle = g;
    hCtx.fillRect(-2, -60, 4, 120);
    hCtx.restore();
  }
  fallingStarHeadTexture = new THREE.CanvasTexture(headCanvas);

  const trailCanvas = document.createElement('canvas');
  trailCanvas.width = 64;
  trailCanvas.height = 64;
  const tCtx = trailCanvas.getContext('2d');
  const tc = 32;
  const tGrad = tCtx.createRadialGradient(tc, tc, 0, tc, tc, 32);
  tGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
  tGrad.addColorStop(0.2, 'rgba(200,220,255,0.6)');
  tGrad.addColorStop(0.5, 'rgba(150,180,255,0.25)');
  tGrad.addColorStop(1, 'rgba(150,180,255,0)');
  tCtx.fillStyle = tGrad;
  tCtx.fillRect(0, 0, 64, 64);
  fallingStarTrailTexture = new THREE.CanvasTexture(trailCanvas);
}

// ============================================================
// BUILD STARS
// ============================================================
let starGroup = new THREE.Group();
scene.add(starGroup);

// ============================================================
// FALLING STARS SYSTEM
// ============================================================
let fallingStarGroup = new THREE.Group();
scene.add(fallingStarGroup);
let activeFallingStars = [];
let fallingStarSpawnTimer = null;

function spawnFallingStar() {
  const cfg = FALLING_STAR_CONFIG;
  const angleXY = Math.random() * Math.PI * 2;
  const startRadius = 100 + Math.random() * 150;
  const heightOffset = (Math.random() - 0.5) * 100;
  const startPos = new THREE.Vector3(
    Math.cos(angleXY) * startRadius,
    50 + Math.random() * 60 + heightOffset * 0.3,
    Math.sin(angleXY) * startRadius
  );
  const dir = new THREE.Vector3(
    -startPos.x * 0.3 + (Math.random() - 0.5) * 20,
    -(30 + Math.random() * 40),
    -startPos.z * 0.3 + (Math.random() - 0.5) * 20
  ).normalize();
  const group = new THREE.Group();
  group.position.copy(startPos);
  if (!fallingStarHeadTexture) createFallingStarTextures();
  const headMat = new THREE.SpriteMaterial({
    map: fallingStarHeadTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 1.0,
  });
  const head = new THREE.Sprite(headMat);
  const headScale = cfg.headSize * (0.8 + Math.random() * 0.4);
  head.scale.set(headScale, headScale, 1);
  group.add(head);
  const trail = [];
  if (!fallingStarTrailTexture) createFallingStarTextures();
  for (let i = 0; i < cfg.trailLength; i++) {
    const trailMat = new THREE.SpriteMaterial({
      map: fallingStarTrailTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7 * (1 - i / cfg.trailLength),
    });
    const dot = new THREE.Sprite(trailMat);
    const tScale = cfg.trailSize * (1 - i / cfg.trailLength) * (0.7 + Math.random() * 0.3);
    dot.scale.set(tScale, tScale, 1);
    const trailOffset = dir.clone().multiplyScalar(-i * 2.5);
    const spread = new THREE.Vector3(
      (Math.random() - 0.5) * cfg.spreadAngle * (i + 1),
      (Math.random() - 0.5) * cfg.spreadAngle * (i + 1),
      (Math.random() - 0.5) * cfg.spreadAngle * (i + 1)
    );
    trailOffset.add(spread);
    dot.position.copy(trailOffset);
    dot.userData.trailIdx = i;
    group.add(dot);
    trail.push(dot);
  }
  fallingStarGroup.add(group);
  const starData = {
    group, head, trail, dir,
    lifetime: cfg.lifetime * (0.8 + Math.random() * 0.4),
    age: 0,
    speed: cfg.speed * (0.8 + Math.random() * 0.4),
    startPos: startPos.clone(),
  };
  activeFallingStars.push(starData);
}

function updateFallingStars() {
  const cfg = FALLING_STAR_CONFIG;
  const dt = 0.016;
  for (let i = activeFallingStars.length - 1; i >= 0; i--) {
    const fs = activeFallingStars[i];
    fs.age += dt;
    const progress = fs.age / fs.lifetime;
    fs.group.position.add(fs.dir.clone().multiplyScalar(fs.speed));
    let fadeOpacity = 1.0;
    if (progress > 0.4) fadeOpacity = 1.0 - (progress - 0.4) / 0.6;
    fadeOpacity = Math.max(0, fadeOpacity);
    fs.head.material.opacity = fadeOpacity;
    fs.trail.forEach((dot, idx) => {
      const trailProgress = idx / cfg.trailLength;
      const dotFade = fadeOpacity * (1 - trailProgress * 0.5);
      dot.material.opacity = Math.max(0, dotFade);
    });
    const headScale = cfg.headSize * (0.8 + Math.random() * 0.4) * (0.5 + 0.5 * fadeOpacity);
    fs.head.scale.set(headScale, headScale, 1);
    if (fadeOpacity <= 0 || fs.age >= fs.lifetime) {
      fs.head.material.dispose();
      fs.trail.forEach(t => t.material.dispose());
      fallingStarGroup.remove(fs.group);
      activeFallingStars.splice(i, 1);
    }
  }
}

function startFallingStarSpawner() {
  function scheduleNext() {
    const delay = FALLING_STAR_CONFIG.spawnMinInterval +
      Math.random() * (FALLING_STAR_CONFIG.spawnMaxInterval - FALLING_STAR_CONFIG.spawnMinInterval);
    fallingStarSpawnTimer = setTimeout(() => {
      spawnFallingStar();
      scheduleNext();
    }, delay);
  }
  setTimeout(() => {
    spawnFallingStar();
    scheduleNext();
  }, 1000 + Math.random() * 2000);
}

function starHash(starId) {
  let hash = 0;
  const str = String(starId);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  function lcg(seed) {
    return function() {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return (seed >>> 0) / 0x7fffffff;
    };
  }
  return lcg(hash);
}

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

  const MIN_RADIUS = 20;
  const MAX_RADIUS = 200;

  filteredMsgs.forEach((msg) => {
    const rng = starHash(msg.id);
    const radiusNorm = rng();
    const radius = MIN_RADIUS + radiusNorm * (MAX_RADIUS - MIN_RADIUS);
    const armIndex = Math.floor(rng() * GALAXY_ARMS);
    const armAngle = (armIndex / GALAXY_ARMS) * Math.PI * 2;
    const angleSpread = 0.6 + rng() * 1.0;
    const angle = armAngle + (rng() - 0.5) * angleSpread;
    const heightFactor = 1.0 - radiusNorm * 0.5;
    const yOffset = (rng() - 0.5) * GALAXY_THICKNESS * heightFactor;
    msg._pos = {
      x: Math.cos(angle) * radius + (rng() - 0.5) * 8,
      y: yOffset + (rng() - 0.5) * 3,
      z: Math.sin(angle) * radius + (rng() - 0.5) * 8,
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
      opacity: 1.0,
    });
    const sprite = new THREE.Sprite(mat);
    const rng = starHash(msg.id + '_size');
    const baseScale = isMyStar ? 4.5 + rng() * 4.5 : 2.5 + rng() * 3.5;
    const phase = rng() * Math.PI * 2;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.position.set(msg._pos.x, msg._pos.y, msg._pos.z);
    sprite.userData = { msgId: msg.id, baseScale, phase, isMyStar };
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
    starCounter.textContent = '✦ 0 stars — Share your emotion!';
  } else if (total === visible) {
    starCounter.textContent = `✦ ${total} star${total !== 1 ? 's' : ''}`;
  } else {
    starCounter.textContent = `✦ ${visible} / ${total} stars`;
  }
}

// ============================================================
// FILTERS
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

function setFilter(emotion) {
  state.currentFilter = emotion || null;
  buildFilterPills();
  buildStars();

  if (emotion === '__mystars__' && state.messages.filter(m => state.myStarIds.has(m.id)).length === 0) {
    showToast('✦ You haven\'t created any stars yet. Share your emotion to create your first star!');
  }
}

// ============================================================
// MODAL
// ============================================================
let currentModalMsgId = null;
let currentModalComments = [];

async function openModal(msg) {
  if (!msg) return;
  currentModalMsgId = msg.id;
  modalIcon.textContent = EMOTION_ICONS[msg.emotion] || '✦';
  modalLabel.textContent = msg.emotion;
  modalMessage.textContent = msg.text;
  modalName.textContent = msg.name;
  const date = new Date(msg.created_at);
  modalTime.textContent = date.toLocaleString();
  modalLikeCount.textContent = msg.likes || 0;
  modalLikeBtn.classList.toggle('liked', (msg.liked_by || []).includes(state.sessionId));

  currentModalComments = await loadComments(msg.id);
  renderComments(currentModalComments);

  // Show/hide PM button based on whether this is the user's own star
  if (msg.user_id === state.sessionId) {
    modalPmBtn.style.display = 'none';
  } else {
    modalPmBtn.style.display = 'inline-flex';
    modalPmBtn.dataset.targetUserId = msg.user_id;
    modalPmBtn.dataset.targetUserName = msg.name;
  }

  modal.classList.add('visible');
  controls.autoRotate = false;
}

function closeModal() {
  modal.classList.remove('visible');
  currentModalMsgId = null;
  
  if (!state.isExploring && !state.transitioning) {
    controls.autoRotate = true;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = new THREE.Vector3(0, 60, 140);
    const endTarget = new THREE.Vector3(0, 0, 0);
    let t = 0;
    const duration = 40;
    function animateBack() {
      t++;
      const p = Math.min(t / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();
      if (p < 1) requestAnimationFrame(animateBack);
    }
    animateBack();
  }
}

modalBackdrop.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);

modalLikeBtn.addEventListener('click', async () => {
  if (!currentModalMsgId) return;
  const msg = state.messages.find(m => m.id === currentModalMsgId);
  if (!msg) return;

  const newLikes = await toggleLike(msg.id);
  if (newLikes !== null) {
    modalLikeCount.textContent = newLikes;
    const liked = (msg.liked_by || []).includes(state.sessionId);
    modalLikeBtn.classList.toggle('liked', liked);
  }
});

// ============================================================
// COMMENTS
// ============================================================
function renderComments(comments) {
  commentsList.innerHTML = '';
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<div class="comment-empty">No messages yet. Be the first to leave a kind thought!</div>';
    return;
  }
  comments.forEach(c => {
    const el = document.createElement('div');
    const isMine = c.user_id === state.sessionId;
    el.className = 'comment-item' + (isMine ? ' is-mine' : '');
    const date = new Date(c.created_at);
    const initial = (c.name && c.name !== 'Anonymous') ? c.name.charAt(0).toUpperCase() : '?';
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mineBadge = isMine ? '<span class="comment-mine-badge">you</span>' : '';
    el.innerHTML = `
      <div class="comment-avatar">${initial}</div>
      <div class="comment-bubble">
        <div class="comment-author">
          <span class="comment-author-name">
            ${c.name} ${mineBadge}
          </span>
          <span class="comment-time">${timeStr}</span>
        </div>
        <div class="comment-text">${c.text}</div>
      </div>
    `;
    commentsList.appendChild(el);
  });
  commentsList.scrollTop = commentsList.scrollHeight;
}

async function addComment(starId, text) {
  if (!text.trim()) return;
  const msg = state.messages.find(m => m.id === starId);
  if (!msg) return;

  const userName = nameInput.value.trim() || 'Anonymous';
  const newComment = await saveComment(starId, text, userName);

  if (newComment) {
    currentModalComments.push(newComment);
    renderComments(currentModalComments);
    showToast('✦ Message sent to star!');
  }
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
// PRIVATE MESSAGE CHAT LOGIC
// ============================================================

// PM Button in Modal
modalPmBtn.addEventListener('click', () => {
  const targetUserId = modalPmBtn.dataset.targetUserId;
  const targetUserName = modalPmBtn.dataset.targetUserName;
  if (!targetUserId) return;
  closeModal();
  startChatWith(targetUserId, targetUserName);
});

// Chat button in HUD
btnChat.addEventListener('click', () => {
  openChatPanel();
});

// Chat panel close
chatCloseBtn.addEventListener('click', closeChatPanel);
chatBackdrop.addEventListener('click', closeChatPanel);

// Back to conversation list
chatBackBtn.addEventListener('click', () => {
  chatDetail.style.display = 'none';
  chatConversationsList.style.display = 'block';
  state.currentConvId = null;
});

// Send message
chatSendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendChatMessage();
  }
});

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !state.currentConvId) return;
  
  const result = await sendPrivateMessage(state.chatPartnerId, state.chatPartnerName, text);
  if (result) {
    state.chatMessages.push(result);
    renderChatMessages();
    chatInput.value = '';
  }
}

function startChatWith(targetUserId, targetUserName) {
  state.chatPartnerId = targetUserId;
  state.chatPartnerName = targetUserName;
  state.currentConvId = getConversationId(state.sessionId, targetUserId);
  
  chatDetailName.textContent = targetUserName;
  chatConversationsList.style.display = 'none';
  chatDetail.style.display = 'flex';
  
  loadChatHistory();
  openChatPanel();
}

async function loadChatHistory() {
  if (!state.currentConvId) return;
  state.chatMessages = await loadPrivateMessages(state.currentConvId);
  renderChatMessages();
  await markMessagesAsRead(state.currentConvId);
  await updateUnreadCount();
}

function renderChatMessages() {
  chatMessages.innerHTML = '';
  if (state.chatMessages.length === 0) {
    chatMessages.innerHTML = '<div class="chat-messages-empty">Send a message to start the conversation!</div>';
    return;
  }
  state.chatMessages.forEach(msg => {
    const isMine = msg.sender_id === state.sessionId;
    const el = document.createElement('div');
    
    // Handle deleted state
    if (msg.is_deleted) {
      el.className = 'chat-msg deleted' + (isMine ? ' sent' : ' received');
      const time = new Date(msg.created_at);
      const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `
        <div class="chat-msg-bubble">🗑️ This message was deleted</div>
        <div class="chat-msg-time">${timeStr}</div>
      `;
      chatMessages.appendChild(el);
      return;
    }
    
    const time = new Date(msg.created_at);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const name = isMine ? 'You' : msg.sender_name;
    const editedBadge = msg.is_edited ? ' <span class="chat-msg-edited">(edited)</span>' : '';
    
    el.className = 'chat-msg' + (isMine ? ' sent' : ' received');
    el.dataset.msgId = msg.id;
    
    let actionsHtml = '';
    if (isMine) {
      actionsHtml = `
        <div class="chat-msg-actions">
          <button class="chat-msg-action-btn edit" title="Edit" data-msg-id="${msg.id}">✎</button>
          <button class="chat-msg-action-btn delete" title="Delete" data-msg-id="${msg.id}">🗑️</button>
        </div>
      `;
    }
    
    el.innerHTML = `
      <div class="chat-msg-name">${name}</div>
      <div class="chat-msg-bubble">${msg.message}${editedBadge}</div>
      <div class="chat-msg-time">${timeStr}</div>
      ${actionsHtml}
    `;
    
    // Add event listeners for edit/delete buttons
    if (isMine) {
      const editBtn = el.querySelector('.chat-msg-action-btn.edit');
      const deleteBtn = el.querySelector('.chat-msg-action-btn.delete');
      
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startChatEdit(msg, el);
      });
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleChatDelete(msg);
      });
    }
    
    chatMessages.appendChild(el);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================================
// CHAT MESSAGE EDIT & DELETE ACTIONS
// ============================================================
function startChatEdit(msg, el) {
  if (msg.is_deleted) return;
  
  el.classList.add('editing');
  const bubble = el.querySelector('.chat-msg-bubble');
  const originalText = msg.message;
  
  const editForm = document.createElement('div');
  editForm.className = 'chat-msg-edit-form';
  editForm.innerHTML = `
    <input class="chat-msg-edit-input" type="text" value="${originalText}" maxlength="500">
    <div class="chat-msg-edit-actions">
      <button class="chat-msg-edit-save">Save</button>
      <button class="chat-msg-edit-cancel">Cancel</button>
    </div>
  `;
  
  bubble.style.display = 'none';
  el.appendChild(editForm);
  
  const input = editForm.querySelector('.chat-msg-edit-input');
  input.focus();
  input.select();
  
  editForm.querySelector('.chat-msg-edit-save').addEventListener('click', async () => {
    const newText = input.value.trim();
    if (newText && newText !== originalText) {
      const updated = await updatePrivateMessage(msg.id, newText);
      if (updated) {
        msg.message = updated.message;
        msg.is_edited = updated.is_edited;
        renderChatMessages();
        showToast('✎ Message edited');
      }
    } else {
      renderChatMessages();
    }
  });
  
  editForm.querySelector('.chat-msg-edit-cancel').addEventListener('click', () => {
    renderChatMessages();
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      editForm.querySelector('.chat-msg-edit-save').click();
    } else if (e.key === 'Escape') {
      editForm.querySelector('.chat-msg-edit-cancel').click();
    }
  });
}

async function handleChatDelete(msg) {
  if (msg.is_deleted) return;
  
  const confirmed = confirm('Delete this message? It will be removed for both of you.');
  if (!confirmed) return;
  
  const result = await deletePrivateMessage(msg.id);
  if (result) {
    msg.is_deleted = result.is_deleted;
    msg.message = result.message;
    renderChatMessages();
    showToast('🗑️ Message deleted');
  }
}

async function openChatPanel() {
  chatPanel.classList.add('visible');
  // If no current conversation, show the list
  if (!state.currentConvId) {
    chatConversationsList.style.display = 'block';
    chatDetail.style.display = 'none';
  } else {
    chatConversationsList.style.display = 'none';
    chatDetail.style.display = 'flex';
  }
  // Refresh conversations from server to get latest messages
  await loadChatData();
  if (state.currentConvId) {
    loadChatHistory();
  }
}

function closeChatPanel() {
  chatPanel.classList.remove('visible');
}

async function loadChatData() {
  const allMessages = await loadConversations();
  state.unreadCount = await getUnreadCount();
  updateChatBadge();
  
  // Build conversation list from messages
  const convMap = new Map();
  allMessages.forEach(msg => {
    const convId = msg.conversation_id;
    if (!convMap.has(convId)) {
      const otherId = msg.sender_id === state.sessionId ? msg.recipient_id : msg.sender_id;
      const otherName = msg.sender_id === state.sessionId ? msg.recipient_name : msg.sender_name;
      convMap.set(convId, {
        conversation_id: convId,
        otherUserId: otherId,
        otherUserName: otherName,
        lastMessage: msg.message,
        lastTime: msg.created_at,
        unread: !msg.is_read && msg.recipient_id === state.sessionId ? 1 : 0
      });
    } else {
      const existing = convMap.get(convId);
      if (new Date(msg.created_at) > new Date(existing.lastTime)) {
        existing.lastMessage = msg.message;
        existing.lastTime = msg.created_at;
      }
      if (!msg.is_read && msg.recipient_id === state.sessionId) {
        existing.unread = (existing.unread || 0) + 1;
      }
    }
  });
  
  state.chatConversations = Array.from(convMap.values());
  renderConversations();
}

function renderConversations() {
  chatConversationsList.innerHTML = '';
  if (state.chatConversations.length === 0) {
    chatConversationsList.innerHTML = '<div class="chat-convs-empty">No conversations yet. Click "Private Message" on a star to start chatting!</div>';
    return;
  }
  state.chatConversations.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'chat-conv-item';
    const time = new Date(conv.lastTime);
    const timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const unreadBadge = conv.unread > 0 ? `<span class="chat-conv-unread">${conv.unread}</span>` : '';
    item.innerHTML = `
      <div class="chat-conv-avatar">${conv.otherUserName.charAt(0).toUpperCase()}</div>
      <div class="chat-conv-info">
        <div class="chat-conv-name">${conv.otherUserName}</div>
        <div class="chat-conv-preview">${conv.lastMessage}</div>
      </div>
      <div class="chat-conv-meta">
        <div class="chat-conv-time">${timeStr}</div>
        ${unreadBadge}
      </div>
    `;
    item.addEventListener('click', () => {
      state.currentConvId = conv.conversation_id;
      state.chatPartnerId = conv.otherUserId;
      state.chatPartnerName = conv.otherUserName;
      chatDetailName.textContent = conv.otherUserName;
      chatConversationsList.style.display = 'none';
      chatDetail.style.display = 'flex';
      loadChatHistory();
    });
    chatConversationsList.appendChild(item);
  });
}

async function updateUnreadCount() {
  state.unreadCount = await getUnreadCount();
  updateChatBadge();
}

function updateChatBadge() {
  if (state.unreadCount > 0) {
    chatBadge.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
    chatBadge.style.display = 'flex';
  } else {
    chatBadge.style.display = 'none';
  }
}

// ============================================================
// RAYCASTER & EVENT HANDLERS
// ============================================================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredStar = null;
let touchStartPos = { x: 0, y: 0 };
let isTouching = false;

renderer.domElement.addEventListener('click', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  handleStarClick();
});

renderer.domElement.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  touchStartPos.x = touch.clientX;
  touchStartPos.y = touch.clientY;
  isTouching = true;
  pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

renderer.domElement.addEventListener('touchend', (e) => {
  if (!isTouching) return;
  isTouching = false;
  const touch = e.changedTouches[0];
  const dx = Math.abs(touch.clientX - touchStartPos.x);
  const dy = Math.abs(touch.clientY - touchStartPos.y);
  if (dx < 15 && dy < 15) {
    handleStarClick();
  }
}, { passive: true });

renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
});

function handleStarClick() {
  if (state.transitioning) return;
  if (state.isExploring) {
    stopExplore();
  }
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(starGroup.children);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const msg = state.starDataMap.get(hit.uuid);
    if (msg) {
      animateToStar(msg, hit);
    }
  }
}

function animateToStar(msg, hit) {
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

renderer.domElement.addEventListener('click', () => {
  if (state.isExploring) {
    stopExplore();
  }
});

// ============================================================
// SOUND
// ============================================================
let audioCtx = null;
let bgAudio = null;
let soundInitialized = false;
const SOUND_FILES = ['sound/sv-sound.mp3', 'sound/sv2-sound.mp3'];

async function initAudio() {
  if (soundInitialized) return;
  try {
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    soundInitialized = true;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {});
    }
    startBgMusic();
  } catch (e) {
    console.warn('Audio context creation failed:', e);
  }
}

function startBgMusic() {
  if (!state.soundOn) return;
  if (bgAudio) {
    if (bgAudio.paused) {
      bgAudio.play().catch(() => {
        bgAudio = null;
        loadBgMusic(0);
      });
    }
    return;
  }
  loadBgMusic(0);
}

function loadBgMusic(index) {
  if (index >= SOUND_FILES.length) return;
  try {
    bgAudio = new Audio(SOUND_FILES[index]);
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
    bgAudio.play().catch(() => {
      bgAudio = null;
      loadBgMusic(index + 1);
    });
  } catch {
    loadBgMusic(index + 1);
  }
}

function stopBgMusic() {
  if (bgAudio) {
    try {
      bgAudio.pause();
      bgAudio.currentTime = 0;
    } catch {}
  }
}

async function playChime() {
  if (!audioCtx || !state.soundOn) return;
  try {
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {});
    }
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    osc.type = 'sine';
    osc2.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(880 + Math.random() * 440, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    osc2.frequency.setValueAtTime(1320 + Math.random() * 220, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.08);
    const gain = audioCtx.createGain();
    const gain2 = audioCtx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(audioCtx.destination);
    gain2.connect(audioCtx.destination);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.8);
    osc2.stop(now + 0.5);
  } catch (e) {}
}

async function playCommentChime() {
  if (!audioCtx || !state.soundOn) return;
  try {
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {});
    }
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(1320, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(1560, now + 0.15);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {}
}

btnSound.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  const soundText = document.getElementById('sound-text');
  if (soundText) {
    soundText.textContent = state.soundOn ? 'Sound' : 'Mute';
  }
  if (state.soundOn) {
    if (audioCtx) startBgMusic();
    else initAudio();
  } else {
    stopBgMusic();
  }
});

// ============================================================
// EXPLORE
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
  state.exploredStarIds = new Set();
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
  const unvisited = visible.filter(s => {
    const m = state.starDataMap.get(s.uuid);
    return m && !state.exploredStarIds.has(m.id);
  });
  if (unvisited.length === 0) {
    showToast('✦ You\'ve explored all visible stars! Click Explore again to restart.');
    stopExplore();
    return;
  }
  const star = unvisited[Math.floor(Math.random() * unvisited.length)];
  const msg = state.starDataMap.get(star.uuid);
  if (!msg) { scheduleExplore(); return; }
  state.exploredStarIds.add(msg.id);
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
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const name = nameInput.value.trim();
  const emotion = emotionCat.value;

  await initAudio();

  const newStar = await saveMessage(text, name, emotion);
  if (newStar) {
    state.messages.unshift(newStar);
    state.myStarIds.add(newStar.id);

    buildStars();
    buildFilterPills();

    landingScreen.classList.add('hidden');
    hud.style.display = 'flex';
    state.isNewUser = false;

    input.value = '';
    nameInput.value = '';
  }
});

// ============================================================
// SKIP LANDING
// ============================================================
skipBtn.addEventListener('click', () => {
  localStorage.setItem('soulverse_landing_dismissed', 'true');
  landingScreen.classList.add('hidden');
  hud.style.display = 'flex';
  if (state.messages.length > 0) {
    showToast('✦ Welcome to the galaxy! Click on any star to explore.');
  } else {
    showToast('✦ The galaxy is empty... Be the first to share your emotion!');
  }
});

// ============================================================
// BACK
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
// REFRESH
// ============================================================
btnRefresh.addEventListener('click', async () => {
  closeModal();
  stopExplore();
  controls.autoRotate = true;
  camera.position.set(0, 60, 140);
  controls.target.set(0, 0, 0);
  controls.update();
  state.currentFilter = null;

  const stars = await loadMessages();
  state.messages = stars;
  state.myStarIds = new Set();
  state.messages.forEach(msg => {
    if (msg.user_id === state.sessionId) {
      state.myStarIds.add(msg.id);
    }
  });

  buildFilterPills();
  buildStars();
  showToast('✦ Galaxy refreshed from server');
});

// ============================================================
// DELETE CONFIRM MODAL
// ============================================================
let pendingDeleteStarId = null;
let pendingDeleteStarMsg = null;

function showDeleteConfirm(msg) {
  pendingDeleteStarId = msg.id;
  pendingDeleteStarMsg = msg;
  deleteConfirmPreview.textContent = `"${msg.text.length > 80 ? msg.text.substring(0, 80) + '...' : msg.text}"`;
  deleteConfirmModal.classList.add('visible');
  deleteConfirmBackdrop.classList.add('visible');
}

function hideDeleteConfirm() {
  deleteConfirmModal.classList.remove('visible');
  deleteConfirmBackdrop.classList.remove('visible');
  pendingDeleteStarId = null;
  pendingDeleteStarMsg = null;
}

deleteConfirmCancel.addEventListener('click', hideDeleteConfirm);
deleteConfirmBackdrop.addEventListener('click', hideDeleteConfirm);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && deleteConfirmModal.classList.contains('visible')) {
    hideDeleteConfirm();
  }
});

deleteConfirmDelete.addEventListener('click', async () => {
  if (!pendingDeleteStarId) return;
  const msg = pendingDeleteStarMsg;
  const success = await deleteMessage(msg.id);
  if (success) {
    closeModal();
    closeMyStars();
    buildStars();
    buildFilterPills();
    renderMyStars();
    showToast('💫 Star deleted from the galaxy');
  }
  hideDeleteConfirm();
});

// ============================================================
// MY STARS
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

  myStars.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  myStars.forEach(msg => {
    const item = document.createElement('div');
    item.className = 'mystar-item';
    item.dataset.id = msg.id;

    const icon = EMOTION_ICONS[msg.emotion] || '✦';
    const date = new Date(msg.created_at);

    item.innerHTML = `
      <div class="mystar-item-icon">${icon}</div>
      <div class="mystar-item-body">
        <div class="mystar-item-text">${msg.text}</div>
        <div class="mystar-item-meta">
          <span>${msg.emotion}</span>
          <span>${date.toLocaleDateString()}</span>
          <span>✦ ${msg.likes || 0}</span>
        </div>
      </div>
      <div class="mystar-item-actions">
        <button class="mystar-edit-btn" title="Edit">✎</button>
        <button class="mystar-delete-btn" title="Delete">🗑️</button>
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
      showDeleteConfirm(msg);
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

  body.querySelector('.mystar-save-btn').addEventListener('click', async () => {
    const newText = input.value.trim();
    if (newText && newText !== originalText) {
      const updated = await updateMessage(msg.id, newText);
      if (updated) {
        msg.text = updated.text;
        buildStars();
        showToast('✎ Star updated!');
      }
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

    const pulseSpeed = isMyStar ? 2.0 : 1.5;
    const pulseAmount = isMyStar ? 0.25 : 0.2;
    const basePulse = 1.0 + pulseAmount * Math.sin(state.animTime * pulseSpeed + ud.phase);
    
    const floatSpeed = isMyStar ? 1.0 : 0.6;
    const floatAmount = isMyStar ? 2.0 : 0.6;
    if (msg && msg._pos) {
      sprite.position.y = msg._pos.y + Math.sin(state.animTime * floatSpeed + ud.phase) * floatAmount;
    }

    if (hoveredStar === sprite) {
      sprite.scale.setScalar(ud.baseScale * 2.8);
      sprite.material.opacity = 1.0;
    } else {
      const targetScale = ud.baseScale * (0.9 + 0.15 * Math.sin(state.animTime * 3 + ud.phase));
      sprite.scale.setScalar(targetScale);
      sprite.material.opacity = 0.85 + 0.15 * Math.sin(state.animTime * 2.5 + ud.phase);
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

  updateFallingStars();
  controls.update();
  composer.render();
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================
function setupRealtimeSubscriptions() {
  supabase
    .channel('stars-realtime')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'stars' },
      async (payload) => {
        const newStar = payload.new;
        if (newStar.user_id === state.sessionId) return;

        const exists = state.messages.some(m => m.id === newStar.id);
        if (exists) return;

        state.messages.unshift(newStar);
        if (newStar.user_id === state.sessionId) {
          state.myStarIds.add(newStar.id);
        }

        buildStars();
        buildFilterPills();

        if (state.soundOn) {
          await initAudio();
          playChime();
        }

        const name = newStar.name || 'Someone';
        showToast(`✦ ${name} shared a ${newStar.emotion} emotion!`);
      }
    )
    .subscribe();

  supabase
    .channel('comments-realtime')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      async (payload) => {
        const newComment = payload.new;
        if (newComment.user_id === state.sessionId) return;

        if (state.soundOn) {
          await initAudio();
          playCommentChime();
        }

        if (currentModalMsgId === newComment.star_id) {
          const exists = currentModalComments.some(c => c.id === newComment.id);
          if (!exists) {
            currentModalComments.push(newComment);
            renderComments(currentModalComments);
          }
        }

        const name = newComment.name || 'Someone';
        showToast(`💬 ${name} left a message on a star`);
      }
    )
    .subscribe();


  supabase
    .channel('private-messages-realtime')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'private_messages' },
      async (payload) => {
        const newMsg = payload.new;
        // Skip our own messages (we already added them locally)
        if (newMsg.sender_id === state.sessionId) return;
        // Only process messages that involve us
        if (newMsg.recipient_id !== state.sessionId) return;

        // If we're currently viewing this conversation, add the message live
        if (state.currentConvId === newMsg.conversation_id) {
          state.chatMessages.push(newMsg);
          renderChatMessages();
          await markMessagesAsRead(state.currentConvId);
          await updateUnreadCount();
        } else {
          // Refresh conversation list and update badge
          await loadChatData();
          state.unreadCount++;
          updateChatBadge();
          showToast(`💬 ${newMsg.sender_name} sent you a private message`);
        }
      }
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'private_messages' },
      async (payload) => {
        const updatedMsg = payload.new;
        if (updatedMsg.recipient_id !== state.sessionId && updatedMsg.sender_id !== state.sessionId) return;

        // Update the message in the local state
        const idx = state.chatMessages.findIndex(m => m.id === updatedMsg.id);
        if (idx !== -1) {
          state.chatMessages[idx] = updatedMsg;
          if (state.currentConvId === updatedMsg.conversation_id) {
            renderChatMessages();
          }
        }

        // Also update in conversations list
        const convIdx = state.chatConversations.findIndex(c => c.conversation_id === updatedMsg.conversation_id);
        if (convIdx !== -1 && !updatedMsg.is_deleted) {
          state.chatConversations[convIdx].lastMessage = updatedMsg.message;
          renderConversations();
        }
      }
    )
    .subscribe();
}

// ============================================================
// NEW STAR POLLING
// ============================================================
function startNewStarPolling() {
  if (state.newStarPollTimer) {
    clearTimeout(state.newStarPollTimer);
  }

  async function pollForNewStars() {
    try {
      if (!state.lastKnownStarTimestamp) {
        state.lastKnownStarTimestamp = Date.now();
      }

      const afterDate = new Date(state.lastKnownStarTimestamp).toISOString();
      const { data: newStars, error } = await supabase
        .from('stars')
        .select('*')
        .gt('created_at', afterDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (newStars && newStars.length > 0) {
        const trulyNew = newStars.filter(ns => {
          const exists = state.messages.some(m => m.id === ns.id);
          return !exists;
        });

        if (trulyNew.length > 0) {
          for (const newStar of trulyNew) {
            if (newStar.user_id === state.sessionId) continue;

            state.messages.unshift(newStar);
            if (newStar.user_id === state.sessionId) {
              state.myStarIds.add(newStar.id);
            }

            buildStars();
            buildFilterPills();

            if (state.soundOn) {
              await initAudio();
              playChime();
            }

            const name = newStar.name || 'Someone';
            showToast(`✦ ${name} shared a ${newStar.emotion} emotion!`);
          }
        }

        const latest = new Date(newStars[0].created_at).getTime();
        if (latest > state.lastKnownStarTimestamp) {
          state.lastKnownStarTimestamp = latest + 1;
        }
      }
    } catch (err) {}

    state.newStarPollTimer = setTimeout(pollForNewStars, 4000);
  }

  state.newStarPollTimer = setTimeout(pollForNewStars, 2000);
}

// ============================================================
// SUPPORT DEVELOPER TOGGLE
// ============================================================
function setupSupportToggle() {
  const supportToggle = document.getElementById('support-toggle');
  const supportContent = document.getElementById('support-content');
  const supportArrow = document.querySelector('.support-toggle .arrow');

  if (supportToggle && supportContent) {
    let isOpen = false;
    supportToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      if (isOpen) {
        supportContent.classList.add('visible');
        if (supportArrow) supportArrow.classList.add('open');
      } else {
        supportContent.classList.remove('visible');
        if (supportArrow) supportArrow.classList.remove('open');
      }
    });
  }
}

// ============================================================
// INIT
// ============================================================
async function init() {
  await initializeApp();
  setupRealtimeSubscriptions();
  startNewStarPolling();
  startFallingStarSpawner();
  setupSupportToggle();

  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 1500);

  animate();

  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { once: true });
}

init();
