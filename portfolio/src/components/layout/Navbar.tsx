"use client";

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAudio } from "@/components/audio/MusicProvider";
import { useTimeLapse } from "@/components/animations/TimeLapseProvider";

const navLinks = [
  { href: "/demos", label: "Demos", isPage: true },
  { href: "/work", label: "Work", isPage: true },
  { href: "/points", label: "Points", isPage: true },
  { href: "/rfcs", label: "RFCs", isPage: true },
  { href: "/about", label: "About", isPage: true },
  { href: "/colophon", label: "60°N", isPage: true },
];

function AudioControl() {
  const { isPlaying, toggle } = useAudio();

  return (
    <motion.button
      onClick={toggle}
      className={`flex items-center p-2.5 rounded-full transition-colors cursor-pointer ${
        isPlaying ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isPlaying ? "Pause music" : "Play music"}
    >
      <div className="flex items-end gap-0.75 h-3.5">
        {[0, 1, 2].map((i) => {
          const staticHeights = ["8px", "12px", "6px"];
          return (
            <motion.div
              key={i}
              className={`w-0.75 rounded-full transition-colors duration-300 ${
                isPlaying ? "bg-white/90" : "bg-white/40"
              }`}
              animate={isPlaying ? {
                height: ["5px", "14px", "8px", "12px", "5px"],
              } : {
                height: staticHeights[i],
              }}
              transition={isPlaying ? {
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              } : {
                duration: 0.3,
              }}
            />
          );
        })}
      </div>
    </motion.button>
  );
}

function TimeLapseControl() {
  const { isActive, toggle } = useTimeLapse();

  return (
    <motion.button
      onClick={toggle}
      className={`flex items-center p-2.5 rounded-full transition-colors cursor-pointer ${
        isActive ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isActive ? "Stop time-lapse" : "Start time-lapse"}
    >
      {/* Three dots in circular arrangement - mirrors the 3 sound bars */}
      <motion.div
        className="relative w-3.5 h-3.5"
        animate={isActive ? { rotate: 360 } : { rotate: 0 }}
        transition={isActive ? {
          duration: 2.5,
          repeat: Infinity,
          ease: "linear",
        } : {
          duration: 0.4,
        }}
      >
        {[0, 1, 2].map((i) => {
          const angle = (i * 120 - 90) * (Math.PI / 180);
          const radius = 5;
          const x = 7 + Math.cos(angle) * radius;
          const y = 7 + Math.sin(angle) * radius;
          const sizes = [3, 2.5, 2];
          return (
            <motion.div
              key={i}
              className={`absolute rounded-full transition-colors duration-300 ${
                isActive ? "bg-white/90" : "bg-white/40"
              }`}
              style={{
                width: sizes[i],
                height: sizes[i],
                left: x - sizes[i] / 2,
                top: y - sizes[i] / 2,
              }}
            />
          );
        })}
      </motion.div>
    </motion.button>
  );
}

interface NavbarProps {
  isSubpage?: boolean;
  hasStars?: boolean;
  glass?: boolean;
}

let hasAnimatedNavbar = false;

export function Navbar({ isSubpage = false, hasStars = true, glass = false }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrolledOrGlass = isScrolled || glass;
  const [showLogo, setShowLogo] = useState(isSubpage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    // On subpages, always show the logo (initialized via useState)
    if (isSubpage) return;

    const heroSection = document.getElementById("hero");
    if (!heroSection) return;

    let heroInView = true;
    let nameVisible = true;

    const updateLogo = () => setShowLogo(!heroInView || !nameVisible);

    const observer = new IntersectionObserver(
      ([entry]) => {
        heroInView = entry.isIntersecting;
        updateLogo();
      },
      { threshold: 0 }
    );

    observer.observe(heroSection);

    const onSlideChange = (e: Event) => {
      nameVisible = (e as CustomEvent).detail.slide !== 2;
      updateLogo();
    };

    window.addEventListener('hero-slide-change', onSlideChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('hero-slide-change', onSlideChange);
    };
  }, [isSubpage]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === "#hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Only animate on first mount, not on route changes
  const [shouldAnimate] = useState(() => !hasAnimatedNavbar);

  useEffect(() => {
    hasAnimatedNavbar = true;
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <>
    <motion.nav
      initial={shouldAnimate ? { y: -100, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolledOrGlass
          ? "h-14 bg-white/2 backdrop-blur-2xl border-white/4 shadow-lg shadow-black/10"
          : "h-16 md:h-20 bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showLogo ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/"
            data-cursor="pointer"
            className={`text-lg font-semibold tracking-tight hover:opacity-70 transition-opacity ${
              showLogo ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            Quang Luong
          </Link>
        </motion.div>

        {/* Center nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link, index) => (
            <motion.li
              key={link.href}
              initial={shouldAnimate ? { y: -20, opacity: 0 } : false}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: shouldAnimate ? 0.1 + index * 0.05 : 0 }}
            >
              {link.isPage ? (
                <Link
                  href={link.href}
                  data-cursor="pointer"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  data-cursor="pointer"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              )}
            </motion.li>
          ))}
        </ul>

        {/* Right side */}
        <motion.div
          initial={shouldAnimate ? { y: -20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: shouldAnimate ? 0.2 : 0 }}
          className="flex items-center gap-3"
        >
          {hasStars && <TimeLapseControl />}
          <AudioControl />
          <Link
            href={isSubpage ? "/#contact" : "#contact"}
            onClick={isSubpage ? undefined : (e) => scrollToSection(e, "#contact")}
            data-cursor="pointer"
            className="hidden md:inline-block px-4 py-2 text-sm bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium"
          >
            Contact
          </Link>
          {/* Mobile menu toggle */}
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
            whileTap={{ scale: 0.92 }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <div className="relative w-3.75 h-2.75">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute left-0 w-full h-px bg-white/80 origin-center"
                  style={{ top: i * 5 }}
                  animate={mobileMenuOpen ? {
                    top: 5,
                    rotate: i === 0 ? 45 : i === 2 ? -45 : 0,
                    opacity: i === 1 ? 0 : 1,
                    scaleX: i === 1 ? 0 : 1,
                  } : {
                    top: i * 5,
                    rotate: 0,
                    opacity: 1,
                    scaleX: 1,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.52, 0.16, 0.24, 1],
                    ...(mobileMenuOpen
                      ? { rotate: { delay: 0.12 }, opacity: { duration: 0.2 } }
                      : { rotate: { duration: 0.25 }, top: { delay: 0.12 } }
                    ),
                  }}
                />
              ))}
            </div>
          </motion.button>
        </motion.div>
      </div>

    </motion.nav>

    {/* Full-screen mobile menu */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-40 md:hidden"
        >
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative h-full flex flex-col items-center justify-center gap-8">
            {[...navLinks, { href: isSubpage ? "/#contact" : "#contact", label: "Contact", isPage: isSubpage }].map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Link
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (!link.isPage && link.href.startsWith("#")) {
                      scrollToSection(e, link.href);
                    }
                  }}
                  data-cursor="pointer"
                  className="text-4xl font-extralight text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
