"use client";

import { useEffect, useState } from "react";

const getFileType = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "other";
  if (["png","jpg","jpeg","gif","webp"].includes(ext)) return "image";
  if (["mp4","mov","avi","mkv","webm"].includes(ext)) return "video";
  if (["mp3","wav","ogg","flac"].includes(ext)) return "audio";
  if (["txt","json","md"].includes(ext)) return "text";
  return "other";
};

interface FileViewerProps {
  file: { url: string; name: string };
  files: { url: string; name: string }[]; // danh sách file trong folder
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  onClose: () => void;
}

export default function FileViewer({
  file,
  files,
  currentIndex,
  setCurrentIndex,
  onClose,
}: FileViewerProps) {
  const [text, setText] = useState("");
  const type = getFileType(file.name);

  // Load text
  useEffect(() => {
    if (type === "text") {
      fetch(file.url).then(r => r.text()).then(setText);
    }
  }, [file, type]);

  // ESC key
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const handlePrev = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);
  const handleNext = () => currentIndex < files.length - 1 && setCurrentIndex(currentIndex + 1);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,12,46,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#1c0c2e",
          padding: 20,
          border: "2px solid #ff69b4",
          borderRadius: 12,
          maxWidth: "90%",
          maxHeight: "90%",
          overflow: "auto",
          boxShadow: "0 0 20px #ff69b4, 0 0 40px #ff1493",
          transition: "0.3s",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "transparent",
            color: "#ff69b4",
            fontSize: 22,
            cursor: "pointer",
            padding: "2px 6px",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ff1493")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#ff69b4")}
          title="Close"
        >
          ✖
        </button>

        <h3 style={{ marginBottom: 12, color: "#ff69b4", textShadow: "0 0 8px #ff69b4" }}>
          {file.name}
        </h3>

        {type === "image" && <img src={file.url} style={{ maxWidth: "100%", border: "2px solid #ff69b4", borderRadius: 8, boxShadow: "0 0 12px #ff69b4" }} />}
        {type === "video" && <video src={file.url} controls style={{ maxWidth: "100%", border: "2px solid #ff69b4", borderRadius: 8, boxShadow: "0 0 12px #ff69b4" }} />}
        {type === "audio" && <audio src={file.url} controls style={{ width: "100%", border: "2px solid #ff69b4", borderRadius: 8, boxShadow: "0 0 12px #ff69b4" }} />}
        {type === "text" && <pre style={{ whiteSpace: "pre-wrap", background: "rgba(255,20,147,0.05)", padding: 10, borderRadius: 8, border: "1px solid #ff69b4", boxShadow: "0 0 6px #ff69b4", maxHeight: "60vh", overflow: "auto" }}>{text || "Loading..."}</pre>}
        {type === "other" && <a href={file.url} target="_blank" style={{ color: "#ff69b4", textDecoration: "underline", textShadow: "0 0 6px #ff69b4" }}>Download file</a>}

        {/* Navigation */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{ padding: "6px 12px", border: "2px solid #ff69b4", borderRadius: 6, background: "#2a1a3d", color: "#ff69b4", cursor: currentIndex === 0 ? "not-allowed" : "pointer" }}
          >
            ◀ Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
            style={{ padding: "6px 12px", border: "2px solid #ff69b4", borderRadius: 6, background: "#2a1a3d", color: "#ff69b4", cursor: currentIndex === files.length - 1 ? "not-allowed" : "pointer" }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}