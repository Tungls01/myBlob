"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAccountBlobs } from "@shelby-protocol/react";
import { shelbyClient } from "../../lib/shelby";

// ===== Theme =====
const theme = {
  colors: {
    neonPink: "#ff69b4",
    neonHotPink: "#ff1493",
    bgDark: "#2a1a3d",
    bgDarkHover: "#3b1f54",
    cardBg: "rgba(42,26,61,0.5)",
    overlay: "rgba(0,0,0,0.6)",
  },
  borderRadius: 12,
  transition: "0.3s",
  shadow: "0 0 20px rgba(255,105,180,0.6)",
};

type BlobItem = {
  blobNameSuffix?: string;
  name?: string;
  size?: number;
};

interface FileViewerProps {
  files: BlobItem[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  file: { url: string; name: string };
  onClose: () => void;
}

function getFileType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "other";
  if (["png","jpg","jpeg","gif","webp"].includes(ext)) return "image";
  if (["mp4","mov","avi","mkv","webm"].includes(ext)) return "video";
  if (["mp3","wav","ogg","flac"].includes(ext)) return "audio";
  if (["txt","json","md"].includes(ext)) return "text";
  return "other";
}

// ===== FileViewer =====
function FileViewer({ files, currentIndex, setCurrentIndex, file, onClose }: FileViewerProps) {
  const [text, setText] = useState("");
  const type = getFileType(file.name);

  useEffect(() => {
    if (type === "text") {
      fetch(file.url).then(r => r.text()).then(setText);
    }
  }, [file, type]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && currentIndex < files.length - 1) setCurrentIndex(currentIndex + 1);
      if (e.key === "ArrowLeft" && currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [currentIndex, files.length, onClose, setCurrentIndex]);

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

        <h3 style={{ marginBottom: 12, color: "#ff69b4", textShadow: "0 0 8px #ff69b4" }}>{file.name}</h3>

        {type === "image" && <img src={file.url} style={{ maxWidth: "100%", border: "2px solid #ff69b4", borderRadius: 8, boxShadow: "0 0 12px #ff69b4" }} />}
        {type === "video" && <video src={file.url} controls style={{ maxWidth: "100%", border: "2px solid #ff69b4", borderRadius: 8, boxShadow: "0 0 12px #ff69b4" }} />}
        {type === "audio" && <audio src={file.url} controls style={{ width: "100%", border: "2px solid #ff69b4", borderRadius: 8, boxShadow: "0 0 12px #ff69b4" }} />}
        {type === "text" && <pre style={{ whiteSpace: "pre-wrap", background: "rgba(255,20,147,0.05)", padding: 10, borderRadius: 8, border: "1px solid #ff69b4", boxShadow: "0 0 6px #ff69b4", maxHeight: "60vh", overflow: "auto" }}>{text || "Loading..."}</pre>}
        {type === "other" && <a href={file.url} target="_blank" style={{ color: "#ff69b4", textDecoration: "underline", textShadow: "0 0 6px #ff69b4" }}>Download file</a>}

        {/* Prev / Next */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <button
            onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            style={{ padding: "4px 10px", border: `2px solid #ff69b4`, borderRadius: 6, background: "transparent", color: "#ff69b4", cursor: currentIndex === 0 ? "not-allowed" : "pointer" }}
          >
            ◀ Prev
          </button>
          <button
            onClick={() => currentIndex < files.length - 1 && setCurrentIndex(currentIndex + 1)}
            disabled={currentIndex === files.length - 1}
            style={{ padding: "4px 10px", border: `2px solid #ff69b4`, borderRadius: 6, background: "transparent", color: "#ff69b4", cursor: currentIndex === files.length - 1 ? "not-allowed" : "pointer" }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== BlobList Component =====
interface BlobListProps {
  accountAddress?: string;
}

export default function BlobList({ accountAddress }: BlobListProps) {
  console.log("KEY:", process.env.NEXT_PUBLIC_SHELBY_API_KEY);
  const { account } = useWallet();
  const address =
    accountAddress ||
    (typeof account?.address === "string" ? account.address : account?.address?.toString?.() || "");

  const { data, isLoading, error, refetch } = useAccountBlobs({
    client: shelbyClient,
    account: address,
    pagination: { limit: 100, offset: 0 },
  });

  const blobs: BlobItem[] = Array.isArray(data) ? data : [];

  const getName = (b: BlobItem) => (b.blobNameSuffix || b.name || "").toLowerCase();

  // classify files
  const musicFiles = blobs.filter((b) => [".mp3", ".wav", ".ogg", ".flac"].some((ext) => getName(b).endsWith(ext)));
  const imageFiles = blobs.filter((b) => [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) => getName(b).endsWith(ext)));
  const videoFiles = blobs.filter((b) => [".mp4", ".mov", ".avi", ".mkv", ".webm"].some((ext) => getName(b).endsWith(ext)));
  const textFiles = blobs.filter((b) => [".txt", ".json", ".md"].some((ext) => getName(b).endsWith(ext)));
  const otherFiles = blobs.filter((b) => {
    const name = getName(b);
    const isKnown =
      [".mp3", ".wav", ".ogg", ".flac"].some((e) => name.endsWith(e)) ||
      [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((e) => name.endsWith(e)) ||
      [".mp4", ".mov", ".avi", ".mkv", ".webm"].some((e) => name.endsWith(e)) ||
      [".txt", ".json", ".md"].some((e) => name.endsWith(e));
    return !isKnown;
  });

  const folders = { Music: musicFiles, Image: imageFiles, Video: videoFiles, Text: textFiles, Others: otherFiles };

  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const files = openFolder ? folders[openFolder as keyof typeof folders] : [];
  const totalPages = Math.ceil(files.length / pageSize);
  const paginatedFiles = files.slice((page - 1) * pageSize, page * pageSize);

  const [currentBlob, setCurrentBlob] = useState<{ url: string; name: string } | null>(null);

  const handlePlay = (blobName: string) => {
    const url = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${address}/${blobName}`;
    setCurrentBlob({ url, name: blobName });
  };

  // ===== Tự động refetch khi mở folder =====
  useEffect(() => {
    if (openFolder) {
      refetch?.();
    }
  }, [openFolder, refetch]);

  if (!address) return <p> No address found!</p>;
  if (isLoading) return <p> Loading...</p>;
  if (error) return <p> Error loading data!</p>;

  return (
    <div style={{ padding: 5, maxWidth: 940, margin: "0 auto", fontFamily: "Courier New, monospace", color: theme.colors.neonPink }}>
      {/* Folders */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(folders).map(([name, list]) => (
          <div
            key={name}
            onMouseEnter={() => { setOpenFolder(name); setPage(1); setCurrentBlob(null); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: theme.borderRadius,
              border: `2px solid ${theme.colors.neonPink}`,
              background: openFolder === name ? "linear-gradient(135deg, #ff69b4, #ff1493)" : theme.colors.bgDark,
              color: openFolder === name ? "#fff" : theme.colors.neonPink,
              cursor: "pointer",
              transition: theme.transition,
              boxShadow: openFolder === name ? theme.shadow : "none",
            }}
          >
            <img src="/icons/folder.png" alt="folder icon" style={{ width: 20, height: 20 }} />
            {name} ({list.length})
          </div>
        ))}
      </div>

      {/* File list */}
      {openFolder && (
        <div style={{ background: theme.colors.bgDark, borderRadius: theme.borderRadius, padding: 16, border: `2px solid ${theme.colors.neonPink}` }}>
          <h3 style={{ marginBottom: 12, color: theme.colors.neonPink }}>{openFolder} Files</h3>
          {paginatedFiles.map((b, i) => {
            const name = b.blobNameSuffix || b.name || "unknown";
            const size = b.size || 0;
            const isActive = currentBlob?.name === name;
            const fileUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${address}/${name}`;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 10px",
                  borderBottom: "1px solid rgba(255,105,180,0.2)",
                  borderRadius: 6,
                  background: isActive ? "rgba(255,105,180,0.2)" : "transparent",
                  cursor: "pointer",
                  transition: "0.3s",
                }}
                onClick={() => handlePlay(name)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = isActive ? "rgba(255,105,180,0.3)" : "rgba(255,105,180,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = isActive ? "rgba(255,105,180,0.2)" : "transparent"; }}
              >
                <span>{name}</span>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span>{(size / 1024).toFixed(1)} KB</span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={name}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, background: "#2a1a3d", border: "2px solid #ff69b4", cursor: "pointer", transition: "0.3s", boxShadow: "0 0 6px #ff69b4" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 12px #ff69b4, 0 0 18px #ff1493")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 6px #ff69b4")}
                    title="Download"
                  >
                    <img src="/icons/dl.png" alt="Download" style={{ width: 26, height: 26 }} />
                  </a>
                </span>
              </div>
            );
          })}

          {/* Pagination */}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} style={{ padding: "5px 12px", borderRadius: theme.borderRadius, border: `2px solid ${theme.colors.neonPink}`, background: theme.colors.bgDark, color: theme.colors.neonPink, cursor: page === 1 ? "not-allowed" : "pointer", transition: theme.transition, boxShadow: "0 0 8px #ff69b4aa" }}>◀ Prev</button>
            <span>{page} / {totalPages || 1}</span>
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} style={{ padding: "5px 12px", borderRadius: theme.borderRadius, border: `2px solid ${theme.colors.neonPink}`, background: theme.colors.bgDark, color: theme.colors.neonPink, cursor: page === totalPages ? "not-allowed" : "pointer", transition: theme.transition, boxShadow: "0 0 8px #ff69b4aa" }}>Next ▶</button>
          </div>
        </div>
      )}

      {/* ===== FILE VIEWER MODAL ===== */}
      {currentBlob && (
        <FileViewer
          files={files}
          currentIndex={files.findIndex(f => (f.blobNameSuffix || f.name) === currentBlob.name)}
          setCurrentIndex={(i) => {
            const f = files[i];
            if (f) {
              setCurrentBlob({
                url: `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${address}/${f.blobNameSuffix || f.name}`,
                name: f.blobNameSuffix || f.name!,
              });
            }
          }}
          file={currentBlob}
          onClose={() => setCurrentBlob(null)}
        />
      )}
    </div>
  );
}