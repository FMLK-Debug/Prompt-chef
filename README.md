# 🍲 Prompt Chef

[![tests](https://github.com/FMLK-Debug/Prompt-chef/actions/workflows/test.yml/badge.svg)](https://github.com/FMLK-Debug/Prompt-chef/actions/workflows/test.yml)

A single-page kitchen for building well-written AI prompts. Pick your ingredients
from the pantry, drop them in the pot, watch the flavor meter, and serve.

No build step, no dependencies — just open it.

**Look:** neon night kitchen — synthwave grid, scanlines, and magenta/cyan/lime
glow on near-black. Orbitron for headings, Chakra Petch for text, Share Tech Mono
for the prompt itself.

## Run it

```bash
cd prompt-chef
python3 -m http.server 8000     # then visit http://localhost:8000
```

Opening `index.html` directly works too (the clipboard falls back to an
`execCommand` copy when the file:// clipboard API is unavailable).

## How it works

| Piece | Where |
| --- | --- |
| Markup | `index.html` |
| Warm kitchen theme + responsive layout | `styles.css` |
| State, prompt builder, flavor rules, confetti | `app.js` |
| Behaviour tests | `test/prompt-chef.test.js` |

The tests run `app.js` against a stubbed DOM with plain Node (no dependencies),
so the flavor rules are executable specs:

```bash
node test/prompt-chef.test.js   # 74 assertions, no npm install required
```

### Ingredients

Six, always assembled in the same order because that order is what makes a
prompt readable:

1. **Role** — who is doing the talking
2. **Context** — where and for whom
3. **Task** — what should actually happen
4. **Format** — how the answer should look
5. **Tone** — how it should sound
6. **Constraints** — rules and limits

Click a pantry card or drag it into the pot. Each one expands into a field with a
worked example as its placeholder. Drag a pot item back onto the pantry (or hit
its ✕) to take it out.

### The Flavor Meter

| Verdict | Rule |
| --- | --- |
| 🌶️ **Too spicy** | The composed prompt runs past 150 words |
| 😋 **Perfect** | A Task is filled in and 4+ ingredients are filled in |
| 😐 **Bland** | Anything else — empty pot, no Task, or not enough filled in |

The meter tells you which rule tripped in plain language underneath the bar, so
"Bland" is never a dead end.

### Buttons

- **Serve** — copies the composed prompt to the clipboard and fires confetti.
  <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Enter</kbd> works from anywhere.
- **Surprise Me** — drops in a random recipe. Eight hand-written specials
  (pirate fractions, a noir password reset, a robot poet…) plus a generator that
  mixes roles, contexts, formats and tones for endless variety.
- **Save to Cookbook** — files the current recipe under its Task, with its
  flavor badge and word count. The Cookbook keeps the last 40 and persists them
  in `localStorage`; each entry can be loaded back, copied, or deleted.

## Project documents

| File | What it is |
| --- | --- |
| `PROJECT-REPORT.md` | Full project report — problem, framework, design, testing, future scope |
| `PRESENTATION.md` | 7-slide presentation content with speaker notes and a demo script |
| `VIVA-QA.md` | 15 likely viva questions with short answers, plus a code walkthrough |

## Accessibility & responsiveness

- Three columns on desktop, two at ≤1180px, single column at ≤780px, where the
  pantry becomes a two-up grid.
- Every card is a real `<button>`, every pot field has a `<label>`, and removal
  buttons carry their own labels.
- Status changes are announced through a screen-reader-only live region that
  dedupes itself, so typing doesn't flood a screen reader.
- Visible focus rings, and `prefers-reduced-motion` turns off the steam, the
  confetti wiggles and the transitions.
- All text clears WCAG AA (4.5:1) against the panel it sits on, including
  input placeholders — neon glow is decoration, never the only thing carrying
  contrast.