"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMLModelCache } from "@/components/providers/MLModelCacheProvider";

// Types
interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  embedding?: number[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

type Status = "idle" | "loading-embedder" | "loading-llm" | "ready" | "error";

// Chunking utilities
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }

  return chunks.filter((chunk) => chunk.length > 20);
}

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function DocumentRAG() {
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [documents, setDocuments] = useState<DocumentChunk[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { getLLMEngine, setLLMEngine, getEmbeddingPipeline, setEmbeddingPipeline } = useMLModelCache();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const embedderRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engineRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Parse PDF using PDF.js
  const parsePDF = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText;
  };

  // Initialize models
  const initialize = async () => {
    const embeddingModelId = "Xenova/all-MiniLM-L6-v2";
    const llmModelId = "SmolLM2-360M-Instruct-q4f16_1-MLC";

    // Check caches first
    const cachedEmbedder = getEmbeddingPipeline(embeddingModelId);
    const cachedLLM = getLLMEngine(llmModelId);

    // If both are cached, use them directly
    if (cachedEmbedder && cachedLLM) {
      embedderRef.current = cachedEmbedder;
      engineRef.current = cachedLLM;
      setStatus("ready");
      return;
    }

    setStatus("loading-embedder");
    setErrorMessage("");

    try {
      // Load embedding model if not cached
      if (cachedEmbedder) {
        embedderRef.current = cachedEmbedder;
      } else {
        setStatusMessage("Loading embedding model...");
        const { pipeline } = await import("@huggingface/transformers");
        const embedder = await pipeline(
          "feature-extraction",
          embeddingModelId,
          { dtype: "fp32" }
        );
        embedderRef.current = embedder;
        setEmbeddingPipeline(embeddingModelId, embedder);
      }

      // Load LLM if not cached
      if (cachedLLM) {
        engineRef.current = cachedLLM;
      } else {
        setStatus("loading-llm");
        setStatusMessage("Loading language model...");

        const webllm = await import("@mlc-ai/web-llm");
        const engine = new webllm.MLCEngine();
        engine.setInitProgressCallback((progress) => {
          setStatusMessage(progress.text);
        });

        await engine.reload(llmModelId);
        engineRef.current = engine;
        setLLMEngine(llmModelId, engine);
      }

      setStatus("ready");
      setStatusMessage("");
    } catch (error) {
      console.error("Initialization error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to initialize"
      );
    }
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !embedderRef.current) return;

    setStatusMessage("Processing documents...");

    try {
      for (const file of Array.from(files)) {
        let text = "";

        if (file.type === "application/pdf") {
          text = await parsePDF(file);
        } else {
          text = await file.text();
        }

        // Chunk the text
        const chunks = chunkText(text);
        setStatusMessage(`Embedding ${chunks.length} chunks from ${file.name}...`);

        // Generate embeddings for each chunk
        const newChunks: DocumentChunk[] = [];
        for (let i = 0; i < chunks.length; i++) {
          const output = await embedderRef.current(chunks[i], {
            pooling: "mean",
            normalize: true,
          });

          newChunks.push({
            id: `${file.name}-${i}`,
            content: chunks[i],
            source: file.name,
            embedding: Array.from(output.data),
          });

          setStatusMessage(
            `Embedding chunk ${i + 1}/${chunks.length} from ${file.name}...`
          );
        }

        setDocuments((prev) => [...prev, ...newChunks]);
      }

      setStatusMessage("");
    } catch (error) {
      console.error("File processing error:", error);
      setStatusMessage("Error processing file");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Retrieve relevant chunks
  const retrieveContext = async (query: string, topK = 3): Promise<DocumentChunk[]> => {
    if (!embedderRef.current || documents.length === 0) return [];

    // Embed the query
    const queryOutput = await embedderRef.current(query, {
      pooling: "mean",
      normalize: true,
    });
    const queryEmbedding = Array.from(queryOutput.data) as number[];

    // Calculate similarities
    const scored = documents
      .filter((doc) => doc.embedding)
      .map((doc) => ({
        ...doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !engineRef.current || isGenerating) return;

    const userQuery = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);
    setIsGenerating(true);

    try {
      // Retrieve relevant context
      const relevantChunks = await retrieveContext(userQuery);
      const context = relevantChunks
        .map((chunk) => `[${chunk.source}]: ${chunk.content}`)
        .join("\n\n");

      const sources = [...new Set(relevantChunks.map((c) => c.source))];

      // Build prompt with context
      const systemPrompt = documents.length > 0
        ? `You are a helpful assistant. Answer questions based on the provided context. If the context doesn't contain relevant information, say so.

Context:
${context}`
        : "You are a helpful assistant. No documents have been uploaded yet.";

      // Add empty assistant message for streaming
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", sources: sources.length > 0 ? sources : undefined },
      ]);

      const response = await engineRef.current.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery },
        ],
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
            sources: sources.length > 0 ? sources : undefined,
          };
          return newMessages;
        });
        scrollToBottom();
      }
    } catch (error) {
      console.error("Generation error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Sorry, an error occurred while generating the response.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearDocuments = () => {
    setDocuments([]);
    setMessages([]);
  };

  // Idle state - show start screen
  if (status === "idle" || status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-orange-500 to-rose-500 flex items-center justify-center mb-4 text-3xl">
            📚
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Document Q&A</h3>
          <p className="text-slate-400 mb-6">
            Upload documents and ask questions. Everything runs locally - your
            data never leaves your device.
          </p>

          {status === "error" && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4 mb-6 text-left">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  1
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Load AI Models
                  </div>
                  <div className="text-xs text-slate-500">
                    Embedding model (~23MB) + LLM (~200MB)
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  2
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Upload Documents
                  </div>
                  <div className="text-xs text-slate-500">
                    PDF or text files
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  3
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Ask Questions
                  </div>
                  <div className="text-xs text-slate-500">
                    AI finds relevant passages and answers
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={initialize}
            className="w-full py-4 px-6 rounded-xl bg-linear-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Load Models & Start
          </button>

          <p className="text-slate-600 text-xs mt-4">
            Requires WebGPU (Chrome 113+ or Edge 113+)
          </p>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (status === "loading-embedder" || status === "loading-llm") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-orange-500 to-rose-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              {status === "loading-embedder" ? "🔤" : "🧠"}
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">
            {status === "loading-embedder"
              ? "Loading Embedding Model"
              : "Loading Language Model"}
          </h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-slate-400 text-sm wrap-break-word">{statusMessage}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Ready state - main interface
  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-white/2 border border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-500 to-rose-500 flex items-center justify-center text-sm">
            📚
          </div>
          <div>
            <div className="text-sm font-medium text-white">Document Q&A</div>
            <div className="text-xs text-emerald-400">
              {documents.length} chunks indexed
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!statusMessage}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Files
          </button>
          {documents.length > 0 && (
            <button
              onClick={clearDocuments}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
          <p className="text-xs text-orange-400">{statusMessage}</p>
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="px-4 py-2 border-b border-white/10 bg-white/1">
          <div className="flex flex-wrap gap-2">
            {[...new Set(documents.map((d) => d.source))].map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white/5 text-slate-400"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {source}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full min-h-50">
            <div className="text-center text-slate-500">
              {documents.length === 0 ? (
                <>
                  <p className="text-sm">Upload documents to get started.</p>
                  <p className="text-xs mt-1">
                    Supports PDF and text files.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm">Documents loaded! Ask a question.</p>
                  <p className="text-xs mt-1">
                    The AI will search your documents for answers.
                  </p>
                </>
              )}
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
              <div
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-linear-to-r from-orange-500 to-rose-500 text-white rounded-2xl px-4 py-3"
                    : "space-y-2"
                }`}
              >
                {message.role === "assistant" ? (
                  <>
                    <div className="bg-white/10 text-slate-200 rounded-2xl px-4 py-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-1">
                        {message.sources.map((source) => (
                          <span
                            key={source}
                            className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded"
                          >
                            📄 {source}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
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

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-white/2">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              documents.length === 0
                ? "Upload documents first..."
                : "Ask about your documents..."
            }
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 resize-none"
            disabled={isGenerating}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isGenerating}
            className="px-4 py-3 rounded-xl bg-linear-to-r from-orange-500 to-rose-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
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
        </div>
        <p className="text-center text-slate-600 text-xs mt-2">
          Press Enter to send • All processing happens locally
        </p>
      </div>
    </div>
  );
}