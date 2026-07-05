import { useState, useRef, useCallback } from "react";
import "./App.css";

const ALGORITHMS = ["Bubble Sort", "Selection Sort", "Insertion Sort"];
const COLORS = {
  default: "#4f9dde",
  comparing: "#f5a623",
  swapping: "#e74c3c",
  sorted: "#2ecc71",
};

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

// Each algorithm returns an array of "steps".
// A step is { array, comparing: [i,j] | [], swapping: [i,j] | [], sortedIndices: [] }
function bubbleSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;
  const sortedIndices = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ array: [...a], comparing: [j, j + 1], swapping: [], sortedIndices: [...sortedIndices] });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ array: [...a], comparing: [], swapping: [j, j + 1], sortedIndices: [...sortedIndices] });
      }
    }
    sortedIndices.unshift(n - i - 1);
  }
  sortedIndices.unshift(0);
  steps.push({ array: [...a], comparing: [], swapping: [], sortedIndices: Array.from({ length: n }, (_, k) => k) });
  return steps;
}

function selectionSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;
  const sortedIndices = [];
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({ array: [...a], comparing: [minIdx, j], swapping: [], sortedIndices: [...sortedIndices] });
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({ array: [...a], comparing: [], swapping: [i, minIdx], sortedIndices: [...sortedIndices] });
    }
    sortedIndices.push(i);
  }
  sortedIndices.push(n - 1);
  steps.push({ array: [...a], comparing: [], swapping: [], sortedIndices: Array.from({ length: n }, (_, k) => k) });
  return steps;
}

function insertionSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let key = a[i];
    let j = i - 1;
    steps.push({ array: [...a], comparing: [i, j], swapping: [], sortedIndices: Array.from({ length: i }, (_, k) => k) });
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      steps.push({ array: [...a], comparing: [], swapping: [j, j + 1], sortedIndices: Array.from({ length: i }, (_, k) => k) });
      j--;
      if (j >= 0) {
        steps.push({ array: [...a], comparing: [i, j], swapping: [], sortedIndices: Array.from({ length: i }, (_, k) => k) });
      }
    }
    a[j + 1] = key;
  }
  steps.push({ array: [...a], comparing: [], swapping: [], sortedIndices: Array.from({ length: n }, (_, k) => k) });
  return steps;
}

const ALGO_FN = {
  "Bubble Sort": bubbleSortSteps,
  "Selection Sort": selectionSortSteps,
  "Insertion Sort": insertionSortSteps,
};

export default function App() {
  const [size, setSize] = useState(30);
  const [speed, setSpeed] = useState(40); // ms per step
  const [algorithm, setAlgorithm] = useState("Bubble Sort");
  const [array, setArray] = useState(() => generateArray(30));
  const [comparing, setComparing] = useState([]);
  const [swapping, setSwapping] = useState([]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [isSorting, setIsSorting] = useState(false);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0, timeMs: 0 });

  const stopRef = useRef(false);

  const resetArray = useCallback(
    (newSize = size) => {
      if (isSorting) return;
      setArray(generateArray(newSize));
      setComparing([]);
      setSwapping([]);
      setSortedIndices([]);
      setStats({ comparisons: 0, swaps: 0, timeMs: 0 });
    },
    [size, isSorting]
  );

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const runSort = async () => {
    if (isSorting) return;
    setIsSorting(true);
    stopRef.current = false;

    const steps = ALGO_FN[algorithm](array);
    let comparisons = 0;
    let swaps = 0;
    const start = performance.now();

    for (const step of steps) {
      if (stopRef.current) break;
      if (step.comparing.length) comparisons++;
      if (step.swapping.length) swaps++;

      setArray(step.array);
      setComparing(step.comparing);
      setSwapping(step.swapping);
      setSortedIndices(step.sortedIndices);
      setStats({ comparisons, swaps, timeMs: performance.now() - start });

      await sleep(speed);
    }

    setComparing([]);
    setSwapping([]);
    setIsSorting(false);
  };

  const handleSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setSize(newSize);
    resetArray(newSize);
  };

  const barColor = (idx) => {
    if (sortedIndices.includes(idx)) return COLORS.sorted;
    if (swapping.includes(idx)) return COLORS.swapping;
    if (comparing.includes(idx)) return COLORS.comparing;
    return COLORS.default;
  };

  return (
    <div className="app">
      <header>
        <h1>DSA Sorting Visualizer</h1>
        <p className="subtitle">
          A browser port of my{" "}
          <a href="https://github.com/Ruggy-droid/Visualizer.git" target="_blank" rel="noreferrer">
            C++ terminal Algorithm Visualizer
          </a>
        </p>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>Algorithm</label>
          <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} disabled={isSorting}>
            {ALGORITHMS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Array Size: {size}</label>
          <input type="range" min="10" max="80" value={size} onChange={handleSizeChange} disabled={isSorting} />
        </div>

        <div className="control-group">
          <label>Speed: {speed}ms</label>
          <input
            type="range"
            min="5"
            max="200"
            value={210 - speed}
            onChange={(e) => setSpeed(210 - Number(e.target.value))}
          />
        </div>

        <div className="control-group buttons">
          <button onClick={() => resetArray()} disabled={isSorting}>
            New Array
          </button>
          <button className="primary" onClick={runSort} disabled={isSorting}>
            {isSorting ? "Sorting..." : "Start Sort"}
          </button>
        </div>
      </div>

      <div className="stats">
        <div>
          Comparisons: <strong>{stats.comparisons}</strong>
        </div>
        <div>
          Swaps: <strong>{stats.swaps}</strong>
        </div>
        <div>
          Time: <strong>{stats.timeMs.toFixed(0)} ms</strong>
        </div>
      </div>

      <div className="bars-container">
        {array.map((value, idx) => (
          <div
            key={idx}
            className="bar"
            style={{
              height: `${value * 3.5}px`,
              width: `${Math.max(100 / array.length - 0.3, 0.5)}%`,
              backgroundColor: barColor(idx),
            }}
          />
        ))}
      </div>

      <footer>
        <p>Built with React · Deployed on Vercel</p>
      </footer>
    </div>
  );
}
