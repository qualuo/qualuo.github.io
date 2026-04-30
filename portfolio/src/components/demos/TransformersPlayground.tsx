"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMLModelCache } from "@/components/providers/MLModelCacheProvider";

type TaskType = "sentiment" | "ner" | "image-classification" | "fill-mask" | "object-detection";
type PipelineStatus = "idle" | "loading" | "ready" | "error";

interface TaskConfig {
  id: TaskType;
  name: string;
  description: string;
  icon: string;
  inputType: "text" | "image";
  model: string;
  modelSize: string;
  placeholder?: string;
  examples?: string[];
}

const TASKS: TaskConfig[] = [
  {
    id: "sentiment",
    name: "Sentiment Analysis",
    description: "Detect if text is positive or negative",
    icon: "😊",
    inputType: "text",
    model: "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
    modelSize: "~67MB",
    placeholder: "Enter text to analyze sentiment...",
    examples: [
      "I absolutely love this product! Best purchase ever.",
      "This is the worst experience I've ever had.",
      "The weather is okay today, nothing special.",
    ],
  },
  {
    id: "ner",
    name: "Named Entity Recognition",
    description: "Identify people, places, and organizations",
    icon: "🏷️",
    inputType: "text",
    model: "Xenova/bert-base-NER",
    modelSize: "~180MB",
    placeholder: "Enter text to find named entities...",
    examples: [
      "Elon Musk founded SpaceX in Hawthorne, California in 2002.",
      "Apple Inc. announced a new product at their headquarters in Cupertino.",
      "The Eiffel Tower in Paris attracts millions of visitors every year.",
    ],
  },
  {
    id: "image-classification",
    name: "Image Classification",
    description: "Identify what's in an image",
    icon: "🖼️",
    inputType: "image",
    model: "Xenova/vit-base-patch16-224",
    modelSize: "~90MB",
  },
  {
    id: "fill-mask",
    name: "Fill-Mask",
    description: "Predict missing words in a sentence",
    icon: "🔮",
    inputType: "text",
    model: "Xenova/bert-base-uncased",
    modelSize: "~110MB",
    placeholder: "Enter text with [MASK] token...",
    examples: [
      "The capital of France is [MASK].",
      "She went to the [MASK] to buy groceries.",
      "The sun rises in the [MASK] and sets in the west.",
    ],
  },
  {
    id: "object-detection",
    name: "Object Detection",
    description: "Locate and identify objects in images",
    icon: "🎯",
    inputType: "image",
    model: "Xenova/detr-resnet-50",
    modelSize: "~160MB",
  },
];

interface SentimentResult {
  label: string;
  score: number;
}

interface NERResult {
  entity: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

interface ClassificationResult {
  label: string;
  score: number;
}

interface FillMaskResult {
  score: number;
  token_str: string;
  sequence: string;
}

interface DetectionResult {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultType = SentimentResult[] | NERResult[] | ClassificationResult[] | FillMaskResult[] | DetectionResult[] | any;

export function TransformersPlayground() {
  const [selectedTask, setSelectedTask] = useState<TaskConfig>(TASKS[0]);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [loadProgress, setLoadProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ResultType | null>(null);

  const { getTransformersPipeline, setTransformersPipeline } = useMLModelCache();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipelineRef = useRef<any>(null);
  const currentTaskRef = useRef<TaskType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const loadModel = async (task: TaskConfig) => {
    // Check cache first
    const cachedPipeline = getTransformersPipeline(task.id);
    if (cachedPipeline) {
      pipelineRef.current = cachedPipeline;
      currentTaskRef.current = task.id;
      setStatus("ready");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setResults(null);

    try {
      setLoadProgress(`Loading ${task.name} model...`);
      const { pipeline } = await import("@huggingface/transformers");

      const pipelineTask = task.id === "image-classification"
        ? "image-classification"
        : task.id === "object-detection"
        ? "object-detection"
        : task.id === "ner"
        ? "token-classification"
        : task.id === "sentiment"
        ? "sentiment-analysis"
        : task.id;

      const pipe = await pipeline(pipelineTask, task.model, {
        progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
          if (!isMountedRef.current) return;
          if (progress.status === "downloading" || progress.status === "progress") {
            const pct = progress.progress ? Math.round(progress.progress) : 0;
            const filename = progress.file ? progress.file.split("/").pop() || "" : "";
            const shortName = filename.length > 25 ? filename.slice(0, 22) + "..." : filename;
            setLoadProgress(`Downloading: ${pct}%${shortName ? `\n${shortName}` : ""}`);
          } else if (progress.status === "loading") {
            setLoadProgress("Loading model into memory...");
          }
        },
      });

      pipelineRef.current = pipe;
      currentTaskRef.current = task.id;

      // Store in cache for persistence across navigation
      setTransformersPipeline(task.id, pipe);

      if (!isMountedRef.current) return;
      setStatus("ready");
      setLoadProgress("");
    } catch (error) {
      console.error("Failed to load model:", error);
      if (isMountedRef.current) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Failed to load model");
      }
    }
  };

  const handleTaskSelect = (task: TaskConfig) => {
    setSelectedTask(task);
    setInput("");
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResults(null);
    setErrorMessage("");
    // Reset if different task
    if (currentTaskRef.current !== task.id) {
      // Check if this task's pipeline is cached
      const cachedPipeline = getTransformersPipeline(task.id);
      if (cachedPipeline) {
        pipelineRef.current = cachedPipeline;
        currentTaskRef.current = task.id;
        setStatus("ready");
      } else {
        setStatus("idle");
        pipelineRef.current = null;
      }
    }
  };

  const acceptImage = useCallback((file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErrorMessage(`Unsupported file type: ${file.type || "unknown"}. Use JPG, PNG, WebP, or GIF.`);
      return;
    }
    const MAX_IMAGE_MB = 10;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setErrorMessage(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is ${MAX_IMAGE_MB}MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setResults(null);
    setErrorMessage("");
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptImage(file);
  }, [acceptImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) acceptImage(file);
  }, [acceptImage]);

  // Revoke object URL on unmount (use ref to avoid stale closure)
  const imageUrlRef = useRef(imageUrl);
  useEffect(() => {
    imageUrlRef.current = imageUrl;
  }, [imageUrl]);
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  const runInference = async () => {
    if (!pipelineRef.current) return;
    if (selectedTask.inputType === "text" && !input.trim()) return;
    if (selectedTask.inputType === "image" && !imageUrl) return;

    setIsProcessing(true);
    setResults(null);
    setErrorMessage("");

    try {
      let result;
      if (selectedTask.inputType === "text") {
        result = await pipelineRef.current(input.trim());
      } else {
        result = await pipelineRef.current(imageUrl);
      }
      setResults(result);

      // Draw bounding boxes for object detection
      if (selectedTask.id === "object-detection" && result && imageRef.current && canvasRef.current) {
        drawDetections(result as DetectionResult[]);
      }
    } catch (error) {
      console.error("Inference error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Inference failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const drawDetections = (detections: DetectionResult[]) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.drawImage(image, 0, 0);
    ctx.font = "16px sans-serif";

    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6", "#ec4899"];

    detections.forEach((det, i) => {
      const color = colors[i % colors.length];
      const { xmin, ymin, xmax, ymax } = det.box;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

      const label = `${det.label} ${Math.round(det.score * 100)}%`;
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = color;
      ctx.fillRect(xmin, ymin - 25, textWidth + 10, 25);

      ctx.fillStyle = "white";
      ctx.fillText(label, xmin + 5, ymin - 7);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runInference();
    }
  };

  const handleExample = (example: string) => {
    setInput(example);
    setResults(null);
  };

  // Render task selection
  if (status === "idle" || status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 text-3xl">
              🤖
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">ML Playground</h3>
            <p className="text-slate-400">
              Try different machine learning tasks. Models run entirely in your browser.
            </p>
          </div>

          {status === "error" && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {TASKS.map((task) => (
              <button
                key={task.id}
                onClick={() => handleTaskSelect(task)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedTask.id === task.id
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 hover:bg-white/7"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xl">
                    {task.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-white">{task.name}</div>
                      <div className="text-xs text-slate-500">{task.modelSize}</div>
                    </div>
                    <div className="text-sm text-slate-400">{task.description}</div>
                  </div>
                  {selectedTask.id === task.id && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => loadModel(selectedTask)}
            className="w-full py-4 px-6 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Load {selectedTask.name}
          </button>

          <p className="text-center text-slate-500 text-xs mt-4">
            First load downloads the model. Subsequent loads use cached data.
          </p>
        </motion.div>
      </div>
    );
  }

  // Render loading progress
  if (status === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">{selectedTask.icon}</div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Loading {selectedTask.name}</h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-18 flex flex-col justify-center">
            <p className="text-slate-400 text-sm whitespace-pre-line text-center">{loadProgress}</p>
          </div>
          <p className="text-slate-500 text-xs mt-4">This may take a moment on first load...</p>
        </motion.div>
      </div>
    );
  }

  // Render ready state - main interface
  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white/2 border border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm">
            {selectedTask.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{selectedTask.name}</div>
            <div className="text-xs text-indigo-400">Ready</div>
          </div>
        </div>
        <button
          onClick={() => {
            setStatus("idle");
            pipelineRef.current = null;
            currentTaskRef.current = null;
            setResults(null);
            setInput("");
            setImageUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return null;
            });
            setErrorMessage("");
          }}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          Change task
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}
        {/* Text input tasks */}
        {selectedTask.inputType === "text" && (
          <div className="space-y-4">
            {/* Example prompts */}
            {selectedTask.examples && !results && (
              <div className="flex flex-wrap gap-2">
                {selectedTask.examples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExample(example)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                  >
                    {example.length > 50 ? example.slice(0, 47) + "..." : example}
                  </button>
                ))}
              </div>
            )}

            {/* Results display */}
            <AnimatePresence mode="wait">
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Sentiment Results */}
                  {selectedTask.id === "sentiment" && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-3">Results</h4>
                      {(results as SentimentResult[]).map((r, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-medium ${r.label === "POSITIVE" ? "text-emerald-400" : "text-red-400"}`}>
                              {r.label === "POSITIVE" ? "😊 Positive" : "😞 Negative"}
                            </span>
                            <span className="text-slate-400">{Math.round(r.score * 100)}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${r.label === "POSITIVE" ? "bg-emerald-500" : "bg-red-500"}`}
                              style={{ width: `${r.score * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* NER Results */}
                  {selectedTask.id === "ner" && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-3">Entities Found</h4>
                      {(results as NERResult[]).length === 0 ? (
                        <p className="text-slate-500 text-sm">No entities found.</p>
                      ) : (
                        <div className="space-y-2">
                          {(results as NERResult[]).map((r, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                r.entity.includes("PER") ? "bg-blue-500/20 text-blue-400" :
                                r.entity.includes("ORG") ? "bg-purple-500/20 text-purple-400" :
                                r.entity.includes("LOC") ? "bg-emerald-500/20 text-emerald-400" :
                                "bg-amber-500/20 text-amber-400"
                              }`}>
                                {r.entity.replace("B-", "").replace("I-", "")}
                              </span>
                              <span className="text-white font-medium">{r.word}</span>
                              <span className="text-slate-500 text-xs ml-auto">{Math.round(r.score * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fill-Mask Results */}
                  {selectedTask.id === "fill-mask" && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-3">Predictions</h4>
                      <div className="space-y-2">
                        {(results as FillMaskResult[]).slice(0, 5).map((r, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">{r.token_str}</span>
                              <span className="text-slate-400 text-sm">{Math.round(r.score * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all"
                                style={{ width: `${r.score * 100}%` }}
                              />
                            </div>
                            <p className="text-slate-400 text-xs">{r.sequence}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Image input tasks */}
        {selectedTask.inputType === "image" && (
          <div className="space-y-4">
            {/* Image upload area */}
            {!imageUrl ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload image: drop here or activate to browse"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-colors"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                  📷
                </div>
                <p className="text-white font-medium mb-1">Drop an image here</p>
                <p className="text-slate-500 text-sm">or click to browse · max 10MB · JPG, PNG, WebP, GIF</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stable hidden image used as drawDetections source */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt=""
                  className="hidden"
                  onLoad={() => {
                    if (canvasRef.current) {
                      const ctx = canvasRef.current.getContext("2d");
                      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                  }}
                />

                {/* Image preview */}
                <div className="relative rounded-xl overflow-hidden bg-black/20">
                  {selectedTask.id === "object-detection" && results ? (
                    <canvas ref={canvasRef} className="w-full h-auto" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="Upload"
                      className="w-full h-auto"
                    />
                  )}
                  <button
                    onClick={() => {
                      setImageUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return null;
                      });
                      setResults(null);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Image Classification Results */}
                {selectedTask.id === "image-classification" && results && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <h4 className="text-sm font-medium text-white mb-3">Classifications</h4>
                    <div className="space-y-2">
                      {(results as ClassificationResult[]).slice(0, 5).map((r, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm">{r.label}</span>
                            <span className="text-slate-400 text-xs">{Math.round(r.score * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all"
                              style={{ width: `${r.score * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Object Detection Results */}
                {selectedTask.id === "object-detection" && results && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <h4 className="text-sm font-medium text-white mb-3">Objects Detected</h4>
                    {(results as DetectionResult[]).length === 0 ? (
                      <p className="text-slate-500 text-sm">No objects detected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(results as DetectionResult[]).map((r, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm"
                          >
                            {r.label} <span className="text-slate-400">{Math.round(r.score * 100)}%</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/10 bg-white/2">
        {selectedTask.inputType === "text" ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedTask.placeholder}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20"
              disabled={isProcessing}
            />
            <button
              onClick={runInference}
              disabled={!input.trim() || isProcessing}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isProcessing ? (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              ) : (
                "Analyze"
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={runInference}
            disabled={!imageUrl || isProcessing}
            className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            ) : (
              "Analyze Image"
            )}
          </button>
        )}
        <p className="text-center text-slate-600 text-xs mt-2">
          {selectedTask.inputType === "text" ? "Press Enter to analyze" : "Upload an image to analyze"}
        </p>
      </div>
    </div>
  );
}
