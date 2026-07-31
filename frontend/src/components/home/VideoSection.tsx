import { useState, useRef } from "react";
import { FadeUp } from "../ui/Animate";

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClick = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <section className="video-section">
      <div className="video-inner">
        {/* Header */}
        <FadeUp className="video-header">
          <p className="video-eyebrow">L'univers Kort</p>
          <h2 className="video-title">Créer votre havre de paix</h2>
          <div className="video-divider">
            <span className="video-divider-dot" />
            <span className="video-divider-dot" />
            <span className="video-divider-dot" />
          </div>
        </FadeUp>

        {/* Video Wrapper — taille fixe, poster et vidéo superposés */}
        {/* Video Wrapper — plain div, taille fixe garantie par inline styles */}
        <FadeUp>
          <div style={{
            position: "relative",
            width: "100%",
            paddingBottom: "56.25%", /* 16/9 ratio */
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            backgroundColor: "#000",
          }}>

            {/* POSTER */}
            <div
              onClick={handlePlayClick}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                cursor: "pointer",
                opacity: isPlaying ? 0 : 1,
                pointerEvents: isPlaying ? "none" : "auto",
                transition: "opacity 0.4s ease",
              }}
            >
              <img
                src="/videos/poster.png"
                alt="Kort Interiors Video Poster"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(14,12,10,0.28)",
              }} />
              <button className="video-play-btn" aria-label="Lire la vidéo">
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                  <path d="M4 3.25926V24.7407C4 26.312 5.73359 27.2719 7.06667 26.4388L24.252 15.6981C25.4952 14.921 25.4952 13.079 24.252 12.3019L7.06667 1.56121C5.73359 0.728087 4 1.68798 4 3.25926Z" fill="currentColor"/>
                </svg>
              </button>
            </div>

            {/* VIDEO */}
            <div style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              opacity: isPlaying ? 1 : 0,
              pointerEvents: isPlaying ? "auto" : "none",
              transition: "opacity 0.4s ease",
            }}>
              <video
                ref={videoRef}
                src="/videos/reel_3.mp4"
                controls
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

          </div>
        </FadeUp>
      </div>

      <style jsx>{`
        .video-section {
          background-color: #fcfbf7;
          padding: 100px 40px 110px;
        }

        .video-inner {
          max-width: 960px;
          margin: 0 auto;
        }

        .video-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .video-eyebrow {
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: #c9a96e;
          margin: 0 0 16px;
        }

        .video-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 300;
          color: #0e0c0a;
          margin: 0 0 20px;
          letter-spacing: -0.5px;
        }

        .video-divider {
          display: flex;
          justify-content: center;
          gap: 6px;
          align-items: center;
          margin-top: 12px;
        }

        .video-divider-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #c9a96e;
          opacity: 0.6;
        }

        .video-divider-dot:nth-child(2) {
          width: 6px;
          height: 6px;
          opacity: 1;
        }

        /* Conteneur à taille FIXE — ne change jamais */
        .video-container {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* ratio 16/9 */
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          background-color: #000;
        }

        /* Poster et player occupent EXACTEMENT la même zone */
        .video-poster-wrapper,
        .video-player-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transition: opacity 0.4s ease;
        }

        .video-poster-wrapper {
          cursor: pointer;
        }

        .video-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .video-poster-wrapper:hover .video-poster {
          transform: scale(1.03);
        }

        .video-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(14, 12, 10, 0.25);
          transition: background-color 0.3s ease;
        }

        .video-poster-wrapper:hover .video-overlay {
          background-color: rgba(14, 12, 10, 0.35);
        }

        .video-play-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #c9a96e;
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(201, 169, 110, 0.4);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .video-play-btn svg {
          margin-left: 4px;
          transition: transform 0.3s ease;
        }

        .video-poster-wrapper:hover .video-play-btn {
          background-color: #fff;
          color: #c9a96e;
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .video-section {
            padding: 70px 24px 80px;
          }
          .video-play-btn {
            width: 60px;
            height: 60px;
          }
          .video-play-btn svg {
            width: 18px;
            height: 22px;
          }
        }
      `}</style>
    </section>
  );
}
