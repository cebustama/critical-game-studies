# PROGRESS

## A Game Poem

---

### Premise

A world exists. It is full. You arrive. You extract. A number goes up. The world empties. You win. You can never go back.

---

### Visual Language

Mondrian-like. Flat rectangles, black borders, no curves. The world is a composition of colored blocks on a green field:

- **Green blocks** — forests (10)
- **Blue blocks** — water bodies (4)
- **Small warm blocks** (red, orange, gold) — animals (6)
- **Medium violet blocks** — native peoples (4)

Total: 24 elements. 24 taps to win.

---

### Interaction

Tap anywhere. Each tap removes one element from the world. The player does not choose what to destroy — the system chooses, following a fixed arc:

1. **Taps 1–7:** Mostly forests. Feels routine. Number climbs.
2. **Taps 8–12:** Water begins to go. First animals vanish. Something shifts.
3. **Taps 13–18:** Interleaved loss. First native displacement. The cost becomes visible.
4. **Taps 19–24:** The last animals. The last peoples. The world empties.

Each tap also grows a dark building from the center of the screen.

---

### The Number

A counter displays the accumulated "progress." It grows exponentially — from 25 to 22 billion across 24 taps. Its font size grows with it, eventually dominating the screen. It measures everything and means nothing.

---

### Background

The background color transitions continuously:

- **Green (#3d6b44)** → living land
- **Brown (#8B7355)** → dying land
- **Grey (#5a5a5a)** → dead land

---

### Sound

Minimal. A low sine drone begins on first tap — warm, steady. As the world empties:

- The drone loses warmth (low-pass filter closes)
- The drone loses volume
- Extraction sounds drop in pitch from bright to dull

On the last tap: silence.

---

### The End

When the 24th element is extracted:

1. Three seconds of silence. Barren grey. The building. Nothing else.
2. Then: **YOU WIN** appears. Permanently.

---

### The Permanent Death

The game saves its end state to persistent storage. Refreshing, closing, reopening — the world stays dead. Grey background. Dark building. **YOU WIN.** Forever.

The player won. There is nothing left to play.

---

### Duration

~3–5 minutes.

### Controls

Tap/click only.

### Platform

Browser (mobile-first).
