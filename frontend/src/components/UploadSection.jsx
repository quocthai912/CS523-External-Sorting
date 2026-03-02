import { useState } from "react";
import axios from "axios";

function UploadSection({ onUploadSuccess }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".bin")) {
      setStatus("Error: Only .bin Files Accepted.");
      return;
    }

    setLoading(true);
    setStatus("Uploading...");
    setFilename(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/upload", formData);
      setStatus(`${res.data.total_numbers} Numbers Detected.`);
      onUploadSuccess(res.data);
    } catch {
      setStatus("Error: Upload Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <label
        className="w-full flex flex-col items-center justify-center gap-2
  border-2 border-dashed rounded-xl py-8 cursor-pointer
  transition-all duration-300 group"
        style={{
          borderColor: "#30363d",
          background: "#0d1117",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#388bfd")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#30363d")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
            a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span
          className="text-xs  text-slate-500
          group-hover:text-slate-300 transition-colors"
        >
          {filename ? filename : "Click To Select .bin File"}
        </span>
        <input
          type="file"
          accept=".bin"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {loading && (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full border-2 border-blue-500
            border-t-transparent animate-spin"
          />
          <span className="text-xs  text-slate-500">Uploading...</span>
        </div>
      )}

      {status && !loading && (
        <p
          className="text-xs  text-slate-500 border-l-2
          border-blue-800 pl-3"
        >
          {status}
        </p>
      )}
    </div>
  );
}

export default UploadSection;
