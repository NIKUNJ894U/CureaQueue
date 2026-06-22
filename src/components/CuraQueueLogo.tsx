/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

// Simple global listener model to share active logo variant across all instances
let globalLogoVariant = Number(localStorage.getItem('curaqueue_logo_variant') || '1');
const listeners = new Set<() => void>();

export function getGlobalLogoVariant(): number {
  return globalLogoVariant;
}

export function setGlobalLogoVariant(variant: number) {
  globalLogoVariant = variant;
  localStorage.setItem('curaqueue_logo_variant', String(variant));
  listeners.forEach(listener => listener());
}

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: number; // Optional prop override
}

export default function CuraQueueLogo({ className = '', size = 48, variant: propVariant }: LogoProps) {
  const [activeVariant, setActiveVariant] = useState(globalLogoVariant);
  const [rasterUrl, setRasterUrl] = useState<string | null>(null);

  useEffect(() => {
    if (propVariant !== undefined) return;
    const handleUpdate = () => {
      setActiveVariant(globalLogoVariant);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [propVariant]);

  const currentVariant = propVariant !== undefined ? propVariant : activeVariant;

  // Let's define the gradients and colors for all 5 variations
  const config = {
    1: {
      id: "sky-classic",
      crossGradient: { start: "#0a2540", end: "#133d7c" },
      arrowGradient: { start: "#0f9f90", end: "#1cbba5" },
      tag: "Sky Classic",
      desc: "Original trust blue & healthcare teal contrast"
    },
    2: {
      id: "indigo-ocean",
      crossGradient: { start: "#172554", end: "#1e3a8a" },
      arrowGradient: { start: "#0284c7", end: "#38bdf8" },
      tag: "Indigo Ocean",
      desc: "Energetic hospital brand with bright sky aesthetics"
    },
    3: {
      id: "emerald-botanical",
      crossGradient: { start: "#022c22", end: "#065f46" },
      arrowGradient: { start: "#059669", end: "#34d399" },
      tag: "Emerald Botanical",
      desc: "Calming wellness green with clinical mint flow"
    },
    4: {
      id: "slate-digital",
      crossGradient: { start: "#0f172a", end: "#334155" },
      arrowGradient: { start: "#0891b2", end: "#22d3ee" },
      tag: "Slate Digital",
      desc: "Modern minimal software dashboard look"
    },
    5: {
      id: "regal-coral",
      crossGradient: { start: "#3b0764", end: "#581c87" },
      arrowGradient: { start: "#e11d48", end: "#fda4af" },
      tag: "Regal Coral",
      desc: "Vibrant plum clinic aesthetic with warm active coral"
    }
  } as const;

  const selected = config[currentVariant as keyof typeof config] || config[1];
  useEffect(() => {
    let mounted = true;
    // Check if a raster logo was placed at /brand-logo.png (public/) which Vite serves at root
    fetch('/brand-logo.png', { method: 'HEAD' })
      .then(res => {
        if (mounted && res.ok) setRasterUrl('/brand-logo.png');
      })
      .catch(() => {
        // ignore errors — we'll fall back to SVG
      });
    return () => { mounted = false; };
  }, []);

  // If a raster logo exists in the public assets folder, prefer it (keeps pixel-perfect branding)
  if (rasterUrl) {
    const dimStyle: React.CSSProperties = typeof size === 'number' ? { width: size, height: size } : { width: size, height: size };
    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img src={rasterUrl} className={className} style={dimStyle} alt="CuraQueue logo" />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Dynamic Gradients for the Medical Cross */}
        <linearGradient id={`cross-grad-${selected.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={selected.crossGradient.start} />
          <stop offset="100%" stopColor={selected.crossGradient.end} />
        </linearGradient>

        {/* Dynamic Gradients for the Curving Arrow Swosh */}
        <linearGradient id={`arrow-grad-${selected.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={selected.arrowGradient.start} />
          <stop offset="100%" stopColor={selected.arrowGradient.end} />
        </linearGradient>
      </defs>

      {/* 1. Medical Cross Container */}
      <path
        d="M 180 121
           A 76 76 0 0 1 332 121
           L 332 140
           A 40 40 0 0 0 372 180
           L 391 180
           A 76 76 0 0 1 391 332
           L 372 332
           A 40 40 0 0 0 332 372
           L 332 391
           A 76 76 0 0 1 180 391
           L 180 372
           A 40 40 0 0 0 140 332
           L 121 332
           A 76 76 0 0 1 121 180
           L 140 180
           A 40 40 0 0 0 180 140
           Z"
        fill={`url(#cross-grad-${selected.id})`}
      />

      {/* 2. Pure White Human Profile Silhouette - High Fidelity contour */}
      <path
        d="M 205 370 
           C 205 320, 215 285, 238 275 
           C 225 264, 218 245, 218 223 
           C 218 181, 248 147, 285 147 
           C 310 147, 332 165, 338 190
           C 340 198, 342 208, 340 216
           C 334 228, 324 235, 318 242 
           C 310 250, 305 258, 302 268
           C 298 280, 298 295, 298 312
           C 298 335, 285 365, 260 375
           Z"
        fill="#ffffff"
      />

      {/* 3. Upward Trending Curved Arrow Swosh */}
      <path
        d="M 245 378
           C 243 330, 275 280, 325 220 
           C 365 170, 400 130, 435 95 
           L 392 85 
           L 472 80 
           L 467 160 
           L 435 130 
           C 395 165, 360 210, 315 265 
           C 275 315, 252 355, 248 378 
           Z"
        fill={`url(#arrow-grad-${selected.id})`}
      />
    </svg>
  );
}
