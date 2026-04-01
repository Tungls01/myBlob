"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

// ===== Theme =====
const theme = {
  colors: {
    neonPink: "#ff69b4",
    neonHotPink: "#ff1493",
    bgDark: "#2a1a3d",
    bgDarkHover: "#3b1f54",
    dropdownBg: "#1e1a2f",
  },
  borderRadius: 12,
  transition: "0.3s",
  shadow: "0 0 12px rgba(255,105,180,0.7)",
};

export default function ConnectWalletButton() {
  const { connect, connected, disconnect, wallets, account } = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  const shortenAddress = (addr?: string) => {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const buttonStyle = {
    padding: "8px 18px",
    borderRadius: theme.borderRadius,
    border: `2px solid ${theme.colors.neonPink}`,
    backgroundColor: theme.colors.bgDark,
    color: theme.colors.neonPink,
    cursor: "pointer",
    fontWeight: 600,
    transition: theme.transition,
    boxShadow: "none",
  };

  const handleHover = (e: any) => {
    e.currentTarget.style.background = theme.colors.bgDarkHover;
    e.currentTarget.style.boxShadow = theme.shadow;
  };

  const handleLeave = (e: any) => {
    e.currentTarget.style.background = theme.colors.bgDark;
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        position: "relative",
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "Courier New, monospace",
        color: theme.colors.neonPink,
      }}
    >
      {/* Connect / Disconnect Button */}
      {!connected ? (
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={buttonStyle}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={disconnect}
          style={buttonStyle}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}
        >
          Disconnect
        </button>
      )}

      {/* Address Display */}
      {connected && account?.address && (
        <div
          style={{
            padding: "2px 10px",
            borderRadius: theme.borderRadius,
            backgroundColor: theme.colors.bgDark,
            border: `2px solid ${theme.colors.neonPink}`,
            color: theme.colors.neonPink,
            fontWeight: 500,
            fontFamily: "Courier New, monospace",
            transition: theme.transition,
            boxShadow: theme.shadow,
          }}
        >
          {shortenAddress(account.address?.toString())}
        </div>
      )}

      {/* Dropdown Wallet Menu */}
      {!connected && showMenu && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            backgroundColor: theme.colors.dropdownBg,
            borderRadius: theme.borderRadius,
            padding: 8,
            border: `2px solid ${theme.colors.neonPink}`,
            zIndex: 1000,
            minWidth: 180,
            boxShadow: theme.shadow,
            transition: theme.transition,
          }}
        >
          {wallets.map((w) => (
            <button
              key={w.name}
              onClick={() => {
                connect(w.name);
                setShowMenu(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                marginBottom: 4,
                borderRadius: theme.borderRadius,
                border: `2px solid ${theme.colors.neonPink}`,
                backgroundColor: theme.colors.bgDark,
                color: theme.colors.neonPink,
                cursor: "pointer",
                fontWeight: 500,
                transition: theme.transition,
              }}
              onMouseEnter={handleHover}
              onMouseLeave={handleLeave}
            >
              Connect {w.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}