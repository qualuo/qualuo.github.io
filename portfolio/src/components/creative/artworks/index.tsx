"use client";

import { useSyncExternalStore } from "react";
import { MotionValue } from "framer-motion";
import { NeuralDreamsArt } from "./NeuralDreamsArt";
import { VoiceIntimacyArt } from "./VoiceIntimacyArt";
import { LivingTypographyArt } from "./LivingTypographyArt";
import { PulseVisualizerArt } from "./PulseVisualizerArt";
import { DigitalGardensArt } from "./DigitalGardensArt";
import { ThreeWorldsArt } from "./ThreeWorldsArt";
import { SakuraArt } from "./SakuraArt";

const emptySubscribe = () => () => {};

interface ArtworkProps {
  color: string;
  scrollProgress: MotionValue<number>;
}

const ARTWORK_MAP: Record<string, React.ComponentType<ArtworkProps>> = {
  "neural-dreams": NeuralDreamsArt,
  "voice-intimacy": VoiceIntimacyArt,
  "living-typography": LivingTypographyArt,
  "pulse-visualizer": PulseVisualizerArt,
  "digital-gardens": DigitalGardensArt,
  "three-worlds": ThreeWorldsArt,
  "sakura-dreams": SakuraArt,
};

export function SectionArtwork({
  workId,
  color,
  scrollProgress,
}: {
  workId: string;
  color: string;
  scrollProgress: MotionValue<number>;
}) {
  // Render artworks client-only to avoid hydration mismatches from
  // Math.sin/Math.cos floating-point differences between Node.js and browser
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const Art = ARTWORK_MAP[workId];
  if (!Art || !mounted) return null;
  return <Art color={color} scrollProgress={scrollProgress} />;
}

export { OrnateFrame } from "./OrnateFrame";
