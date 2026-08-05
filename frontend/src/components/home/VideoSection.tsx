import { useState, useRef, useEffect } from "react";
import { FadeUp } from "../ui/Animate";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6002/api/v1";
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "http://localhost:6002";

interface VideoSettings {
  eyebrow: string;
  title: string;
  poster: string;
  video: string;
}

const DEFAULT: VideoSettings = {
  eyebrow: "L'univers Kort",
  title: "Créer votre havre de paix",
  poster: "/videos/poster.png",
  video: "/videos/reel_3.mp4",
};

export default function VideoSection() {
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resolveUrl = (pathStr: string) => {
    if (!pathStr) return "";
    if (pathStr.startsWith("http")) return pathStr;
    if (pathStr.startsWith("/public/")) return `${IMAGE_BASE}${pathStr}`;
    return pathStr;
  };

  useEffect(() => {
    fetch(`${API_BASE}/video-section`)
      .then((r) => r.json())
      .then((data: VideoSettings) => {
        if (data?.video) setSettings(data);
      })
      .catch(() => {
        // Keep defaults silently
      });
  }, []);

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 50);
  };

  return (
    <section className="video-section">
      <div className="video-inner">

        {/* Header */}
        <FadeUp className="video-header">
          <p className="video-eyebrow">{settings.eyebrow}</p>
          <h2 className="video-title">{settings.title}</h2>
          <div className="video-divider">
            <span className="video-divider-dot" />
            <span className="video-divider-dot" />
            <span className="video-divider-dot" />
          </div>
        </FadeUp>

        {/* Player */}
        <FadeUp>
          <div className="video-container">

            {/* POSTER (shown before play) */}
            {!isPlaying && (
              <div className="video-poster" onClick={handlePlay}>
                <img
                  src={resolveUrl(settings.poster)}
                  alt="Kort Interiors"
                  className="video-poster-img"
                />
                <div className="video-overlay" />
                <button className="video-play-btn" aria-label="Lire la vidéo">
                  <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
                    <path d="M4 3.26V24.74C4 26.31 5.73 27.27 7.07 26.44L24.25 15.7C25.5 14.92 25.5 13.08 24.25 12.3L7.07 1.56C5.73 0.73 4 1.69 4 3.26Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            )}

            {/* VIDEO (shown after play) */}
            {isPlaying && (
              <video
                ref={videoRef}
                src={resolveUrl(settings.video)}
                poster={resolveUrl(settings.poster)}
                controls
                autoPlay
                className="video-player"
              />
            )}

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
        .video-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          background-color: #000;
        }
        .video-poster {
          position: absolute;
          inset: 0;
          cursor: pointer;
        }
        .video-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .video-overlay {
          position: absolute;
          inset: 0;
          background: rgba(14, 12, 10, 0.25);
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
          transition: all 0.3s ease;
        }
        .video-play-btn svg {
          margin-left: 4px;
        }
        .video-poster:hover .video-play-btn {
          background-color: #fff;
          color: #c9a96e;
          transform: translate(-50%, -50%) scale(1.1);
        }
        .video-player {
          position: absolute;
          inset: 0;
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
        }
      `}</style>
    </section>
  );
}
