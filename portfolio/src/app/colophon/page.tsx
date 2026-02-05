"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { StarsBackground } from "@/components/animations/StarsBackground";

// Animated counter component
function AnimatedNumber({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * value);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{displayValue}{suffix}</span>;
}

// Spectral type color display
function SpectralBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const types = [
    { type: "O", color: "rgb(155, 176, 255)", temp: "30,000K+" },
    { type: "B", color: "rgb(170, 191, 255)", temp: "10,000K" },
    { type: "A", color: "rgb(202, 215, 255)", temp: "7,500K" },
    { type: "F", color: "rgb(248, 247, 255)", temp: "6,000K" },
    { type: "G", color: "rgb(255, 244, 232)", temp: "5,200K" },
    { type: "K", color: "rgb(255, 222, 180)", temp: "3,700K" },
    { type: "M", color: "rgb(255, 189, 145)", temp: "2,400K" },
  ];

  return (
    <div ref={ref} className="mt-6 mb-2">
      <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
        {types.map((s, i) => (
          <motion.div
            key={s.type}
            className="flex-1 relative group cursor-default"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={isInView ? { scaleY: 1, opacity: 1 } : {}}
            transition={{
              delay: i * 0.08,
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1]
            }}
            style={{
              backgroundColor: s.color,
              transformOrigin: "bottom"
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-medium text-black/70">{s.type}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-slate-600">
        <span>Hot</span>
        <span>Cool</span>
      </div>
    </div>
  );
}

// Reveal text animation
function RevealText({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        className={className}
        initial={{ y: "100%", opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.23, 1, 0.32, 1]
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Section component with fade-in
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.section>
  );
}

// Stat display
function Stat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-light text-white tracking-tight">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Colophon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const headerScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  return (
    <>
      <StarsBackground />
      <main ref={containerRef} className="min-h-screen text-white">
      <motion.div
        className="h-screen flex flex-col items-center justify-center relative"
        style={{ opacity: headerOpacity, scale: headerScale }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-12"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-4">
            The Night Sky
          </h1>
          <p className="text-slate-500 text-lg tracking-wide">
            60°N — Sweden
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-12 flex flex-col items-center gap-2 text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-32">

        {/* Opening */}
        <Section className="mb-24">
          <p className="text-xl text-slate-300 leading-relaxed font-light">
            This is a Swedish winter night. The kind where you step outside and
            the cold catches in your throat, and when you look up, you understand
            why people once believed the gods lived there.
          </p>
        </Section>

        {/* Stats */}
        <Section className="mb-24">
          <div className="grid grid-cols-3 gap-8 py-8 border-y border-white/10">
            <Stat value={110} label="Stars" />
            <Stat value={60} label="Latitude" suffix="°N" />
            <Stat value={7} label="Spectral Types" />
          </div>
        </Section>

        {/* Polaris */}
        <Section className="mb-20">
          <RevealText>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">The Fixed Point</h2>
          </RevealText>
          <p className="text-slate-400 leading-relaxed">
            Polaris hangs high—sixty degrees above the northern horizon, exactly
            where it should be at this latitude. The other stars wheel around it
            in slow, ancient circles. Some never set. They trace their quiet
            paths around that fixed point, the way they have for anyone who has
            ever looked up from this part of the world.
          </p>
        </Section>

        {/* Spectral Types */}
        <Section className="mb-20">
          <RevealText>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Stellar Classification</h2>
          </RevealText>
          <p className="text-slate-400 leading-relaxed mb-4">
            Each star is assigned a spectral type based on its surface temperature.
            O-type stars burn at 30,000 Kelvin—violent blue. M-type stars glow a
            gentle red at 2,400K. The distribution follows the real night sky:
            most stars you see are cooler K and M types, while the rare blue giants
            demand attention.
          </p>
          <SpectralBar />
        </Section>

        {/* Atmospheric Physics */}
        <Section className="mb-20">
          <RevealText>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Atmospheric Physics</h2>
          </RevealText>
          <div className="space-y-4 text-slate-400 leading-relaxed">
            <p>
              Near the horizon, starlight passes through more atmosphere. It dims,
              warms, and shimmers more violently. These are the same physics that
              make sunsets red and stars near the horizon twinkle harder than those
              overhead.
            </p>
            <p>
              The scintillation—what we call twinkling—comes from three overlapping
              wave frequencies, creating the organic, irregular flicker that no
              single sine wave could produce.
            </p>
          </div>
        </Section>

        {/* Meteors */}
        <Section className="mb-20">
          <RevealText>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Shooting Stars</h2>
          </RevealText>
          <p className="text-slate-400 leading-relaxed">
            If you wait, you might catch a meteor. They appear perhaps once every
            forty seconds—rare enough to be a gift, common enough that patience
            is rewarded. Each one traces a unique path, fading as it burns through
            our thin atmosphere.
          </p>
        </Section>

        {/* Aurora */}
        <Section className="mb-20">
          <RevealText>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Aurora Borealis</h2>
          </RevealText>
          <p className="text-slate-400 leading-relaxed">
            The aurora is barely there—a breath of green near the pole, a hint of
            blue. Sometimes a whisper of violet. Most people won't notice it.
            That's intentional. The northern lights are often more felt than seen.
          </p>
        </Section>

        {/* Technical Details */}
        <Section className="mb-20">
          <RevealText>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">The Details</h2>
          </RevealText>
          <div className="space-y-6 text-slate-500 text-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span className="text-slate-400 block mb-1">Distribution</span>
                Poisson disk sampling
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Rotation</span>
                Polar coordinates
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Rendering</span>
                Sub-pixel precision
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Bright Stars</span>
                Diffraction spikes
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Edge Behavior</span>
                Smooth fade transitions
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Performance</span>
                Visibility-adaptive
              </div>
            </div>
          </div>
        </Section>

        {/* Time Lapse */}
        <Section className="mb-20 py-8 border-y border-white/10">
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-2">
              Click <span className="text-slate-300">Stars</span> in the navigation
            </p>
            <p className="text-slate-600 text-xs">
              Watch hours compress into seconds
            </p>
          </div>
        </Section>

        {/* Closing */}
        <Section className="text-center">
          <motion.p
            className="text-slate-600 text-sm tracking-wide"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            viewport={{ once: true }}
          >
            Every detail considered. Nothing arbitrary.
          </motion.p>
        </Section>
      </div>
    </main>
    </>
  );
}
