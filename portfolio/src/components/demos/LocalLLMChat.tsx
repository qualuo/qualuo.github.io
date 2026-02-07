"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMLModelCache } from "@/components/providers/MLModelCacheProvider";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AVAILABLE_MODELS = [
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M",
    description: "Tiny & fast, ~200MB",
    contextSize: 4096,
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 1.5B",
    description: "Balanced, ~900MB",
    contextSize: 4096,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    description: "Meta's compact model, ~700MB",
    contextSize: 4096,
  },
];

const SYSTEM_PROMPT = "You are a helpful, friendly AI assistant. Provide clear, concise answers. Be direct and informative.";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

type LoadingStatus = "idle" | "checking" | "loading" | "ready" | "error";

export function LocalLLMChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<LoadingStatus>("idle");
  const [loadProgress, setLoadProgress] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { getLLMEngine, setLLMEngine } = useMLModelCache();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engineRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel);
  const tokenEstimate = useMemo(() => {
    const allText = SYSTEM_PROMPT + messages.map((m) => m.content).join("") + input;
    return estimateTokens(allText);
  }, [messages, input]);
  const contextSize = currentModel?.contextSize ?? 2048;
  const tokenPct = Math.min(100, (tokenEstimate / contextSize) * 100);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Check WebGPU support
    const checkWebGPU = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gpu = (navigator as any).gpu;
        if (!gpu) {
          setWebGPUSupported(false);
          return;
        }
        const adapter = await gpu.requestAdapter();
        setWebGPUSupported(!!adapter);
      } catch {
        setWebGPUSupported(false);
      }
    };
    checkWebGPU();
  }, []);

  const loadModel = async () => {
    if (!webGPUSupported) return;

    // Check cache first
    const cachedEngine = getLLMEngine(selectedModel);
    if (cachedEngine) {
      engineRef.current = cachedEngine;
      setStatus("ready");
      inputRef.current?.focus();
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setLoadProgress("Initializing...");

    try {
      // Dynamically import web-llm only when needed
      const webllm = await import("@mlc-ai/web-llm");
      const engine = new webllm.MLCEngine();

      engine.setInitProgressCallback((progress) => {
        setLoadProgress(progress.text);
      });

      await engine.reload(selectedModel);
      engineRef.current = engine;

      // Store in cache for persistence across navigation
      setLLMEngine(selectedModel, engine);

      setStatus("ready");
      setLoadProgress("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to load model:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load model"
      );
    }
  };

  const stopGeneration = useCallback(() => {
    try { engineRef.current?.interruptGenerate?.(); } catch {}
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !engineRef.current || isGenerating) return;

    const userMessage = input.trim();
    const now = new Date();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: now }]);

    setIsGenerating(true);

    try {
      const allMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...messages,
        { role: "user" as const, content: userMessage },
      ];

      // Add empty assistant message that we'll stream into
      const assistantTime = new Date();
      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: assistantTime }]);

      const response = await engineRef.current.chat.completions.create({
        messages: allMessages,
        stream: true,
      });

      let fullResponse = "";
      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta?.content || "";
        fullResponse += delta;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: fullResponse,
            timestamp: assistantTime,
          };
          return newMessages;
        });
      }

      // Remove empty assistant message if no content was generated
      if (!fullResponse) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (error) {
      console.error("Generation error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Sorry, an error occurred while generating the response.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      resetChat();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) {
        sendMessage();
      }
    }
  };

  const copyMessage = useCallback((content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const resetChat = () => {
    if (isGenerating) {
      stopGeneration();
    }
    setMessages([]);
    inputRef.current?.focus();
  };

  // Render unsupported state
  if (webGPUSupported === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          WebGPU Not Available
        </h3>
        <p className="text-slate-400 max-w-md mb-4">
          This demo requires WebGPU to run AI models on your GPU. Please use a
          supported browser:
        </p>
        <ul className="text-slate-500 text-sm space-y-1">
          <li>• Chrome 113+ or Edge 113+</li>
          <li>• Make sure hardware acceleration is enabled</li>
        </ul>
      </div>
    );
  }

  // Render loading check
  if (webGPUSupported === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">
          Checking GPU capabilities...
        </div>
      </div>
    );
  }

  // Render model selection
  if (status === "idle" || status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4 text-3xl">
              🧠
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Local AI Chat
            </h3>
            <p className="text-slate-400">
              Run an AI model directly in your browser using your GPU. No data
              leaves your device.
            </p>
          </div>

          {status === "error" && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedModel === model.id
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{model.name}</div>
                    <div className="text-sm text-slate-400">
                      {model.description}
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={loadModel}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Load Model
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🧠
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Loading Model
          </h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-18 flex flex-col justify-center">
            <p className="text-slate-400 text-sm whitespace-pre-line text-center">{loadProgress}</p>
          </div>
          <p className="text-slate-500 text-xs mt-4">
            This may take a moment on first load...
          </p>
        </motion.div>
      </div>
    );
  }

  // Render chat interface
  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.08]">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm">
            🧠
          </div>
          <div>
            <div className="text-sm font-medium text-white">
              {currentModel?.name}
            </div>
            <div className="text-xs text-emerald-400">Running locally</div>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Messages area */}
      <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center text-slate-500">
              <p className="text-sm">Start a conversation with the AI.</p>
              <p className="text-xs mt-1">
                Everything runs locally on your device.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`max-w-[80%] group ${message.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                      : "bg-white/10 text-slate-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 px-1 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-slate-600">{formatTime(message.timestamp)}</span>
                  {message.role === "assistant" && message.content && (
                    <button
                      onClick={() => copyMessage(message.content, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-400"
                    >
                      {copiedIndex === index ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isGenerating && messages[messages.length - 1]?.content === "" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 resize-none"
          />
          {isGenerating ? (
            <button
              onClick={stopGeneration}
              className="px-4 py-3 rounded-xl bg-red-500/80 text-white font-medium hover:bg-red-500 transition-colors"
              title="Stop generating"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-slate-600 text-xs">
            Enter to send · Esc to clear · Shift+Enter for new line
          </p>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  tokenPct > 90 ? "bg-red-500" : tokenPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${tokenPct}%` }}
              />
            </div>
            <span className={`text-[10px] tabular-nums ${
              tokenPct > 90 ? "text-red-400" : "text-slate-600"
            }`}>
              ~{tokenEstimate}/{contextSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}