"use client";

import { useState, useEffect } from "react";

interface WelcomeModalProps {
  open: boolean;
  type: "signup" | "login";
  userName?: string;
  onClose: () => void;
}

export default function WelcomeModal({ open, type, userName, onClose }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    }
  }, [open]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible && !open) return null;

  const isSignup = type === "signup";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: open
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.95)",
          zIndex: 301,
          background: "#fff",
          borderRadius: "12px",
          padding: "60px 40px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          textAlign: "center",
          opacity: open ? 1 : 0,
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0ece6",
            borderRadius: "50%",
            animation: open ? "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0e0d0c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 300,
            color: "#0e0d0c",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
          }}
        >
          {isSignup ? "Bienvenue!" : "Bon retour!"}
        </h2>

        {/* Subheading with name */}
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            margin: "0 0 32px",
            lineHeight: 1.6,
          }}
        >
          {isSignup ? (
            <>
              Merci d&apos;avoir créé un compte{userName && `, ${userName}`}.<br />
              Un email de confirmation a été envoyé à votre adresse.
            </>
          ) : (
            <>
              Heureux de vous revoir{userName && `, ${userName}`}!<br />
              Explorez nos dernières offres et collections.
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {isSignup ? (
            <>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "14px 24px",
                  background: "#0e0d0c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.opacity = "0.8")}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.opacity = "1")}
              >
                Continuer
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                  handleClose();
                }}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "14px 24px",
                  background: "transparent",
                  color: "#0e0d0c",
                  border: "1px solid #e8e4dc",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = "#f9f8f6";
                  (e.target as HTMLButtonElement).style.borderColor = "#0e0d0c";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = "transparent";
                  (e.target as HTMLButtonElement).style.borderColor = "#e8e4dc";
                }}
              >
                Explorer
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              style={{
                minWidth: "200px",
                padding: "14px 32px",
                background: "#0e0d0c",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "opacity 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.opacity = "0.8")}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.opacity = "1")}
            >
              Continuer
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
