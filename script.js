let currentTheme = 'night';
let currentMode = 'tree'; // 'tree', 'search', or 'random'
let eyeStates = {}; // Remembers open/close eye state per question
let randomQueue = [];
let activeMenuQnId = null;

const sheetContainer = document.getElementById('sheetContainer');
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const homeBtn = document.getElementById('homeBtn');
const randomBtn = document.getElementById('randomBtn');
const themeBtn = document.getElementById('themeBtn');

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  renderTopicTree();
  setupEventListeners();
});

function setupEventListeners() {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    searchClearBtn.style.display = val ? 'block' : 'none';
    if (val) {
      handleSearch(val);
    } else {
      renderTopicTree();
    }
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    renderTopicTree();
    searchInput.focus();
  });

  homeBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    renderTopicTree();
  });

  randomBtn.addEventListener('click', handleRandomQuestion);
  themeBtn.addEventListener('click', toggleTheme);

  // Close menus or modal dialogs when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-options-dropdown') && !e.target.closest('.three-dots-btn')) {
      closeGlobalMenu();
    }
    if (e.target.classList.contains('info-modal-backdrop') || e.target.classList.contains('modal-close-btn')) {
      closeInfoModal();
    }
  });

  // Reposition or close menu on scroll or resize
  window.addEventListener('scroll', closeGlobalMenu, true);
  window.addEventListener('resize', closeGlobalMenu);
}

function renderTopicTree() {
  currentMode = 'tree';
  sheetContainer.className = 'sheet-container tree-mode';
  sheetContainer.innerHTML = '';

  sheetData.forEach(topic => {
    const topicCard = document.createElement('div');
    topicCard.className = 'topic-card';

    const topicHeader = document.createElement('div');
    topicHeader.className = 'topic-header';
    topicHeader.innerHTML = `
      <span class="topic-title">${topic.topicTitle}</span>
      <span class="chevron-icon">▼</span>
    `;
    topicHeader.addEventListener('click', () => {
      topicCard.classList.toggle('open');
    });

    const qnsWrapper = document.createElement('div');
    qnsWrapper.className = 'questions-wrapper';

    topic.questions.forEach(qn => {
      const qnNode = createQuestionNode(qn);
      qnsWrapper.appendChild(qnNode);
    });

    topicCard.appendChild(topicHeader);
    topicCard.appendChild(qnsWrapper);
    sheetContainer.appendChild(topicCard);
  });
}

function createQuestionNode(qn) {
  const node = document.createElement('div');
  node.className = 'question-node';
  node.dataset.qnId = qn.id;

  const isOpen = !!eyeStates[qn.id];

  node.innerHTML = `
    <div class="question-row">
      <div class="question-info">
        <span class="qn-number">${qn.id}</span>
        <span class="qn-title" title="${qn.title}">${qn.title}</span>
      </div>
      <div class="question-actions">
        <button class="three-dots-btn" title="Question Options">⋮</button>
      </div>
    </div>
    <div class="solution-block ${isOpen ? 'visible' : ''}">
      <div class="solution-arrow">↓ Solution Details ↓</div>
      <div class="solution-images-list">
        ${qn.solutionImages.map((img, idx) => {
          const imgSrc = typeof img === 'string' ? img : img.src;
          const imgAlt = (typeof img === 'object' && img.alt) ? img.alt : `Solution Step ${idx + 1}`;
          return `
            <div class="solution-img-wrapper">
              <img src="${imgSrc}" alt="${imgAlt}" class="solution-img" loading="lazy" />
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Three-dots menu click event
  const threeDotsBtn = node.querySelector('.three-dots-btn');
  threeDotsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleGlobalMenu(qn, threeDotsBtn, node);
  });

  return node;
}

/* Dynamic Global Body Menu (Bypasses parent stacking contexts) */
function toggleGlobalMenu(qn, buttonEl, qnNode) {
  if (activeMenuQnId === qn.id) {
    closeGlobalMenu();
    return;
  }

  closeGlobalMenu();
  activeMenuQnId = qn.id;

  const isOpen = !!eyeStates[qn.id];
  const closedEyeSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  const openEyeSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

  const hasYtLink = qn.ytUrl && qn.ytUrl !== '#';
  const hasPlatformLink = qn.platform && qn.platform !== '*' && qn.platformUrl && qn.platformUrl !== '#';
  const logoSrc = qn.platform === 'LeetCode' ? 'Leetcode_Logo.png' : 'GFG_Logo.png';

  const menuHtml = `
    <div class="global-options-dropdown" id="globalMenu">
      <button class="menu-item info-option" title="Question Info">
        <img src="Info-logo.png" alt="Info Logo" class="menu-icon" />
        <span class="menu-label">Question Info</span>
      </button>
      ${hasYtLink ? `
        <a href="${qn.ytUrl}" target="_blank" rel="noopener" class="menu-item yt-option" title="Watch Video">
          <img src="You-Tube-logo.png" alt="YouTube Logo" class="menu-platform-img" />
          <span class="menu-label">YouTube</span>
        </a>
      ` : ''}
      <button class="menu-item eye-option ${isOpen ? 'active' : ''}">
        <span class="menu-icon eye-svg-container">${isOpen ? openEyeSvg : closedEyeSvg}</span>
        <span class="menu-label">${isOpen ? 'Hide Solution' : 'View Solution'}</span>
      </button>
      ${hasPlatformLink ? `
        <a href="${qn.platformUrl}" target="_blank" rel="noopener" class="menu-item platform-option">
          <img src="${logoSrc}" alt="${qn.platform} Logo" class="menu-platform-img" />
          <span class="menu-label">${qn.platform}</span>
        </a>
      ` : ''}
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', menuHtml);
  const globalMenu = document.getElementById('globalMenu');

  // Position relative to screen viewport
  const rect = buttonEl.getBoundingClientRect();
  const menuWidth = 180;
  let topPos = rect.bottom + 6;
  let leftPos = rect.right - menuWidth;

  if (leftPos < 10) leftPos = 10;
  
  globalMenu.style.top = `${topPos}px`;
  globalMenu.style.left = `${leftPos}px`;
  globalMenu.classList.add('show');

  // Info Button Handler
  globalMenu.querySelector('.info-option').addEventListener('click', (e) => {
    e.stopPropagation();
    closeGlobalMenu();
    openInfoModal(qn);
  });

  // Solution Eye Toggle Handler
  globalMenu.querySelector('.eye-option').addEventListener('click', (e) => {
    e.stopPropagation();
    eyeStates[qn.id] = !eyeStates[qn.id];
    const solutionBlock = qnNode.querySelector('.solution-block');
    
    if (eyeStates[qn.id]) {
      solutionBlock.classList.add('visible');
    } else {
      solutionBlock.classList.remove('visible');
    }
    closeGlobalMenu();
  });
}

function closeGlobalMenu() {
  const menu = document.getElementById('globalMenu');
  if (menu) menu.remove();
  activeMenuQnId = null;
}

function openInfoModal(qn) {
  closeInfoModal();
  const infoText = qn.info || "No extra information or notes provided for this question.";

  const modalHtml = `
    <div class="info-modal-backdrop">
      <div class="info-modal-card">
        <div class="modal-header">
          <span class="modal-title">ℹ️ Question Details</span>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <h4 class="modal-qn-heading">#${qn.id} - ${qn.title}</h4>
          <p class="modal-qn-info">${infoText}</p>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeInfoModal() {
  const modal = document.querySelector('.info-modal-backdrop');
  if (modal) modal.remove();
}

function getAllQuestions() {
  const all = [];
  sheetData.forEach(t => all.push(...t.questions));
  return all;
}

function handleSearch(query) {
  currentMode = 'search';
  sheetContainer.className = 'sheet-container flat-mode';
  sheetContainer.innerHTML = '';

  const cleanQuery = query.toLowerCase().trim();
  const allQns = getAllQuestions();

  const exactNumMatch = cleanQuery.replace('#', '');
  if (!isNaN(exactNumMatch) && exactNumMatch !== '') {
    const targetId = parseInt(exactNumMatch, 10);
    const match = allQns.find(q => q.id === targetId);
    if (match) {
      sheetContainer.appendChild(createQuestionNode(match));
      return;
    }
  }

  const matched = [];
  allQns.forEach(qn => {
    const titleLower = qn.title.toLowerCase();
    let score = 0;

    if (titleLower === cleanQuery) score += 100;
    else if (titleLower.startsWith(cleanQuery)) score += 50;
    else if (titleLower.includes(cleanQuery)) score += 20;
    else if (cleanQuery.includes(titleLower)) score += 15;
    else {
      const queryWords = cleanQuery.split(/\s+/);
      queryWords.forEach(w => {
        if (w.length >= 3 && titleLower.includes(w.substring(0, 4))) {
          score += 10;
        }
      });
    }

    if (score > 0) {
      matched.push({ question: qn, score });
    }
  });

  matched.sort((a, b) => b.score - a.score);

  if (matched.length > 0) {
    matched.forEach(item => {
      sheetContainer.appendChild(createQuestionNode(item.question));
    });
  } else {
    sheetContainer.innerHTML = `<div class="no-results">No matching questions found</div>`;
  }
}

function handleRandomQuestion() {
  currentMode = 'random';
  sheetContainer.className = 'sheet-container flat-mode';
  sheetContainer.innerHTML = '';

  const allQns = getAllQuestions();
  if (allQns.length === 0) return;

  if (randomQueue.length === 0) {
    randomQueue = [...allQns].sort(() => Math.random() - 0.5);
  }

  const randomQn = randomQueue.pop();
  sheetContainer.appendChild(createQuestionNode(randomQn));
}

function toggleTheme() {
  if (currentTheme === 'night') {
    currentTheme = 'day';
    document.documentElement.setAttribute('data-theme', 'day');
    themeBtn.innerHTML = `<span class="btn-icon">☀️</span> <span class="btn-text" id="themeLabel">Day</span>`;
  } else {
    currentTheme = 'night';
    document.documentElement.setAttribute('data-theme', 'night');
    themeBtn.innerHTML = `<span class="btn-icon">🌙</span> <span class="btn-text" id="themeLabel">Night</span>`;
  }
}
