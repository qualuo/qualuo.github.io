"use client";

/**
 * Subtle geometric watermark behind page headers.
 * - "goldenbloom": golden-ratio geometry — φ-spaced spirals, phyllotaxis dots, logarithmic spiral
 * - "timeline": vertical timeline spine with alternating milestone branches (Work page)
 * - "compass": radial lines from center + thin circle (frameworks / Points page)
 */
export function DelicateAccent({
  variant = "goldenbloom",
  className = "",
}: {
  variant?: "goldenbloom" | "compass" | "timeline";
  className?: string;
}) {
  const stroke = "rgba(255,255,255,0.30)";
  const strokeFaint = "rgba(255,255,255,0.26)";
  const strokeGhost = "rgba(255,255,255,0.15)";

  if (variant === "goldenbloom") {
    // ═══════════════════════════════════════════════════════
    //  G O L D E N   B L O O M
    //
    //  Every element derives from the golden ratio φ = 1.618…
    //
    //  φ appears in nature wherever growth optimises for
    //  space: sunflower heads, nautilus shells, galaxy arms.
    //  The same constant governs every layer here:
    //
    //  LAYERS
    //  ──────
    //  ① 3-arm golden spiral — logarithmic spirals where
    //     r(θ) = A · e^(bθ), with b = ln(φ)/(π/2).
    //     The radius multiplies by φ every quarter-turn.
    //     Three arms offset by the golden angle (≈ 137.508°),
    //     which is 360°/φ² — the same rotation sunflower
    //     florets use to pack most efficiently.
    //
    //  ② Intersection stars — 9 four-point stars (3 arms ×
    //     3 Fibonacci radii) where the spiral crosses each
    //     ring. Radial spacing is φ-governed: the rings sit
    //     at radii 68, 110, 178 (Fibonacci ×2), so consecutive
    //     ratios ≈ φ (110/68 ≈ 1.618, 178/110 ≈ 1.618).
    //     Angular positions solved via θ = ln(r/A)/b,
    //     inheriting the spiral's φ growth rate. Stars on
    //     different arms are golden-angle (137.508°) apart.
    //
    //  ③ Phyllotaxis dots — 34 (a Fibonacci number) dots
    //     placed on a Fermat spiral r = c·√n, each rotated by
    //     the golden angle from its predecessor. This recreates
    //     the sunflower seed pattern; every 5th dot (also Fib)
    //     glows brighter.
    //
    //  ④ Center seed — the origin from which everything grows.
    //
    //  ROTATION
    //  ────────
    //  The entire bloom rotates counterclockwise at one
    //  revolution per 60·φ ≈ 97.08 seconds — a golden-ratio-
    //  derived period that feels unhurried and contemplative.
    //
    //  ANIMATION — bloom/wilt cycle (~10s, 2s entrance delay)
    //  ─────────
    //  Waits 2s for hero text to settle, then blooms outward
    //  from center (2→5.3s), holds ~3s for appreciation,
    //  then closes inward like a flower folding (8.3→10s).
    // ═══════════════════════════════════════════════════════
    const φ  = 1.618033988749895;
    const GA = 360 / (φ * φ);              // golden angle ≈ 137.508°
    const GAr = (GA * Math.PI) / 180;
    const b  = Math.log(φ) / (Math.PI / 2); // spiral growth: ×φ per 90°

    // Timing — narrative arc:
    //
    //  BLOOM (center → out, after 2s entrance delay):
    //   2.0  seed blooms (0.55s)
    //   2.18 spiral begins unfurling (2.4s)
    //   3.7  stars flash at intersections
    //   4.0  phyllotaxis dots cascade outward
    //   5.3  everything fully visible — hold ~3s
    //
    //  CLOSE (outside → in, the flower folds back):
    //   8.3  dots wilt outer→inner
    //   8.6  stars blink out outer→inner
    //   9.1  spiral retracts back to center
    //  10.0  seed shrinks — silence (~10s total)

    // ── Fibonacci radii (×2 scale) ──
    const R = [21, 34, 55, 89].map(n => n * 2);
    // → [42, 68, 110, 178]

    // ── Golden spiral path builder (CCW logarithmic) ──
    const A = 2.5; // seed radius
    const mkSpiral = (off: number) => {
      const pts: string[] = [];
      for (let θ = 0; θ <= 14; θ += 0.05) {
        const r = A * Math.exp(b * θ);
        if (r > R[R.length - 1]) break;
        const x = 200 + r * Math.cos(-(θ + off));
        const y = 200 + r * Math.sin(-(θ + off));
        pts.push(`${pts.length ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.join(" ");
    };

    // ── Spiral × Fibonacci-circle intersection points (all 3 arms) ──
    const armOffsets = [0, GAr, 2 * GAr];
    const ixns = armOffsets.flatMap((off, ai) =>
      R.slice(1).map((r, ri) => {
        const θ = Math.log(r / A) / b;
        return {
          x: +((200 + r * Math.cos(-(θ + off))).toFixed(3)),
          y: +((200 + r * Math.sin(-(θ + off))).toFixed(3)),
          d: 3.7 + ai * 0.1 + ri * 0.35,  // stagger by arm, then ring
          ri,                               // ring index for wilt ordering
        };
      })
    );

    return (
      <svg className={`w-full h-full ${className}`} viewBox="0 0 400 400" aria-hidden="true">
        <style>{`
          @keyframes gbl-pd{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
          @keyframes gbl-pdo{from{stroke-dashoffset:0}to{stroke-dashoffset:1}}
          @keyframes gbl-bloom{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
          @keyframes gbl-wilt{to{opacity:0;transform:scale(0)}}
          @keyframes gbl-spin{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
        `}</style>

        {/* CCW rotation: one revolution per 60·φ ≈ 97s — matches starfield's contemplative drift */}
        <g style={{ transformOrigin: "200px 200px", animation: "gbl-spin 97.08s linear infinite" }}>

        {/* ① Golden spiral — 3 arms offset by the golden angle */}
        {[0, GAr, 2 * GAr].map((off, ai) => (
          <path key={`sp${ai}`} d={mkSpiral(off)} fill="none"
            stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" strokeLinecap="round"
            pathLength={1} strokeDasharray="1" strokeDashoffset={1}
            style={{ animation: `gbl-pd ${2.4 + ai * 0.2}s cubic-bezier(0.16,1,0.3,1) ${2.18 + ai * 0.1}s forwards, gbl-pdo 1.3s ease-in ${9.1 + ai * 0.1}s forwards` }}
          />
        ))}

        {/* ② Intersection stars — where spiral meets Fibonacci rings */}
        {ixns.map(({ x, y, d, ri }, i) => {
          const s = 4.5;  // outer spike length
          const n = 1.2;  // inner notch
          const star = `M${x},${y - s} L${x + n},${y - n} L${x + s},${y} L${x + n},${y + n} L${x},${y + s} L${x - n},${y + n} L${x - s},${y} L${x - n},${y - n}Z`;
          return (
            <path key={`ix${i}`} d={star} fill={strokeFaint} stroke="none"
              style={{ opacity: 0, transformOrigin: `${x}px ${y}px`, animation: `gbl-bloom 0.2s ease-out ${d}s forwards, gbl-wilt 0.3s ease-in ${(8.6 + (2 - ri) * 0.25).toFixed(2)}s forwards` }}
            />
          );
        })}

        {/* ③ Phyllotaxis bloom — 34 dots, golden-angle Fermat spiral */}
        {Array.from({ length: 34 }).map((_, n) => {
          const a = -(n + 1) * GAr;
          const r = 24 * Math.sqrt(n + 1);
          if (r > 170) return null;
          const x = +((200 + Math.cos(a) * r).toFixed(3));
          const y = +((200 + Math.sin(a) * r).toFixed(3));
          const sz = r < 35 ? 1.3 : r < 70 ? 1.0 : r < 110 ? 0.8 : 0.6;
          const d = 4.0 + n * 0.04;          // cascade after spirals settle
          return (
            <circle key={`ph${n}`} cx={x} cy={y} r={sz}
              fill={n % 5 === 0 ? strokeFaint : strokeGhost}
              style={{ opacity: 0, transformOrigin: `${x}px ${y}px`, animation: `gbl-bloom 0.3s ease-out ${d}s forwards, gbl-wilt 0.25s ease-in ${(8.3 + (33 - n) * 0.025).toFixed(2)}s forwards` }}
            />
          );
        })}

        {/* ④ Center seed — the origin */}
        <circle cx={200} cy={200} r={2} fill={stroke}
          style={{ opacity: 0, transformOrigin: "200px 200px", animation: `gbl-bloom 0.55s cubic-bezier(0.16,1,0.3,1) 2s forwards, gbl-wilt 0.45s ease-in 10s forwards` }}
        />

        </g>
      </svg>
    );
  }

  if (variant === "timeline") {
    // Stronger strokes for the timeline — needs to read behind text
    const tlStroke = "rgba(255,255,255,0.35)";
    const tlFaint = "rgba(255,255,255,0.22)";
    const tlGhost = "rgba(255,255,255,0.13)";
    const cx = 150;
    const spineLen = 650; // 675 - 25
    const trackLen = 640; // 670 - 30
    const milestones = [
      { y: 70, dir: -1, len: 55, r: 2.5 },
      { y: 140, dir: 1, len: 45, r: 2 },
      { y: 210, dir: -1, len: 60, r: 2.5 },
      { y: 280, dir: 0, len: 0, r: 2 },
      { y: 350, dir: 0, len: 0, r: 4 },
      { y: 420, dir: -1, len: 50, r: 2.5 },
      { y: 490, dir: 1, len: 60, r: 2 },
      { y: 560, dir: -1, len: 45, r: 2.5 },
      { y: 630, dir: 1, len: 55, r: 2 },
    ];

    return (
      <svg
        className={`w-full h-full ${className}`}
        viewBox="0 0 300 700"
        aria-hidden="true"
      >
        <style>{`
          @keyframes tl-draw{from{stroke-dashoffset:var(--dash-len)}to{stroke-dashoffset:0}}
          @keyframes tl-fade{from{opacity:0}to{opacity:1}}
          @keyframes tl-dot{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        `}</style>

        {/* Faint parallel tracks — draw after spine */}
        <line x1={cx - 40} y1={30} x2={cx - 40} y2={670} stroke={tlGhost} strokeWidth="0.5"
          strokeDasharray={trackLen} strokeDashoffset={trackLen}
          style={{ ["--dash-len" as string]: trackLen, animation: `tl-draw 1.8s ease-out 0.6s forwards` }}
        />
        <line x1={cx + 40} y1={30} x2={cx + 40} y2={670} stroke={tlGhost} strokeWidth="0.5"
          strokeDasharray={trackLen} strokeDashoffset={trackLen}
          style={{ ["--dash-len" as string]: trackLen, animation: `tl-draw 1.8s ease-out 0.7s forwards` }}
        />

        {/* Main vertical spine — draws first, top to bottom */}
        <line x1={cx} y1={25} x2={cx} y2={675} stroke={tlFaint} strokeWidth="0.9"
          strokeDasharray={spineLen} strokeDashoffset={spineLen}
          style={{ ["--dash-len" as string]: spineLen, animation: `tl-draw 1.6s ease-out 0.2s forwards` }}
        />

        {/* Dashed accent segments — fade in after spine settles */}
        {[
          { y1: 85, y2: 125 },
          { y1: 225, y2: 265 },
          { y1: 365, y2: 405 },
          { y1: 505, y2: 545 },
          { y1: 645, y2: 665 },
        ].map((seg, i) => (
          <line
            key={`dash-${i}`}
            x1={cx} y1={seg.y1} x2={cx} y2={seg.y2}
            stroke={tlStroke}
            strokeWidth="0.7"
            strokeDasharray="2 5"
            style={{ opacity: 0, animation: `tl-fade 0.5s ease-out ${1.6 + i * 0.1}s forwards` }}
          />
        ))}

        {/* Horizontal connections to parallel tracks — fade in */}
        {[140, 350, 490, 630].map((y, i) => (
          <g key={`pconn-${i}`} style={{ opacity: 0, animation: `tl-fade 0.4s ease-out ${1.8 + i * 0.08}s forwards` }}>
            <line x1={cx - 40} y1={y} x2={cx - 12} y2={y} stroke={tlGhost} strokeWidth="0.5" />
            <line x1={cx + 12} y1={y} x2={cx + 40} y2={y} stroke={tlGhost} strokeWidth="0.5" />
          </g>
        ))}

        {/* Small tick marks along spine — staggered fade down the spine */}
        {Array.from({ length: 25 }).map((_, i) => {
          const y = 45 + i * 25;
          return (
            <line
              key={`tick-${i}`}
              x1={cx - 3} y1={y} x2={cx + 3} y2={y}
              stroke={tlGhost}
              strokeWidth="0.5"
              style={{ opacity: 0, animation: `tl-fade 0.3s ease-out ${0.8 + i * 0.06}s forwards` }}
            />
          );
        })}

        {/* Milestone nodes and branches — staggered draw-on */}
        {milestones.map((m, i) => {
          const circleCirc = 2 * Math.PI * m.r;
          const msDelay = 1.0 + i * 0.15;
          return (
            <g key={`ms-${i}`}>
              {/* Node circle — draws on */}
              <circle
                cx={cx} cy={m.y} r={m.r}
                fill="none"
                stroke={i === 4 ? tlStroke : tlFaint}
                strokeWidth={i === 4 ? "1.2" : "1"}
                strokeDasharray={circleCirc}
                strokeDashoffset={circleCirc}
                style={{
                  ["--dash-len" as string]: circleCirc,
                  animation: `tl-draw 0.5s ease-out ${msDelay}s forwards`,
                }}
              />

              {/* Inner dot for center node */}
              {i === 4 && (
                <circle cx={cx} cy={m.y} r="2" fill={tlFaint}
                  style={{
                    opacity: 0,
                    transformOrigin: `${cx}px ${m.y}px`,
                    animation: `tl-dot 0.3s ease-out ${msDelay + 0.4}s forwards`,
                  }}
                />
              )}

              {/* Branch line + end marker + content placeholder lines */}
              {m.dir !== 0 && (
                <>
                  {/* Branch extends outward from spine */}
                  <line
                    x1={cx} y1={m.y}
                    x2={cx + m.len * m.dir} y2={m.y}
                    stroke={tlFaint}
                    strokeWidth="0.7"
                    strokeDasharray={m.len}
                    strokeDashoffset={m.len}
                    style={{
                      ["--dash-len" as string]: m.len,
                      animation: `tl-draw 0.5s ease-out ${msDelay + 0.2}s forwards`,
                    }}
                  />
                  {/* End dot pops in after branch arrives */}
                  <circle
                    cx={cx + m.len * m.dir} cy={m.y}
                    r="1.5"
                    fill={tlFaint}
                    style={{
                      opacity: 0,
                      transformOrigin: `${cx + m.len * m.dir}px ${m.y}px`,
                      animation: `tl-dot 0.3s ease-out ${msDelay + 0.5}s forwards`,
                    }}
                  />
                  {/* Content placeholder lines — fade in last */}
                  <g style={{ opacity: 0, animation: `tl-fade 0.4s ease-out ${msDelay + 0.6}s forwards` }}>
                    <line
                      x1={cx + (m.len + 6) * m.dir} y1={m.y - 4}
                      x2={cx + (m.len + 28) * m.dir} y2={m.y - 4}
                      stroke={tlGhost} strokeWidth="0.5"
                    />
                    <line
                      x1={cx + (m.len + 6) * m.dir} y1={m.y}
                      x2={cx + (m.len + 22) * m.dir} y2={m.y}
                      stroke={tlGhost} strokeWidth="0.5"
                    />
                    <line
                      x1={cx + (m.len + 6) * m.dir} y1={m.y + 4}
                      x2={cx + (m.len + 16) * m.dir} y2={m.y + 4}
                      stroke={tlGhost} strokeWidth="0.5"
                    />
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* Decorative dots — fade in late */}
        {[100, 175, 315, 385, 525, 600].map((y, i) => (
          <g key={`dec-${i}`} style={{ opacity: 0, animation: `tl-fade 0.3s ease-out ${2.2 + i * 0.06}s forwards` }}>
            <circle cx={cx - 20} cy={y} r="1" fill={tlGhost} />
            <circle cx={cx + 20} cy={y} r="1" fill={tlGhost} />
          </g>
        ))}

        {/* Endpoint caps — appear last */}
        <g style={{ opacity: 0, animation: `tl-fade 0.4s ease-out 2.6s forwards` }}>
          <line x1={cx - 4} y1={25} x2={cx + 4} y2={25} stroke={tlFaint} strokeWidth="0.7" />
          <line x1={cx} y1={21} x2={cx} y2={29} stroke={tlFaint} strokeWidth="0.7" />
        </g>
        <g style={{ opacity: 0, animation: `tl-fade 0.4s ease-out 2.7s forwards` }}>
          <line x1={cx - 4} y1={675} x2={cx + 4} y2={675} stroke={tlFaint} strokeWidth="0.7" />
          <line x1={cx} y1={671} x2={cx} y2={679} stroke={tlFaint} strokeWidth="0.7" />
        </g>
      </svg>
    );
  }

  // Compass variant — radial spokes + circle with draw-on animation
  const circleCircumference = 2 * Math.PI * 110; // ≈ 691

  return (
    <svg
      className={`w-full h-full ${className}`}
      viewBox="0 0 400 400"
      aria-hidden="true"
    >
      <style>{`
        @keyframes compass-draw{from{stroke-dashoffset:var(--dash-len)}to{stroke-dashoffset:0}}
        @keyframes compass-dot{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Radial spokes — staggered draw-on */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const gap = 35;
        const reach = i % 3 === 0 ? 185 : 140;
        const lineLen = reach - gap;
        return (
          <line
            key={i}
            x1={200 + Math.cos(angle) * gap}
            y1={200 + Math.sin(angle) * gap}
            x2={200 + Math.cos(angle) * reach}
            y2={200 + Math.sin(angle) * reach}
            stroke={i % 3 === 0 ? stroke : strokeFaint}
            strokeWidth="0.75"
            strokeDasharray={lineLen}
            strokeDashoffset={lineLen}
            style={{
              ["--dash-len" as string]: lineLen,
              animation: `compass-draw 0.8s ease-out ${0.2 + i * 0.06}s forwards`,
            }}
          />
        );
      })}

      {/* Enclosing circle — draws after spokes */}
      <circle
        cx="200"
        cy="200"
        r="110"
        fill="none"
        stroke={stroke}
        strokeWidth="0.75"
        strokeDasharray={circleCircumference}
        strokeDashoffset={circleCircumference}
        style={{
          ["--dash-len" as string]: circleCircumference,
          animation: `compass-draw 1.6s ease-in-out 1.8s forwards`,
        }}
      />

      {/* Inner dot — fades in last */}
      <circle
        cx="200"
        cy="200"
        r="2"
        fill={strokeFaint}
        style={{
          opacity: 0,
          transformOrigin: "200px 200px",
          animation: `compass-dot 0.4s ease-out 3s forwards`,
        }}
      />
    </svg>
  );
}
