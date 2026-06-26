import { useCart } from "@/hooks/useCart";
import { useCartTotals } from "@/hooks/useCart";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import LuxuryNavbar from "@/components/home/LuxuryNavbar";
import { getUserProfile, updateUserProfile, UserProfile } from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/home/AuthModal";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

const resolveImg = (path: string | undefined): string => {
  if (!path) return "/placeholder.png";
  return path.startsWith("http") ? path : `${IMAGE_BASE}${path}`;
};

export default function CartPage() {
  const { items, isLoading, fetchCart, removeFromCart, updateQuantity, placeOrder } = useCart();
  const { totals } = useCartTotals();
  const [promoOpen, setPromoOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "on_delivery">("online");
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Address state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Fetch cart when component mounts or auth state changes
  // Note: Unauthenticated users can view their cart, but must authenticate to checkout

  useEffect(() => {
    fetchCart();
    // Fetch user profile to check for address
    getUserProfile()
      .then((profile) => setUserProfile(profile))
      .catch(() => {});
  }, []);

  const handleSaveAddress = useCallback(async () => {
    const trimmed = addressInput.trim();
    if (!trimmed) {
      setAddressError("Veuillez entrer votre adresse de livraison.");
      return;
    }
    try {
      setIsSavingAddress(true);
      setAddressError("");
      const updated = await updateUserProfile({ address: trimmed });
      setUserProfile(updated);
      setShowAddressModal(false);
      // Proceed with checkout now that address is saved
      await proceedWithOrder(trimmed);
    } catch (err: any) {
      setAddressError(err?.message || "Erreur lors de l'enregistrement de l'adresse.");
    } finally {
      setIsSavingAddress(false);
    }
  }, [addressInput]);

  const handleSavePhone = useCallback(async () => {
    const trimmed = phoneInput.trim();
    if (!trimmed) {
      setPhoneError("Veuillez entrer votre numéro de téléphone.");
      return;
    }
    try {
      setIsSavingPhone(true);
      setPhoneError("");
      const updated = await updateUserProfile({ phoneNumber: trimmed });
      setUserProfile(updated);
      setShowPhoneModal(false);
      // Check if user has an address before proceeding
      const userAddress = updated?.address || userProfile?.address;
      if (!userAddress) {
        setAddressInput("");
        setAddressError("");
        setShowAddressModal(true);
        return;
      }
      // Both phone and address exist, proceed with checkout
      await proceedWithOrder(userAddress);
    } catch (err: any) {
      setPhoneError(err?.message || "Erreur lors de l'enregistrement du numéro.");
    } finally {
      setIsSavingPhone(false);
    }
  }, [phoneInput, userProfile?.address]);

  const proceedWithOrder = async (shippingAddress?: string) => {
    try {
      setIsPlacingOrder(true);
      if (placeOrder) {
        await placeOrder(shippingAddress, undefined, paymentMethod);
        // Redirect based on payment method
        if (paymentMethod === "online") {
          router.push("/cart/payment-success");
        } else {
          // For on_delivery payments, show success message and redirect to home
          showToastMsg("Votre commande a été passée avec succès !", "success");
          setTimeout(() => router.push("/"), 2000);
        }
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Veuillez réessayer.";
      if (paymentMethod === "online") {
        router.push("/cart/payment-failed?reason=declined");
      } else {
        showToastMsg("Erreur : " + errMsg, "error");
        console.error(err);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <>
        <LuxuryNavbar transparent={false}/>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: "sans-serif", color: "#666" }}>Chargement du panier...</p>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <LuxuryNavbar transparent={false}/>
        <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px", background: "#f5f5f5" }}>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 16, fontFamily: "sans-serif" }}>
            Votre panier est vide
          </h2>
          <p style={{ color: "#666", fontSize: 16, marginBottom: 32, fontFamily: "sans-serif" }}>
            Explorez nos produits et trouvez ce que vous aimez.
          </p>
          <Link href="/" style={{
            padding: "12px 32px",
            background: "#1a1a1a",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
            fontFamily: "sans-serif",
            fontSize: 13,
            letterSpacing: 1,
          }}>
            Explorer les produits
          </Link>
        </div>
      </>
    );
  }

  const articleCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    // Verify user is still authenticated (in case token expired)
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check if user has a phone number
    const phoneNumber = userProfile?.phoneNumber;
    if (!phoneNumber) {
      setPhoneInput("");
      setPhoneError("");
      setShowPhoneModal(true);
      return;
    }

    // Check if user has an address
    const address = userProfile?.address;
    if (!address) {
      // Show the address modal instead of proceeding
      setAddressInput("");
      setAddressError("");
      setShowAddressModal(true);
      return;
    }
    // Both phone and address exist, proceed directly
    await proceedWithOrder(address);
  };

  return (
    <>
      <LuxuryNavbar transparent={false}/>
      <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

        {/* ── Top bar: back link + stepper ── */}
        <div style={{
          background: "#fff",
          borderBottom: "1px solid #e8e8e8",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}>
          {/* Back link */}
          <Link href="/" style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#1a1a1a",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
          }}>
            <span style={{ fontSize: 16 }}>‹</span> Continuer mes achats
          </Link>

          {/* Stepper — centered absolutely */}
          <div style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}>
            {/* Step 1 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "2px solid #1a1a1a",
                background: "#fff",
                color: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 15,
              }}>1</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a", letterSpacing: 0.5 }}>PANIER</span>
            </div>

            {/* Line */}
            <div style={{ width: 80, height: 1, background: "#ccc", marginBottom: 22 }} />

            {/* Step 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "#e0e0e0",
                color: "#aaa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 15,
              }}>2</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5 }}>PAIEMENT</span>
            </div>

            {/* Line */}
            <div style={{ width: 80, height: 1, background: "#ccc", marginBottom: 22 }} />

            {/* Step 3 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "#e0e0e0",
                color: "#aaa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 15,
              }}>3</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5 }}>VALIDATION</span>
            </div>
          </div>

          {/* Spacer to balance the flex row */}
          <div style={{ width: 160 }} />
        </div>

        {/* ── Main content ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>

          {/* Left: cart items */}
          <div>
            {items.map((item) => {
              const images = item.product?.images || [];
              const imageArray = Array.isArray(images) ? images : (typeof images === "string" ? JSON.parse(images) : []);
              const rawImageUrl = item.pieceImage || imageArray?.[0];
              const imageUrl = rawImageUrl ? resolveImg(rawImageUrl) : undefined;
              const cleanSize =
                (item.displaySize && !item.displaySize.startsWith("__item__:"))
                  ? item.displaySize
                  : (item.selectedSize && !item.selectedSize.startsWith("__item__:"))
                      ? item.selectedSize
                      : "";
              const detailsLine = [cleanSize, item.colorName || item.selectedColor, item.selectedMaterial]
                .filter(Boolean)
                .join(" - ");

              return (
                <div key={item.id} style={{
                  background: "#fff",
                  borderRadius: 2,
                  marginBottom: 12,
                  overflow: "hidden",
                }}>
                  {/* Shipping banner */}
                  <div style={{
                    borderBottom: "1px solid #eee",
                    padding: "10px 20px",
                    fontSize: 13,
                    color: "#333",
                  }}>
                    Expédié par {"KORT INTERIORS"}
                  </div>

                  {/* Product row */}
                  <div style={{ padding: "20px", display: "flex", alignItems: "flex-start", gap: 20 }}>
                    {/* Image */}
                    <div style={{ width: 100, flexShrink: 0 }}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.product?.name}
                          style={{ width: 100, height: 100, objectFit: "cover" }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (img.src.endsWith("/placeholder.png")) return;
                            img.src = "/placeholder.png";
                          }}
                        />
                      ) : (
                        <div style={{ width: 100, height: 100, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 12 }}>
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badge */}
                      <div style={{
                        display: "inline-block",
                        background: "#1a1a1a",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        padding: "3px 8px",
                        marginBottom: 8,
                      }}>
                        NOUVELLE COLLECTION
                      </div>

                      {/* Brand & name */}
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>
                        {"Kort Interiors"}
                      </div>
                      <div style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 2 }}>
                        {item.pieceName ? `${item.product?.name} - ${item.pieceName}` : item.product?.name}
                      </div>
                      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
                        {detailsLine}
                      </div>

                      {/* Quantity + price row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        {/* Dropdown quantity */}
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                          <select
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            style={{
                              appearance: "none",
                              WebkitAppearance: "none",
                              border: "1px solid #bbb",
                              borderRadius: 0,
                              padding: "6px 32px 6px 12px",
                              fontSize: 14,
                              background: "#fff",
                              color: "#1a1a1a",
                              cursor: "pointer",
                              minWidth: 70,
                            }}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <span style={{ position: "absolute", right: 10, pointerEvents: "none", fontSize: 10, color: "#555" }}>▼</span>
                        </div>

                        {/* Price - with promotion if available */}
                        {(() => {
                          // Determine the final price for this cart item
                          let finalPrice = Number(item.priceAtPurchase);
                          let showPromotion = false;

                          // If product has promotion and size-material pricing, calculate discounted price
                          if (item.product?.promotion && item.selectedMaterial && item.selectedSize && item.product?.sizeMaterialPricingWithPromotion?.[item.selectedSize]?.[item.selectedMaterial]) {
                            const pricingInfo = item.product.sizeMaterialPricingWithPromotion[item.selectedSize][item.selectedMaterial];
                            finalPrice = pricingInfo.finalPrice;
                            showPromotion = true;
                          }
                          // If product has promotion but no size-material pricing, apply base promotion
                          else if (item.product?.promotion && item.product?.pricing) {
                            finalPrice = item.product.pricing.finalPrice;
                            showPromotion = true;
                          }

                          const totalPrice = Number(finalPrice * item.quantity).toFixed(2);

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {showPromotion && (
                                <span style={{ fontSize: 12, color: "#999", textDecoration: "line-through" }}>
                                  {Number(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}DT
                                </span>
                              )}
                              <span style={{ fontSize: 16, fontWeight: 500, color: showPromotion ? "#c0392b" : "#1a1a1a" }}>
                                {totalPrice}DT
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Supprimer */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          marginTop: 14,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "none",
                          border: "none",
                          color: "#555",
                          cursor: "pointer",
                          fontSize: 13,
                          padding: 0,
                        }}
                      >
                        {/* Trash icon (inline SVG) */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Summary */}
          <div style={{
            background: "#fff",
            padding: "28px 28px",
            height: "fit-content",
            position: "sticky",
            top: 20,
          }}>
            {/* Title */}
            <h2 style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: 26,
              color: "#1a1a1a",
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: 0.5,
            }}>
              Récapitulatif
            </h2>

            {/* Articles & Livraison lines */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: "#1a1a1a" }}>
              <span>{articleCount} Article{articleCount > 1 ? "s" : ""}</span>
              <span>{totals?.subtotal ? `${Number(totals.subtotal).toFixed(2)}DT` : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 14, color: "#1a1a1a" }}>
              <span>Livraison</span>
              <span>{totals?.shipping === 0 ? "Gratuit" : `${Number(totals?.shipping).toFixed(2)}DT`}</span>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #e8e8e8", marginBottom: 20 }} />

            {/* Total */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: "#1a1a1a", marginBottom: 8 }}>
                TOTAL DE VOTRE COMMANDE
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: "#1a1a1a" }}>
                {totals?.grandTotal ? `${Number(totals.grandTotal).toFixed(2)}DT` : "—"}
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
                MÉTHODE DE PAIEMENT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", color: "#1a1a1a" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#1a1a1a" }}
                  />
                  Paiement en ligne
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", color: "#1a1a1a" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="on_delivery"
                    checked={paymentMethod === "on_delivery"}
                    onChange={() => setPaymentMethod("on_delivery")}
                    style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#1a1a1a" }}
                  />
                  Paiement à la livraison
                </label>
              </div>
            </div>

            {/* COMMANDER */}
            <button
              onClick={handleCheckout}
              disabled={isPlacingOrder}
              style={{
                width: "100%",
                padding: "14px",
                background: isPlacingOrder ? "#666" : "#1a1a1a",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                cursor: isPlacingOrder ? "not-allowed" : "pointer",
                marginBottom: 24,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { if (!isPlacingOrder) (e.target as HTMLElement).style.background = "#333"; }}
              onMouseLeave={(e) => { if (!isPlacingOrder) (e.target as HTMLElement).style.background = "#1a1a1a"; }}
            >
              {isPlacingOrder ? "TRAITEMENT..." : "COMMANDER"}
            </button>

            {/* Promo code collapsible */}
            {/* <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 16, marginBottom: 20 }}>
              <button
                onClick={() => setPromoOpen(!promoOpen)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                  color: "#1a1a1a",
                }}
              >
                <span>Ajouter un code (facultatif)</span>
                <span style={{ fontSize: 12, transition: "transform 0.2s", transform: promoOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
              </button>

            </div> */}

            {/* Payment icons */}
            <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {/* VISA */}
              <div style={{ width: 42, height: 27, border: "1px solid #ddd", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#1434CB", letterSpacing: -0.5 }}>VISA</span>
              </div>
              {/* Mastercard */}
              <div style={{ width: 42, height: 27, border: "1px solid #ddd", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>
                  <span style={{ color: "#EB001B", marginRight: -6, position: "relative" }}>●</span>
                  <span style={{ color: "#F79E1B" }}>●</span>
                </span>
              </div>
              {/* CB */}
              <div style={{ width: 42, height: 27, border: "1px solid #ddd", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "#1434CB" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>CB</span>
              </div>
              {/* Amex */}
              <div style={{ width: 42, height: 27, border: "1px solid #ddd", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "#016FD0" }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>AMEX</span>
              </div>
              {/* PayPal */}
              <div style={{ width: 42, height: 27, border: "1px solid #ddd", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#003087" }}>Pay<span style={{ color: "#009CDE" }}>Pal</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Address Modal ── */}
      {showAddressModal && (
        <div
          id="address-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).id === "address-modal-overlay") {
              setShowAddressModal(false);
            }
          }}
        >
          <div style={{
            background: "#fff",
            width: "100%",
            maxWidth: 480,
            padding: "36px 32px 28px",
            position: "relative",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowAddressModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#999",
                cursor: "pointer",
                lineHeight: 1,
                padding: 4,
              }}
              aria-label="Fermer"
            >
              ×
            </button>

            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#f5f5f5",
                marginBottom: 12,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3 style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 400,
                fontSize: 22,
                color: "#1a1a1a",
                margin: "0 0 6px",
              }}>
                Adresse de livraison requise
              </h3>
              <p style={{
                fontSize: 13,
                color: "#777",
                margin: 0,
                lineHeight: 1.5,
              }}>
                Veuillez ajouter votre adresse de livraison pour finaliser votre commande.
              </p>
            </div>

            {/* Address input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: "#7a7a7a",
                marginBottom: 8,
              }}>
                Adresse complète
              </label>
              <textarea
                id="address-input"
                value={addressInput}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  if (addressError) setAddressError("");
                }}
                placeholder="Numéro, rue, ville, code postal..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: addressError ? "1px solid #c0392b" : "1px solid #d8d8d8",
                  background: "#fafafa",
                  fontSize: 14,
                  color: "#1a1a1a",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  if (!addressError) e.currentTarget.style.borderColor = "#1a1a1a";
                }}
                onBlur={(e) => {
                  if (!addressError) e.currentTarget.style.borderColor = "#d8d8d8";
                }}
                autoFocus
              />
              {addressError && (
                <p style={{
                  fontSize: 12,
                  color: "#c0392b",
                  margin: "6px 0 0",
                }}>
                  {addressError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowAddressModal(false)}
                style={{
                  flex: 1,
                  padding: "13px 16px",
                  background: "#fff",
                  color: "#1a1a1a",
                  border: "1px solid #d8d8d8",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAddress}
                disabled={isSavingAddress}
                style={{
                  flex: 2,
                  padding: "13px 16px",
                  background: isSavingAddress ? "#666" : "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: isSavingAddress ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { if (!isSavingAddress) e.currentTarget.style.background = "#333"; }}
                onMouseLeave={(e) => { if (!isSavingAddress) e.currentTarget.style.background = "#1a1a1a"; }}
              >
                {isSavingAddress ? "Enregistrement..." : "Enregistrer et commander"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal - shown when user tries to checkout without being authenticated */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ── Phone Modal ── */}
      {showPhoneModal && (
        <div
          id="phone-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).id === "phone-modal-overlay") {
              setShowPhoneModal(false);
            }
          }}
        >
          <div style={{
            background: "#fff",
            width: "100%",
            maxWidth: 480,
            padding: "36px 32px 28px",
            position: "relative",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowPhoneModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#999",
                cursor: "pointer",
                lineHeight: 1,
                padding: 4,
              }}
              aria-label="Fermer"
            >
              ×
            </button>

            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#f5f5f5",
                marginBottom: 12,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h3 style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 400,
                fontSize: 22,
                color: "#1a1a1a",
                margin: "0 0 6px",
              }}>
                Numéro de téléphone requis
              </h3>
              <p style={{
                fontSize: 13,
                color: "#777",
                margin: 0,
                lineHeight: 1.5,
              }}>
                Veuillez ajouter votre numéro de téléphone pour finaliser votre commande.
              </p>
            </div>

            {/* Phone input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: "#7a7a7a",
                marginBottom: 8,
              }}>
                Numéro de téléphone
              </label>
              <input
                id="phone-input"
                type="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
                placeholder="+216 XX XXX XXX"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: phoneError ? "1px solid #c0392b" : "1px solid #d8d8d8",
                  background: "#fafafa",
                  fontSize: 14,
                  color: "#1a1a1a",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  if (!phoneError) e.currentTarget.style.borderColor = "#1a1a1a";
                }}
                onBlur={(e) => {
                  if (!phoneError) e.currentTarget.style.borderColor = "#d8d8d8";
                }}
                autoFocus
              />
              {phoneError && (
                <p style={{
                  fontSize: 12,
                  color: "#c0392b",
                  margin: "6px 0 0",
                }}>
                  {phoneError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowPhoneModal(false)}
                style={{
                  flex: 1,
                  padding: "13px 16px",
                  background: "#fff",
                  color: "#1a1a1a",
                  border: "1px solid #d8d8d8",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                Annuler
              </button>
              <button
                onClick={handleSavePhone}
                disabled={isSavingPhone}
                style={{
                  flex: 2,
                  padding: "13px 16px",
                  background: isSavingPhone ? "#666" : "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: isSavingPhone ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { if (!isSavingPhone) e.currentTarget.style.background = "#333"; }}
                onMouseLeave={(e) => { if (!isSavingPhone) e.currentTarget.style.background = "#1a1a1a"; }}
              >
                {isSavingPhone ? "Enregistrement..." : "Enregistrer et commander"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          background: toastType === 'error' ? '#ef4444' : '#fff',
          color: toastType === 'error' ? '#fff' : '#1a1a1a',
          padding: '16px 20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          borderLeft: toastType === 'error' ? 'none' : '3px solid #1a1a1a',
          minWidth: 280,
          maxWidth: 400,
        }}>
          {toastType === 'success' && (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
              {toastType === 'error' ? 'Erreur' : 'Succès'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: toastType === 'error' ? 'rgba(255,255,255,0.85)' : '#666' }}>
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}