"use client";

import { useState, useEffect } from "react";
import api from "@/libs/axios";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

interface SuccessMessage {
  title: string;
  message: string;
  duration?: number;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessMessage | null>(null);

  /* Fermer sur Échap */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Bloquer le scroll du body quand modal ouverte */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Reset form when switching tabs */
  useEffect(() => {
    setError("");
    setEmailError("");
  }, [tab]);

  /* Close account menu when auth modal opens */
  useEffect(() => {
    if (open) {
      const event = new Event("closeAccountMenu");
      window.dispatchEvent(event);
    }
  }, [open]);

  /* Reset form when modal closes */
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setName("");
      setError("");
      setEmailError("");
      setSuccess(null);
    }
  }, [open]);

  if (!open) return null;

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setSuccess(null);

    try {
      if (tab === "register") {
        if (!validateName(name)) {
          setError("Le nom doit contenir au moins 2 caractères");
          return;
        }
        if (!validateEmail(email)) {
          setEmailError("Veuillez entrer une adresse e-mail valide");
          return;
        }
        if (!validatePassword(password)) {
          setError("Le mot de passe doit contenir au moins 8 caractères");
          return;
        }

        setIsLoading(true);
        const response = await api.post("/auth/signup", {
          username: name.trim(),
          email: email.toLowerCase(),
          password,
        });

        setSuccess({
          title: "Compte créé avec succès !",
          message: "Veuillez vérifier votre e-mail pour valider votre compte.",
          duration: 3000,
        });

        setTimeout(() => {
          setName("");
          setEmail("");
          setPassword("");
          setTab("login");
          setSuccess(null);
          onClose();
        }, 3000);
      } else {
        if (!validateEmail(email)) {
          setEmailError("Veuillez entrer une adresse e-mail valide");
          return;
        }
        if (!password) {
          setError("Veuillez entrer votre mot de passe");
          return;
        }

        setIsLoading(true);
        const response = await api.post("/auth/login", {
          email: email.toLowerCase(),
          password,
        });

        if (response.data.token && response.data.user) {
          login(response.data.token, response.data.user);
        } else {
          console.error("No token in response:", response.data);
          throw new Error("No token received from server");
        }

        setSuccess({
          title: "Connecté avec succès !",
          message: `Bienvenue ${response.data.user.username || "!"}`,
          duration: 2000,
        });

        setTimeout(() => {
          setEmail("");
          setPassword("");
          setSuccess(null);
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Une erreur s'est produite";

      if (tab === "register" && /already exists|already in use|email/i.test(errorMessage)) {
        setEmailError("Cet e-mail est deja utilise. Vous ne pouvez pas l'utiliser.");
        setError("");
      } else {
        setError(errorMessage);
      }
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: "100%", maxWidth: "440px",
        zIndex: 201,
        background: "#fff",
        display: "flex", flexDirection: "column",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.12)",
        animation: "slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* Header */}
        <div style={{
          padding: "36px 40px 28px",
          borderBottom: "1px solid #f0ece6",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: "9px", letterSpacing: "4px", textTransform: "uppercase", color: "#999", margin: "0 0 6px" }}>
              Kort Interiors
            </p>
            <h2 style={{ fontSize: "22px", fontWeight: 300, color: "#0e0d0c", margin: 0, letterSpacing: "-0.3px" }}>
              Mon compte
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px", color: "#999", lineHeight: 1,
            }}
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f0ece6" }}>
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "16px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
                color: tab === t ? "#0e0d0c" : "#bbb",
                borderBottom: tab === t ? "2px solid #0e0d0c" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "color 0.2s",
                fontFamily: "inherit",
              }}
            >
              {t === "login" ? "Se connecter" : "Créer un compte"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
          {/* Error message */}
          {error && (
            <div style={{
              marginBottom: "20px",
              padding: "14px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#991b1b",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: "2px", flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {tab === "register" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Prénom & Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie Dupont"
                required
                disabled={isLoading}
                autoComplete="off"
                style={inputStyle}
                className="auth-input"
              />
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              placeholder="marie@example.com"
              required
              disabled={isLoading}
              autoComplete="off"
              style={inputStyle}
              className="auth-input"
            />
            {emailError && (
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#991b1b" }}>
                {emailError}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              autoComplete="new-password"
              style={inputStyle}
              className="auth-input"
            />
            {tab === "register" && (
              <p style={{ fontSize: "11px", color: "#999", margin: "6px 0 0 0" }}>
                Minimum 8 caractères
              </p>
            )}
          </div>

          {tab === "login" && (
            <div style={{ textAlign: "right", marginTop: "-24px", marginBottom: "28px" }}>
              <a href="#" style={{ fontSize: "11px", color: "#999", textDecoration: "none" }} className="auth-forgot">
                Mot de passe oublié ?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", padding: "16px",
              background: isLoading ? "#999" : "#0e0d0c", color: "#fff",
              border: "none", cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
              fontFamily: "inherit", fontWeight: 500,
              transition: "opacity 0.2s",
              opacity: isLoading ? 0.7 : 1,
            }}
            className="auth-submit"
          >
            {isLoading ? "Traitement..." : (tab === "login" ? "Se connecter" : "Créer mon compte")}
          </button>

          {/* Séparateur */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "28px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#f0ece6" }} />
            <span style={{ fontSize: "10px", color: "#ccc", letterSpacing: "1px" }}>ou</span>
            <div style={{ flex: 1, height: "1px", background: "#f0ece6" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#999", textAlign: "center", lineHeight: 1.7, margin: 0 }}>
            {tab === "login" ? (
              <>Pas encore de compte ?{" "}
                <button type="button" onClick={() => setTab("register")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#0e0d0c", textDecoration: "underline", fontFamily: "inherit", padding: 0 }}>
                  Créer un compte gratuit
                </button>
              </>
            ) : (
              <>Déjà inscrit ?{" "}
                <button type="button" onClick={() => setTab("login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#0e0d0c", textDecoration: "underline", fontFamily: "inherit", padding: 0 }}>
                  Se connecter
                </button>
              </>
            )}
          </p>
        </form>

        {/* Footer note */}
        <div style={{ padding: "20px 40px 28px", borderTop: "1px solid #f0ece6" }}>
          <p style={{ fontSize: "10px", color: "#bbb", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            En vous connectant, vous acceptez nos{" "}
            <a href="#" style={{ color: "#888", textDecoration: "underline" }}>CGU</a>{" "}
            et notre{" "}
            <a href="#" style={{ color: "#888", textDecoration: "underline" }}>politique de confidentialité</a>.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0);      opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; }
        }
        .auth-input {
          width: 100%; box-sizing: border-box;
          padding: 13px 16px;
          border: 1px solid #e8e4dc;
          background: #faf9f7;
          font-size: 13px; color: #0e0d0c;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .auth-input:focus {
          border-color: #0e0d0c !important;
          background: #fff !important;
        }
        .auth-input::placeholder { color: #c0bbb4; }
        .auth-submit:hover { opacity: 0.78 !important; }
        .auth-forgot:hover { color: #0e0d0c !important; }
      `}</style>

      {/* Success Modal */}
      {success && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 202,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              animation: "fadeOut 0.4s ease forwards",
              animationDelay: "2.6s",
            }}
          />
          {/* Success Message */}
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 203,
            animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            <div style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "48px 40px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
              textAlign: "center",
            }}>
              {/* Success Icon */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#f0fdf4",
                marginBottom: "20px",
                margin: "0 auto 20px",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              {/* Title */}
              <h3 style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                color: "#1a1a1a",
                margin: "0 0 8px",
              }}>
                {success.title}
              </h3>
              {/* Message */}
              <p style={{
                fontSize: "14px",
                color: "#666",
                margin: 0,
                lineHeight: 1.5,
              }}>
                {success.message}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
  color: "#888", marginBottom: "10px", fontFamily: "inherit",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "13px 16px",
  border: "1px solid #e8e4dc",
  background: "#faf9f7",
  fontSize: "13px", color: "#0e0d0c",
  outline: "none",
  fontFamily: "inherit",
};