import { useState, useEffect } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";

const RUN_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
];
const RUN_BORDER = [
  "border-blue-400",
  "border-purple-400",
  "border-yellow-400",
  "border-pink-400",
  "border-orange-400",
  "border-teal-400",
];
const RUN_TEXT = [
  "text-blue-300",
  "text-purple-300",
  "text-yellow-300",
  "text-pink-300",
  "text-orange-300",
  "text-teal-300",
];

function NumberBlock({ value, color, small }) {
  return (
    <Motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`${color} ${small ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"}
        rounded-lg font-mono font-bold text-white shadow-md`}
    >
      {typeof value === "number" ? value.toFixed(1) : value}
    </Motion.div>
  );
}

function Visualizer({ trace }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);

  const events = trace?.events || [];
  const event = events[currentStep];

  useEffect(() => {
    if (!playing) return;
    if (currentStep >= events.length - 1) {
      const stop = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(stop);
    }
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        setCurrentStep((prev) => prev + 1);
      });
    }, speed);
    return () => clearTimeout(timer);
  }, [playing, currentStep, events.length, speed]);

  const handlePlayPause = () => setPlaying((p) => !p);
  const handleReset = () => {
    setCurrentStep(0);
    setPlaying(false);
  };
  const handlePrev = () => {
    setPlaying(false);
    setCurrentStep((p) => Math.max(0, p - 1));
  };
  const handleNext = () => {
    setPlaying(false);
    setCurrentStep((p) => Math.min(events.length - 1, p + 1));
  };

  const runsData = event?.data?.runs_data || [];
  const runPointers = event?.data?.run_pointers || [];
  const heapState = event?.data?.heap_state || [];
  const outputSoFar = event?.data?.output_so_far || [];
  const finalOutput = event?.data?.final_output || [];
  const isDone = event?.type === "DONE";
  const highlightRun = event?.data?.from_run ?? -1;
  const highlightValue = event?.data?.value ?? null;

  // Phase hiện tại
  const isPhase1 = ["START", "LOAD", "SORT", "WRITE", "END_PHASE1"].includes(
    event?.type,
  );
  const isPhase2 = [
    "START_PHASE2",
    "INIT_HEAP",
    "MERGE",
    "END_PHASE2",
    "CLEANUP",
  ].includes(event?.type);

  return (
    <div className="w-full max-w-5xl mt-6 flex flex-col gap-6 px-4">
      {/* Thanh tiến trình */}
      <div className="flex flex-col gap-1">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <Motion.div
            className="bg-blue-500 h-2 rounded-full"
            animate={{ width: `${((currentStep + 1) / events.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Step {currentStep + 1} / {events.length}
          </span>
          <span className={isPhase1 ? "text-yellow-400" : "text-green-400"}>
            {isPhase1 ? "Phase 1 — Create Runs" : "Phase 2 — Merge"}
          </span>
        </div>
      </div>
      {/* Thanh trượt tua nhanh */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-600 w-6 text-right">
          {currentStep + 1}
        </span>
        <input
          type="range"
          min={0}
          max={events.length - 1}
          value={currentStep}
          onChange={(e) => {
            setPlaying(false);
            setCurrentStep(Number(e.target.value));
          }}
          className="w-full accent-blue-500 cursor-pointer"
        />
        <span className="text-xs font-mono text-slate-600 w-6">
          {events.length}
        </span>
      </div>
      {/* Mô tả bước hiện tại */}
      <AnimatePresence mode="wait">
        <Motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="bg-gray-800 border border-gray-600 rounded-xl px-5 py-3 text-center"
        >
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {event?.type}
          </span>
          <p className="text-white font-semibold mt-1">{event?.description}</p>
        </Motion.div>
      </AnimatePresence>

      {/* Phase 1: Hiển thị chunk đang được load/sort */}
      {isPhase1 && event?.data?.numbers && (
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-600">
          <p className="text-xs text-gray-400 uppercase mb-3">
            {event.type === "LOAD" ? "Loading Into RAM" : "Sorted In RAM"}
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {event.data.numbers.map((num, i) => (
                <NumberBlock
                  key={i}
                  value={num}
                  color={
                    event.type === "SORT" ? "bg-purple-600" : "bg-yellow-600"
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Phase 2: Visualization 3 khu vực */}
      {isPhase2 && runsData.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Khu vực 1: Các Run */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                />
              </svg>
              <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                Runs
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {runsData.map((run, ri) => (
                <div
                  key={ri}
                  className={`flex flex-col gap-1 border-2 rounded-xl p-2 min-w-16
                    ${highlightRun === ri ? RUN_BORDER[ri % RUN_BORDER.length] : "border-gray-600"}
                    transition-all duration-300`}
                >
                  <p
                    className={`text-xs font-bold text-center ${RUN_TEXT[ri % RUN_TEXT.length]}`}
                  >
                    Run {ri + 1}
                  </p>
                  {run.map((num, ni) => (
                    <Motion.div
                      key={ni}
                      className={`px-2 py-1 rounded text-xs font-mono text-center transition-all duration-300
                        ${
                          ni < runPointers[ri]
                            ? "bg-gray-700 text-gray-500 line-through"
                            : RUN_COLORS[ri % RUN_COLORS.length] + " text-white"
                        }
                        ${
                          highlightValue === num &&
                          highlightRun === ri + 1 &&
                          ni === runPointers[ri] - 1
                            ? "ring-2 ring-white scale-110"
                            : ""
                        }
                      `}
                    >
                      {num.toFixed(1)}
                    </Motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Khu vực 2: Min-Heap */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 17l9-14 9 14H3z"
                />
              </svg>
              <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                Min-Heap
              </p>
            </div>
            <div className="flex gap-2 flex-wrap min-h-10">
              <AnimatePresence>
                {heapState.map((item, i) => (
                  <Motion.div
                    key={`${item.value}-${item.from_run}-${i}`}
                    initial={{ scale: 0, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className={`${RUN_COLORS[(item.from_run - 1) % RUN_COLORS.length]}
                      px-3 py-2 rounded-lg text-white text-sm font-mono font-bold shadow-lg`}
                  >
                    {item.value.toFixed(1)}
                    <span className="text-xs opacity-75 ml-1">
                      R{item.from_run}
                    </span>
                  </Motion.div>
                ))}
              </AnimatePresence>
              {heapState.length === 0 && (
                <p className="text-gray-600 text-sm italic">Empty Heap</p>
              )}
            </div>
          </div>

          {/* Khu vực 3: Output */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                Output — {outputSoFar.length} Numbers
              </p>
            </div>
            <div className="flex gap-1 flex-wrap max-h-24 overflow-y-auto">
              <AnimatePresence>
                {outputSoFar.map((num, i) => (
                  <Motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`px-2 py-1 rounded text-xs font-mono text-white
                      ${
                        i === outputSoFar.length - 1
                          ? "bg-green-500 ring-2 ring-green-300"
                          : "bg-green-800"
                      }`}
                  >
                    {num.toFixed(1)}
                  </Motion.div>
                ))}
              </AnimatePresence>
              {outputSoFar.length === 0 && (
                <p className="text-gray-600 text-sm italic">
                  Awaiting Output....
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Bước DONE: Hiển thị toàn bộ kết quả */}
      {isDone && finalOutput.length > 0 && (
        <div
          className="w-full rounded-2xl border border-emerald-900/50 overflow-hidden"
          style={{ background: "#08080f" }}
        >
          {/* Header */}
          <div
            className="px-5 py-3 border-b border-emerald-900/30 flex items-center
      justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Sorted Output — {finalOutput.length} Numbers
              </span>
            </div>
            <span className="text-xs font-mono text-slate-600">
              Ascending Order ↑
            </span>
          </div>

          {/* Các số đã sort */}
          <div className="p-4 flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
            {finalOutput.map((num, i) => (
              <Motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.008, duration: 0.2 }}
                className="font-mono text-xs px-2 py-1 rounded-lg border
            border-emerald-900/40 text-emerald-300"
                style={{ background: "#0a1a0f" }}
              >
                {num.toFixed(2)}
              </Motion.div>
            ))}
          </div>

          {/* Footer gợi ý */}
          <div className="px-5 py-3 border-t border-emerald-900/30 text-center">
            <p className="text-xs font-mono text-slate-600">
              Sort Completed Successfully. You Can Now Download The Output File.
            </p>
          </div>
        </div>
      )}
      {/* Thanh điều khiển */}
      <div className="flex flex-col gap-3 items-center">
        {/* Tốc độ */}
        <div className="flex items-center gap-3">
          {/* Icon chậm */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>

          <input
            type="range"
            min="200"
            max="2000"
            step="100"
            value={2200 - speed}
            onChange={(e) => setSpeed(2200 - Number(e.target.value))}
            className="w-32 accent-blue-500 cursor-pointer"
          />

          {/* Icon nhanh */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>

          <span className="text-xs font-mono text-slate-600">{speed}ms</span>
        </div>

        {/* Nút điều khiển */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
          >
            ⏮ Reset
          </button>
          <button
            onClick={handlePrev}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
          >
            ◀ Prev
          </button>
          <button
            onClick={handlePlayPause}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-2 rounded-lg font-semibold"
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={handleNext}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default Visualizer;
