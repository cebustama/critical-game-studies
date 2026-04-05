import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

/* ═══════════════════════════════════════════════════════
   P R O G R E S S
   A game poem about extraction.
   ═══════════════════════════════════════════════════════ */

/* ─── world elements: a Mondrian composition of living things ─── */
const WORLD = [
  { id:"f0",  x:2,  y:2,  w:18, h:19, type:"forest", c:"#2d6b1e" },
  { id:"f1",  x:22, y:1,  w:14, h:16, type:"forest", c:"#3a7a2a" },
  { id:"f2",  x:57, y:3,  w:19, h:14, type:"forest", c:"#357a28" },
  { id:"f3",  x:3,  y:28, w:16, h:16, type:"forest", c:"#2e7d1f" },
  { id:"f4",  x:69, y:25, w:27, h:18, type:"forest", c:"#3d8530" },
  { id:"f5",  x:31, y:48, w:17, h:14, type:"forest", c:"#2a6318" },
  { id:"f6",  x:4,  y:58, w:19, h:20, type:"forest", c:"#348a26" },
  { id:"f7",  x:55, y:54, w:15, h:16, type:"forest", c:"#2f7520" },
  { id:"f8",  x:38, y:23, w:12, h:12, type:"forest", c:"#3b8132" },
  { id:"f9",  x:76, y:64, w:20, h:18, type:"forest", c:"#2c6a1c" },
  { id:"w0",  x:40, y:1,  w:13, h:13, type:"water",  c:"#1a5276" },
  { id:"w1",  x:1,  y:44, w:14, h:9,  type:"water",  c:"#2471a3" },
  { id:"w2",  x:51, y:38, w:11, h:11, type:"water",  c:"#1b6b99" },
  { id:"w3",  x:26, y:68, w:16, h:8,  type:"water",  c:"#1f6f8b" },
  { id:"a0",  x:13, y:12, w:5,  h:4,  type:"animal", c:"#c0392b" },
  { id:"a1",  x:47, y:16, w:4,  h:5,  type:"animal", c:"#e67e22" },
  { id:"a2",  x:72, y:34, w:5,  h:4,  type:"animal", c:"#d4a017" },
  { id:"a3",  x:24, y:54, w:4,  h:5,  type:"animal", c:"#c0392b" },
  { id:"a4",  x:61, y:64, w:5,  h:4,  type:"animal", c:"#e67e22" },
  { id:"a5",  x:9,  y:74, w:4,  h:4,  type:"animal", c:"#d4a017" },
  { id:"n0",  x:32, y:33, w:7,  h:9,  type:"native", c:"#8e44ad" },
  { id:"n1",  x:64, y:13, w:6,  h:8,  type:"native", c:"#a04db5" },
  { id:"n2",  x:15, y:39, w:7,  h:7,  type:"native", c:"#7d3c98" },
  { id:"n3",  x:48, y:66, w:6,  h:8,  type:"native", c:"#9b59b6" },
];

/* ─── fixed narrative sequence: what dies in what order ─── */
const SEQUENCE = [
  "forest","forest","forest","forest",   // clearing the land — routine
  "water",                                // first water — wait...
  "forest","forest",                      // more clearing
  "animal",                               // first animal — a small shock
  "forest",                               // more clearing
  "water",                                // the water is going
  "animal",                               // another animal
  "forest",                               // clearing continues
  "water",                                // more water
  "animal",                               // another animal
  "forest",                               // a forest, again
  "native",                               // first people displaced
  "animal",                               // another animal
  "water",                                // last water
  "forest",                               // last forest
  "animal",                               // another animal
  "native",                               // more people
  "animal",                               // last animal
  "native",                               // almost done
  "native",                               // the last people
];

const TOTAL = WORLD.length;

/* ─── utilities ─── */
function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function colorLerp(hex1, hex2, t) {
  const p = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(hex1);
  const [r2, g2, b2] = p(hex2);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r},${g},${b})`;
}

function formatScore(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

/* ═══════════════════════════════════════════════════════ */

export default function Progress() {
  const [phase, setPhase] = useState("loading");
  const [alive, setAlive] = useState(() => new Set(WORLD.map((e) => e.id)));
  const [step, setStep] = useState(0);
  const [buildPct, setBuildPct] = useState(0);
  const audioRef = useRef({ started: false });
  const removedByType = useRef({ forest: 0, water: 0, animal: 0, native: 0 });

  const destruction = 1 - alive.size / TOTAL;
  const score = step === 0 ? 0 : Math.floor(10 * Math.pow(2.5, step));

  /* background: green → brown → grey */
  const bg =
    destruction < 0.5
      ? colorLerp("#3d6b44", "#8b7355", destruction * 2)
      : colorLerp("#8b7355", "#5a5a5a", (destruction - 0.5) * 2);

  /* ─── check permanent death on mount ─── */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("progress-poem-dead");
        setPhase(r ? "dead" : "title");
      } catch {
        setPhase("title");
      }
    })();
  }, []);

  /* ─── update audio as destruction progresses ─── */
  useEffect(() => {
    const a = audioRef.current;
    if (!a.started || !a.drone || !a.filter) return;
    a.filter.frequency.rampTo(lerp(700, 50, destruction), 1);
    a.drone.volume.rampTo(lerp(-20, -55, destruction), 1);
  }, [destruction]);

  /* ─── audio setup ─── */
  const initAudio = useCallback(async () => {
    if (audioRef.current.started) return;
    try {
      await Tone.start();
      const filter = new Tone.Filter({
        frequency: 700,
        type: "lowpass",
      }).toDestination();

      const drone = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 4, decay: 0, sustain: 1, release: 5 },
        volume: -20,
      }).connect(filter);
      drone.triggerAttack("C2");

      const pluck = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.08 },
        volume: -10,
      }).connect(filter);

      audioRef.current = { started: true, drone, pluck, filter };
    } catch {
      audioRef.current = { started: true };
    }
  }, []);

  /* ─── the core act: tap to extract ─── */
  const extract = useCallback(async () => {
    if (phase === "title") {
      await initAudio();
      setPhase("play");
      return;
    }

    if (phase !== "play") return;
    if (step >= TOTAL) return;
    if (!audioRef.current.started) await initAudio();

    /* determine target: follow the narrative sequence */
    const targetType = SEQUENCE[step];
    const typeIndex = removedByType.current[targetType];
    const candidates = WORLD.filter((e) => e.type === targetType && alive.has(e.id));

    if (candidates.length === 0) return;

    const target = candidates[typeIndex % candidates.length] || candidates[0];
    removedByType.current[targetType]++;

    /* extraction sound — bright at first, dull at end */
    const a = audioRef.current;
    if (a.pluck) {
      try {
        const freq = lerp(600, 80, step / TOTAL);
        a.pluck.triggerAttackRelease(freq, 0.12);
      } catch {}
    }

    /* update world */
    const next = new Set(alive);
    next.delete(target.id);
    setAlive(next);
    const nextStep = step + 1;
    setStep(nextStep);
    setBuildPct(nextStep / TOTAL);

    /* last extraction? */
    if (nextStep >= TOTAL) {
      /* kill the drone */
      if (a.drone) {
        try { a.drone.triggerRelease(); } catch {}
      }
      /* save permanent death immediately */
      try {
        await window.storage.set("progress-poem-dead", "true");
      } catch {}
      setPhase("won");
      /* brief silence, then permanent end */
      setTimeout(() => setPhase("dead"), 3500);
    }
  }, [phase, step, alive, initAudio]);

  /* ─── font size for score ─── */
  const scoreFontVw = lerp(5, 18, destruction);

  /* ═══════════════════════════════════════════════════════
     R E N D E R
     ═══════════════════════════════════════════════════════ */

  const mono = "'Courier New', Courier, monospace";

  /* ─── LOADING ─── */
  if (phase === "loading") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  /* ─── DEAD FOREVER ─── */
  if (phase === "dead") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#5a5a5a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: mono,
        }}
      >
        {/* the building — all that remains */}
        <div
          style={{
            position: "absolute",
            left: "22%",
            top: "10%",
            width: "56%",
            height: "80%",
            background: "#2c2c2c",
            border: "3px solid #1a1a1a",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            color: "#1a1a1a",
            fontSize: "clamp(2.5rem, 10vw, 6rem)",
            fontWeight: "bold",
            letterSpacing: "0.35em",
            textAlign: "center",
          }}
        >
          YOU WIN
        </div>
      </div>
    );
  }

  /* ─── WON: 3.5 seconds of silence ─── */
  if (phase === "won") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#5a5a5a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "22%",
            top: "10%",
            width: "56%",
            height: "80%",
            background: "#2c2c2c",
            border: "3px solid #1a1a1a",
          }}
        />
      </div>
    );
  }

  /* ─── TITLE ─── */
  if (phase === "title") {
    return (
      <div
        onClick={extract}
        style={{
          width: "100vw",
          height: "100vh",
          background: "#3d6b44",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontFamily: mono,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* WORLD visible behind title */}
        {WORLD.map((el) => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              background: el.c,
              border: "1.5px solid rgba(0,0,0,0.2)",
            }}
          />
        ))}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            color: "#0e2e12",
            fontSize: "clamp(2rem, 9vw, 4.5rem)",
            fontWeight: "bold",
            letterSpacing: "0.5em",
            textShadow: "0 0 40px rgba(61,107,68,0.8)",
          }}
        >
          PROGRESS
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 2,
            color: "rgba(14,46,18,0.5)",
            fontSize: "clamp(0.6rem, 2vw, 0.8rem)",
            marginTop: "2.5rem",
            letterSpacing: "0.25em",
          }}
        >
          tap to begin
        </div>
      </div>
    );
  }

  /* ─── PLAYING ─── */
  return (
    <div
      onClick={extract}
      style={{
        width: "100vw",
        height: "100vh",
        background: bg,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: mono,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        transition: "background-color 0.7s ease",
      }}
    >
      {/* world elements */}
      {WORLD.map((el) => (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${el.h}%`,
            background: el.c,
            border: "1.5px solid rgba(0,0,0,0.2)",
            opacity: alive.has(el.id) ? 1 : 0,
            transition: "opacity 1.4s ease-out",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* the building — grows from center */}
      {buildPct > 0.04 && (
        <div
          style={{
            position: "absolute",
            left: `${50 - buildPct * 28}%`,
            top: `${50 - buildPct * 40}%`,
            width: `${buildPct * 56}%`,
            height: `${buildPct * 80}%`,
            background: "#2c2c2c",
            border: `${Math.max(1, Math.round(buildPct * 3))}px solid #1a1a1a`,
            transition: "all 0.6s ease",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />
      )}

      {/* the number */}
      {step > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color:
              destruction > 0.5
                ? "rgba(180,180,180,0.18)"
                : "rgba(255,255,255,0.15)",
            fontSize: `clamp(1rem, ${scoreFontVw}vw, 20vw)`,
            fontWeight: "bold",
            zIndex: 10,
            transition: "all 0.6s ease",
            pointerEvents: "none",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {formatScore(score)}
        </div>
      )}

      {/* tap hint — fades after 3 taps */}
      {step < 3 && (
        <div
          style={{
            position: "absolute",
            bottom: "7%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.25)",
            fontSize: "clamp(0.55rem, 1.8vw, 0.75rem)",
            letterSpacing: "0.2em",
            zIndex: 20,
            pointerEvents: "none",
            opacity: step === 0 ? 0.6 : step === 1 ? 0.3 : 0.1,
            transition: "opacity 0.8s ease",
          }}
        >
          tap to extract
        </div>
      )}
    </div>
  );
}
