import { useState, useRef, useEffect, useCallback } from "react";

if (!document.getElementById("tg-fonts")) {
  const l = document.createElement("link");
  l.id = "tg-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Mono:wght@400;700&family=Courier+Prime:wght@400;700&family=Bebas+Neue&family=Playfair+Display:ital,wght@0,700;1,700&display=swap";
  document.head.appendChild(l);
}

const FONTS = [
  { label: "Space Mono",    value: "Space Mono" },
  { label: "IBM Plex Mono", value: "IBM Plex Mono" },
  { label: "Courier Prime", value: "Courier Prime" },
  { label: "Bebas Neue",    value: "Bebas Neue" },
];

const SHAPES = [
  { label: "Circle",   value: "circle" },
  { label: "Square",   value: "square" },
  { label: "Triangle", value: "triangle" },
  { label: "Diamond",  value: "diamond" },
  { label: "Star",     value: "star" },
  { label: "Hexagon",  value: "hexagon" },
  { label: "Ring",     value: "ring" },
  { label: "Blob",     value: "blob" },
];

const ASPECT_RATIOS = [
  { label: "1:1",  w: 1,  h: 1  },
  { label: "3:4",  w: 3,  h: 4  },
  { label: "4:3",  w: 4,  h: 3  },
  { label: "2:3",  w: 2,  h: 3  },
  { label: "3:2",  w: 3,  h: 2  },
  { label: "9:16", w: 9,  h: 16 },
  { label: "16:9", w: 16, h: 9  },
  { label: "5:4",  w: 5,  h: 4  },
  { label: "4:5",  w: 4,  h: 5  },
  { label: "21:9", w: 21, h: 9  },
];

function computeDims(ratio) {
  const BASE = 2048;
  const { w, h } = ratio;
  return w >= h
    ? { cw: BASE, ch: Math.round(BASE * h / w) }
    : { cw: Math.round(BASE * w / h), ch: BASE };
}

function snap(value, step) {
  return Math.round(value / step) * step;
}

function seededRand(seed, n) {
  const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hexToHsv(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return [0, 0, 100];
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function hsvToHex(h, s, v) {
  s /= 100; v /= 100;
  const f = n => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function DragSlider({ value, min, max, step, onChange, lo, hi, fmt, accentColor }) {
  const trackRef = useRef(null);

  const pct = ((value - min) / (max - min)) * 100;

  const valueFromClientX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snap(min + ratio * (max - min), step);
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    onChange(valueFromClientX(e.clientX));

    const onMove = (ev) => onChange(valueFromClientX(ev.clientX));
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        style={{
          position: "relative", height: 20, cursor: "ew-resize",
          display: "flex", alignItems: "center", userSelect: "none", touchAction: "none",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#333", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 2, background: "#888", borderRadius: 2 }} />
        <div style={{
          position: "absolute", left: `${pct}%`, transform: "translateX(-50%)",
          width: 12, height: 12, borderRadius: "50%",
          background: "#d0d0d0",
          border: "2px solid #1a1a1a",
          boxSizing: "border-box",
        }} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, lo, hi, fmt, accentColor }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "#888", textTransform: "uppercase" }}>{label}</span>
        {lo && hi && (
          <span style={{ fontSize: 8, color: "#555", letterSpacing: "0.08em" }}>{lo} — {hi}</span>
        )}
      </div>
      <DragSlider value={value} min={min} max={max} step={step} onChange={onChange}
        fmt={fmt} accentColor={accentColor} />
    </div>
  );
}

function RatioIcon({ w, h }) {
  const MAX = 16;
  const rw = w >= h ? MAX : Math.round(MAX * w / h);
  const rh = h >= w ? MAX : Math.round(MAX * h / w);
  return (
    <div style={{ width: MAX + 4, height: MAX + 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{
        width: rw, height: rh,
        border: "1.5px solid #777",
        borderRadius: 1.5,
        boxSizing: "border-box",
      }} />
    </div>
  );
}

function AspectRatioSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = ASPECT_RATIOS.find(r => r.label === value) || ASPECT_RATIOS[0];

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 18 }}>
      <span style={lbl}>Aspect Ratio</span>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...iStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none",
        }}
      >
        <RatioIcon w={selected.w} h={selected.h} />
        <span style={{ flex: 1 }}>{selected.label}</span>
        <svg width="14" height="14" viewBox="0 0 512 512" fill="#555" style={{ flexShrink: 0 }}><path d="m98 190.06 139.78 163.12a24 24 0 0 0 36.44 0l139.78-163.12c13.34-15.57 2.28-39.62-18.22-39.62h-279.6c-20.5 0-31.56 24.05-18.18 39.62z"/></svg>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "#131313", border: "1px solid #252525", borderRadius: 6,
          overflow: "hidden",
        }}>
          {ASPECT_RATIOS.map(r => (
            <div
              key={r.label}
              onMouseDown={() => { onChange(r.label); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 11px",
                cursor: "pointer",
                background: r.label === value ? "#1e1e1e" : "transparent",
              }}
              onMouseEnter={e => { if (r.label !== value) e.currentTarget.style.background = "#181818"; }}
              onMouseLeave={e => { e.currentTarget.style.background = r.label === value ? "#1e1e1e" : "transparent"; }}
            >
              <RatioIcon w={r.w} h={r.h} />
              <span style={{ flex: 1, fontSize: 12, color: "#c8c8c8", fontFamily: "'Space Mono', monospace" }}>{r.label}</span>
              {r.label === value && <span style={{ color: "#888", fontSize: 11 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShapeIcon({ value }) {
  const s = { stroke: "#777", strokeWidth: 1.5, fill: "none", strokeLinejoin: "round" };
  const icons = {
    circle:   <circle cx="9" cy="9" r="7" {...s} />,
    square:   <rect x="2" y="2" width="14" height="14" {...s} />,
    triangle: <polygon points="9,2 16,16 2,16" {...s} />,
    diamond:  <polygon points="9,2 16,9 9,16 2,9" {...s} />,
    star:     <polygon points="9,2 10.76,6.57 15.66,6.84 11.85,9.93 13.11,14.66 9,12 4.89,14.66 6.15,9.93 2.34,6.84 7.24,6.57" {...s} />,
    hexagon:  <polygon points="9,2 15.06,5.5 15.06,12.5 9,16 2.94,12.5 2.94,5.5" {...s} />,
    ring:     <>{' '}<circle cx="9" cy="9" r="7" {...s} /><circle cx="9" cy="9" r="3.5" {...s} /></>,
    blob:     <path d="M13,3 C17,6 16,14 12,16 C8,18 2,14 2,10 C2,5 6,1 10,2 C12,2 13,3 13,3 Z" {...s} />,
  };
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      {icons[value] ?? icons.circle}
    </svg>
  );
}

function ShapeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(o => !o);
  };

  const selected = SHAPES.find(s => s.value === value) || SHAPES[0];

  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      <span style={lbl}>Shape</span>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{ ...iStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
      >
        <ShapeIcon value={selected.value} />
        <span style={{ flex: 1 }}>{selected.label}</span>
        <svg width="14" height="14" viewBox="0 0 512 512" fill="#555" style={{ flexShrink: 0 }}><path d="m98 190.06 139.78 163.12a24 24 0 0 0 36.44 0l139.78-163.12c13.34-15.57 2.28-39.62-18.22-39.62h-279.6c-20.5 0-31.56 24.05-18.18 39.62z"/></svg>
      </div>
      {open && (
        <div style={{
          position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 1000,
          background: "#131313", border: "1px solid #252525", borderRadius: 6,
          overflow: "hidden",
        }}>
          {SHAPES.map(s => (
            <div
              key={s.value}
              onMouseDown={() => { onChange(s.value); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 11px",
                cursor: "pointer",
                background: s.value === value ? "#1e1e1e" : "transparent",
              }}
              onMouseEnter={e => { if (s.value !== value) e.currentTarget.style.background = "#181818"; }}
              onMouseLeave={e => { e.currentTarget.style.background = s.value === value ? "#1e1e1e" : "transparent"; }}
            >
              <ShapeIcon value={s.value} />
              <span style={{ flex: 1, fontSize: 12, color: "#c8c8c8", fontFamily: "'Space Mono', monospace" }}>{s.label}</span>
              {s.value === value && <span style={{ color: "#888", fontSize: 11 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildLumMap(shape, cxPct, cyPct, sizePct, softness, rot, ringGap, blobPoints, blobSpread, blobSeed, CW, CH) {
  const off = document.createElement("canvas");
  off.width = CW; off.height = CH;
  const ctx = off.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CW, CH);

  const r   = (sizePct / 100) * Math.min(CW, CH) * 0.48;
  const pcx = (cxPct / 100) * CW;
  const pcy = (cyPct / 100) * CH;
  const blurPx = Math.round(softness * 1.8);
  if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`;
  ctx.fillStyle = "#fff";

  if (shape === "blob") {
    for (let i = 0; i < blobPoints; i++) {
      const angle = seededRand(blobSeed, i * 3) * Math.PI * 2;
      const dist = (blobSpread / 100) * r * seededRand(blobSeed, i * 3 + 1);
      const blobR = r * (0.3 + 0.6 * seededRand(blobSeed, i * 3 + 2));
      const bx = pcx + Math.cos(angle) * dist;
      const by = pcy + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(bx, by, blobR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape === "ring") {
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.arc(0, 0, r * (1 - ringGap), 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.beginPath();
    switch (shape) {
      case "circle":  ctx.arc(0, 0, r, 0, Math.PI * 2); break;
      case "square":  ctx.rect(-r, -r, r * 2, r * 2); break;
      case "triangle":
        ctx.moveTo(0, -r); ctx.lineTo(r * 0.866, r * 0.5); ctx.lineTo(-r * 0.866, r * 0.5);
        ctx.closePath(); break;
      case "diamond":
        ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0);
        ctx.closePath(); break;
      case "star": {
        const inner = r * 0.42;
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const rad = i % 2 === 0 ? r : inner;
          i === 0 ? ctx.moveTo(Math.cos(a)*rad, Math.sin(a)*rad)
                  : ctx.lineTo(Math.cos(a)*rad, Math.sin(a)*rad);
        }
        ctx.closePath(); break;
      }
      case "hexagon":
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
                  : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        ctx.closePath(); break;
      default: ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  const raw = ctx.getImageData(0, 0, CW, CH).data;
  const map = new Float32Array(CW * CH);
  for (let i = 0; i < CW * CH; i++) map[i] = raw[i * 4] / 255;
  return map;
}

function DropZone({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onUpload({ target: { files: [file], value: "" } });
    }
  };

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        height: 108, borderRadius: 6, border: `1.5px dashed ${dragging ? "#666" : "#2a2a2a"}`,
        background: dragging ? "#181818" : "#0d0d0d",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} style={{ display: "none" }} />
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={dragging ? "#888" : "#444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 14V4M7 8l4-4 4 4" />
        <path d="M3 15v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <span style={{ fontSize: 9, letterSpacing: "0.14em", color: dragging ? "#888" : "#444", fontFamily: "'Space Mono', monospace" }}>
        {dragging ? "DROP IMAGE" : "CLICK OR DROP IMAGE"}
      </span>
    </div>
  );
}

function FontSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = FONTS.find(f => f.value === value) || FONTS[0];

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 18 }}>
      <span style={lbl}>Font</span>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ ...iStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
      >
        <span style={{ fontFamily: `'${selected.value}', monospace`, fontSize: 14, color: "#c8c8c8", width: 20, textAlign: "center", flexShrink: 0 }}>Ag</span>
        <span style={{ flex: 1 }}>{selected.label}</span>
        <svg width="14" height="14" viewBox="0 0 512 512" fill="#555" style={{ flexShrink: 0 }}><path d="m98 190.06 139.78 163.12a24 24 0 0 0 36.44 0l139.78-163.12c13.34-15.57 2.28-39.62-18.22-39.62h-279.6c-20.5 0-31.56 24.05-18.18 39.62z"/></svg>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "#131313", border: "1px solid #252525", borderRadius: 6,
          overflow: "hidden",
        }}>
          {FONTS.map(f => (
            <div
              key={f.value}
              onMouseDown={() => { onChange(f.value); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 11px",
                cursor: "pointer",
                background: f.value === value ? "#1e1e1e" : "transparent",
              }}
              onMouseEnter={e => { if (f.value !== value) e.currentTarget.style.background = "#181818"; }}
              onMouseLeave={e => { e.currentTarget.style.background = f.value === value ? "#1e1e1e" : "transparent"; }}
            >
              <span style={{ fontFamily: `'${f.value}', monospace`, fontSize: 14, color: "#c8c8c8", width: 20, textAlign: "center", flexShrink: 0 }}>Ag</span>
              <span style={{ flex: 1, fontSize: 12, color: "#c8c8c8", fontFamily: "'Space Mono', monospace" }}>{f.label}</span>
              {f.value === value && <span style={{ color: "#888", fontSize: 11 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Collapsible({ open, children }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.22s ease" }}>
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

function HoverZone({ children, first = false }) {
  const [hovered, setHovered] = useState(false);
  const mt = first ? 0 : -20;
  const pt = first ? 0 : 20;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ margin: `${mt}px -20px -6px`, padding: `${pt}px 20px 6px`, background: hovered ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.2s" }}
    >
      {children}
    </div>
  );
}

function Section({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  const handleToggle = () => {
    const opening = !open;
    setOpen(o => !o);
    if (opening) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 240);
    }
  };

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ margin: "-20px -20px -6px", padding: "20px 20px 6px", background: hovered ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.2s" }}
    >
      <div
        onClick={handleToggle}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none", paddingBottom: 12 }}
      >
        <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "#888", textTransform: "uppercase" }}>{label}</span>
        <svg width="10" height="10" viewBox="0 0 512 512" fill="#555"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s ease", flexShrink: 0 }}>
          <path d="m98 190.06 139.78 163.12a24 24 0 0 0 36.44 0l139.78-163.12c13.34-15.57 2.28-39.62-18.22-39.62h-279.6c-20.5 0-31.56 24.05-18.18 39.62z"/>
        </svg>
      </div>
      <Collapsible open={open}>
        {children}
      </Collapsible>
    </div>
  );
}

function FontDropZone({ onUpload, fontName }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".otf") || file.name.endsWith(".ttf"))) {
      onUpload({ target: { files: [file], value: "" } });
    }
  };

  if (fontName) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#131313", border: "1px solid #252525", borderRadius: 6, padding: "6px 10px", marginBottom: 4 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#777" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 13h12M4 13V5.5L8 3l4 2.5V13M6 13v-3h4v3" />
        </svg>
        <span style={{ flex: 1, fontSize: 10, color: "#c8c8c8", fontFamily: "'Space Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fontName}</span>
        <button onClick={() => onUpload(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        height: 108, borderRadius: 6, border: `1.5px dashed ${dragging ? "#666" : "#2a2a2a"}`,
        background: dragging ? "#181818" : "#0d0d0d",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <input ref={inputRef} type="file" accept=".otf,.ttf" onChange={onUpload} style={{ display: "none" }} />
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={dragging ? "#888" : "#444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 14V4M7 8l4-4 4 4" />
        <path d="M3 15v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <span style={{ fontSize: 9, letterSpacing: "0.14em", color: dragging ? "#888" : "#444", fontFamily: "'Space Mono', monospace" }}>
        {dragging ? "DROP FONT" : "CLICK OR DROP OTF / TTF"}
      </span>
    </div>
  );
}

function buildImageLumMap(bitmap, CW, CH) {
  const off = document.createElement("canvas");
  off.width = CW; off.height = CH;
  const ctx = off.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, CW, CH);
  const raw = ctx.getImageData(0, 0, CW, CH).data;
  const map = new Float32Array(CW * CH);
  for (let i = 0; i < CW * CH; i++) {
    const r = raw[i * 4], g = raw[i * 4 + 1], b = raw[i * 4 + 2];
    map[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  return map;
}

const iStyle = {
  width: "100%", background: "#131313", border: "1px solid #252525",
  borderRadius: 6, color: "#c8c8c8", fontFamily: "'Space Mono', monospace",
  fontSize: 12, padding: "8px 11px", outline: "none", boxSizing: "border-box",
};
const lbl = { display: "block", fontSize: 9, letterSpacing: "0.14em", color: "#888", textTransform: "uppercase", marginBottom: 6 };
const divider = { borderTop: "1px solid #2e2e2e", margin: "6px -20px 20px" };

function ColorInput({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [popTop, setPopTop] = useState(0);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const internalHexRef = useRef(value);
  const fieldRef = useRef(null);
  const hueRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (value !== internalHexRef.current) {
      setHsv(hexToHsv(value));
      internalHexRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const [h, s, v] = hsv;

  const updateColor = (nh, ns, nv) => {
    const hex = hsvToHex(nh, ns, nv);
    internalHexRef.current = hex;
    setHsv([nh, ns, nv]);
    onChange(hex);
  };

  const onFieldPointerDown = (e) => {
    e.preventDefault();
    const move = (ev) => {
      const rect = fieldRef.current.getBoundingClientRect();
      const ns = Math.round(Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)) * 100);
      const nv = Math.round(Math.max(0, Math.min(1, 1 - (ev.clientY - rect.top) / rect.height)) * 100);
      updateColor(h, ns, nv);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    move(e);
  };

  const onHuePointerDown = (e) => {
    e.preventDefault();
    const move = (ev) => {
      const rect = hueRef.current.getBoundingClientRect();
      const nh = Math.round(Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)) * 360);
      updateColor(nh, s, v);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    move(e);
  };

  const handleTriggerClick = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popH = 300;
      const top = Math.min(rect.top, window.innerHeight - popH - 12);
      setPopTop(Math.max(12, top));
    }
    setOpen(o => !o);
  };

  const pureHue = `hsl(${h}, 100%, 50%)`;

  return (
    <div style={{ marginBottom: 10 }}>
      <span style={lbl}>{label}</span>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: "#131313", border: "1px solid #252525", borderRadius: 6,
          padding: "6px 10px", userSelect: "none",
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 3,
          background: value, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, color: "#c8c8c8", fontFamily: "'Space Mono', monospace", flex: 1 }}>
          {value.replace('#', '').toUpperCase()}
        </span>
      </div>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed", left: 278, top: popTop, width: 232, zIndex: 1000,
            background: "#0f0f0f", border: "1px solid #252525", borderRadius: 8,
            padding: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          <div
            ref={fieldRef}
            onPointerDown={onFieldPointerDown}
            style={{
              position: "relative", width: "100%", height: 160, borderRadius: 6,
              cursor: "crosshair", marginBottom: 10, background: pureHue,
              userSelect: "none", touchAction: "none",
            }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "linear-gradient(to right, #fff, transparent)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "linear-gradient(to bottom, transparent, #000)" }} />
            <div style={{
              position: "absolute", left: `${s}%`, top: `${100 - v}%`,
              transform: "translate(-50%, -50%)", pointerEvents: "none",
              width: 12, height: 12, borderRadius: "50%",
              border: "2px solid #fff", boxSizing: "border-box",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
            }} />
          </div>
          <div
            ref={hueRef}
            onPointerDown={onHuePointerDown}
            style={{
              position: "relative", height: 12, borderRadius: 6,
              cursor: "ew-resize", marginBottom: 10,
              background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
              userSelect: "none", touchAction: "none",
            }}
          >
            <div style={{
              position: "absolute", left: `${(h / 360) * 100}%`, top: "50%",
              transform: "translate(-50%, -50%)", pointerEvents: "none",
              width: 14, height: 14, borderRadius: "50%",
              background: pureHue, border: "2px solid #fff", boxSizing: "border-box",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
            }} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: value, border: "1px solid #252525", flexShrink: 0 }} />
            <input
              type="text" value={value}
              onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
              style={iStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Typogram() {
  const [word,        setWord]       = useState("TYPEYOURWORD");
  const [fgColor,     setFg]         = useState("#85914e");
  const [bgColor,     setBg]         = useState("#153b3d");
  const [font,        setFont]       = useState("Space Mono");
  const [contrast,    setContrast]   = useState(0.65);
  const [density,     setDensity]    = useState(16);
  const [aspectRatio, setAspectRatio]= useState("1:1");
  const [shape,       setShape]      = useState("circle");
  const [cx,          setCx]         = useState(50);
  const [cy,          setCy]         = useState(50);
  const [size,        setSize]       = useState(60);
  const [softness,    setSoft]       = useState(30);
  const [rot,         setRot]        = useState(0);
  const [ringGap,     setRingGap]    = useState(0.45);
  const [blobPoints,  setBlobPoints] = useState(3);
  const [blobSpread,  setBlobSpread] = useState(50);
  const [blobSeed,    setBlobSeed]   = useState(1);
  const [animTypes,    setAnimTypes]    = useState([]);
  const [animSpeed,    setAnimSpeed]    = useState(1);
  const [animStrength, setAnimStrength] = useState(0.5);
  const [hasImage,   setHasImage]   = useState(false);
  const [sourceTab,    setSourceTab]    = useState("shape");
  const [fontTab,        setFontTab]        = useState("system");
  const [customFontName, setCustomFontName] = useState("");
  const [customFontFamily, setCustomFontFamily] = useState("");
  const [imageURL,   setImageURL]   = useState(null);
  const [imageName,  setImageName]  = useState("");
  const [textMode,   setTextMode]   = useState("custom");
  const imageBitmapRef = useRef(null);
  const canvasRef    = useRef(null);
  const lumMapRef    = useRef(null);
  const drawOnlyRef  = useRef(null);
  const rafRef       = useRef(null);
  const animTimeRef  = useRef(0);
  const lastRafRef   = useRef(null);

  const selectedRatio = ASPECT_RATIOS.find(r => r.label === aspectRatio) || ASPECT_RATIOS[0];
  const { cw: CW, ch: CH } = computeDims(selectedRatio);

  // Always-fresh draw closure — updated every render so RAF loop reads latest state
  drawOnlyRef.current = (t) => {
    const canvas = canvasRef.current;
    const lumMap = lumMapRef.current;
    if (!canvas || !lumMap) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = fgColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cw = density;
    const ch = Math.round(density * 1.18);
    const minSz = Math.max(3, density * 0.22);
    const maxSz = minSz + contrast * density * 1.3;
    const letters = (word || "A").toUpperCase();
    const totalCols = Math.ceil(CW / cw) + 1;
    const totalRows = Math.ceil(CH / ch) + 1;
    let li = 0;
    for (let row = 0; row * ch <= CH; row++) {
      for (let col = 0; col * cw <= CW; col++) {
        const px = col * cw + cw / 2;
        const py = row * ch + ch / 2;
        const xi = Math.min(CW - 1, Math.floor(px));
        const yi = Math.min(CH - 1, Math.floor(py));
        let lookupXi = xi, lookupYi = yi;
        if (animTypes.includes("drift")) {
          const ox = Math.round(animStrength * 50 * Math.sin(t * animSpeed * 0.5));
          const oy = Math.round(animStrength * 35 * Math.cos(t * animSpeed * 0.37));
          lookupXi = Math.max(0, Math.min(CW - 1, xi + ox));
          lookupYi = Math.max(0, Math.min(CH - 1, yi + oy));
        }
        const b = lumMap[lookupYi * CW + lookupXi];
        let mod = 1;
        if (animTypes.includes("wave"))
          mod *= 1 + animStrength * 0.5 * Math.sin(col * 0.5 + row * 0.4 - t * animSpeed * 2);
        if (animTypes.includes("pulse"))
          mod *= 1 + animStrength * 0.5 * Math.sin(t * animSpeed * Math.PI * 2);
        if (animTypes.includes("ripple")) {
          const dx = col - totalCols / 2, dy = row - totalRows / 2;
          mod *= 1 + animStrength * 0.5 * Math.sin(Math.sqrt(dx * dx + dy * dy) * 0.8 - t * animSpeed * 4);
        }
        if (animTypes.includes("shimmer")) {
          const sweep = (t * animSpeed * 0.3) % 1;
          const diff = Math.abs(((col / (totalCols - 1) - sweep + 1.5) % 1) - 0.5);
          mod *= 1 + animStrength * Math.max(0, 0.5 - diff) * 2;
        }
        if (animTypes.includes("chaos"))
          mod *= 1 + animStrength * 0.4 * Math.sin(li * 2.399 + t * animSpeed * 2.5);
        const sz = Math.max(1, (minSz + b * (maxSz - minSz)) * mod);
        ctx.font = `700 ${sz.toFixed(1)}px '${font}', monospace`;
        ctx.fillText(letters[li % letters.length], px, py);
        li++;
      }
    }
  };

  // Rebuild lum map when shape params change, then redraw
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try { await document.fonts.load(`700 16px '${font}'`); } catch (_) {}
    lumMapRef.current = (sourceTab === "image" && imageBitmapRef.current)
      ? buildImageLumMap(imageBitmapRef.current, CW, CH)
      : buildLumMap(shape, cx, cy, size, softness, rot, ringGap, blobPoints, blobSpread, blobSeed, CW, CH);
    drawOnlyRef.current(animTimeRef.current);
  }, [font, shape, cx, cy, size, softness, rot, ringGap, blobPoints, blobSpread, blobSeed, CW, CH, hasImage, sourceTab]);

  useEffect(() => { render(); }, [render]);

  // Redraw when non-shape render params change (only when not animating)
  useEffect(() => {
    if (animTypes.length === 0) drawOnlyRef.current?.(0);
  }, [word, fgColor, bgColor, contrast, density, animTypes, animSpeed, animStrength]);

  // RAF animation loop
  useEffect(() => {
    if (animTypes.length === 0) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const loop = (now) => {
      if (lastRafRef.current !== null) animTimeRef.current += (now - lastRafRef.current) / 1000;
      lastRafRef.current = now;
      drawOnlyRef.current(animTimeRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    lastRafRef.current = null;
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); rafRef.current = null; lastRafRef.current = null; };
  }, [animTypes]);

  const download = () => {
    const a = document.createElement("a");
    a.download = `${(word || "typogram").toLowerCase()}.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState("");
  const ffmpegRef = useRef(null);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();
    // Load single-threaded core from CDN (no SharedArrayBuffer needed)
    const base = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm";
    const toBlobURL = async (url, type) => {
      const buf = await fetch(url).then(r => r.arrayBuffer());
      return URL.createObjectURL(new Blob([buf], { type }));
    };
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const downloadVideo = async () => {
    if (isRecording) return;
    setIsRecording(true);

    try {
      setRecordStatus("Loading encoder…");
      const ffmpeg = await loadFFmpeg();

      const animPeriods = { wave: Math.PI / animSpeed, pulse: 1 / animSpeed, ripple: Math.PI / (2 * animSpeed), shimmer: 1 / (animSpeed * 0.3), chaos: (2 * Math.PI) / (animSpeed * 2.5), drift: (4 * Math.PI) / animSpeed };
      const period = animTypes.length > 0 ? Math.max(...animTypes.map(a => animPeriods[a] ?? 3)) : 3;
      const duration = Math.min(Math.max(period, 1), 20);
      const fps = 30;
      const totalFrames = Math.round(duration * fps);

      // Offscreen canvas at 1080p (even dimensions required by H.264)
      const maxDim = 1080;
      const scale = Math.min(maxDim / CW, maxDim / CH, 1);
      const vw = Math.floor(CW * scale / 2) * 2;
      const vh = Math.floor(CH * scale / 2) * 2;
      const offCanvas = document.createElement("canvas");
      offCanvas.width = vw;
      offCanvas.height = vh;
      const offCtx = offCanvas.getContext("2d");

      // Pause RAF loop and render frames synthetically
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      setRecordStatus("Capturing frames…");
      for (let i = 0; i < totalFrames; i++) {
        drawOnlyRef.current(i / fps);
        offCtx.drawImage(canvasRef.current, 0, 0, vw, vh);
        const blob = await new Promise(res => offCanvas.toBlob(res, "image/jpeg", 0.95));
        await ffmpeg.writeFile(`f${String(i).padStart(4, "0")}.jpg`, new Uint8Array(await blob.arrayBuffer()));
      }

      // Restart RAF loop
      lastRafRef.current = null;
      const loop = (now) => {
        if (lastRafRef.current !== null) animTimeRef.current += (now - lastRafRef.current) / 1000;
        lastRafRef.current = now;
        drawOnlyRef.current(animTimeRef.current);
        rafRef.current = requestAnimationFrame(loop);
      };
      if (animTypes.length > 0) rafRef.current = requestAnimationFrame(loop);

      setRecordStatus("Encoding…");
      await ffmpeg.exec([
        "-framerate", String(fps),
        "-i", "f%04d.jpg",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "fast",
        "-movflags", "+faststart",
        "out.mp4",
      ]);

      const data = await ffmpeg.readFile("out.mp4");
      const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
      const a = document.createElement("a");
      a.download = `${(word || "typogram").toLowerCase()}.mp4`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);

      // Clean up ffmpeg FS
      for (let i = 0; i < totalFrames; i++)
        await ffmpeg.deleteFile(`f${String(i).padStart(4, "0")}.jpg`);
      await ffmpeg.deleteFile("out.mp4");

    } catch (err) {
      console.error("Video export failed:", err);
    } finally {
      setIsRecording(false);
      setRecordStatus("");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageURL) URL.revokeObjectURL(imageURL);
    const url = URL.createObjectURL(file);
    const bitmap = await createImageBitmap(file);
    imageBitmapRef.current = bitmap;

    // Snap to closest aspect ratio
    const imgRatio = bitmap.width / bitmap.height;
    const closest = ASPECT_RATIOS.reduce((best, r) =>
      Math.abs(r.w / r.h - imgRatio) < Math.abs(best.w / best.h - imgRatio) ? r : best
    );
    setAspectRatio(closest.label);

    setImageURL(url);
    setImageName(file.name);
    setHasImage(true);
    setSourceTab("image");
    e.target.value = "";
  };

  const clearImage = () => {
    if (imageURL) URL.revokeObjectURL(imageURL);
    imageBitmapRef.current = null;
    setImageURL(null);
    setImageName("");
    setHasImage(false);
  };

  const handleFontUpload = async (e) => {
    if (e === null) {
      setCustomFontName("");
      setCustomFontFamily("");
      setFont("Space Mono");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const fontName = "UserFont_" + Date.now();
    const fontFace = new FontFace(fontName, await file.arrayBuffer());
    await fontFace.load();
    document.fonts.add(fontFace);
    setCustomFontName(file.name);
    setCustomFontFamily(fontName);
    setFont(fontName);
    setFontTab("custom");
    e.target.value = "";
  };

  const downloadFrames = async () => {
    if (isRecording) return;
    setIsRecording(true);

    try {
      setRecordStatus("Loading…");
      const { default: JSZip } = await import("jszip");

      const animPeriods = { wave: Math.PI / animSpeed, pulse: 1 / animSpeed, ripple: Math.PI / (2 * animSpeed), shimmer: 1 / (animSpeed * 0.3), chaos: (2 * Math.PI) / (animSpeed * 2.5), drift: (4 * Math.PI) / animSpeed };
      const period = animTypes.length > 0 ? Math.max(...animTypes.map(a => animPeriods[a] ?? 3)) : 3;
      const duration = Math.min(Math.max(period, 1), 20);
      const fps = 30;
      const totalFrames = Math.round(duration * fps);

      const zip = new JSZip();
      const folder = zip.folder(word || "typogram");

      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      setRecordStatus("Capturing frames…");
      for (let i = 0; i < totalFrames; i++) {
        drawOnlyRef.current(i / fps);
        const blob = await new Promise(res => canvasRef.current.toBlob(res, "image/png"));
        folder.file(`frame_${String(i).padStart(4, "0")}.png`, blob);
      }

      // Restart RAF loop
      lastRafRef.current = null;
      const loop = (now) => {
        if (lastRafRef.current !== null) animTimeRef.current += (now - lastRafRef.current) / 1000;
        lastRafRef.current = now;
        drawOnlyRef.current(animTimeRef.current);
        rafRef.current = requestAnimationFrame(loop);
      };
      if (animTypes.length > 0) rafRef.current = requestAnimationFrame(loop);

      setRecordStatus("Zipping…");
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.download = `${(word || "typogram").toLowerCase()}_frames.zip`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Frame export failed:", err);
    } finally {
      setIsRecording(false);
      setRecordStatus("");
    }
  };

  const hasRotation = shape !== "circle" && shape !== "ring" && shape !== "blob";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0b0b", fontFamily: "'Space Mono', monospace", color: "#c8c8c8", overflow: "hidden" }}>

      <div style={{ width: 268, background: "#0f0f0f", borderRight: "1px solid #1c1c1c", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>

        <div style={{ flex: 1, overflowY: "auto", padding: "22px 20px" }}>

        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "#252525", textTransform: "uppercase", marginBottom: 4 }}>Word Art Generator</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.04em", color: "#ddd" }}>TYPOGRAM</div>
        </div>

        {/* TEXT */}
        <HoverZone first>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {["custom", "ascii"].map(tab => (
                <button key={tab} onClick={() => {
                  setTextMode(tab);
                  if (tab === "ascii") {
                    const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    setWord(Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
                  }
                }} style={{
                  flex: 1, padding: "6px 0", fontSize: 9, letterSpacing: "0.14em",
                  textTransform: "uppercase", fontFamily: "'Space Mono', monospace", fontWeight: 700,
                  cursor: "pointer", border: "1px solid #252525", borderRadius: 4,
                  background: textMode === tab ? "#2a2a2a" : "transparent",
                  color: textMode === tab ? "#ccc" : "#555",
                }}>{tab === "custom" ? "Custom Type" : "ASCII"}</button>
              ))}
            </div>
            {textMode === "custom" ? (
              <input value={word} onChange={e => setWord(e.target.value)} placeholder="Enter text..." style={iStyle} />
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input value={word} readOnly style={{ ...iStyle, flex: 1, color: "#777", cursor: "default" }} />
                <button onClick={() => {
                  const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                  setWord(Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
                }} style={{
                  padding: "0 10px", fontSize: 14, cursor: "pointer",
                  border: "1px solid #252525", borderRadius: 4,
                  background: "transparent", color: "#666",
                  flexShrink: 0,
                }} title="Regenerate">↻</button>
              </div>
            )}
          </div>
        </HoverZone>

        <div style={divider} />

        {/* ASPECT RATIO */}
        <HoverZone>
          <AspectRatioSelect value={aspectRatio} onChange={setAspectRatio} />
        </HoverZone>

        <div style={divider} />

        {/* FONT */}
        <Section label="Font">
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {["system", "custom"].map(tab => (
              <button key={tab} onClick={() => {
                setFontTab(tab);
                if (tab === "system") setFont("Space Mono");
                if (tab === "custom" && customFontFamily) setFont(customFontFamily);
              }} style={{
                flex: 1, padding: "7px 0", fontSize: 9, letterSpacing: "0.14em",
                textTransform: "uppercase", fontFamily: "'Space Mono', monospace", fontWeight: 700,
                cursor: "pointer", border: "1px solid #252525", borderRadius: 4,
                background: fontTab === tab ? "#2a2a2a" : "transparent",
                color: fontTab === tab ? "#ccc" : "#555",
              }}>{tab}</button>
            ))}
          </div>
          <Collapsible open={fontTab === "system"}>
            <div style={{ background: "#131313", border: "1px solid #252525", borderRadius: 6, overflow: "hidden" }}>
              {FONTS.map((f, i) => (
                <div
                  key={f.value}
                  onClick={() => setFont(f.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
                    cursor: "pointer", borderTop: i > 0 ? "1px solid #1a1a1a" : "none",
                    background: font === f.value ? "#1e1e1e" : "transparent",
                  }}
                  onMouseEnter={e => { if (font !== f.value) e.currentTarget.style.background = "#181818"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = font === f.value ? "#1e1e1e" : "transparent"; }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                    border: `1.5px solid ${font === f.value ? "#888" : "#444"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {font === f.value && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#aaa" }} />}
                  </div>
                  <span style={{ fontFamily: `'${f.value}', monospace`, fontSize: 14, color: "#c8c8c8", width: 22, flexShrink: 0 }}>Ag</span>
                  <span style={{ fontSize: 11, color: "#c8c8c8", fontFamily: "'Space Mono', monospace" }}>{f.label}</span>
                </div>
              ))}
            </div>
          </Collapsible>
          <Collapsible open={fontTab === "custom"}>
            <FontDropZone onUpload={handleFontUpload} fontName={customFontName} />
          </Collapsible>
          <div style={{ height: 10 }} />
        </Section>

        <div style={divider} />

        {/* PATTERN */}
        <Section label="Pattern">
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {["shape", "image"].map(tab => (
              <button key={tab} onClick={() => setSourceTab(tab)} style={{
                flex: 1, padding: "7px 0", fontSize: 9, letterSpacing: "0.14em",
                textTransform: "uppercase", fontFamily: "'Space Mono', monospace", fontWeight: 700,
                cursor: "pointer", border: "1px solid #252525", borderRadius: 4,
                background: sourceTab === tab ? "#2a2a2a" : "transparent",
                color: sourceTab === tab ? "#ccc" : "#555",
              }}>{tab}</button>
            ))}
          </div>

          <Collapsible open={sourceTab === "image"}>
            {hasImage ? (
              <div style={{ position: "relative", borderRadius: 6, overflow: "hidden", height: 108, marginBottom: 18 }}>
                <img src={imageURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)", display: "flex", alignItems: "flex-end", padding: "8px 10px", gap: 6 }}>
                  <span style={{ flex: 1, fontSize: 9, color: "#ccc", fontFamily: "'Space Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imageName}</span>
                  <button onClick={clearImage} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #444", borderRadius: 4, color: "#aaa", cursor: "pointer", fontSize: 11, padding: "2px 7px", fontFamily: "'Space Mono', monospace", lineHeight: 1.4 }}>×</button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 18 }}>
                <DropZone onUpload={handleImageUpload} />
              </div>
            )}
          </Collapsible>
          <Collapsible open={sourceTab === "shape"}>
            <ShapeSelect value={shape} onChange={setShape} />
            <SliderRow accentColor={fgColor} label="Size" value={size} min={10} max={95} step={1} onChange={setSize} fmt={v => `${v}%`} />
            <SliderRow accentColor={fgColor} label="Softness" value={softness} min={0} max={80} step={1} onChange={setSoft} lo="HARD" hi="SOFT" fmt={v => `${v}`} />
            <Collapsible open={shape === "ring"}>
              <SliderRow accentColor={fgColor} label="Ring Gap" value={ringGap} min={0.1} max={0.85} step={0.05}
                onChange={setRingGap} lo="THIN" hi="THICK" fmt={v => `${Math.round(v * 100)}%`} />
            </Collapsible>
            <Collapsible open={hasRotation}>
              <SliderRow accentColor={fgColor} label="Rotation" value={rot} min={0} max={360} step={1} onChange={setRot} fmt={v => `${v}°`} />
            </Collapsible>
            <Collapsible open={shape === "blob"}>
              <SliderRow accentColor={fgColor} label="Points" value={blobPoints} min={1} max={8} step={1}
                onChange={v => setBlobPoints(Math.round(v))} fmt={v => `${Math.round(v)}`} />
              <SliderRow accentColor={fgColor} label="Spread" value={blobSpread} min={0} max={100} step={1}
                onChange={setBlobSpread} lo="TIGHT" hi="LOOSE" fmt={v => `${Math.round(v)}%`} />
              <SliderRow accentColor={fgColor} label="Seed" value={blobSeed} min={1} max={99} step={1}
                onChange={v => setBlobSeed(Math.round(v))} fmt={v => `${Math.round(v)}`} />
            </Collapsible>
          </Collapsible>
        </Section>

        <div style={divider} />

        {/* SIZE CONTRAST + GRID DENSITY */}
        <Section label="Intensity">
          <SliderRow accentColor={fgColor} label="Size Contrast" value={contrast} min={0.1} max={1} step={0.05}
            onChange={setContrast} lo="SUBTLE" hi="BOLD" fmt={v => `${Math.round(v * 100)}%`} />
          <SliderRow accentColor={fgColor} label="Grid Density" value={density} min={10} max={28} step={2}
            onChange={v => setDensity(Math.round(v))} lo="DENSE" hi="LOOSE" fmt={v => `${v}px`} />
        </Section>

        <div style={divider} />

        {/* POSITION */}
        <Section label="Position">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
            <div>
              <span style={lbl}>X</span>
              <DragSlider value={cx} min={10} max={90} step={1} onChange={setCx} accentColor={fgColor} />
            </div>
            <div>
              <span style={lbl}>Y</span>
              <DragSlider value={cy} min={10} max={90} step={1} onChange={setCy} accentColor={fgColor} />
            </div>
          </div>
        </Section>

        <div style={divider} />

        {/* COLOUR */}
        <Section label="Colour">
          <ColorInput label="Foreground" value={fgColor} onChange={setFg} />
          <ColorInput label="Background" value={bgColor} onChange={setBg} />
          <div style={{ height: 10 }} />
        </Section>

        <div style={divider} />

        {/* ANIMATION */}
        <Section label="Animation">
          <div style={{ background: "#131313", border: "1px solid #252525", borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
            {[["wave","Wave"],["pulse","Pulse"],["ripple","Ripple"],["shimmer","Shimmer"],["chaos","Chaos"],["drift","Drift"]].map(([v, label], i) => {
              const active = animTypes.includes(v);
              return (
                <div
                  key={v}
                  onClick={() => setAnimTypes(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v])}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
                    cursor: "pointer", borderTop: i > 0 ? "1px solid #1a1a1a" : "none",
                    background: active ? "#1e1e1e" : "transparent",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#181818"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = active ? "#1e1e1e" : "transparent"; }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: `1.5px solid ${active ? "#888" : "#444"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <div style={{ width: 8, height: 8, borderRadius: 2, background: "#aaa" }} />}
                  </div>
                  <span style={{ fontSize: 11, color: "#c8c8c8", fontFamily: "'Space Mono', monospace" }}>{label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ opacity: animTypes.length > 0 ? 1 : 0.35, pointerEvents: animTypes.length > 0 ? "auto" : "none", transition: "opacity 0.2s" }}>
            <SliderRow label="Speed" value={animSpeed} min={0.2} max={4} step={0.1}
              onChange={setAnimSpeed} lo="SLOW" hi="FAST" fmt={v => `${v.toFixed(1)}x`} />
            <SliderRow label="Strength" value={animStrength} min={0.05} max={1} step={0.05}
              onChange={setAnimStrength} lo="SUBTLE" hi="STRONG" fmt={v => `${Math.round(v * 100)}%`} />
          </div>
        </Section>

        </div>{/* end scrollable area */}

        {/* DOWNLOAD — pinned to bottom */}
        <div style={{ background: "#171717", borderTop: "1px solid #2e2e2e", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={download} style={{
            width: "100%", padding: 11, background: "#d0d0d0", border: "none",
            borderRadius: 6, color: "#0b0b0b", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.12em", cursor: "pointer", fontFamily: "'Space Mono', monospace",
          }}>DOWNLOAD PNG</button>
          <Collapsible open={animTypes.length > 0}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              <button onClick={downloadVideo} disabled={isRecording} style={{
                width: "100%", padding: 11, background: isRecording ? "#1a1a1a" : "transparent",
                border: "1px solid #444", borderRadius: 6,
                color: isRecording ? "#555" : "#aaa", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.12em", cursor: isRecording ? "default" : "pointer",
                fontFamily: "'Space Mono', monospace",
              }}>{isRecording ? recordStatus.toUpperCase() : "DOWNLOAD VIDEO"}</button>
              <button onClick={downloadFrames} disabled={isRecording} style={{
                width: "100%", padding: 11, background: isRecording ? "#1a1a1a" : "transparent",
                border: "1px solid #444", borderRadius: 6,
                color: isRecording ? "#555" : "#aaa", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.12em", cursor: isRecording ? "default" : "pointer",
                fontFamily: "'Space Mono', monospace",
              }}>{isRecording ? recordStatus.toUpperCase() : "DOWNLOAD FRAMES"}</button>
            </div>
          </Collapsible>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "#090909", overflow: "auto" }}>
        <canvas ref={canvasRef} width={CW} height={CH} style={{ maxWidth: "100%", maxHeight: "100%", border: "1px solid #333" }} />
      </div>
    </div>
  );
}
