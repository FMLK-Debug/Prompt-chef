/* Headless smoke tests for Prompt Chef.
   Runs app.js against a stubbed DOM in a vm and asserts real behaviour:
   prompt composition, flavor rules, pot add/remove, cookbook CRUD.
   Usage: node test/prompt-chef.test.js      (needs Node, nothing else)      */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP_DIR = path.resolve(__dirname, '..');   // repo root, wherever this file lives
const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8');
const appJS = fs.readFileSync(path.join(APP_DIR, 'app.js'), 'utf8');

/* ---------- DOM stub ---------- */

const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
const ctx2d = new Proxy({}, { get: () => () => {} });   // every canvas 2d call is a no-op

function makeClassList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach((x) => set.add(x)),
    remove: (...c) => c.forEach((x) => set.delete(x)),
    toggle: (c, force) => { force ? set.add(c) : set.delete(c); },
    contains: (c) => set.has(c),
    _set: set
  };
}

function makeEl(id) {
  const el = {
    id, textContent: '', value: '', dataset: {}, style: {}, disabled: false, _html: '',
    classList: makeClassList(),
    addEventListener() {}, removeEventListener() {},
    appendChild(child) { return child; }, remove() {},
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    focus() {}, click() {}, blur() {},
    animate() { return {}; },
    getBoundingClientRect() { return { left: 100, top: 100, width: 120, height: 40, right: 220, bottom: 140 }; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    scrollIntoView() {}, select() {}, setSelectionRange() {},
    getContext() { return ctx2d; }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) { el._html = String(v); }
  });
  return el;
}

const registry = new Map(ids.map((id) => [id, makeEl(id)]));
for (const id of ['pot-items', 'pantry-list', 'prompt-output', 'flavor', 'serve', 'save', 'cookbook-list', 'kitchen-live', 'pot-drop', 'confetti']) {
  if (!registry.has(id)) throw new Error(`harness is missing #${id} — update this file`);
}

const document = {
  body: makeEl('body'),
  addEventListener() {},
  querySelector(sel) { return registry.get(sel.replace('#', '')) ?? null; },
  getElementById(id) { return registry.get(id) ?? null; },
  createElement: (tag) => makeEl(`created-${tag}`),
  execCommand: () => true
};

const store = new Map();
const sandbox = {
  document, console,
  navigator: { clipboard: { writeText: async () => {} } },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  },
  requestAnimationFrame: () => 1,
  setTimeout, clearTimeout, Date, Math, JSON,
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, isSecureContext: true,
  addEventListener() {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const results = { passed: 0, failures: [] };
sandbox.__results = results;
const context = vm.createContext(sandbox);

/* ---------- test cases, appended to app.js so they share its scope ---------- */

const tests = String.raw`
const R = __results;   // counters live on the sandbox so both sides can see them
function check(label, cond, extra = '') {
  if (cond) { R.passed++; console.log('  ok   ' + label); }
  else { R.failures.push(label + ' ' + extra); console.log('  FAIL ' + label + ' ' + extra); }
}
function eq(label, actual, expected) {
  check(label, actual === expected,
    '\n       expected: ' + JSON.stringify(expected) + '\n       actual:   ' + JSON.stringify(actual));
}
function words(n) { return Array.from({length: n}, (_, i) => 'w' + i).join(' '); }
const flavorOf = (pot) => { state.pot = pot; return evaluateFlavor(buildPrompt()); };

console.log('\n- prompt composition -');

state.pot = { role: 'a 10-year-old', task: 'Explain rain' };
eq('two ingredients compose in recipe order', buildPrompt(),
   'Act as a 10-year-old.\n\nTask: Explain rain.');

state.pot = { role: ' a pirate captain ', context: 'crew', task: 'do x', format: 'list', tone: 'funny', constraints: 'short' };
eq('all six get their label', buildPrompt(),
   'Act as a pirate captain.\n\nContext: crew.\n\nTask: do x.\n\nFormat: list.\n\nTone: funny.\n\nConstraints: short.');
eq('runs of whitespace are squashed', buildPrompt().includes('Act as a pirate captain.'), true);
eq('blank fields are skipped', buildPrompt({ role: 'chef', task: '   ', context: '', tone: 'warm' }),
   'Act as chef.\n\nTone: warm.');
eq('empty pot -> empty prompt', buildPrompt({}), '');
eq('recipe order beats insertion order',
   buildPrompt({ constraints: 'c', role: 'r', task: 't' }).indexOf('Act as') <
   buildPrompt({ constraints: 'c', role: 'r', task: 't' }).indexOf('Constraints:'), true);
check('no undefined leaks into the prompt', !buildPrompt({ role: 'a' }).includes('undefined'));

console.log('\n- flavor meter -');

eq('empty pot is Bland', flavorOf({}).level, 'bland');
eq('empty pot hint', flavorOf({}).note, 'The pot is empty — add an ingredient to start.');
eq('slots in the pot but blank stay Bland', flavorOf({ task: '', tone: '  ' }).level, 'bland');
eq('no Task is Bland', flavorOf({ role: 'chef', context: 'a', format: 'b', tone: 'c' }).level, 'bland');
eq('no Task hint', flavorOf({ role: 'chef', context: 'a', format: 'b', tone: 'c' }).note,
   'Still bland — every prompt needs a Task.');
eq('Task present but only 3 filled is Bland', flavorOf({ task: 'go', role: 'chef', tone: 'warm' }).level, 'bland');
eq('nudge tells you how many are missing',
   flavorOf({ task: 'go', role: 'chef', tone: 'warm' }).note,
   'Good start. Add 1 more ingredient to reach Perfect.');
eq('Task + 3 others = Perfect', flavorOf({ task: 'go', role: 'chef', tone: 'warm', format: 'list' }).level, 'perfect');
eq('Perfect meter lands on the tick', flavorOf({ task: 'go', role: 'chef', tone: 'warm', format: 'list' }).pct, 75);
eq('all six filled is Perfect', flavorOf({
  role: 'chef', context: 'a', task: 'go', format: 'list', tone: 'warm', constraints: 'short'
}).level, 'perfect');
eq('all six -> meter at 90%', flavorOf({
  role: 'chef', context: 'a', task: 'go', format: 'list', tone: 'warm', constraints: 'short'
}).pct, 90);

// "Task: " adds one word to whatever the Task field holds.
state.pot = { task: words(149) };
eq('149-word task = 150 word prompt', countWords(buildPrompt()), 150);
eq('exactly 150 words is not spicy', evaluateFlavor(buildPrompt()).level, 'bland');
state.pot = { task: words(150) };
eq('150-word task = 151 word prompt', countWords(buildPrompt()), 151);
eq('over 150 words is Too spicy', evaluateFlavor(buildPrompt()).level, 'spicy');
eq('Too spicy pins the meter', evaluateFlavor(buildPrompt()).pct, 100);
eq('spicy beats Perfect',
   flavorOf({ task: words(150), role: 'chef', tone: 'warm', format: 'list' }).level, 'spicy');
eq('word counting ignores extra spaces', countWords('  a  b   c '), 3);
eq('empty string is zero words', countWords('   '), 0);

console.log('\n- pot -');

state.pot = {};
addIngredient('role');
eq('addIngredient opens a slot', 'role' in state.pot, true);
addIngredient('role');
eq('adding twice does not duplicate', Object.keys(state.pot).length, 1);
check('slot renders an input', els.potItems.innerHTML.includes('id="field-role"'));
check('slot renders the example placeholder', els.potItems.innerHTML.includes('science museum'));
eq('pot counts ingredients', els.potCount.textContent, '1 / 6');
eq('drop target flips to filled', els.potDrop.dataset.empty, 'false');
eq('input value is escaped', /value=""/.test(els.potItems.innerHTML), true);
check('pantry marks used ingredients', els.pantryList.innerHTML.includes('is-used'));

removeIngredient('role');
eq('removeIngredient clears the slot', Object.keys(state.pot).length, 0);
eq('drop target flips back to empty', els.potDrop.dataset.empty, 'true');
eq('Serve is disabled while blank', els.serve.disabled, true);

addIngredient('task');
state.pot.task = 'Explain black holes';
renderPreview();
eq('typing reaches the preview', els.output.textContent, 'Task: Explain black holes.');
eq('word count updates', els.wordCount.textContent, '4');
eq('Serve is enabled once there is text', els.serve.disabled, false);
eq('flavor data attribute updates', els.flavor.dataset.level, 'bland');
eq('badge text updates', els.flavorBadge.textContent, 'Bland');

state.pot.task = 'x" onfocus="alert(1)';
renderPot();
check('typed text cannot break out of the attribute',
  els.potItems.innerHTML.includes('&quot;') && !/value="x" onfocus/.test(els.potItems.innerHTML));

console.log('\n- surprise me -');

surpriseMe();
eq('Surprise Me fills all six slots', Object.keys(state.pot).length, 6);
check('Surprise Me is Perfect or spicy',
  ['perfect', 'spicy'].includes(els.flavor.dataset.level),
  'got ' + els.flavor.dataset.level);
check('Surprise Me composes a substantial prompt', buildPrompt().length > 150);
eq('Surprise Me keeps recipe order',
  buildPrompt().indexOf('Act as') < buildPrompt().indexOf('Tone:'), true);
check('the pirate fractions recipe is in the deck',
  RECIPES.some((r) => /pirate/i.test(r.role) && /fraction/i.test(r.task)));
check('every curated recipe fills all six slots',
  RECIPES.every((r) => INGREDIENTS.every((i) => r[i.id] && r[i.id].trim())));
check('filler parts cover all six slots', INGREDIENTS.every((i) => Array.isArray(FILLER[i.id])));
for (let i = 0; i < 25; i++) {
  surpriseMe();
  if (Object.keys(state.pot).length !== 6) { check('random recipe always fills 6 slots', false, 'run ' + i); break; }
}
check('25 random recipes all filled six slots', Object.keys(state.pot).length === 6);

console.log('\n- example cookbook -');

eq('fresh cookbook seeds five examples', state.cookbook.length, 5);
check('every example is marked Example', state.cookbook.every((r) => r.time === 'Example'));
check('every example is Perfect', state.cookbook.every((r) => r.level === 'perfect'));
eq('examples are persisted once', JSON.parse(localStorage.getItem('prompt-chef.cookbook.v1')).length, 5);
check('cookbook hint shows the five examples', els.cookbookHint.textContent.includes('5 saved recipes'));

console.log('\n- cookbook -');

state.cookbook = [];
renderCookbook();
check('empty cookbook shows a nudge', els.cookbookList.innerHTML.includes('Nothing saved yet'));

surpriseMe();
const wordsBefore = els.wordCount.textContent;
const promptBefore = buildPrompt();
saveRecipe();
eq('saveRecipe stores one recipe', state.cookbook.length, 1);
eq('saveRecipe persists to local storage', JSON.parse(localStorage.getItem('prompt-chef.cookbook.v1')).length, 1);
eq('recipe records its flavor', ['perfect', 'spicy', 'bland'].includes(state.cookbook[0].level), true);
eq('recipe records its word count', state.cookbook[0].words, countWords(promptBefore));
check('recipe title is a sane string', state.cookbook[0].title.length > 0 && state.cookbook[0].title.length <= 70,
  'title=' + JSON.stringify(state.cookbook[0].title));
check('recipe list renders Load/Copy/Delete',
  ['data-load=', 'data-copy=', 'data-delete='].every((a) => els.cookbookList.innerHTML.includes(a)));
check('cookbook hint counts recipes', els.cookbookHint.textContent.includes('1 saved recipe'));

state.cookbook.push({ ...state.cookbook[0], id: 'second' });
renderCookbook();
check('cookbook hint pluralises', els.cookbookHint.textContent.includes('2 saved recipes'));
state.cookbook.pop();

clearPot();
eq('clearPot wipes the pot', Object.keys(state.pot).length, 0);
loadRecipe(state.cookbook[0].id);
eq('loadRecipe restores every ingredient', Object.keys(state.pot).length, 6);
eq('loadRecipe rebuilds the same prompt', buildPrompt(), promptBefore);
eq('word count restored', els.wordCount.textContent, wordsBefore);

deleteRecipe(state.cookbook[0].id);
eq('deleteRecipe empties the list', state.cookbook.length, 0);
eq('deleteRecipe clears storage', JSON.parse(localStorage.getItem('prompt-chef.cookbook.v1')).length, 0);

console.log('\n- odds and ends -');

fillPrompt({ task: 'x' });
eq('fillPrompt drops stale slots', Object.keys(state.pot).length, 1);
clearPot();
eq('clearPot after fillPrompt', Object.keys(state.pot).length, 0);

eq('escapeHTML blocks attribute breakouts', escapeHTML('" onfocus="alert(1)'),
   '&quot; onfocus=&quot;alert(1)');
check('escapeHTML handles ampersands', escapeHTML('a & b') === 'a &amp; b');

const before = els.live.textContent;
renderPreview(); renderPreview();
eq('announcements are deduped', els.live.textContent, before);
state.pot = { task: 'a' }; renderPreview();
check('announcements change with the recipe', els.live.textContent !== before);

check('copyText resolves with a clipboard API', typeof copyText('hi').then === 'function');
check('randomRecipe always returns six slots',
  Object.keys(randomRecipe()).length === 6);
`;

let passed = 0;
const failures = [];
vm.runInContext(appJS + tests, context, { filename: 'app.js' });

console.log(`\n${results.passed} passed, ${results.failures.length} failed`);
if (results.failures.length) {
  console.log('\nFailures:');
  results.failures.forEach((f) => console.log('  x', f));
  process.exit(1);
}