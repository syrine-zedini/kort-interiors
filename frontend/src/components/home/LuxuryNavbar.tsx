"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCategories } from "../../hooks/useCategories";
import { CategoryNode } from "../../types/category";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";
import SearchModal from "./SearchModal";
import { useCart } from "@/hooks/useCart";

interface LuxuryNavbarProps {
  transparent?: boolean;
}

export default function LuxuryNavbar({ transparent = true }: LuxuryNavbarProps) {
  const { categories } = useCategories();
  const { isAuthenticated, user, logout } = useAuth();
  const { items } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredChild, setHoveredChild] = useState<string | null>(null);
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
  }, [isAuthenticated, user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-account-menu]")) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [accountMenuOpen]);

  // Close account menu when auth modal opens
  useEffect(() => {
    const handleCloseMenu = () => {
      setAccountMenuOpen(false);
    };
    window.addEventListener("closeAccountMenu", handleCloseMenu);
    return () => window.removeEventListener("closeAccountMenu", handleCloseMenu);
  }, []);

  // Reset hoveredChild when top-level category changes
  useEffect(() => {
    if (!hoveredCat) { setHoveredChild(null); return; }
    const cat = categories.find((c) => c.id === hoveredCat);
    // Pre-select first child that has sub-children, otherwise first child
    const first = cat?.children.find((c) => c.children.length > 0) ?? cat?.children[0] ?? null;
    setHoveredChild(first?.id ?? null);
  }, [hoveredCat, categories]);

  const openMenu = () => {
    if (!isMobile) {
      const first = categories.find((c) => c.children.length > 0);
      setHoveredCat(first?.id ?? categories[0]?.id ?? null);
    } else {
      setHoveredCat(null);
    }
    setMenuOpen(true);
  };

  const activeCategory = categories.find((c) => c.id === hoveredCat);
  const activeChild: CategoryNode | undefined = activeCategory?.children.find(
    (c) => c.id === hoveredChild
  );
  const hasGrandchildren = (activeChild?.children.length ?? 0) > 0;
  // Does the active top-level have any children that themselves have children?
  const hasThirdLevel = activeCategory?.children.some((c) => c.children.length > 0) ?? false;

  const isLight = !transparent || scrolled;
  const headerBg = menuOpen ? "#2b2b2b" : isLight ? "#fff" : "transparent";
  const textColor = menuOpen ? "#fff" : isLight ? "#1a1a1a" : "#fff";
  const borderColor = menuOpen
    ? "rgba(255,255,255,0.3)"
    : isLight
      ? "rgba(14,13,12,0.3)"
      : "rgba(255,255,255,0.35)";

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        backgroundColor: headerBg,
        transition: "background-color 0.35s ease, box-shadow 0.35s ease",
        boxShadow: (!menuOpen && scrolled) ? "0 1px 24px rgba(0,0,0,0.07)" : "none",
      }}>
        <div style={{ padding: isMobile ? "0 16px" : "0 40px" }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            height: "68px", position: "relative",
          }}>

            {/* Gauche : X / MENU */}
            <button
              onClick={menuOpen ? () => setMenuOpen(false) : openMenu}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 0", color: textColor, transition: "color 0.35s",
                display: "flex", alignItems: "center", gap: "12px",
              }}
              aria-label={menuOpen ? "Fermer" : "Menu"}
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <line x1="0" y1="1" x2="22" y2="1" />
                  <line x1="0" y1="7" x2="22" y2="7" />
                  <line x1="0" y1="13" x2="22" y2="13" />
                </svg>
              )}
              <span className="hide-mobile" style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase" }}>
                Menu
              </span>
            </button>

            {/* Centre : logo */}
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              style={{
                position: "absolute", left: "50%", transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: "8px",
                textDecoration: "none", color: textColor, transition: "color 0.35s",
              }}
            >
              <div className="logo-img-nav" style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <Image
                  src="/assets/logo.jpg" alt="Kort Interiors"
                  width={36} height={36}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <span className="logo-text-nav" style={{
                fontSize: "11px", fontWeight: 600,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                Kort Interiors
              </span>
            </Link>

            {/* Droite : icones */}
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <Link
                href="/professionnel"
                style={{
                  fontSize: "9px", letterSpacing: "2.5px", textTransform: "uppercase",
                  color: textColor, textDecoration: "none",
                  padding: "7px 18px",
                  border: `1px solid ${borderColor}`,
                  transition: "color 0.35s, border-color 0.35s",
                  whiteSpace: "nowrap",
                }}
                className="nav-pro-btn hide-mobile"
              >
                Professionnel
              </Link>

              {/* Account / Auth Button */}
              {isAuthenticated && user ? (
                <div style={{ position: "relative" }} data-account-menu>
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: textColor,
                      transition: "color 0.35s",
                      lineHeight: 1,
                      fontSize: "13px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    aria-label="Mon compte"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="hide-mobile">{user.username}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {accountMenuOpen && (
                    <div
                      data-account-menu
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "12px",
                        background: "#fff",
                        border: "1px solid #e8e4dc",
                        borderRadius: "4px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        minWidth: "200px",
                        zIndex: 1000,
                      }}
                    >
                      <div style={{ padding: "12px 0" }}>
                        <div
                          style={{
                            padding: "12px 20px",
                            fontSize: "12px",
                            color: "#888",
                            borderBottom: "1px solid #f0ece6",
                          }}
                        >
                          {user.email}
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setAccountMenuOpen(false)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "12px 20px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "#0e0d0c",
                            textAlign: "left",
                            transition: "background 0.2s",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => {
                            if (e.target instanceof HTMLElement) {
                              e.target.style.background = "#f9f7f4";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (e.target instanceof HTMLElement) {
                              e.target.style.background = "none";
                            }
                          }}
                        >
                          Mon profil
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setAccountMenuOpen(false)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "12px 20px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "#0e0d0c",
                            textAlign: "left",
                            transition: "background 0.2s",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => {
                            if (e.target instanceof HTMLElement) {
                              e.target.style.background = "#f9f7f4";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (e.target instanceof HTMLElement) {
                              e.target.style.background = "none";
                            }
                          }}
                        >
                          Statut des commandes, Historique
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setAccountMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "12px 20px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "#0e0d0c",
                            textAlign: "left",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f7f4")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          Se déconnecter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: textColor,
                    transition: "color 0.35s",
                    lineHeight: 1,
                  }}
                  aria-label="Mon compte"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => {
                  setSearchOpen(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  color: textColor,
                  transition: "color 0.35s",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "auto"
                }}
                aria-label="Recherche"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <Link
                href="/cart"
                aria-label="Panier"
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: textColor,
                  textDecoration: "none",
                  transition: "color 0.35s",
                  lineHeight: 1,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>

                {cartItemCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      borderRadius: 999,
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #fff",
                    }}
                  >
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>

        {/* ── Mega-menu panel ── */}
        <div style={{
          overflow: "hidden",
          maxHeight: menuOpen ? "calc(100vh - 68px)" : "0",
          transition: "max-height 0.45s cubic-bezier(0.16,1,0.3,1)",
          overflowY: isMobile ? "auto" : "hidden",
        }}>
          {isMobile ? (
            <div style={{ background: "#fff", borderTop: "1px solid #ece8e2", paddingBottom: "40px" }}>
              {categories.map((c) => {
                const isActive = hoveredCat === c.id;
                return (
                  <div key={c.id} style={{ borderBottom: "1px solid #f0ece6" }}>
                    <div
                      style={{
                        position: "relative",
                        background: isActive ? "#fbfaf9" : "#fff",
                      }}
                    >
                      <Link
                        href={`/products/${c.slug ?? c.id}`}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "block",
                          padding: "16px 32px",
                          paddingRight: "80px",
                          color: "#1a1a1a",
                          textDecoration: "none",
                          fontSize: "14px",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {c.name}
                      </Link>

                      {c.children.length > 0 && (
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setHoveredCat(isActive ? null : c.id);
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: "150px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 10,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" style={{ transform: isActive ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {isActive && c.children.length > 0 && (
                      <div style={{ background: "#fbfaf9", padding: "8px 32px 16px" }}>
                        {c.children.map((child) => (
                          <div key={child.id} style={{ marginBottom: "8px" }}>
                            <Link
                              href={`/products/${child.slug ?? child.id}`}
                              onClick={() => setMenuOpen(false)}
                              style={{ color: "#444", textDecoration: "none", fontSize: "14px", display: "block", padding: "4px 0" }}
                            >
                              {child.name}
                            </Link>
                            {child.children.length > 0 && (
                              <div style={{ paddingLeft: "16px", marginTop: "4px", borderLeft: "1px solid #ddd" }}>
                                {child.children.map((gc) => (
                                  <Link
                                    key={gc.id}
                                    href={`/products/${gc.slug ?? gc.id}`}
                                    onClick={() => setMenuOpen(false)}
                                    style={{ color: "#777", textDecoration: "none", fontSize: "13px", display: "block", padding: "4px 0" }}
                                  >
                                    {gc.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: "16px" }}>
                <Link href="/professionnel" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "16px 32px", fontSize: "14px", color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #f0ece6", fontWeight: 600 }}>Professionnel</Link>
                <Link href="/blog" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "16px 32px", fontSize: "14px", color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #f0ece6" }}>Blog</Link>
                <Link href="/a-propos" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "16px 32px", fontSize: "14px", color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #f0ece6" }}>À propos</Link>
                <Link href="/contact" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "16px 32px", fontSize: "14px", color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #f0ece6" }}>Contact</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", background: "#fff", borderTop: "1px solid #ece8e2" }}>

              {/* Col 1 — Catégories racines */}
              <div style={{
                width: "240px", flexShrink: 0,
                background: "#f7f5f2",
                borderRight: "1px solid #ece8e2",
                padding: "12px 0 24px",
              }}>
                {categories.map((c) => {
                  const isActive = hoveredCat === c.id;
                  return (
                    <div
                      key={c.id}
                      onMouseEnter={() => setHoveredCat(c.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 28px", cursor: "pointer",
                        background: isActive ? "#fff" : "transparent",
                        borderLeft: isActive ? "2px solid #1a1a1a" : "2px solid transparent",
                      }}
                    >
                      <Link
                        href={`/products/${c.slug ?? c.id}`}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          fontSize: "13px", color: "#1a1a1a", textDecoration: "none",
                          fontWeight: isActive ? 700 : 400, flex: 1, letterSpacing: "0.2px",
                        }}
                      >
                        {c.name}
                      </Link>
                      {c.children.length > 0 && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </div>
                  );
                })}

                <div style={{ borderTop: "1px solid #ece8e2", marginTop: "8px", paddingTop: "8px" }}>
                  <Link
                    href="/blog"
                    onClick={() => setMenuOpen(false)}
                    onMouseEnter={() => setHoveredCat(null)}
                    style={{ display: "block", padding: "12px 28px", fontSize: "13px", color: "#1a1a1a", textDecoration: "none", borderLeft: "2px solid transparent" }}
                    className="cat-link"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/a-propos"
                    onClick={() => setMenuOpen(false)}
                    onMouseEnter={() => setHoveredCat(null)}
                    style={{ display: "block", padding: "12px 28px", fontSize: "13px", color: "#1a1a1a", textDecoration: "none", borderLeft: "2px solid transparent" }}
                    className="cat-link"
                  >
                    À propos
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    onMouseEnter={() => setHoveredCat(null)}
                    style={{ display: "block", padding: "12px 28px", fontSize: "13px", color: "#1a1a1a", textDecoration: "none", borderLeft: "2px solid transparent" }}
                    className="cat-link"
                  >
                    Contact
                  </Link>
                </div>
              </div>

              {/* Col 2 — Enfants de la catégorie survolée */}
              {activeCategory && activeCategory.children.length > 0 && (
                <div style={{
                  width: hasThirdLevel ? "240px" : "auto",
                  flexGrow: hasThirdLevel ? 0 : 1,
                  flexShrink: 0,
                  flexBasis: hasThirdLevel ? "240px" : "0%",
                  borderRight: hasThirdLevel ? "1px solid #ece8e2" : "none",
                  padding: "24px 0",
                  overflowY: "auto",
                }}>
                  <p style={{
                    fontSize: "8px", letterSpacing: "3px", textTransform: "uppercase",
                    color: "#bbb", margin: "0 0 12px", padding: "0 28px",
                  }}>
                    {activeCategory.name}
                  </p>

                  {activeCategory.children.map((child) => {
                    const isActive = hoveredChild === child.id;
                    const hasSubs = child.children.length > 0;
                    return (
                      <div
                        key={child.id}
                        onMouseEnter={() => setHoveredChild(child.id)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 28px", cursor: "pointer",
                          background: isActive && hasSubs ? "#fafaf9" : "transparent",
                          borderLeft: isActive && hasSubs ? "2px solid #1a1a1a" : "2px solid transparent",
                        }}
                      >
                        <Link
                          href={`/products/${child.slug ?? child.id}`}
                          onClick={() => setMenuOpen(false)}
                          style={{
                            fontSize: "13px", color: "#1a1a1a", textDecoration: "none",
                            fontWeight: isActive && hasSubs ? 600 : 400,
                            flex: 1, letterSpacing: "0.2px",
                          }}
                          className="submenu-link"
                        >
                          {child.name}
                        </Link>
                        {hasSubs && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                      </div>
                    );
                  })}

                  {/* Voir tout */}
                  <div style={{ padding: "16px 28px 0" }}>
                    <Link
                      href={`/products/${activeCategory.slug ?? activeCategory.id}`}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        fontSize: "9px", letterSpacing: "2.5px", textTransform: "uppercase",
                        color: "#1a1a1a", textDecoration: "none",
                        borderBottom: "1px solid #1a1a1a", paddingBottom: "2px",
                      }}
                    >
                      Voir tout
                    </Link>
                  </div>
                </div>
              )}

              {/* Col 3 — Petits-enfants (uniquement si le nœud survolé en a) */}
              {hasThirdLevel && (
                <div style={{ flex: 1, padding: "24px 48px", minHeight: "360px" }}>
                  {hasGrandchildren ? (
                    <>
                      <p style={{
                        fontSize: "8px", letterSpacing: "3px", textTransform: "uppercase",
                        color: "#bbb", margin: "0 0 20px",
                      }}>
                        {activeChild!.name}
                      </p>
                      <div style={{
                        columnCount: activeChild!.children.length > 6 ? 3 : activeChild!.children.length > 3 ? 2 : 1,
                        columnGap: "40px",
                      }}>
                        {activeChild!.children.map((gc) => (
                          <Link
                            key={gc.id}
                            href={`/products/${gc.slug ?? gc.id}`}
                            onClick={() => setMenuOpen(false)}
                            style={{
                              display: "block", padding: "8px 0", fontSize: "14px",
                              color: "#1a1a1a", textDecoration: "none",
                              borderBottom: "1px solid #f0ece6", marginBottom: "2px",
                              breakInside: "avoid",
                            }}
                            className="submenu-link"
                          >
                            {gc.name}
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/products/${activeChild!.slug ?? activeChild!.id}`}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "8px",
                          marginTop: "24px", fontSize: "9px", letterSpacing: "2.5px",
                          textTransform: "uppercase", color: "#1a1a1a", textDecoration: "none",
                          borderBottom: "1px solid #1a1a1a", paddingBottom: "2px",
                        }}
                      >
                        Voir tout
                      </Link>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                      <p style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#ccc" }}>
                        Survolez une sous-catégorie
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder quand aucune catégorie n'est survolée */}
              {!activeCategory && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "32px 48px" }}>
                  <p style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#ccc" }}>
                    Survolez une catégorie
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.3)",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.35s ease",
          top: "68px",
        }}
      />

      <style jsx global>{`
        .nav-pro-btn:hover { opacity: 0.6; }
        .submenu-link:hover { color: #888 !important; }
        .cat-link:hover { border-left-color: #1a1a1a !important; font-weight: 700; }
        .logo-text-nav { letter-spacing: 4px; }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .logo-text-nav { letter-spacing: 1px !important; font-size: 10px !important; }
          .logo-img-nav { width: 30px !important; height: 30px !important; }
        }
      `}</style>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
