"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type PipelineStatus = "idle" | "loading" | "ready" | "error";
type GenerationStatus = "idle" | "generating";

interface GeneratedTrack {
  id: string;
  prompt: string;
  audioUrl: string;
  timestamp: Date;
}

const EXAMPLE_PROMPTS = [
  "A cheerful acoustic guitar melody",
  "Ambient electronic with soft synths",
  "Upbeat lo-fi hip hop beat",
  "Calm piano music for studying",
  "Energetic rock guitar riff",
];

export function MusicGeneration() {
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [loadProgress, setLoadProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipelineRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadModel = async () => {

    setStatus("loading");
    setErrorMessage("");

    try {
      setLoadProgress("Loading MusicGen model...");
      const { MusicgenForConditionalGeneration, AutoTokenizer, BaseStreamer, env } = await import(
        "@huggingface/transformers"
      );

      // Configure environment for browser usage
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const modelId = "Xenova/musicgen-small";

      // Load tokenizer
      setLoadProgress("Loading tokenizer...");
      const tokenizer = await AutoTokenizer.from_pretrained(modelId);

      // Load model with progress
      setLoadProgress("Loading model weights (this may take a while)...");
      // Note: WebGPU may have precision issues - see https://github.com/huggingface/transformers.js/issues/1308
      const model = await MusicgenForConditionalGeneration.from_pretrained(modelId, {
        dtype: {
          text_encoder: "fp32",
          decoder_model_merged: "fp32",
          encodec_decode: "fp32",
        },
        device: "webgpu",
        progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
          if (progress.status === "downloading" || progress.status === "progress") {
            const pct = progress.progress ? Math.round(progress.progress) : 0;
            // Truncate long filenames to prevent layout jumping
            const filename = progress.file ? progress.file.split("/").pop() || "" : "";
            const shortName = filename.length > 25 ? filename.slice(0, 22) + "..." : filename;
            setLoadProgress(`Downloading: ${pct}%${shortName ? `\n${shortName}` : ""}`);
          } else if (progress.status === "loading") {
            setLoadProgress("Loading model into memory...");
          }
        },
      });

      pipelineRef.current = { model, tokenizer, BaseStreamer };
      setStatus("ready");
      setLoadProgress("");
    } catch (error) {
      console.error("Failed to load model:", error);
      setStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Failed to load model";
      // Provide more helpful error messages for common issues
      if (errorMsg.includes("Unauthorized") || errorMsg.includes("401")) {
        setErrorMessage(
          "Failed to access model files. This may be a temporary Hugging Face issue. Please try again later or check your network connection."
        );
      } else if (errorMsg.includes("CORS") || errorMsg.includes("NetworkError")) {
        setErrorMessage(
          "Network error loading model. Please check your internet connection and try again."
        );
      } else {
        setErrorMessage(errorMsg);
      }
    }
  };

  const generateMusic = async () => {
    if (!pipelineRef.current || !prompt.trim() || generationStatus === "generating") return;

    setGenerationStatus("generating");

    try {
      const { model, tokenizer } = pipelineRef.current;

      // Tokenize the prompt
      const inputs = tokenizer(prompt.trim());

      // Generate audio
      const audioValues = await model.generate({
        ...inputs,
        max_new_tokens: 256, // ~5 seconds of audio
        do_sample: true,
        guidance_scale: 3,
      });

      // Debug: inspect the output structure
      const sampleRate = model.config.audio_encoder.sampling_rate;
      console.log("Audio output:", audioValues);
      console.log("Audio output type:", typeof audioValues);
      console.log("Audio output keys:", audioValues ? Object.keys(audioValues) : "null");
      console.log("Sample rate:", sampleRate);

      // Try different ways to access the audio data
      let audioData: number[] = [];
      if (audioValues?.data) {
        console.log("Using audioValues.data");
        audioData = Array.from(audioValues.data as Float32Array);
      } else if (Array.isArray(audioValues) && audioValues[0]?.data) {
        console.log("Using audioValues[0].data");
        audioData = Array.from(audioValues[0].data as Float32Array);
      } else if (Array.isArray(audioValues) && audioValues[0]?.tolist) {
        console.log("Using audioValues[0].tolist()");
        audioData = audioValues[0].tolist();
      } else {
        console.log("Unknown audio format, dumping structure:", JSON.stringify(audioValues, null, 2));
      }
      console.log("Audio data length:", audioData.length);
      console.log("Audio data sample:", audioData.slice(0, 10));

      // Convert to WAV
      const wavBlob = audioDataToWav(audioData, sampleRate);
      const audioUrl = URL.createObjectURL(wavBlob);

      const newTrack: GeneratedTrack = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        audioUrl,
        timestamp: new Date(),
      };

      setTracks((prev) => [newTrack, ...prev]);
      setPrompt("");

      // Auto-play the new track
      playTrack(newTrack.id, audioUrl);
    } catch (error) {
      console.error("Generation error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGenerationStatus("idle");
    }
  };

  const audioDataToWav = (audioData: number[], sampleRate: number): Blob => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = audioData.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    // Audio data
    let offset = 44;
    for (const sample of audioData) {
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  const playTrack = (id: string, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audio.onended = () => setCurrentlyPlaying(null);
    audio.play();
    audioRef.current = audio;
    setCurrentlyPlaying(id);
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentlyPlaying(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateMusic();
    }
  };

  const handleExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  // Model selection / idle state
  if (status === "idle" || status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mb-4 text-3xl">
              🎵
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Music Generation</h3>
            <p className="text-slate-400">
              Generate original music from text descriptions. The AI model runs entirely in your browser.
            </p>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-lg">⚠️</span>
              <div>
                <p className="text-amber-400 text-sm font-medium">Currently Unavailable</p>
                <p className="text-amber-400/70 text-xs mt-1">
                  This demo is temporarily out of function due to a known issue with the underlying model.
                </p>
              </div>
            </div>
          </div>

          {status === "error" && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-lg">
                🎹
              </div>
              <div>
                <div className="font-medium text-white">MusicGen Small</div>
                <div className="text-xs text-slate-400">~500MB, generates ~5s clips</div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              A compact music generation model that creates original audio from text prompts.
            </p>
          </div>

          <button
            onClick={loadModel}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium hover:opacity-90 transition-opacity"
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

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🎵</div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Loading Model</h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-18 flex flex-col justify-center">
            <p className="text-slate-400 text-sm whitespace-pre-line text-center">{loadProgress}</p>
          </div>
          <p className="text-slate-500 text-xs mt-4">This may take a moment on first load...</p>
        </motion.div>
      </div>
    );
  }

  // Ready state - main interface
  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-sm">
            🎵
          </div>
          <div>
            <div className="text-sm font-medium text-white">Music Generation</div>
            <div className="text-xs text-pink-400">MusicGen Small</div>
          </div>
        </div>
        {currentlyPlaying && (
          <button
            onClick={stopPlayback}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {/* Generated tracks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tracks.length === 0 && generationStatus === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="text-center text-slate-500 mb-6">
              <p className="text-sm">Describe the music you want to create.</p>
              <p className="text-xs mt-1">The AI will generate a unique audio clip.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExamplePrompt(example)}
                  className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {generationStatus === "generating" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-white rounded-full"
                        animate={{ height: ["8px", "16px", "8px"] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Generating music...</div>
                <div className="text-xs text-slate-400">{prompt}</div>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {tracks.map((track) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl border transition-all ${
                currentlyPlaying === track.id
                  ? "bg-gradient-to-r from-pink-500/10 to-red-500/10 border-pink-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    currentlyPlaying === track.id ? stopPlayback() : playTrack(track.id, track.audioUrl)
                  }
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    currentlyPlaying === track.id
                      ? "bg-gradient-to-br from-pink-500 to-red-500"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {currentlyPlaying === track.id ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{track.prompt}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {track.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <a
                  href={track.audioUrl}
                  download={`music-${track.id}.wav`}
                  className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the music you want to create..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20"
            disabled={generationStatus === "generating"}
          />
          <button
            onClick={generateMusic}
            disabled={!prompt.trim() || generationStatus === "generating"}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {generationStatus === "generating" ? (
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            ) : (
              "Generate"
            )}
          </button>
        </div>
        <p className="text-center text-slate-600 text-xs mt-2">Press Enter to generate</p>
      </div>
    </div>
  );
}
