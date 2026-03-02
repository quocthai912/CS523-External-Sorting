import { useState, useEffect } from "react";
import axios from "axios";
import UploadSection from "./components/UploadSection";
import Visualizer from "./components/Visualizer";
import GenerateSection from "./components/GenerateSection";

const Icons = {
  folder: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    </svg>
  ),
  merge: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  ),
  hash: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8h16M4 16h16M9 3v18M15 3v18"
      />
    </svg>
  ),
  clock: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
      />
    </svg>
  ),
  download: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
      />
    </svg>
  ),
  play: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  upload: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 8l5-5 5 5M12 3v12"
      />
    </svg>
  ),
  trash: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5
        4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
};

function StatCard({ icon, label, value, color, border }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl p-5 border ${border}
      hover:brightness-110 transition-all duration-300`}
      style={{ background: "#161b22" }}
    >
      <div className={`${color} opacity-70`}>{icon}</div>
      <div>
        <p className={`text-2xl font-black  ${color}`}>{value}</p>
        <p
          className="text-xs uppercase tracking-wide mt-1"
          style={{ color: "#8b949e" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function App() {
  const [uploaded, setUploaded] = useState(false);
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState(null);
  const [cleaned, setCleaned] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [chunkSize, setChunkSize] = useState(10);
  const [serverOnline, setServerOnline] = useState(false);
  const [mode, setMode] = useState("visualize"); // "visualize" | "sort-only"
  const [modeWarning, setModeWarning] = useState("");

  const handleGenerateSuccess = () => {
    setUploaded(true);
    setTrace(null);
    setStats(null);
    setCleaned(false);
    setShowGenerate(false);
    setModeWarning("");
    setMode("visualize"); // Generated file luôn nhỏ → visualize
    setStatus("File Generated Successfully. Ready To Sort!");
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get("https://external-sort-api-pl2y.onrender.com/");
        setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadSuccess = (data) => {
    setUploaded(true);
    setTrace(null);
    setStats(null);
    setCleaned(false);
    setModeWarning("");

    // Tự động chuyển chế độ theo file size
    const size = data?.file_size || 0;

    if (size > 10 * 1024) {
      // > 10KB
      setMode("sort-only");
      setModeWarning(
        `File size ${(size / 1024).toFixed(2)}KB exceeds 10KB. Switched To Sort Only Mode Automatically.`,
      );
      setStatus("File Uploaded. Sort Only Mode Activated.");
    } else {
      setMode("visualize");
      setStatus("File Uploaded Successfully.");
    }
  };

  const handleSort = async () => {
    setLoading(true);
    setStatus("Running Algorithm...");
    const start = Date.now();
    try {
      if (mode === "visualize") {
        // Chế độ Visualize
        const res = await axios.post(
          `https://external-sort-api-pl2y.onrender.com/sort?chunk_size=${chunkSize}`,
        );
        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        setTrace(res.data.trace);
        const events = res.data.trace.events;
        const totalRuns =
          events.find((e) => e.type === "END_PHASE1")?.data?.total_runs || 0;
        const mergeSteps = events.filter((e) => e.type === "MERGE").length;
        const totalNumbers =
          events.find((e) => e.type === "END_PHASE2")?.data?.total_written || 0;
        setStats({ totalRuns, mergeSteps, totalNumbers, elapsed });
        setStatus("Sort Completed. Review The Visualization Below.");
      } else {
        // Chế độ Sort Only
        const res = await axios.post(
          `https://external-sort-api-pl2y.onrender.com/sort-only?chunk_size=${chunkSize}`,
        );
        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        setTrace(null);
        setStats({
          totalRuns: res.data.total_runs,
          mergeSteps: res.data.total_written,
          totalNumbers: res.data.total_written,
          elapsed,
        });
        setStatus("Sort Only Complete. File Is Ready To Download.");
      }
    } catch {
      setStatus("Error: Could Not Connect To Backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.get(
        "https://external-sort-api-pl2y.onrender.com/download",
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "output_sorted.bin");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Download Failed.");
    }
  };

  const handleCleanup = async () => {
    try {
      await axios.post("https://external-sort-api-pl2y.onrender.com/cleanup");
      setCleaned(true);
      setStatus("Temporary Run Files Deleted Successfully.");
    } catch {
      setStatus("Error: Cleanup Failed.");
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#0d1117",
        backgroundImage: `
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(31,111,235,0.15) 0%, transparent 60%),
    linear-gradient(rgba(31,111,235,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31,111,235,0.03) 1px, transparent 1px)
  `,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      }}
    >
      {/* Topbar */}
      <div
        className="border-b sticky top-0 z-10"
        style={{
          background: "rgba(13,17,23,0.95)",
          borderColor: "#21262d",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span
              className=" text-sm font-bold tracking-tight"
              style={{ color: "#e6edf3" }}
            >
              External-Sort-Visualizer
            </span>
            <span
              className="text-xs  px-2 py-0.5 rounded-md border"
              style={{
                color: "#8b949e",
                background: "#161b22",
                borderColor: "#30363d",
              }}
            >
              v1.0.0
            </span>
          </div>
          <div
            className="flex items-center gap-2 text-xs "
            style={{ color: "#8b949e" }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300
    ${serverOnline ? "bg-emerald-400" : "bg-red-500"}`}
            />
            <span style={{ color: serverOnline ? "#3fb950" : "#f85149" }}>
              {serverOnline ? "Server Online" : "Server Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
          text-xs  tracking-wide uppercase mb-6 border"
          style={{
            background: "rgba(56,139,253,0.1)",
            borderColor: "rgba(56,139,253,0.3)",
            color: "#58a6ff",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Algorithm Visualization
        </div>

        <h1
          className="text-6xl font-black tracking-tighter leading-none"
          style={{ color: "#e6edf3" }}
        >
          EXTERNAL SORT{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #58a6ff, #a371f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            VISUALIZER
          </span>
        </h1>

        <p
          className="mt-5 text-sm max-w-xl mx-auto leading-relaxed"
          style={{ color: "#8b949e" }}
        >
          Trực Quan Hóa Từng Bước Của Thuật Toán Sắp Xếp Ngoại Trên File Nhị
          Phân. Quan Sát Quá Trình Tạo Run, Khởi Tạo Heap Và Merge Theo Thời
          Gian Thực.
        </p>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 pb-20 flex flex-col items-center gap-8">
        {/* Upload Panel */}
        <div
          className="w-full max-w-lg rounded-2xl p-8 flex flex-col gap-5 border"
          style={{ background: "#161b22", borderColor: "#30363d" }}
        >
          {/* Tab switcher */}
          <div
            className="flex gap-1 p-1 rounded-lg w-full"
            style={{ background: "#0d1117" }}
          >
            <button
              onClick={() => setShowGenerate(false)}
              className="flex-1 flex items-center justify-center gap-2
      py-2 rounded-md text-xs  transition-all duration-200"
              style={{
                background: !showGenerate ? "#161b22" : "transparent",
                color: !showGenerate ? "#e6edf3" : "#8b949e",
                border: !showGenerate
                  ? "1px solid #30363d"
                  : "1px solid transparent",
              }}
            >
              {Icons.upload}
              Upload File
            </button>
            <button
              onClick={() => setShowGenerate(true)}
              className="flex-1 flex items-center justify-center gap-2
      py-2 rounded-md text-xs  transition-all duration-200"
              style={{
                background: showGenerate ? "#161b22" : "transparent",
                color: showGenerate ? "#e6edf3" : "#8b949e",
                border: showGenerate
                  ? "1px solid #30363d"
                  : "1px solid transparent",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
              Generate File
            </button>
          </div>

          {/* Content */}
          {!showGenerate ? (
            <UploadSection onUploadSuccess={handleUploadSuccess} />
          ) : (
            <GenerateSection onGenerateSuccess={handleGenerateSuccess} />
          )}

          {/* Mode Toggle */}
          <div className="w-full flex flex-col gap-2">
            <p
              className="text-xs  uppercase tracking-wide"
              style={{ color: "#8b949e" }}
            >
              Sort Mode
            </p>
            <div
              className="flex gap-1 p-1 rounded-lg w-full"
              style={{ background: "#0d1117" }}
            >
              <button
                onClick={() => {
                  setMode("visualize");
                  setModeWarning("");
                }}
                className="flex-1 flex items-center justify-center gap-2
        py-2 rounded-md text-xs  transition-all duration-200"
                style={{
                  background: mode === "visualize" ? "#161b22" : "transparent",
                  color: mode === "visualize" ? "#e6edf3" : "#8b949e",
                  border:
                    mode === "visualize"
                      ? "1px solid #30363d"
                      : "1px solid transparent",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                  />
                </svg>
                Visualize
              </button>
              <button
                onClick={() => setMode("sort-only")}
                className="flex-1 flex items-center justify-center gap-2
        py-2 rounded-md text-xs  transition-all duration-200"
                style={{
                  background: mode === "sort-only" ? "#161b22" : "transparent",
                  color: mode === "sort-only" ? "#e6edf3" : "#8b949e",
                  border:
                    mode === "sort-only"
                      ? "1px solid #30363d"
                      : "1px solid transparent",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                  />
                </svg>
                Sort Only
              </button>
            </div>

            {/* Cảnh báo tự động chuyển chế độ */}
            {modeWarning && (
              <div
                className="flex items-start gap-2 px-3 py-2 rounded-lg border"
                style={{
                  background: "rgba(210,153,34,0.1)",
                  borderColor: "rgba(210,153,34,0.3)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: "#d29922" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <p className="text-xs " style={{ color: "#d29922" }}>
                  {modeWarning}
                </p>
              </div>
            )}
          </div>

          {/* Chunk Size */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p
                className="text-xs  uppercase tracking-wide"
                style={{ color: "#8b949e" }}
              >
                Chunk Size
              </p>
              <span
                className="text-xs  px-2 py-0.5 rounded border"
                style={{
                  color: "#58a6ff",
                  background: "#0d1117",
                  borderColor: "#30363d",
                }}
              >
                {chunkSize} numbers/run
              </span>
            </div>

            {/* Preset chunk sizes */}
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setChunkSize(n)}
                  className="px-3 py-1.5 rounded-lg text-xs  border
          transition-all duration-200"
                  style={{
                    background: chunkSize === n ? "#1f6feb" : "#0d1117",
                    borderColor: chunkSize === n ? "#1f6feb" : "#30363d",
                    color: chunkSize === n ? "#ffffff" : "#8b949e",
                    boxShadow:
                      chunkSize === n
                        ? "0 0 12px rgba(31,111,235,0.3)"
                        : "none",
                  }}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={2}
                max={500}
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-lg text-xs  border
        outline-none transition-all duration-200"
                style={{
                  background: "#0d1117",
                  borderColor: "#30363d",
                  color: "#e6edf3",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1f6feb")}
                onBlur={(e) => (e.target.style.borderColor = "#30363d")}
                placeholder="Custom"
              />
            </div>

            {/* Số Run dự kiến */}
            <p
              className="text-xs  border-l-2 pl-3"
              style={{ color: "#8b949e", borderColor: "#1f6feb" }}
            >
              Estimated Runs: {stats ? stats.totalRuns : "—"}
            </p>
          </div>
          {uploaded && (
            <button
              onClick={handleSort}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3
                rounded-xl  font-bold text-sm tracking-wide
                transition-all duration-300 disabled:opacity-30
                disabled:cursor-not-allowed text-white"
              style={
                !loading
                  ? {
                      background: "linear-gradient(90deg, #1f6feb, #6e40c9)",
                      boxShadow: "0 0 24px rgba(31,111,235,0.3)",
                    }
                  : { background: "#21262d" }
              }
            >
              {Icons.play}
              {loading
                ? "Running..."
                : mode === "visualize"
                  ? "Run Sort & Visualize"
                  : "Run Sort Only"}
            </button>
          )}

          {status && (
            <p
              className="text-xs  border-l-2 pl-3"
              style={{ color: "#8b949e", borderColor: "#1f6feb" }}
            >
              {status}
            </p>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Icons.folder}
              label="Total Runs"
              value={stats.totalRuns}
              color="text-cyan-400"
              border="border-cyan-900/30"
            />
            <StatCard
              icon={Icons.merge}
              label="Merge Steps"
              value={stats.mergeSteps}
              color="text-violet-400"
              border="border-violet-900/30"
            />
            <StatCard
              icon={Icons.hash}
              label="Numbers"
              value={stats.totalNumbers}
              color="text-blue-400"
              border="border-blue-900/30"
            />
            <StatCard
              icon={Icons.clock}
              label="Time Elapsed"
              value={`${stats.elapsed}s`}
              color="text-emerald-400"
              border="border-emerald-900/30"
            />
          </div>
        )}

        {/* Action Buttons */}
        {stats && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                text-xs  font-semibold border
                transition-all duration-300"
              style={{
                background: "#161b22",
                borderColor: "#30363d",
                color: "#8b949e",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#238636";
                e.currentTarget.style.color = "#3fb950";
                e.currentTarget.style.background = "#0a1a0f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#30363d";
                e.currentTarget.style.color = "#8b949e";
                e.currentTarget.style.background = "#161b22";
              }}
            >
              {Icons.download}
              Download Output
            </button>

            {!cleaned ? (
              <button
                onClick={handleCleanup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                text-xs  font-semibold border
                transition-all duration-300"
                style={{
                  background: "#161b22",
                  borderColor: "#30363d",
                  color: "#8b949e",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#238636";
                  e.currentTarget.style.color = "#3fb950";
                  e.currentTarget.style.background = "#0a1a0f";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#30363d";
                  e.currentTarget.style.color = "#8b949e";
                  e.currentTarget.style.background = "#161b22";
                }}
              >
                {Icons.trash}
                Delete Temp Run Files
              </button>
            ) : (
              <div
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                text-xs  border"
                style={{
                  background: "#161b22",
                  borderColor: "#1a4731",
                  color: "#3fb950",
                }}
              >
                ✓ Temp Files Deleted
              </div>
            )}
          </div>
        )}

        {/* Visualizer */}
        {trace && <Visualizer trace={trace} />}
      </div>

      {/* Footer */}
      <div className="border-t py-5" style={{ borderColor: "#21262d" }}>
        <p className="text-center text-xs " style={{ color: "#484f58" }}>
          External Sort Visualizer · Balanced Multiway Merge · To Quoc Thai ·
          UIT · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default App;
