import { useEffect, useMemo, useRef, useState } from "react";
import { RiAlibabaCloudLine } from "react-icons/ri";
import { LOGOS } from "./logos.ts";
import "./App.css";

/* ============================================================
   CONFIG - edit these values to make the badge your own!
   ============================================================ */
const CONFIG = {
  // 2–4 hex colors. The background will drift smoothly between them.
  // Visit https://coolors.co/palettes/trending for colors!
  // Colors must start with #
  gradientColors: ["#4F46E5", "#8B5CF6", "#06B6D4"],

  name: "Your Name",

  funFact: "I own 7 cats.",

  isOnCloud: false,

  // Lets students flip the card and take a photo with their front camera.
  // Turn off if the device/browser running this has no camera, or you'd
  // rather ship the badge without it.
  enablePhotoBooth: true,

  favorite: {
    // one of: "movie" | "game" | "tv show" | "anime"
    category: "movie",
    title: "Interstellar",
    // swap in a real poster image URL (or a local file like ./posters/mine.jpg)
    // Go to Google -> Search Movie title -> Right click poster, then
    // choose "Copy Image Location" or "Copy Image URL" -> Paste it in here!
    posterUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeX3l7pPix7HgNUcwpFG2Ws3omIqA9URTCWVh6ia-XD4_2yollk1RkIgP2XWYTycl6eSkC6pAnpOxrU2rMZoptSDnvPFcAzKDLsfSVLd0&s=10",
  },
};

const SCCC_URL = "https://sccc.sa";

const SPONSORS = [
  {
    eyebrow: "Hosted by",
    name: "Majal Initiative",
    src: LOGOS.majal,
    url: "https://www.linkedin.com/company/majal-initiative",
  },
  {
    eyebrow: "Sponsored by",
    name: "Saudi AZM",
    src: LOGOS.azm,
    url: "https://azm.com",
  },
  {
    eyebrow: "Cloud partner",
    name: "SCCC by STC",
    src: LOGOS.sccc,
    url: SCCC_URL,
  },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SponsorLogo({
  eyebrow,
  name,
  src,
  url,
}: {
  eyebrow: string;
  name: string;
  src: string;
  url: string;
}) {
  return (
    <div className="sponsor-slot">
      <span className="eyebrow">{eyebrow}</span>
      <a
        className="logo-chip"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={src} alt={name} />
      </a>
    </div>
  );
}

function AuroraBackground({ colors }: { colors: string[] }) {
  const gradient = useMemo(
    () => `linear-gradient(120deg, ${colors.join(", ")})`,
    [colors],
  );
  return <div className="aurora-bg" style={{ backgroundImage: gradient }} />;
}

function BadgeFront({
  config,
  showCameraHint = false,
}: {
  config: {
    name: string;
    funFact: string;
    favorite: { posterUrl: string; title: string; category: string };
  };
  showCameraHint?: boolean;
}) {
  const { name, funFact, favorite } = config;
  return (
    <div className="badge">
      <div className="sheen" />
      <div className="punch-hole" />
      <div className="badge-eyebrow">Cloud Explorer</div>

      <div className="avatar">{initialsOf(name)}</div>
      <h2 className="badge-name">{name}</h2>
      <p className="badge-role">Majal x AZM &middot; Cloud Computing Week</p>

      <div className="fun-fact">
        <span className="label">Fun fact</span>
        {funFact}
      </div>

      <div className="favorite-section">
        <div className="poster-frame">
          <img src={favorite.posterUrl} alt={favorite.title} />
        </div>
        <div className="favorite-text">
          <p className="label">My favorite {favorite.category} is...</p>
          <p className="title">{favorite.title}</p>
        </div>
      </div>

      <div className="stamp">
        I'm learning about Cloud Computing <br />
        on{" "}
        <a
          className="alibaba-link"
          href={SCCC_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <RiAlibabaCloudLine className="alibaba-icon" /> Alibaba Cloud
        </a>
      </div>

      {showCameraHint && (
        <p className="camera-hint">📸 Tap the card for a photo booth!</p>
      )}
    </div>
  );
}

function slugify(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "photo"
  );
}

const SHOT_COUNT = 3;
// A gentle desaturation - mostly monochrome but not a stark black & white.
const MONO_FILTER = "grayscale(0.82) contrast(1.08) brightness(1.02)";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draws text rotated a touch off-axis, like it was stamped or scrawled
// by hand onto the strip rather than perfectly typeset.
function drawStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  angleDeg: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// A cheap simulation of the wear a real photobooth strip picks up: dust,
// scratches, a stray light leak, and a soft vignette. Randomized per print
// so retakes don't all look identical.
function applyVintageDamage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.save();

  const vignette = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  const leakX = Math.random() < 0.5 ? 0 : w;
  const leakY = h * (0.1 + Math.random() * 0.8);
  const leak = ctx.createRadialGradient(leakX, leakY, 0, leakX, leakY, w * 0.6);
  leak.addColorStop(0, "rgba(255,185,105,0.24)");
  leak.addColorStop(1, "rgba(255,185,105,0)");
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  const scratchCount = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < scratchCount; i++) {
    const x = Math.random() * w;
    const startY = Math.random() * h * 0.3;
    const len = h * (0.25 + Math.random() * 0.5);
    const drift = (Math.random() - 0.5) * 14;
    ctx.lineWidth = 0.6 + Math.random() * 1.1;
    ctx.globalAlpha = 0.12 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x + drift, startY + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const speckCount = Math.round((w * h) / 5500);
  for (let i = 0; i < speckCount; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.3 + 0.2;
    const light = Math.random() < 0.5;
    ctx.fillStyle = light
      ? `rgba(255,255,255,${0.15 + Math.random() * 0.25})`
      : `rgba(20,18,14,${0.1 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

async function composeStrip(shotUrls: string[]): Promise<string> {
  const images = await Promise.all(shotUrls.map(loadImage));
  const shotW = images[0].width;
  const shotH = images[0].height;
  const padding = Math.round(shotW * 0.05);
  const gap = Math.round(shotW * 0.04);
  const headerH = Math.round(shotW * 0.12);
  const footerH = Math.round(shotW * 0.16);
  const stripW = shotW + padding * 2;
  const stripH =
    padding * 2 +
    headerH +
    shotH * images.length +
    gap * (images.length - 1) +
    footerH;

  const canvas = document.createElement("canvas");
  canvas.width = stripW;
  canvas.height = stripH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return images[0].src;

  // Make sure the hand-written font is actually loaded before drawing -
  // canvas text silently falls back otherwise. Ephesis is a thin script,
  // so it needs a bigger point size than a bold marker font would.
  const dateFont = `${Math.round(headerH * 0.6)}px "Ephesis", cursive`;
  const captionFont = `${Math.round(footerH * 0.5)}px "Ephesis", cursive`;
  await Promise.all([
    document.fonts.load(dateFont),
    document.fonts.load(captionFont),
  ]);

  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(0, 0, stripW, stripH);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  ctx.fillStyle = "#3a352c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = dateFont;
  drawStamp(ctx, dateLabel, stripW / 2, padding + headerH / 2, -2);

  images.forEach((img, i) => {
    const y = padding + headerH + i * (shotH + gap);
    ctx.drawImage(img, padding, y, shotW, shotH);
  });

  ctx.fillStyle = "#2a2620";
  ctx.font = captionFont;
  drawStamp(
    ctx,
    "☁️ Cloud Explorer Photo Booth",
    stripW / 2,
    stripH - footerH / 2,
    -1.5,
  );

  applyVintageDamage(ctx, stripW, stripH);

  return canvas.toDataURL("image/png");
}

function CameraBack({ name, onClose }: { name: string; onClose: () => void }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [stripPhoto, setStripPhoto] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // This component only mounts while the card is flipped to its camera
  // side, so start the front camera on mount and release it on unmount -
  // the stream never needs to leave the device.
  useEffect(() => {
    let cancelled = false;
    let localStream: MediaStream | null = null;

    Promise.resolve()
      .then(() => {
        if (!navigator.mediaDevices?.getUserMedia) {
          return Promise.reject(
            new DOMException("Camera unsupported", "NotSupportedError"),
          );
        }
        return navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = s;
        setStream(s);
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        setCameraError(
          err.name === "NotSupportedError"
            ? "Camera access isn't available here. It needs a secure context (HTTPS or localhost) and a browser that supports it."
            : err.name === "NotAllowedError"
              ? "Camera access was denied. Allow the camera permission for this page and try again."
              : "Couldn't reach a front camera on this device.",
        );
      });

    return () => {
      cancelled = true;
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Once all shots are in, compose the vintage strip.
  useEffect(() => {
    if (shots.length !== SHOT_COUNT) return;
    let cancelled = false;
    composeStrip(shots).then((strip) => {
      if (!cancelled) setStripPhoto(strip);
    });
    return () => {
      cancelled = true;
    };
  }, [shots]);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady || shots.length >= SHOT_COUNT) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // The raw front-camera frame comes in mirrored (that's why the CSS
    // mirror on the live preview looks "normal"). Un-mirror it here so
    // the saved shot isn't flipped - text in the background reads
    // correctly, matching how the world actually looks.
    ctx.filter = MONO_FILTER;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.filter = "none";
    setShots((prev) => [...prev, canvas.toDataURL("image/png")]);
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
  }

  function handleRetake() {
    setShots([]);
    setStripPhoto(null);
  }

  function handleSaveStrip() {
    if (!stripPhoto) return;
    const link = document.createElement("a");
    link.href = stripPhoto;
    link.download = `${slugify(name)}-photobooth-strip-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="badge camera-card">
      <div className="punch-hole" />
      <button
        type="button"
        className="close-btn"
        aria-label="Close photo booth"
        onClick={onClose}
      >
        ✕
      </button>

      <div className="badge-eyebrow">Photo Booth</div>

      {/* The live <video> stays mounted for as long as the booth is active,
          so its srcObject survives across capture / retake - only its
          visibility toggles. Re-mounting it would drop the camera feed. */}
      <div
        className="camera-viewport"
        style={{ display: stripPhoto ? "none" : "flex" }}
      >
        {flash && <div className="flash-overlay" />}

        {cameraError && <p className="camera-message">{cameraError}</p>}

        {!cameraError && !cameraReady && (
          <p className="camera-message">Starting camera…</p>
        )}

        <video
          ref={videoRef}
          className="camera-video"
          style={{
            filter: MONO_FILTER,
            display: !cameraError && cameraReady ? "block" : "none",
          }}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setCameraReady(true)}
        />

        {!cameraError && cameraReady && (
          <div className="shot-dots">
            {Array.from({ length: SHOT_COUNT }).map((_, i) => (
              <span
                key={i}
                className={`shot-dot${i < shots.length ? " filled" : ""}`}
              />
            ))}
          </div>
        )}
      </div>

      {stripPhoto && (
        <div className="strip-preview">
          <img
            className="strip-img"
            src={stripPhoto}
            alt="Photo booth strip of 3 shots"
          />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="camera-controls">
        {!stripPhoto && !cameraError && (
          <button
            type="button"
            className="shutter-btn"
            disabled={!cameraReady}
            onClick={handleCapture}
            aria-label="Take photo"
          />
        )}
        {stripPhoto && (
          <>
            <button type="button" className="ghost-btn" onClick={handleRetake}>
              Retake
            </button>
            <button
              type="button"
              className="solid-btn"
              onClick={handleSaveStrip}
            >
              Save strip
            </button>
          </>
        )}
      </div>

      <p className="camera-footnote">
        {stripPhoto
          ? "Nothing leaves this device - the strip only saves to your downloads."
          : `Shot ${Math.min(shots.length + 1, SHOT_COUNT)} of ${SHOT_COUNT} - smile!`}
      </p>
    </div>
  );
}

function FlipBadge({
  config,
  enablePhotoBooth,
}: {
  config: {
    name: string;
    funFact: string;
    favorite: { posterUrl: string; title: string; category: string };
  };
  enablePhotoBooth: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  if (!enablePhotoBooth) {
    return (
      <div className="flip-card">
        <BadgeFront config={config} />
      </div>
    );
  }

  return (
    <div className={`flip-card${flipped ? " flipped" : ""}`}>
      <div className="flip-card-inner">
        <div
          className="flip-card-front"
          role="button"
          tabIndex={0}
          aria-label="Open photo booth"
          onClick={() => setFlipped(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped(true);
            }
          }}
        >
          <BadgeFront config={config} showCameraHint />
        </div>
        <div className="flip-card-back">
          {flipped && (
            <CameraBack name={config.name} onClose={() => setFlipped(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AuroraBackground colors={CONFIG.gradientColors} />

      <div className="sponsor-bar">
        {SPONSORS.map((s) => (
          <SponsorLogo key={s.name} {...s} />
        ))}
      </div>

      <div className="page-heading">
        <h1>My Cloud Explorer Badge</h1>
        <p>
          Deployed by me, running on{" "}
          {CONFIG.isOnCloud ? "Alibaba Cloud! ☁️" : "My Laptop!  💻"}.
        </p>
      </div>

      <div className="badge-wrap">
        <FlipBadge config={CONFIG} enablePhotoBooth={CONFIG.enablePhotoBooth} />
      </div>

      {/* <div className="footnote">
        Want to make this yours? Edit the <code>CONFIG</code> object in{" "}
        <code>app.jsx</code> and rebuild.
      </div> */}
    </>
  );
}
