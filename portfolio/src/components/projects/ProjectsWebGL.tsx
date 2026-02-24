"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { WebGLErrorBoundary } from "@/components/ui/WebGLErrorBoundary";

export function ProjectsWebGL({
  sectionRef,
}: {
  sectionRef: React.RefObject<HTMLElement>;
}) {
  return (
    <WebGLErrorBoundary fallback={null}>
      <Canvas
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 1,
        }}
        eventSource={sectionRef}
        eventPrefix="client"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8] }}
      >
        <View.Port />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
