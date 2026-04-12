/* ── Neural Network Training Web Worker ────────────────────── */
export {};

type ActivationFn = "relu" | "sigmoid" | "tanh";

interface Layer {
  weights: Float32Array;
  biases: Float32Array;
  fanIn: number;
  fanOut: number;
}

/* ── Seeded PRNG ───────────────────────────────────────────── */

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianRandom(rng: () => number) {
  return (
    Math.sqrt(-2 * Math.log(rng() || 1e-10)) *
    Math.cos(2 * Math.PI * rng())
  );
}

/* ── Activation functions + derivatives ────────────────────── */

const ACTIVATIONS: Record<
  ActivationFn,
  { fn: (x: number) => number; derivative: (x: number, output: number) => number }
> = {
  relu: {
    fn: (x) => Math.max(0, x),
    derivative: (_x, out) => (out > 0 ? 1 : 0),
  },
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
    derivative: (_x, out) => out * (1 - out),
  },
  tanh: {
    fn: (x) => Math.tanh(x),
    derivative: (_x, out) => 1 - out * out,
  },
};

function softmax(arr: Float32Array): Float32Array {
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] > max) max = arr[i];
  const out = new Float32Array(arr.length);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    out[i] = Math.exp(arr[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

/* ── Network creation ──────────────────────────────────────── */

function createNetwork(seed: number, arch: number[]): Layer[] {
  const rng = mulberry32(seed);
  const layers: Layer[] = [];
  for (let l = 0; l < arch.length - 1; l++) {
    const fanIn = arch[l];
    const fanOut = arch[l + 1];
    const std = Math.sqrt(2 / (fanIn + fanOut));
    const weights = new Float32Array(fanIn * fanOut);
    const biases = new Float32Array(fanOut);
    for (let i = 0; i < weights.length; i++) {
      weights[i] = gaussianRandom(rng) * std;
    }
    layers.push({ weights, biases, fanIn, fanOut });
  }
  return layers;
}

/* ── Forward pass ──────────────────────────────────────────── */

function forwardPassFull(
  input: Float32Array,
  net: Layer[],
  activation: ActivationFn
): { activations: Float32Array[]; preActivations: Float32Array[] } {
  const acts: Float32Array[] = [input];
  const preActs: Float32Array[] = [input];
  let cur = input;
  const actFn = ACTIVATIONS[activation].fn;

  for (let l = 0; l < net.length; l++) {
    const { weights, biases, fanIn, fanOut } = net[l];
    const z = new Float32Array(fanOut);
    const a = new Float32Array(fanOut);
    for (let j = 0; j < fanOut; j++) {
      let s = biases[j];
      for (let i = 0; i < fanIn; i++) s += cur[i] * weights[i * fanOut + j];
      z[j] = s;
      a[j] = l < net.length - 1 ? actFn(s) : s;
    }
    preActs.push(z);
    acts.push(l === net.length - 1 ? softmax(a) : a);
    cur = acts[acts.length - 1];
  }
  return { activations: acts, preActivations: preActs };
}

/* ── Backpropagation ───────────────────────────────────────── */

function backprop(
  net: Layer[],
  acts: Float32Array[],
  preActs: Float32Array[],
  target: number,
  activation: ActivationFn,
  lr: number
): number {
  const L = net.length;
  const output = acts[L];
  const loss = -Math.log(Math.max(1e-10, output[target]));
  const derivFn = ACTIVATIONS[activation].derivative;

  let delta = new Float32Array(output.length);
  for (let i = 0; i < output.length; i++) {
    delta[i] = output[i] - (i === target ? 1 : 0);
  }

  for (let l = L - 1; l >= 0; l--) {
    const layer = net[l];
    const prevActs = acts[l];

    for (let j = 0; j < layer.fanOut; j++) {
      for (let i = 0; i < layer.fanIn; i++) {
        layer.weights[i * layer.fanOut + j] -= lr * prevActs[i] * delta[j];
      }
      layer.biases[j] -= lr * delta[j];
    }

    if (l > 0) {
      const prevDelta = new Float32Array(layer.fanIn);
      for (let i = 0; i < layer.fanIn; i++) {
        let sum = 0;
        for (let j = 0; j < layer.fanOut; j++) {
          sum += layer.weights[i * layer.fanOut + j] * delta[j];
        }
        prevDelta[i] = sum * derivFn(preActs[l][i], acts[l][i]);
      }
      delta = prevDelta;
    }
  }

  return loss;
}

function argmax(arr: Float32Array): number {
  let best = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[best]) best = i;
  }
  return best;
}

/* ── Training data generation ──────────────────────────────── */

const DIGIT_7x7 = [
  ".#####.\n#.....#\n#...#.#\n#..#..#\n#.#...#\n#.....#\n.#####.",
  "...#...\n..##...\n.#.#...\n...#...\n...#...\n...#...\n.#####.",
  ".#####.\n#.....#\n......#\n.#####.\n#......\n#......\n#######",
  ".#####.\n#.....#\n......#\n..####.\n......#\n#.....#\n.#####.",
  "#.....#\n#.....#\n#.....#\n.######\n......#\n......#\n......#",
  "#######\n#......\n#......\n.#####.\n......#\n#.....#\n.#####.",
  ".#####.\n#......\n#......\n######.\n#.....#\n#.....#\n.#####.",
  "#######\n......#\n.....#.\n....#..\n...#...\n...#...\n...#...",
  ".#####.\n#.....#\n#.....#\n.#####.\n#.....#\n#.....#\n.#####.",
  ".#####.\n#.....#\n#.....#\n.######\n......#\n......#\n.#####.",
];

function generateTrainingData(
  seed: number
): { pixels: Float32Array; label: number }[] {
  const rng = mulberry32(seed);
  const data: { pixels: Float32Array; label: number }[] = [];

  for (let digit = 0; digit < 10; digit++) {
    const baseRows = DIGIT_7x7[digit].split("\n");

    for (let v = 0; v < 50; v++) {
      const pixels = new Float32Array(784);
      const dx = Math.floor(rng() * 3) - 1;
      const dy = Math.floor(rng() * 3) - 1;
      const noiseProb = rng() * 0.15;

      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const srcY = y - dy;
          const srcX = x - dx;
          let val = 0;
          if (srcY >= 0 && srcY < 7 && srcX >= 0 && srcX < 7) {
            val = baseRows[srcY]?.[srcX] === "#" ? 1.0 : 0.0;
          }
          if (rng() < noiseProb) val = val > 0.5 ? 0.0 : 1.0;
          for (let py = 0; py < 4; py++) {
            for (let px = 0; px < 4; px++) {
              pixels[(y * 4 + py) * 28 + (x * 4 + px)] = val;
            }
          }
        }
      }
      data.push({ pixels, label: digit });
    }
  }

  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
}

/* ── Worker state ──────────────────────────────────────────── */

let network: Layer[] | null = null;
let trainingData: { pixels: Float32Array; label: number }[] | null = null;
let isTraining = false;

/* ── Message handler ───────────────────────────────────────── */

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case "init": {
      const { seed, arch } = payload;
      network = createNetwork(seed, arch);
      trainingData = null;
      isTraining = false;
      // Send back serialized weights for visualization
      self.postMessage({
        type: "initialized",
        payload: {
          weights: network.map(l => ({
            weights: l.weights,
            fanIn: l.fanIn,
            fanOut: l.fanOut,
          })),
        },
      });
      break;
    }

    case "forward": {
      if (!network) return;
      const { pixels, activation } = payload;
      const input = new Float32Array(pixels);
      const { activations } = forwardPassFull(input, network, activation);
      self.postMessage({
        type: "forward-result",
        payload: { activations },
      });
      break;
    }

    case "start-training": {
      if (!network) return;
      const { activation, learningRate, batchSize, arch } = payload;
      if (!trainingData) {
        trainingData = generateTrainingData(42);
      }
      isTraining = true;

      let epochLoss = 0;
      let epochCorrect = 0;
      let sampleIdx = 0;
      let epoch = payload.startEpoch || 0;
      const data = trainingData;

      function trainBatch() {
        if (!isTraining || !network || !data) return;

        // Process multiple batches per tick (up to ~8ms)
        const start = performance.now();
        while (performance.now() - start < 8) {
          let batchLoss = 0;
          let batchCorrect = 0;
          const end = Math.min(sampleIdx + batchSize, data.length);

          for (let s = sampleIdx; s < end; s++) {
            const sample = data[s];
            const { activations: acts, preActivations: preActs } =
              forwardPassFull(sample.pixels, network!, activation);
            const loss = backprop(
              network!,
              acts,
              preActs,
              sample.label,
              activation,
              learningRate
            );
            batchLoss += loss;
            if (argmax(acts[acts.length - 1]) === sample.label) batchCorrect++;
          }

          epochLoss += batchLoss;
          epochCorrect += batchCorrect;
          sampleIdx = end;

          if (sampleIdx >= data.length) {
            epoch++;
            const avgLoss = epochLoss / data.length;
            const acc = epochCorrect / data.length;

            // Visualize a random sample
            const randomSample = data[Math.floor(Math.random() * data.length)];
            const { activations: vizActs } = forwardPassFull(
              randomSample.pixels,
              network!,
              activation
            );

            self.postMessage({
              type: "epoch-complete",
              payload: {
                epoch,
                loss: avgLoss,
                accuracy: acc,
                activations: vizActs,
                weights: network!.map(l => ({
                  weights: l.weights,
                  fanIn: l.fanIn,
                  fanOut: l.fanOut,
                })),
                archLength: arch.length,
              },
            });

            epochLoss = 0;
            epochCorrect = 0;
            sampleIdx = 0;

            // Shuffle
            for (let i = data.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [data[i], data[j]] = [data[j], data[i]];
            }

            break; // Yield after each epoch
          }
        }

        if (isTraining) {
          setTimeout(trainBatch, 0);
        }
      }

      trainBatch();
      break;
    }

    case "stop-training": {
      isTraining = false;
      self.postMessage({ type: "training-stopped" });
      break;
    }

    case "step": {
      if (!network) return;
      const { activation: act, learningRate: lr, batchSize: bs } = payload;
      if (!trainingData) {
        trainingData = generateTrainingData(42);
      }

      let batchLoss = 0;
      let batchCorrect = 0;
      const end = Math.min(bs, trainingData.length);
      for (let s = 0; s < end; s++) {
        const sample = trainingData[s];
        const { activations: acts, preActivations: preActs } =
          forwardPassFull(sample.pixels, network, act);
        const loss = backprop(network, acts, preActs, sample.label, act, lr);
        batchLoss += loss;
        if (argmax(acts[acts.length - 1]) === sample.label) batchCorrect++;
      }

      const sample = trainingData[0];
      const { activations: vizActs } = forwardPassFull(sample.pixels, network, act);

      self.postMessage({
        type: "step-result",
        payload: {
          loss: batchLoss / end,
          accuracy: batchCorrect / end,
          activations: vizActs,
          weights: network.map(l => ({
            weights: l.weights,
            fanIn: l.fanIn,
            fanOut: l.fanOut,
          })),
        },
      });
      break;
    }
  }
};
