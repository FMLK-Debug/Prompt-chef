/* ============================================================
   Prompt Chef — app logic
   Vanilla JS. State lives in one object; the DOM is re-rendered
   from it on every change.
   ============================================================ */

'use strict';

/* ---------- The six ingredients ---------- */

const INGREDIENTS = [
  {
    id: 'role',
    name: 'Role',
    emoji: '🎭',
    desc: 'Who is doing the talking?',
    placeholder: 'e.g. A patient but witty tour guide at a science museum'
  },
  {
    id: 'context',
    name: 'Context',
    emoji: '🧾',
    desc: 'Where and for whom?',
    placeholder: 'e.g. Visitors are 10-year-olds on a school field trip'
  },
  {
    id: 'task',
    name: 'Task',
    emoji: '🎯',
    desc: 'What should actually happen?',
    placeholder: 'e.g. Explain how a black hole forms and why it is so weird'
  },
  {
    id: 'format',
    name: 'Format',
    emoji: '🍽️',
    desc: 'How should the answer look?',
    placeholder: 'e.g. A 3-bullet list, one surprising fact per bullet'
  },
  {
    id: 'tone',
    name: 'Tone',
    emoji: '🎨',
    desc: 'How should it sound?',
    placeholder: 'e.g. Playful and curious, like a big sibling explaining'
  },
  {
    id: 'constraints',
    name: 'Constraints',
    emoji: '🔒',
    desc: 'Any rules or limits?',
    placeholder: 'e.g. Under 120 words, no emojis, end with a question'
  }
];

const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

/* ---------- State ---------- */

/** Keep only recipes that look like recipes, and fill in anything missing. */
function normaliseCookbook(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((r) => r && typeof r === 'object' && r.values && typeof r.values === 'object')
    .map((r) => ({
      id: String(r.id ?? `r${Math.random().toString(36).slice(2, 9)}`),
      title: String(r.title || 'Untitled recipe'),
      stamp: String(r.stamp || '🍲'),
      values: { ...r.values },
      filled: Number(r.filled) || 0,
      words: Number(r.words) || 0,
      level: ['perfect', 'spicy', 'bland'].includes(r.level) ? r.level : 'bland',
      time: String(r.time || '')
    }));
}

/* ---------- Example recipes (show up in a fresh cookbook) ---------- */

const EXAMPLE_RECIPES = [
  {
    id: 'example-black-hole',
    title: 'Explain a black hole to kids',
    stamp: '🎯',
    values: {
      role: 'A patient but witty tour guide at a science museum',
      context: 'Visitors are 10-year-olds on a school field trip',
      task: 'Explain how a black hole forms and why it is so weird',
      format: 'A 3-bullet list, one surprising fact per bullet',
      tone: 'Playful and curious, like a big sibling explaining',
      constraints: 'Under 120 words, no emojis, end with a question'
    }
  },
  {
    id: 'example-password-email',
    title: 'Write a password reset email',
    stamp: '🎯',
    values: {
      role: 'A friendly IT support engineer',
      context: 'Writing to a non-technical employee who forgot their password',
      task: 'Write a password reset email with clear steps',
      format: 'A subject line, 3 numbered steps, and one support contact line',
      tone: 'Calm, helpful and reassuring',
      constraints: 'No jargon, under 100 words, never ask for the password'
    }
  },
  {
    id: 'example-phishing',
    title: 'Spot a phishing email',
    stamp: '🎯',
    values: {
      role: 'A cybersecurity trainer',
      context: 'Explaining email safety to elderly parents who use email every day',
      task: 'Explain how to spot a phishing email',
      format: '3 warning signs, then 1 action to take',
      tone: 'Simple, patient and not scary',
      constraints: 'Under 90 words, no technical terms'
    }
  },
  {
    id: 'example-python-plan',
    title: '7-day Python revision plan',
    stamp: '🎯',
    values: {
      role: 'An experienced computer science tutor',
      context: 'A first-year student with 7 days left before a Python basics exam',
      task: 'Create a 7-day revision plan for Python basics',
      format: 'A table with Day, Topic and a 30-minute task',
      tone: 'Encouraging but realistic',
      constraints: '2 hours per day, one rest day, no new topics after day 5'
    }
  },
  {
    id: 'example-coffee-caption',
    title: 'Coffee shop Instagram caption',
    stamp: '🎯',
    values: {
      role: 'A witty social media manager for a campus coffee shop',
      context: 'Posting a photo of cold coffee on a rainy Monday',
      task: 'Write an Instagram caption that makes students want to visit',
      format: 'One short caption and 3 hashtags',
      tone: 'Fun, warm and slightly dramatic',
      constraints: "Under 40 words, no clichés like 'best coffee in town'"
    }
  }
];

EXAMPLE_RECIPES.forEach((r) => {
  const prompt = buildPrompt(r.values).trim();
  r.filled = 6;
  r.words = prompt ? prompt.split(/\s+/).length : 0;
  r.level = 'perfect';
  r.time = 'Example';
});

const state = {
  pot: {},                                  // { role: 'text', ... } — only keys sitting in the pot
  cookbook: normaliseCookbook(loadJSON('prompt-chef.cookbook.v1', []))
};

/* ---------- Tiny DOM helpers ---------- */

const $ = (sel) => document.querySelector(sel);

const els = {
  pantryList: $('#pantry-list'),
  potDrop: $('#pot-drop'),
  potItems: $('#pot-items'),
  potCount: $('#pot-count'),
  clearPot: $('#clear-pot'),
  output: $('#prompt-output'),
  wordCount: $('#word-count'),
  flavor: $('#flavor'),
  flavorBadge: $('#flavor-badge'),
  flavorFill: $('#flavor-fill'),
  flavorNote: $('#flavor-note'),
  serve: $('#serve'),
  surprise: $('#surprise'),
  save: $('#save'),
  cookbookList: $('#cookbook-list'),
  cookbookHint: $('#cookbook-hint'),
  loadExamples: $('#load-examples'),
  toast: $('#toast'),
  live: $('#kitchen-live')
};

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Persistence (local state, politely) ---------- */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / storage disabled — the app still works, just forgets */
  }
}

/* ---------- Prompt composition ---------- */

/** Stitch the filled ingredients into one clean, well-written prompt. */
function buildPrompt(values = state.pot) {
  const v = values;
  const get = (id) => (v[id] || '').trim().replace(/\s+/g, ' ');

  const parts = [];
  if (get('role'))        parts.push(`Act as ${get('role')}.`);
  if (get('context'))     parts.push(`Context: ${get('context')}.`);
  if (get('task'))        parts.push(`Task: ${get('task')}.`);
  if (get('format'))      parts.push(`Format: ${get('format')}.`);
  if (get('tone'))        parts.push(`Tone: ${get('tone')}.`);
  if (get('constraints')) parts.push(`Constraints: ${get('constraints')}.`);

  return parts.join('\n\n');
}

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * Flavor rules:
 *   Too spicy — prompt is over 150 words
 *   Perfect   — Task is filled and 4+ ingredients are in play
 *   Bland     — anything else (empty pot, no Task, other parts missing)
 */
function evaluateFlavor(prompt) {
  const filled = INGREDIENTS.filter((i) => (state.pot[i.id] || '').trim()).length;
  const inPot = Object.keys(state.pot).length;
  const words = countWords(prompt);
  const hasTask = Boolean((state.pot.task || '').trim());

  if (words > 150) {
    return {
      level: 'spicy', words, filled, pct: 100,
      note: `${words} words — ${words - 150} over the limit. Trim it down or the flavor gets lost.`
    };
  }

  if (hasTask && filled >= 4) {
    const left = 6 - filled;
    return {
      // starts exactly on the meter's "perfect" tick at 75%, climbs to 90% when full
      level: 'perfect', words, filled, pct: 75 + (filled - 4) * 7.5,
      note: `${filled} ingredients, ${words} words.${left > 0 ? ` You could still add ${left}.` : ' Fully loaded — chef’s kiss!'}`
    };
  }

  if (filled === 0) {
    return {
      level: 'bland', words, filled, pct: 6,
      note: inPot === 0
        ? 'The pot is empty — add an ingredient to start.'
        : 'Your ingredients are in the pot but still blank. Fill one in!'
    };
  }

  return {
    level: 'bland', words, filled, pct: 14 + filled * 7,
    note: !hasTask
      ? ('task' in state.pot
        ? 'Task is in the pot but still empty — fill it in.'
        : 'Still bland — every prompt needs a Task.')
      : `Good start. Add ${4 - filled} more ingredient${4 - filled > 1 ? 's' : ''} to reach Perfect.`
  };
}

/* ---------- Rendering: pantry ---------- */

function renderPantry() {
  els.pantryList.innerHTML = INGREDIENTS.map((ing) => {
    const used = ing.id in state.pot;
    return `
      <li>
        <button type="button" class="ingredient${used ? ' is-used' : ''}"
                draggable="true" data-id="${ing.id}"
                aria-pressed="${used}"
                title="${escapeHTML(used ? `${ing.name} is in the pot` : `Add ${ing.name} to the pot`)}">
          <span class="ingredient__emoji" aria-hidden="true">${ing.emoji}</span>
          <span class="ingredient__text">
            <span class="ingredient__name">${ing.name}</span>
            <span class="ingredient__desc">${ing.desc}</span>
          </span>
          <span class="ingredient__check" aria-hidden="true">✓</span>
        </button>
      </li>`;
  }).join('');
}

/* ---------- Rendering: pot ---------- */

function renderPot({ focusId = null } = {}) {
  const inPot = INGREDIENTS.filter((i) => i.id in state.pot);

  els.potItems.innerHTML = inPot.map((ing) => `
    <li class="pot-item" data-id="${ing.id}">
      <span class="pot-item__emoji" aria-hidden="true">${ing.emoji}</span>
      <span class="pot-item__field">
        <label class="pot-item__label" for="field-${ing.id}">${ing.name}</label>
        <input class="pot-item__input" id="field-${ing.id}" type="text"
               data-id="${ing.id}" value="${escapeHTML(state.pot[ing.id])}"
               placeholder="${escapeHTML(ing.placeholder)}"
               autocomplete="off" spellcheck="true"
               draggable="false" />
      </span>
      <button type="button" class="pot-item__remove" data-remove="${ing.id}"
              aria-label="Remove ${ing.name} from the pot" title="Remove ${ing.name}">✕</button>
    </li>`).join('');

  els.potDrop.dataset.empty = String(inPot.length === 0);
  els.potCount.textContent = `${inPot.length} / 6`;
  els.potDrop.setAttribute('aria-label',
    inPot.length ? `Cooking pot with ${inPot.length} ingredients` : 'Cooking pot, empty');

  markFilledItems();
  renderPantry();

  if (focusId) {
    const input = document.getElementById(`field-${focusId}`);
    if (input) input.focus();
  }
}

/** Adds a filled-state ring to pot items that have text. */
function markFilledItems() {
  els.potItems.querySelectorAll('.pot-item').forEach((li) => {
    const input = li.querySelector('.pot-item__input');
    li.classList.toggle('is-filled', Boolean(input.value.trim()));
  });
}

/* ---------- Rendering: preview + flavor ---------- */

function renderPreview() {
  const prompt = buildPrompt();
  els.output.textContent = prompt;

  const f = evaluateFlavor(prompt);
  els.wordCount.textContent = String(f.words);
  els.flavor.dataset.level = f.level;
  els.flavorBadge.textContent = { bland: 'Bland', perfect: 'Perfect', spicy: 'Too spicy' }[f.level];
  els.flavorFill.style.width = `${f.pct}%`;
  els.flavorNote.textContent = f.note;

  const empty = f.filled === 0;
  els.serve.disabled = empty;
  els.save.disabled = empty;
  markFilledItems();

  announce(f);
}

/** Only speak when the summary changes, so typing doesn't flood a screen reader. */
let lastAnnouncement = '';

function announce(f) {
  const summary = `${f.filled} of 6 ingredients, ${f.words} words. Flavor: ${
    { bland: 'Bland', perfect: 'Perfect', spicy: 'Too spicy' }[f.level]}.`;
  if (summary === lastAnnouncement) return;
  lastAnnouncement = summary;
  els.live.textContent = summary;
}

/* ---------- Rendering: cookbook ---------- */

function renderCookbook() {
  const count = state.cookbook.length;
  els.cookbookHint.textContent = count
    ? `${count} saved recipe${count > 1 ? 's' : ''}`
    : 'Saved recipes live here.';

  if (!count) {
    els.cookbookList.innerHTML = `
      <li class="cookbook__empty">
        Nothing saved yet. Cook something tasty and hit <strong>Save to Cookbook</strong>.
      </li>`;
    return;
  }

  els.cookbookList.innerHTML = state.cookbook.map((r) => {
    const badgeClass = r.level === 'perfect' ? 'ok' : r.level === 'spicy' ? 'hot' : '';
    const badgeText = { perfect: 'Perfect', spicy: 'Too spicy', bland: 'Bland' }[r.level];
    return `
      <li class="recipe" data-id="${r.id}">
        <span class="recipe__stamp" aria-hidden="true">${r.stamp}</span>
        <div class="recipe__body">
          <p class="recipe__title" title="${escapeHTML(r.title)}">${escapeHTML(r.title)}</p>
          <div class="recipe__meta">
            <span class="${badgeClass}">${badgeText}</span>
            <span>${r.filled}/6 ingredients</span>
            <span>${r.words} words</span>
            <span>${r.time}</span>
          </div>
        </div>
        <div class="recipe__actions">
          <button type="button" class="recipe__btn" data-load="${r.id}">Load</button>
          <button type="button" class="recipe__btn" data-copy="${r.id}">Copy</button>
          <button type="button" class="recipe__btn recipe__btn--danger" data-delete="${r.id}"
                  aria-label="Delete recipe">✕</button>
        </div>
      </li>`;
  }).join('');
}

/* ---------- Actions ---------- */

function addIngredient(id) {
  if (!INGREDIENT_BY_ID[id] || id in state.pot) return;
  state.pot[id] = '';
  renderPot({ focusId: id });
  renderPreview();
  bumpPot();
}

function removeIngredient(id) {
  if (!(id in state.pot)) return;
  delete state.pot[id];
  renderPot();
  renderPreview();
  const card = els.pantryList.querySelector(`[data-id="${id}"]`);
  if (card) card.focus();
}

function clearPot() {
  if (!Object.keys(state.pot).length) return;
  state.pot = {};
  renderPot();
  renderPreview();
  toast('Pot scrubbed clean 🧽');
}

function fillPrompt(values, { animate = true } = {}) {
  state.pot = {};
  INGREDIENTS.forEach((ing) => {
    if (values[ing.id]) state.pot[ing.id] = values[ing.id];
  });
  renderPot();
  renderPreview();
  if (animate) bumpPot();
}

function saveRecipe() {
  const prompt = buildPrompt();
  if (!prompt) {
    toast('Add some ingredients first 🍲');
    return;
  }
  const f = evaluateFlavor(prompt);
  const titleSource =
    (state.pot.task || '').trim() || (state.pot.role || '').trim() ||
    INGREDIENTS.map((i) => state.pot[i.id]).find((v) => (v || '').trim()) || 'Untitled recipe';

  const title = titleSource.replace(/\s+/g, ' ').slice(0, 70);
  const stampId = 'task' in state.pot ? 'task' : Object.keys(state.pot)[0];

  const entry = {
    id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    title,
    stamp: INGREDIENT_BY_ID[stampId]?.emoji || '🍲',
    values: { ...state.pot },
    filled: f.filled,
    words: f.words,
    level: f.level,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  state.cookbook.unshift(entry);
  state.cookbook = state.cookbook.slice(0, 40);   // the shelf has limits
  saveJSON('prompt-chef.cookbook.v1', state.cookbook);
  renderCookbook();
  toast('Pinned to the cookbook 📖');
  Confetti.burst(...buttonPoint(els.save), 26);
}

function loadRecipe(id) {
  const entry = state.cookbook.find((r) => r.id === id);
  if (!entry) return;
  fillPrompt(entry.values);
  els.output.scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast('Recipe back on the heat 🔥');
}

/** Puts the built-in examples back on the shelf, without duplicates. */
function loadExamples() {
  const have = new Set(state.cookbook.map((r) => r.id));
  const fresh = EXAMPLE_RECIPES.filter((r) => !have.has(r.id));
  if (!fresh.length) {
    toast('Examples are already on the shelf 📖');
    return;
  }
  state.cookbook = normaliseCookbook([...fresh, ...state.cookbook]).slice(0, 40);
  saveJSON('prompt-chef.cookbook.v1', state.cookbook);
  renderCookbook();
  toast('Examples added to the cookbook 📖');
}

function deleteRecipe(id) {
  state.cookbook = state.cookbook.filter((r) => r.id !== id);
  saveJSON('prompt-chef.cookbook.v1', state.cookbook);
  renderCookbook();
}

/* ---------- Clipboard + confetti ---------- */

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the old-school way */ }

  try {   // file:// and older browsers still get a working Copy button
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function buttonPoint(el) {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

async function serve() {
  const prompt = buildPrompt();
  if (!prompt) {
    toast('Nothing to serve yet — add a Task 🍲');
    return;
  }

  const ok = await copyText(prompt);
  Confetti.burst(...buttonPoint(els.serve), ok ? 120 : 40);
  toast(ok ? 'Served! Prompt copied to your clipboard 🎉' : 'Could not reach the clipboard — select the text instead 😅');

  if (ok) {
    els.serve.classList.add('is-served');
    setTimeout(() => els.serve.classList.remove('is-served'), 900);
  } else {
    selectPromptText();   // clipboard blocked: at least hand them the text, selected
  }
}

/** Last resort when the clipboard is blocked (file://, permissions, old browsers). */
function selectPromptText() {
  if (typeof document.createRange !== 'function' || typeof window.getSelection !== 'function') return;
  const range = document.createRange();
  range.selectNodeContents(els.output);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  els.output.focus();
}

/* ---------- Surprise Me ---------- */

const RECIPES = [
  {
    role: 'a grumpy pirate captain who has clearly never heard of fractions',
    context: 'A crew of deckhands aged 8–12 who just stole the good cheese',
    task: 'Teach them how fractions work by splitting a round of stale biscuit into halves, quarters and eighths',
    format: 'A short story, then 3 worked examples using a ship-biscuit diagram in words',
    tone: 'boisterous and funny, with pirate slang, but never mean',
    constraints: 'Under 120 words, no emojis, end with a question that makes them shout an answer'
  },
  {
    role: 'a Michelin-starred chef who explains code as if it were a recipe',
    context: 'A junior developer staring at their first pull request',
    task: 'Explain what a code review actually does and why it is not an attack on their work',
    format: 'A bulleted checklist of 5 things a reviewer looks at',
    tone: 'warm, encouraging, a little bossy',
    constraints: 'Under 150 words, use one cooking metaphor, no jargon without a plain-English gloss'
  },
  {
    role: 'a noir detective narrating in first person',
    context: 'A user who has lost their password for the third time this month',
    task: 'Walk them through resetting their password step by step',
    format: 'A numbered list, max 4 steps, each one a short paragraph',
    tone: 'gritty and weary, with dry humour',
    constraints: 'Never sound condescending, end with a line about the case being closed'
  },
  {
    role: 'a retired astronaut giving a museum tour',
    context: 'A group of schoolchildren who have been standing for 40 minutes',
    task: 'Describe what it actually feels like to float in the International Space Station',
    format: 'Three vivid sensory moments, each 2 sentences',
    tone: 'calm, vivid, genuinely awed',
    constraints: 'No numbers, no dates, under 130 words'
  },
  {
    role: 'a security-conscious ninja reviewing code',
    context: 'A startup shipping a login form next Tuesday',
    task: 'List the three highest-impact security problems to fix before launch',
    format: 'A ranked table: risk, why it matters, one-line fix',
    tone: 'blunt and practical, no fear-mongering',
    constraints: 'Under 150 words, assume no security background, skip acronyms'
  },
  {
    role: 'a very enthusiastic grandmother who runs a book club',
    context: 'A reader who bounced off a 400-page novel twice',
    task: 'Convince them to give the book one more honest chance',
    format: 'A warm letter, 150 words or fewer, with one specific scene to look forward to',
    tone: 'affectionate, nosy, funny',
    constraints: 'No spoilers about the ending, mention tea at least once'
  },
  {
    role: 'a robot poet who is learning what rain is',
    context: 'A curious kid who has just asked why rain is wet',
    task: 'Write a short poem that explains rain without using the word "cloud"',
    format: 'A 6-line poem',
    tone: 'curious, precise, slightly amazed',
    constraints: 'Exactly 6 lines, no rhyme scheme, under 60 words'
  },
  {
    role: 'a stand-up comedian coaching a nervous presenter',
    context: 'A colleague about to demo a new feature to their boss in 5 minutes',
    task: 'Give them a 60-second demo script that lands the punchline',
    format: 'A script with stage directions in brackets',
    tone: 'punchy, encouraging, lightly profane',
    constraints: 'Under 150 words, exactly 3 jokes, no bullet lists'
  }
];

const FILLER = {
  role: ['a museum audio guide voiced by a sleepy cat', 'a seasoned barista and part-time life coach',
    'an archivist from 1890 who somehow knows your name', 'a friendly neighbourhood librarian with strong opinions'],
  context: ['a 20-minute slot, no slides, no jargon', 'someone who has already tried two other tools today',
    'a small team of 4 with no budget', 'a reader skimming on their phone'],
  task: ['turn a messy brainstorm into three clear next steps', 'rewrite a paragraph so it lands with a sceptical reader',
    'name the single biggest mistake in this plan and how to avoid it', 'explain this in one breath, out loud'],
  format: ['a short table with two columns', 'exactly 4 bullet points, one line each',
    'a 100-word explanation followed by a one-line summary', 'a script with stage directions in brackets'],
  tone: ['calm and plain-spoken', 'playful but precise', 'warm, with a dash of dry humour', 'confident and brief'],
  constraints: ['under 90 words', 'no jargon, no acronyms', 'end with one concrete next step',
    'no emojis, one bold takeaway', 'assume a smart reader who is short on time']
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function randomRecipe() {
  if (Math.random() < 0.6) return pick(RECIPES);
  return Object.fromEntries(INGREDIENTS.map((i) => [i.id, pick(FILLER[i.id])]));
}

function surpriseMe() {
  fillPrompt(randomRecipe());
  const f = evaluateFlavor(buildPrompt());
  Confetti.burst(...buttonPoint(els.surprise), 70);
  toast(f.level === 'spicy' ? 'Whoa — that one came out spicy 🌶️' : 'Tonight\'s special, served hot 🍲');
}

/* ---------- Toast ---------- */

let toastTimer = null;

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('is-on');
  els.toast.setAttribute('aria-hidden', 'false');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('is-on');
    els.toast.setAttribute('aria-hidden', 'true');
  }, 2600);
}

/* ---------- Confetti ---------- */

const Confetti = (() => {
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#ff6aa8', '#a06bff', '#5bc8ff', '#ffb3d1', '#cfb2ff', '#a8e9ff', '#ffffff'];
  let bits = [];
  let raf = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst(x, y, count = 110) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 13;
      bits.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        w: 5 + Math.random() * 7,
        h: 8 + Math.random() * 9,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.36,
        color: pick(COLORS),
        ttl: 85 + Math.random() * 55
      });
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits = bits.filter((b) => b.ttl-- > 0 && b.y < innerHeight + 70);

    for (const b of bits) {
      b.vy += 0.32;      // gravity
      b.vx *= 0.99;      // air
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.globalAlpha = b.ttl < 24 ? b.ttl / 24 : 1;
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }

    if (bits.length) {
      raf = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      raf = null;
    }
  }

  resize();
  addEventListener('resize', resize);
  return { burst };
})();

/* ---------- Little wobble when the pot changes ---------- */

function bumpPot() {
  if (typeof els.potDrop.animate !== 'function') return;
  els.potDrop.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }],
    { duration: 260, easing: 'cubic-bezier(.2,1.3,.4,1)' }
  );
}

/* ---------- Drag & drop ---------- */

let draggingFromPot = false;

function wireDragAndDrop() {
  // Pantry card -> Pot
  els.pantryList.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.ingredient');
    if (!card) return;
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'copy';
    draggingFromPot = false;
    card.classList.add('is-dragging');
  });

  els.pantryList.addEventListener('dragend', (e) => {
    e.target.closest('.ingredient')?.classList.remove('is-dragging');
    els.pantryList.classList.remove('is-over');
  });

  els.potDrop.addEventListener('dragover', (e) => {
    if (draggingFromPot) return;                 // don't let pot items move around
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    els.potDrop.classList.add('is-over');
  });

  els.potDrop.addEventListener('dragleave', (e) => {
    if (e.relatedTarget && els.potDrop.contains(e.relatedTarget)) return;
    els.potDrop.classList.remove('is-over');
  });

  els.potDrop.addEventListener('drop', (e) => {
    if (draggingFromPot) return;
    e.preventDefault();
    els.potDrop.classList.remove('is-over');
    addIngredient(e.dataTransfer.getData('text/plain'));
  });

  // Pot item -> Pantry (drops it back out of the pot)
  els.potItems.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.pot-item');
    if (!item) return;
    e.dataTransfer.setData('text/plain', item.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    draggingFromPot = true;
    item.classList.add('is-dragging');
  });

  els.potItems.addEventListener('dragend', (e) => {
    e.target.closest('.pot-item')?.classList.remove('is-dragging');
    draggingFromPot = false;
    els.pantryList.classList.remove('is-over');
  });

  els.pantryList.addEventListener('dragover', (e) => {
    if (!draggingFromPot) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    els.pantryList.classList.add('is-over');
  });

  els.pantryList.addEventListener('dragleave', (e) => {
    if (e.relatedTarget && els.pantryList.contains(e.relatedTarget)) return;
    els.pantryList.classList.remove('is-over');
  });

  els.pantryList.addEventListener('drop', (e) => {
    if (!draggingFromPot) return;
    e.preventDefault();
    els.pantryList.classList.remove('is-over');
    removeIngredient(e.dataTransfer.getData('text/plain'));
  });
}

/* ---------- Events ---------- */

function wireEvents() {
  // Pantry: click or Enter/Space (native button behaviour) to add
  els.pantryList.addEventListener('click', (e) => {
    const card = e.target.closest('.ingredient');
    if (card) addIngredient(card.dataset.id);
  });

  // Pot: typing + removing
  els.potItems.addEventListener('input', (e) => {
    const input = e.target.closest('.pot-item__input');
    if (!input) return;
    state.pot[input.dataset.id] = input.value;
    renderPreview();
  });

  els.potItems.addEventListener('click', (e) => {
    const remove = e.target.closest('[data-remove]');
    if (remove) removeIngredient(remove.dataset.remove);
  });

  els.clearPot.addEventListener('click', clearPot);

  // Buttons
  els.serve.addEventListener('click', serve);
  els.save.addEventListener('click', saveRecipe);
  els.loadExamples.addEventListener('click', loadExamples);
  els.surprise.addEventListener('click', surpriseMe);

  // Cookbook
  els.cookbookList.addEventListener('click', async (e) => {
    const load = e.target.closest('[data-load]');
    const copy = e.target.closest('[data-copy]');
    const del = e.target.closest('[data-delete]');

    if (load) return loadRecipe(load.dataset.load);

    if (copy) {
      const entry = state.cookbook.find((r) => r.id === copy.dataset.copy);
      if (!entry) return;
      const ok = await copyText(buildPrompt(entry.values));
      toast(ok ? 'Copied from the cookbook 📋' : 'Could not copy that one 😅');
      return;
    }

    if (del) return deleteRecipe(del.dataset.delete);
  });

  // Cmd/Ctrl+Enter serves from anywhere
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !els.serve.disabled) serve();
  });
}

/* ---------- Boot ---------- */

renderPot();
renderPreview();
renderCookbook();
wireDragAndDrop();
wireEvents();

// Seed the cookbook once. The "load examples" button can restore it later.
const seededVersion = loadJSON('prompt-chef.seeded.v1', null);
if (!state.cookbook.length && seededVersion !== 'v1') {
  state.cookbook = normaliseCookbook(EXAMPLE_RECIPES);
  saveJSON('prompt-chef.cookbook.v1', state.cookbook);
  saveJSON('prompt-chef.seeded.v1', 'v1');
  renderCookbook();
}