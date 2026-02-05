"use client";

import { createContext, useContext, useRef, useCallback, ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MLCEngine = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pipeline = any;

interface MLModelCacheContextType {
  // WebLLM engines
  getLLMEngine: (modelId: string) => MLCEngine | undefined;
  setLLMEngine: (modelId: string, engine: MLCEngine) => void;

  // Transformers.js pipelines (for ML Playground tasks)
  getTransformersPipeline: (taskId: string) => Pipeline | undefined;
  setTransformersPipeline: (taskId: string, pipeline: Pipeline) => void;

  // Whisper pipelines
  getWhisperPipeline: (modelId: string) => Pipeline | undefined;
  setWhisperPipeline: (modelId: string, pipeline: Pipeline) => void;

  // Embedding pipelines (for Document RAG)
  getEmbeddingPipeline: (modelId: string) => Pipeline | undefined;
  setEmbeddingPipeline: (modelId: string, pipeline: Pipeline) => void;

  // Clear all cached models
  clearAll: () => void;
}

const MLModelCacheContext = createContext<MLModelCacheContextType | null>(null);

interface MLModelCacheProviderProps {
  children: ReactNode;
}

export function MLModelCacheProvider({ children }: MLModelCacheProviderProps) {
  // Use refs to store Maps - they persist across renders and navigation
  const llmEnginesRef = useRef<Map<string, MLCEngine>>(new Map());
  const transformersPipelinesRef = useRef<Map<string, Pipeline>>(new Map());
  const whisperPipelinesRef = useRef<Map<string, Pipeline>>(new Map());
  const embeddingPipelinesRef = useRef<Map<string, Pipeline>>(new Map());

  // LLM Engine methods
  const getLLMEngine = useCallback((modelId: string) => {
    return llmEnginesRef.current.get(modelId);
  }, []);

  const setLLMEngine = useCallback((modelId: string, engine: MLCEngine) => {
    llmEnginesRef.current.set(modelId, engine);
  }, []);

  // Transformers Pipeline methods
  const getTransformersPipeline = useCallback((taskId: string) => {
    return transformersPipelinesRef.current.get(taskId);
  }, []);

  const setTransformersPipeline = useCallback((taskId: string, pipeline: Pipeline) => {
    transformersPipelinesRef.current.set(taskId, pipeline);
  }, []);

  // Whisper Pipeline methods
  const getWhisperPipeline = useCallback((modelId: string) => {
    return whisperPipelinesRef.current.get(modelId);
  }, []);

  const setWhisperPipeline = useCallback((modelId: string, pipeline: Pipeline) => {
    whisperPipelinesRef.current.set(modelId, pipeline);
  }, []);

  // Embedding Pipeline methods
  const getEmbeddingPipeline = useCallback((modelId: string) => {
    return embeddingPipelinesRef.current.get(modelId);
  }, []);

  const setEmbeddingPipeline = useCallback((modelId: string, pipeline: Pipeline) => {
    embeddingPipelinesRef.current.set(modelId, pipeline);
  }, []);

  // Clear all cached models
  const clearAll = useCallback(() => {
    llmEnginesRef.current.clear();
    transformersPipelinesRef.current.clear();
    whisperPipelinesRef.current.clear();
    embeddingPipelinesRef.current.clear();
  }, []);

  const value: MLModelCacheContextType = {
    getLLMEngine,
    setLLMEngine,
    getTransformersPipeline,
    setTransformersPipeline,
    getWhisperPipeline,
    setWhisperPipeline,
    getEmbeddingPipeline,
    setEmbeddingPipeline,
    clearAll,
  };

  return (
    <MLModelCacheContext.Provider value={value}>
      {children}
    </MLModelCacheContext.Provider>
  );
}

export function useMLModelCache() {
  const context = useContext(MLModelCacheContext);
  if (!context) {
    throw new Error("useMLModelCache must be used within an MLModelCacheProvider");
  }
  return context;
}
