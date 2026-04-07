import React from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G, Rect, Line } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

/**
 * App logo: stylized apple with a scan/AI reticle overlay.
 * Rendered as pure SVG — no raster assets needed.
 */
export default function Logo({ size = 120 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        {/* Apple gradient: rich red to deep crimson */}
        <LinearGradient id="appleGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FF6B6B" />
          <Stop offset="100%" stopColor="#C0392B" />
        </LinearGradient>
        {/* Leaf gradient */}
        <LinearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6BCB77" />
          <Stop offset="100%" stopColor="#27AE60" />
        </LinearGradient>
        {/* Scan ring gradient */}
        <LinearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#007AFF" />
          <Stop offset="100%" stopColor="#34C759" />
        </LinearGradient>
        {/* Background glow */}
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#1A1A2E" />
          <Stop offset="100%" stopColor="#16213E" />
        </LinearGradient>
      </Defs>

      {/* Background circle */}
      <Circle cx="60" cy="60" r="58" fill="url(#bgGrad)" />
      <Circle cx="60" cy="60" r="58" fill="none" stroke="url(#scanGrad)" strokeWidth="2" opacity="0.5" />

      {/* Apple body */}
      <Path
        d="M60 95 C38 95, 25 78, 25 62 C25 46, 35 35, 45 32 C50 30, 55 32, 60 35 C65 32, 70 30, 75 32 C85 35, 95 46, 95 62 C95 78, 82 95, 60 95Z"
        fill="url(#appleGrad)"
      />
      {/* Apple highlight */}
      <Path
        d="M42 50 C42 42, 50 38, 55 42"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Stem */}
      <Path
        d="M60 35 C60 28, 58 22, 60 18"
        fill="none"
        stroke="#8B5E3C"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Leaf */}
      <Path
        d="M60 24 C66 18, 78 18, 80 22 C78 26, 66 28, 60 24Z"
        fill="url(#leafGrad)"
      />

      {/* Scan reticle — thin corners around apple */}
      <G stroke="url(#scanGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
        {/* Top-left corner */}
        <Line x1="22" y1="30" x2="22" y2="42" />
        <Line x1="22" y1="30" x2="34" y2="30" />
        {/* Top-right corner */}
        <Line x1="98" y1="30" x2="98" y2="42" />
        <Line x1="98" y1="30" x2="86" y2="30" />
        {/* Bottom-left corner */}
        <Line x1="22" y1="98" x2="22" y2="86" />
        <Line x1="22" y1="98" x2="34" y2="98" />
        {/* Bottom-right corner */}
        <Line x1="98" y1="98" x2="98" y2="86" />
        <Line x1="98" y1="98" x2="86" y2="98" />
      </G>

      {/* Scan line across apple */}
      <Line
        x1="30" y1="64" x2="90" y2="64"
        stroke="url(#scanGrad)"
        strokeWidth="1.5"
        opacity="0.6"
        strokeDasharray="4 3"
      />

      {/* Small AI sparkle dots */}
      <Circle cx="36" cy="64" r="2" fill="#34C759" opacity="0.8" />
      <Circle cx="84" cy="64" r="2" fill="#007AFF" opacity="0.8" />
    </Svg>
  );
}
