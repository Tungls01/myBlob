"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUploadBlobs } from "@shelby-protocol/react";
import { shelbyClient } from "../lib/shelby";
import BlobList from "./components/BlobList";
import ConnectWalletButton from "./components/ConnectWalletButton";

const ONE_DAY_MICROS = 24 * 60 * 60 * 1_000_000;
const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]+$/.test(addr);
const shortenAddress = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;

function ShelbyStatus({ connected }: { connected: boolean }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      setFlash((f) => !f);
      count++;
      if (count === 3) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [connected]);
  const color = connected ? "#00ff00" : "#ff69b4";
  return (
    <span
      style={{
        fontSize: 24,
        marginLeft: 12,
        color: flash ? "#fff" : color,
        textShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
      }}
    >
      {connected ? "🟢" : "🔴"}
    </span>
  );
}

type FileState = {
  file: File;
  progress: number;
  status: "idle" | "uploading" | "success" | "cancelled";
};

export default function Page() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [files, setFiles] = useState<FileState[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchAccount, setSearchAccount] = useState("");
  const [hover, setHover] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aptosSearchHistory");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);

  const uploadBlobs = useUploadBlobs({
    client: shelbyClient,
    onSuccess: () => {
      setFiles((prev) =>
        prev.map((f) => ({ ...f, progress: 100, status: "success" }))
      );
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "success"));
      }, 5000);
      setStatus("UPLOAD SUCCESSFUL!");
      setTimeout(() => setStatus(null), 5000);
    },
    onError: (e) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "cancelled" } : f
        )
      );
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "cancelled"));
      }, 5000);
      setStatus(" " + e.message);
      setTimeout(() => setStatus(null), 5000);
    },
  });

  const handleUpload = async () => {
    if (!connected || !account || !signAndSubmitTransaction) {
      return setStatus("CONNECT WALLET FIRST!");
    }
    if (files.length === 0) return setStatus("SELECT FILE(S) FIRST!");
    setStatus("UPLOADING...");
    setFiles((prev) =>
      prev.map((f) => ({ ...f, progress: 5, status: "uploading" }))
    );
    try {
      const blobs = await Promise.all(
        files.map(async (f) => {
          const buffer = await f.file.arrayBuffer();
          return { blobName: f.file.name, blobData: new Uint8Array(buffer) };
        })
      );
      uploadBlobs.mutate({
        signer: { account: account.address.toString(), signAndSubmitTransaction },
        blobs,
        expirationMicros: Date.now() * 1000 + ONE_DAY_MICROS,
      });
    } catch (err: any) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: "cancelled" })));
      setStatus("❌ " + err.message);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  useEffect(() => {
    if (!files.some((f) => f.status === "uploading")) return;
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== "uploading") return f;
          const newProgress = Math.min(f.progress + Math.random() * 10, 90);
          return { ...f, progress: newProgress };
        })
      );
    }, 300);
    return () => clearInterval(interval);
  }, [files]);

  const showStatus = (msg: string, timeout = 5000) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), timeout);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress(searchInput)) return showStatus("INVALID ADDRESS!");
    setStatus(null);
    setSearchAccount(searchInput);
    setSearchHistory((prev) => {
      const newHistory = [searchInput, ...prev.filter((a) => a !== searchInput)].slice(
        0,
        5
      );
      localStorage.setItem("aptosSearchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
    setShowHistory(false);
  };

  const clearSearch = () => {
    setSearchAccount("");
    setSearchInput("");
  };

  const displayAddress = useMemo(
    () => (searchAccount ? shortenAddress(searchAccount) : ""),
    [searchAccount]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Courier New, monospace",
        background: "#120629",
        color: "#ff69b4",
        padding: 10,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          borderRadius: 12,
          border: "2px solid #ff69b4",
          boxShadow: "0 0 20px #ff69b4aa",
          marginBottom: 20,
          gap: 8,
          background: "linear-gradient(135deg, #2a1a3d, #3b1f54)",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: 32,
            textShadow: "0 0 8px #ff69b4",
            flexShrink: 0,
          }}
        >
          myBlob
        </div>

        {/* Search */}
        <div style={{ flex: "1 1 200px", minWidth: 180, position: "relative" }}>
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              alignItems: "center",
              border: "2px solid #ff69b4",
              borderRadius: 8,
              overflow: "hidden",
              background: "#2a1a3d",
              boxShadow: "0 0 10px #ff69b4aa inset",
              width: "100%",
            }}
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter address"
              style={{
                flex: 1,
                padding: "6px 10px",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#ff69b4",
                fontFamily: "Courier New, monospace",
              }}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 100)}
            />
            <button
              type="submit"
              style={{
                padding: "6px 12px",
                border: "none",
                background: "#3b1f54",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 0 8px #ff69b4",
                flexShrink: 0,
              }}
            >
              Search
            </button>
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  background: "#3b1f54",
                  color: "#ff69b4",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 0 8px #ff1493",
                  flexShrink: 0,
                }}
              >
                Clear
              </button>
            )}
          </form>

          {/* Search History */}
          {showHistory && searchHistory.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#2a1a3d",
                border: "1px solid #ff69b4",
                borderRadius: 6,
                marginTop: 4,
                zIndex: 50,
                maxHeight: 150,
                overflowY: "auto",
                boxShadow: "0 0 10px #ff69b4aa",
              }}
            >
              {searchHistory.map((addr) => (
                <div
                  key={addr}
                  onMouseDown={() => {
                    setSearchInput(addr);
                    setSearchAccount(addr);
                    setShowHistory(false);
                  }}
                  style={{ padding: "6px 10px", cursor: "pointer", color: "#ff69b4" }}
                  title={addr}
                >
                  {shortenAddress(addr)}
                </div>
              ))}
              <div
                onMouseDown={() => {
                  setSearchHistory([]);
                  localStorage.removeItem("aptosSearchHistory");
                }}
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "#ff1493",
                  borderTop: "1px solid #ff69b4",
                }}
              >
                Clear History
              </div>
            </div>
          )}
        </div>

        {/* Wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ConnectWalletButton />
          <ShelbyStatus connected={connected} />
        </div>
      </div>

      {/* Upload Section */}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          maxWidth: 600,
          width: "90%",
          margin: "40px auto",
          padding: 20,
          textAlign: "center",
          border: "2px dashed #ff69b4",
          background: hover ? "#3b1f54" : "#2a1a3d",
          borderRadius: 12,
          boxShadow: hover ? "0 0 20px #ff69b4aa" : "0 0 10px #ff69b4aa",
          transition: "0.3s",
        }}
      >
        <h2 style={{ fontSize: 28, marginBottom: 20, textShadow: "0 0 8px #ff69b4" }}>
          Upload Blobs
        </h2>
        <label
          htmlFor="fileUpload"
          style={{
            display: "inline-block",
            padding: "10px 25px",
            border: "2px solid #ff69b4",
            borderRadius: 8,
            background: "#2a1a3d",
            color: "#ff69b4",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.2s",
            boxShadow: "0 0 8px #ff69b4",
          }}
        >
          Select Files
        </label>
        <input
          type="file"
          id="fileUpload"
          multiple
          style={{ display: "none" }}
          onChange={(e) =>
            setFiles(
              e.target.files
                ? Array.from(e.target.files).map((f) => ({ file: f, progress: 0, status: "idle" }))
                : []
            )
          }
        />
        <button
          onClick={handleUpload}
          style={{
            display: "block",
            margin: "20px auto 0",
            padding: "8px 20px",
            border: "2px solid #ff69b4",
            borderRadius: 8,
            background: "#3b1f54",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 0 12px #ff69b4",
          }}
        >
          Upload All
        </button>

        {files.map((f, idx) => (
          <div
            key={idx}
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              border: "2px solid #ff69b4",
              background: "#2a1a3d",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            <div style={{ fontWeight: 500, color: "#ff69b4" }}>{f.file.name}</div>
            {f.status !== "cancelled" && (
              <div
                style={{
                  width: "100%",
                  height: 12,
                  borderRadius: 6,
                  border: "2px solid #ff69b4",
                  marginTop: 6,
                  background: "#1c0c2e",
                }}
              >
                <div
                  style={{
                    width: `${f.progress}%`,
                    height: "100%",
                    borderRadius: 6,
                    background:
                      f.status === "success"
                        ? "#00ff00"
                        : "linear-gradient(90deg, #ff69b4, #ff1493)",
                    boxShadow: f.status === "success" ? "0 0 8px #00ff00" : "0 0 12px #ff69b4",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            )}
            {f.status === "cancelled" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.85)",
                  color: "#ff1493",
                  fontWeight: "bold",
                  fontSize: 18,
                  textShadow: "0 0 12px #ff1493, 0 0 24px #ff69b4",
                  borderRadius: 8,
                  zIndex: 10,
                }}
              >
                ❌ Cancelled
              </div>
            )}
            {(f.status === "idle" || f.status === "uploading") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles((prev) => prev.filter((_, i) => i !== idx));
                }}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  border: "none",
                  background: "transparent",
                  color: "#ff1493",
                  fontSize: 18,
                  cursor: "pointer",
                  fontWeight: "bold",
                  textShadow: "0 0 6px #ff1493",
                }}
                title="Remove File"
              >
                ❌
              </button>
            )}
          </div>
        ))}

        {status && (
          <div
            style={{
              marginTop: 16,
              color: "#ff1493",
              fontWeight: "bold",
              textShadow: "0 0 6px #ff69b4",
            }}
          >
            {status}
          </div>
        )}
      </div>

      {/* Blob List */}
      <div
        style={{
          maxWidth: 940,
          width: "95%",
          margin: "0 auto",
          padding: 20,
          border: "2px solid #ff69b4",
          borderRadius: 12,
          background: "#2a1a3d",
          boxShadow: "0 0 20px #ff69b4aa",
        }}
      >
        <h2 style={{ marginBottom: 16, fontSize: 28, textShadow: "0 0 8px #ff69b4" }}>
          {searchAccount ? `Blobs of: ${displayAddress}` : "Your Blobs"}
        </h2>
        <BlobList accountAddress={searchAccount || undefined} />
      </div>
    </div>
  );
}