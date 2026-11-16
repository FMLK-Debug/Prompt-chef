# Prompt Chef: An Interactive Workbench for Structured Prompt Engineering

**Project Report**

| | |
|---|---|
| **Name** | Akshay |
| **Roll No** | 25BCON2394 |
| **Section** | SI |
| **Class** | Prompt Engineering |
| **University** | JECRC University |
| **Program** | B.Tech CSE (Cyber Security) |
| **In collaboration with** | EC-Council, USA |
| **Date** | November 2026 |

---

## 1. Abstract

Large Language Models (LLMs) produce useful answers only when the instructions
they receive are clear, specific, and well-structured. Most users write short,
vague prompts and then blame the model for generic output. **Prompt Chef** is a
single-page web application that turns prompt writing into a guided, visual
process. The user assembles a prompt from six "ingredients" — Role, Context,
Task, Format, Tone, and Constraints — and the application composes a clean,
well-ordered prompt in real time. A "flavour meter" evaluates the draft against
simple quality rules and explains what is missing, while a cookbook feature
saves successful recipes for reuse. The project demonstrates, in a hands-on
form, the core principles of prompt engineering: assign a role, supply context,
state the task explicitly, define the output format, control tone, and set
constraints.

---

## 2. Problem Statement

A typical beginner prompt looks like this:

> "Write about black holes."

The model has no idea who the audience is, how long the answer should be, what
format is wanted, or what tone is appropriate. The result is usually a generic
encyclopaedia paragraph that satisfies nobody. The problem is not the model — it
is the **missing specification**.

Prompt engineering is the discipline of writing that specification. However,
the principles are usually taught as abstract advice ("be specific", "give the
model a role"), which beginners forget while typing. Prompt Chef converts that
advice into a **structured interface**: the six ingredients act as a checklist,
and the flavour meter gives immediate feedback on prompt quality.

---

## 3. Objectives

1. Teach the six-part prompt structure through interaction rather than theory.
2. Generate a clean, copy-ready prompt from the user's inputs.
3. Evaluate prompt quality automatically and give actionable feedback.
4. Let users save and reuse high-quality prompts (a personal prompt library).
5. Keep the whole tool dependency-free and runnable offline in a browser.

---

## 4. Background: The Six-Ingredient Framework

The application is built around a fixed, repeatable prompt structure. The order
matters because it mirrors how a human brief is written: first *who* is
speaking, then *for whom*, then *what* to do, then *how* the result should look.

| # | Ingredient | Question it answers | Example |
|---|---|---|---|
| 1 | **Role** | Who is doing the talking? | "A patient but witty tour guide at a science museum" |
| 2 | **Context** | Where and for whom? | "Visitors are 10-year-olds on a school field trip" |
| 3 | **Task** | What should actually happen? | "Explain how a black hole forms" |
| 4 | **Format** | How should the answer look? | "A 3-bullet list, one surprising fact per bullet" |
| 5 | **Tone** | How should it sound? | "Playful and curious, like a big sibling explaining" |
| 6 | **Constraints** | What are the rules and limits? | "Under 120 words, no emojis, end with a question" |

The composed prompt is assembled in exactly this order and separated into
paragraphs, for example:

```
Act as a patient but witty tour guide at a science museum.

Context: Visitors are 10-year-olds on a school field trip.

Task: Explain how a black hole forms and why it is so weird.

Format: A 3-bullet list, one surprising fact per bullet.

Tone: Playful and curious, like a big sibling explaining.

Constraints: Under 120 words, no emojis, end with a question.
```

Each ingredient is optional, but the Task is treated as mandatory: a prompt
without a task is not a prompt.

---

## 5. System Design

### 5.1 Architecture

The application follows a simple **state → render** pattern:

- A single JavaScript object (`state`) holds the current pot (the six fields)
  and the saved cookbook.
- Every user action mutates the state, then re-renders the affected parts of the
  DOM from that state.
- The composed prompt is derived, never stored as a separate source of truth.

This keeps the code predictable and makes the quality rules easy to test in
isolation.

### 5.2 The Flavour Meter (quality evaluation)

The meter applies three transparent rules:

| Verdict | Rule |
|---|---|
| 🌶️ **Too spicy** | The composed prompt exceeds **150 words** |
| 😋 **Perfect** | A **Task** is filled in and **4 or more** ingredients are filled |
| 😐 **Bland** | Anything else — empty pot, missing task, or too few ingredients |

Under the bar, the app prints the reason in plain language (for example,
"3 ingredients, 41 words. You could still add 3."), so a weak verdict always
tells the user what to do next. This is a lightweight, explainable heuristic —
not a model-based judgement — which makes it fast, private, and easy to audit.

### 5.3 Cookbook (persistence)

The **Save to Cookbook** action stores the current recipe under its Task title,
together with its flavour badge and word count. The cookbook keeps the last 40
entries and persists them in `localStorage`, so the library survives a page
reload. Entries can be loaded back into the pot, copied, or deleted.

### 5.4 Additional features

- **Surprise Me** — inserts a random recipe, drawn from eight hand-written
  examples plus a generator that mixes roles, contexts, formats, and tones.
- **Serve** — copies the composed prompt to the clipboard and triggers a
  confetti animation. <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Enter</kbd> works
  from anywhere.
- **Accessibility** — every card is a real button, every field has a label,
  status changes are announced through a screen-reader-only live region, focus
  rings are visible, and `prefers-reduced-motion` disables animations.

---

## 6. Implementation

| Layer | Technology |
|---|---|
| Markup | HTML5 (`index.html`) |
| Styling | Plain CSS, custom properties, responsive grid (`styles.css`) |
| Logic | Vanilla JavaScript, ES2020 (`app.js`) |
| Storage | Browser `localStorage` |
| Tests | Plain Node.js test runner script (`test/prompt-chef.test.js`) |

No framework, bundler, or package manager is required. The project runs by
opening `index.html` or serving the folder with any static file server:

```bash
cd prompt-chef
python3 -m http.server 8000
# open http://localhost:8000
```

### 6.1 Core functions

- `buildPrompt(values)` — trims each field, strips repeated whitespace, and
  joins the filled ingredients in the canonical order.
- `evaluateFlavor(prompt)` — counts words and filled ingredients, applies the
  three rules above, and returns a verdict, percentage, and explanation.
- `saveRecipe()`, `loadRecipe(id)`, `deleteRecipe(id)` — cookbook operations,
  with `localStorage` persistence.
- `randomRecipe()` — always returns all six slots, using the built-in specials
  or the combinatorial generator.

### 6.2 Testing

The behaviour tests run `app.js` against a stubbed DOM using plain Node, with no
dependencies:

```bash
node test/prompt-chef.test.js
# 74 passed, 0 failed
```

The tests cover prompt composition order, whitespace normalisation, flavour
thresholds, cookbook persistence and normalisation of corrupted storage,
HTML-escaping, clipboard fallbacks, announcement de-duplication, and the
random recipe generator. Writing the quality rules as executable tests means
the "Perfect / Bland / Too spicy" behaviour is a specification, not a vibe.

---

## 7. Demonstration Walkthrough

**Live demo:** https://fmlk-debug.github.io/Prompt-chef/

1. Open the app. The pot is empty and the meter reads **Bland** with the note
   "The pot is empty — add an ingredient to start."
2. Add **Task** only: "Explain how a black hole forms." The meter improves but
   still says **Bland**, because a task alone is not enough context.
3. Add **Role**, **Context**, and **Format**. The meter turns **Perfect** and
   explains how many ingredients are still available.
4. Show the composed prompt in the output panel: ordered, spaced, and ready to
   paste into any LLM.
5. Click **Serve** to copy the prompt and trigger confetti.
6. Click **Surprise Me** to load a complete recipe, then **Save to Cookbook**.
   Reload the page — the entry is still there.
7. Paste the composed prompt into an LLM and compare the answer with the
   original one-line prompt. The difference in specificity is the lesson.

---

## 8. Results and Learning Outcomes

- The six-part structure consistently produces more specific, more usable LLM
  output than a one-line instruction.
- Beginners understand the framework faster when it is a checklist with live
  feedback than when it is a list of rules in a textbook.
- Explainable heuristics (word count, filled slots, mandatory task) are enough
  to teach the basics; they are fast, private, and require no API key.
- Treating prompt rules as unit-tested behaviour prevents the tool from giving
  contradictory advice as features are added.

---

## 9. Limitations and Future Scope

**Limitations**

- The flavour meter is heuristic; it measures structure, not semantic quality.
- Prompts and cookbook entries live only in the browser's `localStorage`.
- The interface is English-only.

**Future scope**

- Optional LLM integration: send the composed prompt and show a side-by-side
  answer comparison.
- A model-based prompt scorer that rates specificity and ambiguity.
- Import/export of cookbooks as JSON, and shareable prompt links.
- Multi-language ingredient labels and prompts.
- A "diff" view that highlights what changed between two prompt versions.

---

## 10. Conclusion

Prompt Chef turns prompt engineering from abstract advice into a concrete,
testable workflow. By enforcing a six-part structure and giving immediate,
explainable feedback, it helps users write prompts that are specific enough for
an LLM to act on. The project is deliberately small — vanilla HTML, CSS, and
JavaScript with no dependencies — but it demonstrates the central idea of the
course: **the quality of the answer depends on the quality of the question.**
