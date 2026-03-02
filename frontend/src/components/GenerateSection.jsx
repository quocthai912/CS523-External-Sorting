import { useState } from "react";
import axios from "axios";

const PRESETS = [50, 100, 200, 500, 1000];

function GenerateSection({ onGenerateSuccess }) {
  const [count, setCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleGenerate = async () => {
    if (count < 10 || count > 1000) {
      setStatus("Error: Number Must Be Between 10 And 1000.");
      return;
    }

    setLoading(true);
    setStatus("Generating...");

    try {
      const res = await axios.post(
        `http://localhost:8000/generate?num_numbers=${count}`,
      );
      setStatus(`${res.data.message} — ${res.data.num_numbers} Numbers Ready.`);
      onGenerateSuccess(res.data);
    } catch {
      setStatus("Error: Could Not Connect To Backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Preset buttons */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs  uppercase tracking-wide"
          style={{ color: "#8b949e" }}
        >
          Quick Select
        </p>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className="px-3 py-1.5 rounded-lg text-xs  border
                transition-all duration-200"
              style={{
                background: count === n ? "#1f6feb" : "#161b22",
                borderColor: count === n ? "#1f6feb" : "#30363d",
                color: count === n ? "#ffffff" : "#8b949e",
                boxShadow:
                  count === n ? "0 0 12px rgba(31,111,235,0.3)" : "none",
              }}
            >
              {n} numbers
            </button>
          ))}
        </div>
      </div>

      {/* Custom input */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs  uppercase tracking-wide"
          style={{ color: "#8b949e" }}
        >
          Custom Amount
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min={10}
            max={10000}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="flex-1 px-3 py-2 rounded-lg text-sm  border
              outline-none transition-all duration-200"
            style={{
              background: "#0d1117",
              borderColor: "#30363d",
              color: "#e6edf3",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1f6feb")}
            onBlur={(e) => (e.target.style.borderColor = "#30363d")}
            placeholder="Enter amount (10 - 10,000)"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm  font-bold
              text-white transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? "#21262d"
                : "linear-gradient(90deg, #1f6feb, #6e40c9)",
              boxShadow: loading ? "none" : "0 0 16px rgba(31,111,235,0.25)",
            }}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <p
          className="text-xs  border-l-2 pl-3"
          style={{ color: "#8b949e", borderColor: "#1f6feb" }}
        >
          {status}
        </p>
      )}
    </div>
  );
}

export default GenerateSection;
