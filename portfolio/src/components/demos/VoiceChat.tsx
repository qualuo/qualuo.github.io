"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMLModelCache } from "@/components/providers/MLModelCacheProvider";

interface Message {
  role: "user" | "assistant";
  content: string;
  audioPlaying?: boolean;
}

type PipelineStatus = "idle" | "loading" | "ready" | "error";
type VoiceState = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

const AVAILABLE_MODELS = [
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M",
    description: "Tiny & fast",
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 1.5B",
    description: "Balanced",
  },
];

const WHISPER_MODELS = [
  { id: "onnx-community/whisper-tiny.en", name: "Whisper Tiny (EN)", description: "~75MB, fastest" },
  { id: "onnx-community/whisper-base.en", name: "Whisper Base (EN)", description: "~150MB, better accuracy" },
];

export function VoiceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [loadProgress, setLoadProgress] = useState("");
  const [selectedLLM, setSelectedLLM] = useState(AVAILABLE_MODELS[0].id);
  const [selectedWhisper, setSelectedWhisper] = useState(WHISPER_MODELS[0].id);
  const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const { getLLMEngine, setLLMEngine, getWhisperPipeline, setWhisperPipeline } = useMLModelCache();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const llmEngineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whisperPipelineRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
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

  const loadModels = async () => {
    if (!webGPUSupported) return;

    // Check caches first
    const cachedWhisper = getWhisperPipeline(selectedWhisper);
    const cachedLLM = getLLMEngine(selectedLLM);

    // If both are cached, use them directly
    if (cachedWhisper && cachedLLM) {
      whisperPipelineRef.current = cachedWhisper;
      llmEngineRef.current = cachedLLM;
      setStatus("ready");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Load Whisper if not cached
      if (cachedWhisper) {
        whisperPipelineRef.current = cachedWhisper;
      } else {
        setLoadProgress("Loading Whisper speech recognition...");
        const { pipeline } = await import("@huggingface/transformers");

        const whisperPipeline = await pipeline(
          "automatic-speech-recognition",
          selectedWhisper,
          {
            dtype: "fp32",
            device: "webgpu",
            progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
              if (progress.status === "downloading" || progress.status === "progress") {
                const pct = progress.progress ? Math.round(progress.progress) : 0;
                const filename = progress.file ? progress.file.split("/").pop() || "" : "";
                const shortName = filename.length > 25 ? filename.slice(0, 22) + "..." : filename;
                setLoadProgress(`Downloading Whisper: ${pct}%${shortName ? `\n${shortName}` : ""}`);
              } else if (progress.status === "loading") {
                setLoadProgress("Loading Whisper model...");
              }
            },
          }
        );
        whisperPipelineRef.current = whisperPipeline;
        setWhisperPipeline(selectedWhisper, whisperPipeline);
      }

      // Load LLM if not cached
      if (cachedLLM) {
        llmEngineRef.current = cachedLLM;
      } else {
        setLoadProgress("Loading language model...");
        const webllm = await import("@mlc-ai/web-llm");
        const engine = new webllm.MLCEngine();

        engine.setInitProgressCallback((progress) => {
          setLoadProgress(progress.text);
        });

        await engine.reload(selectedLLM);
        llmEngineRef.current = engine;
        setLLMEngine(selectedLLM, engine);
      }

      setStatus("ready");
      setLoadProgress("");
    } catch (error) {
      console.error("Failed to load models:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to load models");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setVoiceState("recording");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setErrorMessage("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!whisperPipelineRef.current || !llmEngineRef.current) return;

    setVoiceState("transcribing");

    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Decode audio
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);

      // Transcribe with Whisper
      const result = await whisperPipelineRef.current(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });

      const transcription = result.text.trim();

      if (!transcription) {
        setVoiceState("idle");
        return;
      }

      // Add user message
      setMessages((prev) => [...prev, { role: "user", content: transcription }]);

      // Generate LLM response
      setVoiceState("thinking");

      const allMessages = [
        { role: "system" as const, content: "You are a helpful voice assistant. Keep your responses concise and conversational, suitable for being spoken aloud. Avoid using markdown, bullet points, or special formatting." },
        ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: transcription },
      ];

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const response = await llmEngineRef.current.chat.completions.create({
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
          };
          return newMessages;
        });
      }

      // Speak the response
      if (ttsEnabled && fullResponse) {
        setVoiceState("speaking");
        await speakText(fullResponse);
      }

      setVoiceState("idle");
    } catch (error) {
      console.error("Processing error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, an error occurred while processing." },
      ]);
      setVoiceState("idle");
    }
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Alex")
      ) || voices.find(v => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setVoiceState("idle");
  };

  const resetChat = () => {
    window.speechSynthesis.cancel();
    setMessages([]);
    setVoiceState("idle");
  };

  // Handle mic button click
  const handleMicClick = () => {
    if (voiceState === "recording") {
      stopRecording();
    } else if (voiceState === "speaking") {
      stopSpeaking();
    } else if (voiceState === "idle") {
      startRecording();
    }
  };

  // Render unsupported state
  if (webGPUSupported === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">WebGPU Not Available</h3>
        <p className="text-slate-400 max-w-md mb-4">
          This demo requires WebGPU to run AI models locally. Please use Chrome 113+ or Edge 113+.
        </p>
      </div>
    );
  }

  // Render loading check
  if (webGPUSupported === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Checking GPU capabilities...</div>
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
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 text-3xl">
              🎙️
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Voice Chat</h3>
            <p className="text-slate-400">
              Talk to an AI using your voice. Speech recognition, language model, and text-to-speech all run locally.
            </p>
          </div>

          {status === "error" && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Whisper Model Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Speech Recognition</label>
            <div className="space-y-2">
              {WHISPER_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedWhisper(model.id)}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    selectedWhisper === model.id
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white text-sm">{model.name}</div>
                      <div className="text-xs text-slate-400">{model.description}</div>
                    </div>
                    {selectedWhisper === model.id && (
                      <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* LLM Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Language Model</label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedLLM(model.id)}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    selectedLLM === model.id
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white text-sm">{model.name}</div>
                      <div className="text-xs text-slate-400">{model.description}</div>
                    </div>
                    {selectedLLM === model.id && (
                      <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadModels}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Load Models
          </button>

          <p className="text-center text-slate-500 text-xs mt-4">
            First load downloads models (~200-400MB total). Uses Web Speech API for TTS.
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
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🎙️</div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Loading Models</h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-18 flex flex-col justify-center">
            <p className="text-slate-400 text-sm whitespace-pre-line text-center">{loadProgress}</p>
          </div>
          <p className="text-slate-500 text-xs mt-4">This may take a moment on first load...</p>
        </motion.div>
      </div>
    );
  }

  // Get status display
  const getStatusDisplay = () => {
    switch (voiceState) {
      case "recording":
        return { text: "Listening...", color: "text-red-400" };
      case "transcribing":
        return { text: "Transcribing...", color: "text-amber-400" };
      case "thinking":
        return { text: "Thinking...", color: "text-violet-400" };
      case "speaking":
        return { text: "Speaking...", color: "text-fuchsia-400" };
      default:
        return { text: "Ready", color: "text-emerald-400" };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Render voice chat interface
  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm">
            🎙️
          </div>
          <div>
            <div className="text-sm font-medium text-white">Voice Chat</div>
            <div className={`text-xs ${statusDisplay.color}`}>{statusDisplay.text}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              ttsEnabled ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-slate-500"
            }`}
            title={ttsEnabled ? "TTS enabled" : "TTS disabled"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          <button
            onClick={resetChat}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center text-slate-500">
              <p className="text-sm">Press the microphone to start talking.</p>
              <p className="text-xs mt-1">Everything runs locally on your device.</p>
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
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    : "bg-white/10 text-slate-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Voice control area */}
      <div className="p-6 border-t border-white/10 bg-white/[0.02]">
        <div className="flex flex-col items-center">
          {/* Main mic button */}
          <motion.button
            onClick={handleMicClick}
            disabled={voiceState === "transcribing" || voiceState === "thinking"}
            whileTap={{ scale: 0.95 }}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              voiceState === "recording"
                ? "bg-red-500 shadow-lg shadow-red-500/30"
                : voiceState === "speaking"
                ? "bg-fuchsia-500 shadow-lg shadow-fuchsia-500/30"
                : voiceState === "transcribing" || voiceState === "thinking"
                ? "bg-white/10 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/30"
            }`}
          >
            {/* Pulse animation when recording */}
            {voiceState === "recording" && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* Speaking animation */}
            {voiceState === "speaking" && (
              <motion.div
                className="absolute inset-0 rounded-full bg-fuchsia-500"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}

            {/* Icon */}
            {voiceState === "recording" ? (
              <svg className="w-8 h-8 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : voiceState === "speaking" ? (
              <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : voiceState === "transcribing" || voiceState === "thinking" ? (
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            ) : (
              <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </motion.button>

          {/* Status text */}
          <p className="text-slate-500 text-xs mt-4">
            {voiceState === "recording"
              ? "Tap to stop recording"
              : voiceState === "speaking"
              ? "Tap to stop speaking"
              : voiceState === "transcribing"
              ? "Processing speech..."
              : voiceState === "thinking"
              ? "Generating response..."
              : "Tap to start talking"}
          </p>
        </div>
      </div>
    </div>
  );
}
