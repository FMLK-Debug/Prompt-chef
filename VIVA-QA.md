# Prompt Chef — Viva / Q&A Prep

Short answers you can say out loud. Each one is 2–4 sentences.

---

### 1. What is prompt engineering?

Prompt engineering is the practice of writing instructions for an AI model so
that it produces the answer you actually need. It covers role, context, task,
output format, tone, and constraints. It is not about "tricking" the model — it
is about specifying the problem clearly.

---

### 2. What is your project in one line?

Prompt Chef is a browser app that builds a well-structured prompt from six
ingredients and scores the result, so users learn prompt engineering by doing it
instead of reading about it.

---

### 3. Why these six ingredients? Why this order?

They map to the questions any good brief must answer: who is speaking, for whom,
what to do, how it should look, how it should sound, and what the limits are.
The order goes from identity to output, which reads naturally and keeps the
prompt stable. It is the same structure used in professional prompt templates.

---

### 4. What is the difference between a weak and a strong prompt?

A weak prompt states only a topic: "Write about black holes." A strong prompt
adds an audience, a role, a format, a tone, and limits. Same model, same topic,
but the second answer is usable in a real situation.

---

### 5. How does the flavour meter work?

It applies three rules: over 150 words is "Too spicy"; a filled Task plus at
least four ingredients is "Perfect"; everything else is "Bland". It also prints
the reason and the word count. It is a transparent heuristic, not a model call,
so it is fast, private, and easy to test.

---

### 6. Why is the Task mandatory?

Without a task there is nothing to do — the other five ingredients only describe
the *how*. Role, context, tone, and constraints cannot substitute for the
instruction itself. So the meter never awards "Perfect" without a Task.

---

### 7. What technologies did you use, and why?

Plain HTML, CSS, and JavaScript, with `localStorage` for the cookbook and a
plain Node test script. I avoided frameworks and dependencies because the
project is small, and this keeps it runnable offline with no installation. The
logic is separated from the DOM so it can be tested.

---

### 8. What are zero-shot, one-shot, and few-shot prompting?

Zero-shot gives the model only an instruction. One-shot adds one example.
Few-shot adds several examples so the model copies the pattern. Prompt Chef
focuses on structured zero-shot prompting, but its Format field can describe an
example the model should follow, which moves it toward one-shot.

---

### 9. What is chain-of-thought prompting, and does your app use it?

Chain-of-thought asks the model to reason step by step before answering, often
with "think step by step". Prompt Chef does not force it, but a user can add a
Constraint such as "show your reasoning before the final answer". For simple
tasks it is unnecessary and can add noise.

---

### 10. What is temperature?

Temperature controls randomness. Low values (0–0.3) give focused, repeatable
output; high values give more varied, creative output. The right value depends
on the task: summarising a contract wants low temperature, brainstorming wants
higher. It is a model setting, so it is outside the prompt itself.

---

### 11. How do you know your app works?

The rules are unit tested: 74 assertions run in plain Node with no
dependencies. They cover prompt composition order, whitespace handling, flavour
thresholds, cookbook persistence, corrupted storage, HTML escaping, clipboard
fallbacks, and the random generator. We can run
`node test/prompt-chef.test.js` live.

---

### 12. Why is there no backend or database?

The app never needs to send anything to a server: prompt composition and scoring
happen in the browser, and the cookbook is personal, so `localStorage` is
enough. A backend would add cost, latency, and privacy risk for no benefit. If
we later add LLM integration, a small proxy would be needed to keep API keys
private.

---

### 13. What are the limitations of the project?

The meter judges structure, not meaning — a well-structured but factually vague
prompt can still score "Perfect". The cookbook is per-browser and is lost if
site data is cleared. The interface is English-only. These are documented as
future work.

---

### 14. What would you build next?

Three things: optional LLM integration with a side-by-side comparison of answers,
a model-based scorer that rates specificity and ambiguity, and cookbook
export/import with shareable prompt links. Multi-language support is also
planned.

---

### 15. Why "Prompt Chef"?

Because the six ingredients are combined like a recipe, the quality meter is a
"flavour" meter, and saved prompts go into a "cookbook". The metaphor makes the
structure easy to remember, which is the whole point of the project.

---

## If the teacher says "explain the code"

Say this, in this order:

1. **State** — one object holds the pot (six fields) and the cookbook.
2. **Render** — every change re-renders the UI from that state, so the screen
   always matches the data.
3. **`buildPrompt()`** — trims each field, removes extra spaces, and joins the
   filled ingredients in the fixed order.
4. **`evaluateFlavor()`** — counts words and filled ingredients, applies the
   three rules, and returns the verdict, percentage, and explanation.
5. **Cookbook** — `saveRecipe`, `loadRecipe`, `deleteRecipe` write through to
   `localStorage`.
6. **Tests** — the same functions are imported by a plain Node script with a
   stubbed DOM, so the rules are verified without a browser.
