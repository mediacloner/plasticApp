import React from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G, Rect, Text as SvgText, Ellipse, Line } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

/**
 * App logo matching the plasticApp icon: green background, plastic items
 * (PET bottle, HDPE bottle, PP container), camera lens, leaf, and recycling symbols.
 */
export default function Logo({ size = 120 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        {/* Green background gradient */}
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#66BB6A" />
          <Stop offset="100%" stopColor="#2E7D32" />
        </LinearGradient>
        {/* Inner circle lighter green */}
        <LinearGradient id="innerGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#81C784" />
          <Stop offset="50%" stopColor="#4CAF50" />
          <Stop offset="100%" stopColor="#388E3C" />
        </LinearGradient>
        {/* PET bottle gradient: clear/light blue */}
        <LinearGradient id="petGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#BBDEFB" />
          <Stop offset="100%" stopColor="#64B5F6" />
        </LinearGradient>
        {/* HDPE bottle gradient: blue */}
        <LinearGradient id="hdpeGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#42A5F5" />
          <Stop offset="100%" stopColor="#1565C0" />
        </LinearGradient>
        {/* PP container gradient: green */}
        <LinearGradient id="ppGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#66BB6A" />
          <Stop offset="100%" stopColor="#2E7D32" />
        </LinearGradient>
        {/* Camera lens gradient */}
        <LinearGradient id="lensGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#546E7A" />
          <Stop offset="100%" stopColor="#263238" />
        </LinearGradient>
        {/* Leaf gradient */}
        <LinearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#81C784" />
          <Stop offset="100%" stopColor="#388E3C" />
        </LinearGradient>
      </Defs>

      {/* Rounded square background */}
      <Rect x="2" y="2" width="116" height="116" rx="26" ry="26" fill="url(#bgGrad)" />

      {/* Inner circle */}
      <Circle cx="60" cy="62" r="42" fill="url(#innerGrad)" opacity="0.5" />

      {/* === PET Water Bottle (left) === */}
      <G>
        {/* Cap */}
        <Rect x="28" y="28" width="10" height="6" rx="2" fill="#455A64" />
        {/* Neck */}
        <Rect x="30" y="34" width="6" height="6" rx="1" fill="url(#petGrad)" />
        {/* Body */}
        <Path
          d="M28 40 L28 80 C28 83, 30 85, 33 85 L33 85 C36 85, 38 83, 38 80 L38 40 C38 38, 36 37, 33 37 L33 37 C30 37, 28 38, 28 40Z"
          fill="url(#petGrad)"
          opacity="0.9"
        />
        {/* Highlight */}
        <Path d="M30 44 L30 72" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Ridges */}
        <Line x1="28" y1="50" x2="38" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        <Line x1="28" y1="68" x2="38" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        {/* Recycle symbol "1" */}
        <SvgText x="33" y="63" fontSize="6" fontWeight="700" fill="#1565C0" textAnchor="middle">1</SvgText>
      </G>

      {/* === HDPE Bottle (center-back, taller) === */}
      <G>
        {/* Cap */}
        <Rect x="44" y="24" width="14" height="5" rx="2" fill="#1565C0" />
        {/* Neck */}
        <Path
          d="M48 29 L48 35 C46 37, 44 40, 44 42 L44 72 C44 76, 47 78, 51 78 L51 78 C55 78, 58 76, 58 72 L58 42 C58 40, 56 37, 54 35 L54 29Z"
          fill="url(#hdpeGrad)"
        />
        {/* Highlight */}
        <Path d="M47 38 L47 70" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Recycle symbol "2" */}
        <SvgText x="51" y="60" fontSize="6" fontWeight="700" fill="#FFF" textAnchor="middle">2</SvgText>
        <SvgText x="51" y="67" fontSize="4" fontWeight="600" fill="rgba(255,255,255,0.8)" textAnchor="middle">HDPE</SvgText>
      </G>

      {/* === Camera Lens (right) === */}
      <G>
        {/* Outer ring */}
        <Circle cx="78" cy="52" r="18" fill="#37474F" />
        <Circle cx="78" cy="52" r="16" fill="#455A64" />
        {/* Middle ring */}
        <Circle cx="78" cy="52" r="12" fill="#37474F" />
        {/* Inner lens */}
        <Circle cx="78" cy="52" r="8" fill="url(#lensGrad)" />
        <Circle cx="78" cy="52" r="5" fill="#1A237E" opacity="0.6" />
        {/* Lens highlight */}
        <Circle cx="75" cy="49" r="2.5" fill="rgba(255,255,255,0.35)" />
        {/* Lens ring highlights */}
        <Circle cx="78" cy="52" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      </G>

      {/* === PP Container (front-right) === */}
      <G>
        {/* Container body */}
        <Path
          d="M56 76 L56 88 C56 91, 58 93, 62 93 L80 93 C84 93, 86 91, 86 88 L86 76 C86 74, 84 73, 80 73 L62 73 C58 73, 56 74, 56 76Z"
          fill="url(#ppGrad)"
        />
        {/* Rim */}
        <Path
          d="M54 74 L88 74 C88 72, 86 71, 82 71 L60 71 C56 71, 54 72, 54 74Z"
          fill="#43A047"
        />
        {/* Highlight */}
        <Line x1="59" y1="77" x2="59" y2="89" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
        {/* Recycle symbol "5" */}
        <SvgText x="71" y="86" fontSize="6" fontWeight="700" fill="#FFF" textAnchor="middle">5</SvgText>
        <SvgText x="71" y="91" fontSize="3.5" fontWeight="600" fill="rgba(255,255,255,0.8)" textAnchor="middle">PP</SvgText>
      </G>

      {/* === Leaf (top-right) === */}
      <G>
        <Path
          d="M82 22 C88 18, 96 20, 98 26 C96 30, 88 32, 82 28 C80 26, 80 24, 82 22Z"
          fill="url(#leafGrad)"
        />
        {/* Leaf vein */}
        <Path
          d="M84 25 C88 24, 94 24, 96 25"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </G>

      {/* === Sparkle/scan effects === */}
      <Circle cx="42" cy="45" r="1.2" fill="#FFF" opacity="0.7" />
      <Circle cx="64" cy="38" r="1" fill="#FFF" opacity="0.6" />
      <Circle cx="36" cy="70" r="0.8" fill="#FFF" opacity="0.5" />
      <Circle cx="68" cy="76" r="1" fill="#FFF" opacity="0.6" />

      {/* Scan line across items */}
      <Line
        x1="24" y1="58" x2="96" y2="58"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
    </Svg>
  );
}
