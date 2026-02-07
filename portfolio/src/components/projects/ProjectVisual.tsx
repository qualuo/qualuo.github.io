"use client";

import { useRef, useEffect } from "react";
import { MotionValue } from "framer-motion";
import Image from "next/image";
import { Project } from "@/lib/projects";
import { AbstractVisual } from "./visuals/AbstractVisual";

interface ProjectVisualProps {
  project: Project;
  scrollProgress: MotionValue<number>;
}

export function ProjectVisual({ project, scrollProgress }: ProjectVisualProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Control video playback based on scroll position (ref-based, no re-renders)
  useEffect(() => {
    const unsubscribe = scrollProgress.on("change", (value) => {
      const inView = value > 0.15 && value < 0.85;

      if (videoRef.current) {
        if (inView) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
    });

    return () => unsubscribe();
  }, [scrollProgress]);

  // If project has media, display it
  if (project.media) {
    if (project.media.type === "video") {
      return (
        <video
          ref={videoRef}
          src={project.media.src}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
        />
      );
    }

    if (project.media.type === "image") {
      return (
        <Image
          src={project.media.src}
          alt={project.title}
          fill
          className="object-cover"
          unoptimized
        />
      );
    }
  }

  // Otherwise, render abstract visual based on category
  if (project.visualConfig) {
    return (
      <AbstractVisual
        type={project.visualConfig.type}
        colors={project.visualConfig.colors}
        scrollProgress={scrollProgress}
      />
    );
  }

  // Fallback gradient
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
  );
}
