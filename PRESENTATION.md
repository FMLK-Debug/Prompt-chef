# Prompt Chef — Presentation Pack

7 slides. Total speaking time: about 3 minutes. Copy each slide into
PowerPoint / Canva / Google Slides. Speaker notes are written the way you can
say them out loud.

---

## Slide 1 — Title

**Prompt Chef**
*An interactive workbench for prompt engineering*

- **Name:** Akshay
- **Roll No:** 25BCON2394
- **Section:** SI
- **Class:** Prompt Engineering
- **University:** JECRC University
- **Program:** B.Tech CSE (Cyber Security) — in collaboration with EC-Council, USA
- **Date:** November 2026

**Speaker note:**
> "Good morning. My project is called Prompt Chef. It is a small web app that
> teaches people how to write better prompts for AI, by building the prompt
> with them, step by step."

---

## Slide 2 — The problem

**AI gives generic answers when the prompt is vague.**

Weak prompt:

> "Write about black holes."

What the model does not know:

- Who is the audience?
- How long should the answer be?
- What format?
- What tone?
- What should be avoided?

**Speaker note:**
> "This is the prompt most people type. The model is not stupid — the
> instruction is incomplete. It does not know the audience, the length, the
> format, or the tone. Prompt engineering is the skill of filling in those
> blanks."

---

## Slide 3 — The six-ingredient framework

**A good prompt has six parts, always in the same order:**

| # | Ingredient | Answers |
|---|---|---|
| 1 | Role | Who is talking? |
| 2 | Context | For whom, and where? |
| 3 | Task | What must happen? |
| 4 | Format | How should the answer look? |
| 5 | Tone | How should it sound? |
| 6 | Constraints | What are the limits? |

**Speaker note:**
> "The app is built around this checklist. Role, Context, Task, Format, Tone,
> Constraints. The order matters because it reads like a human brief: first who
> is speaking, then for whom, then what to do, then how the result should look."

---

## Slide 4 — The app

**Screenshot / live demo**

- Pantry: six ingredient cards with worked examples
- Pot: fill the fields, watch the prompt compose in real time
- Flavour meter: 🌶️ Too spicy · 😋 Perfect · 😐 Bland, with a reason
- Cookbook: save, reload, copy, delete prompts

**Speaker note:**
> "This is the app. You pick an ingredient, fill in an example, and the prompt
> is composed live. The flavour meter judges it. For example, a prompt is
> 'Perfect' when it has a Task and at least four ingredients. If it crosses 150
> words, it becomes 'Too spicy'. And the cookbook saves your best prompts."

---

## Slide 5 — Quality rules (how the meter works)

| Verdict | Rule |
|---|---|
| 🌶️ Too spicy | More than 150 words |
| 😋 Perfect | Task filled + 4 or more ingredients |
| 😐 Bland | Empty pot, no task, or too few ingredients |

- The meter **explains** its verdict ("3 ingredients, 41 words…")
- Rules are **unit tested** — 74 assertions, zero dependencies

**Speaker note:**
> "The important part is that the meter never just says 'bad'. It tells you what
> is missing. And the rules are covered by 74 automated tests, so the behaviour
> cannot silently change. We can run the tests live if you want."

---

## Slide 6 — Demo: before and after

**Before:**
> Write about black holes.

**After (composed by Prompt Chef):**
> Act as a patient but witty tour guide at a science museum.
> Context: Visitors are 10-year-olds on a school field trip.
> Task: Explain how a black hole forms and why it is so weird.
> Format: A 3-bullet list, one surprising fact per bullet.
> Tone: Playful and curious, like a big sibling explaining.
> Constraints: Under 120 words, no emojis, end with a question.

**Speaker note:**
> "Same model, same topic. The first prompt gets an encyclopaedia paragraph.
> The second gets an answer that is actually usable in a museum. That difference
> is prompt engineering."

---

## Slide 7 — Learning and future scope

**What I learned**

- Specificity beats cleverness: role + context + task + format + tone + limits
- Constraints are part of the prompt, not an afterthought
- Small, explainable rules beat vague advice

**Future scope**

- Optional LLM integration with side-by-side answer comparison
- Model-based prompt scoring
- Cookbook export/import and shareable prompt links
- Multi-language support

**Speaker note:**
> "To conclude: the quality of the answer depends on the quality of the
> question. Prompt Chef makes that idea visible and hands-on. Thank you — I am
> happy to take questions."

---

## 2-Minute Live Demo Script

1. Open the app (empty pot, meter says **Bland**).
2. Say: *"The pot is empty, and the meter tells me exactly what to do."*
3. Click **Task**, type: `Explain how a black hole forms.`
4. Say: *"Still Bland — a task alone is not enough."*
5. Add **Role** (`A patient but witty tour guide`), **Context**
   (`10-year-olds on a school trip`), **Format** (`3 bullets`).
6. Say: *"Now it flips to Perfect. Four ingredients and a task."*
7. Point at the composed prompt and read the first two lines aloud.
8. Click **Surprise Me**, then **Save to Cookbook**, then reload the page.
9. Say: *"The cookbook persists, so this becomes a personal prompt library."*
10. Click **Serve** (or Ctrl+Enter) to copy the prompt.

**If the projector fails:** run `python3 -m http.server 8000` in the
`prompt-chef` folder and open `http://localhost:8000` in the browser. Screenshots
of slides 4–6 are enough as a fallback.
