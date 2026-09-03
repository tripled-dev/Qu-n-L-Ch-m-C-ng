import React from 'react';

/**
 * High-fidelity Vector Signatures matching the document
 */
export const FinanceSignatureSvg: React.FC<{ className?: string }> = ({ className = 'w-48 h-20' }) => (
  <svg
    viewBox="0 0 280 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`stroke-[#1e3a8a] text-[#1e3a8a] ${className}`}
    style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
  >
    {/* Stylized authentic cursive signature */}
    {/* Cursive initial loop and flourish */}
    <path
      d="M50 24 C42 42, 38 68, 42 86 C44 91, 52 91, 55 86 C66 62, 92 18, 114 20 C125 21, 122 36, 108 42"
      stroke="currentColor"
      strokeWidth="2.8"
    />
    {/* Flowing cursive connections */}
    <path
      d="M108 42 C116 52, 128 64, 138 56 C144 50, 150 42, 156 54 C162 66, 172 74, 180 54 C186 44, 194 48, 198 60"
      stroke="currentColor"
      strokeWidth="2.4"
    />
    {/* Descending loop */}
    <path
      d="M198 60 C202 72, 206 90, 196 98 C186 104, 178 92, 198 78"
      stroke="currentColor"
      strokeWidth="2.4"
    />
    {/* Confident paraph underline stroke */}
    <path
      d="M36 90 C85 96, 155 92, 230 76"
      stroke="currentColor"
      strokeWidth="2.6"
    />
    <path
      d="M48 94 C95 98, 150 95, 195 86"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    {/* Handwritten cursive text */}
    <text
      x="120"
      y="82"
      fontFamily="'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive, sans-serif"
      fontSize="17"
      fontStyle="italic"
      fontWeight="bold"
      fill="currentColor"
      stroke="none"
      opacity="0.95"
      letterSpacing="0.5"
    >
      Đại Diện Lớp
    </text>
  </svg>
);

export const RepresentativeSignatureSvg = FinanceSignatureSvg;
export const TranHanhDungSignatureSvg = FinanceSignatureSvg;
export const ManagerSignatureSvg = FinanceSignatureSvg;

/**
 * High-fidelity Vector Red Stamp/Seal for Lớp Ôn Thi HSGQG Sinh Học
 */
export const CompanySealSvg: React.FC<{ className?: string }> = ({ className = 'w-32 h-32' }) => (
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={`text-red-600 opacity-90 select-none pointer-events-none ${className}`}
  >
    {/* Outer Double Circle */}
    <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" />
    <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 2" />

    {/* Center Star */}
    <polygon
      points="100,72 106,86 122,87 109,97 114,112 100,103 86,112 91,97 78,87 94,86"
      fill="currentColor"
    />

    {/* Top Text Arc */}
    <path id="circleTopPath" d="M 22,100 A 78,78 0 0,1 178,100" fill="none" stroke="none" />
    <text fill="currentColor" fontSize="10" fontWeight="bold" letterSpacing="0.8">
      <textPath href="#circleTopPath" startOffset="50%" textAnchor="middle">
        LỚP ÔN THI HSGQG SINH HỌC
      </textPath>
    </text>

    {/* Bottom Text Arc */}
    <path id="circleBottomPath" d="M 178,100 A 78,78 0 0,1 22,100" fill="none" stroke="none" />
    <text fill="currentColor" fontSize="11" fontWeight="bold" letterSpacing="1.2">
      <textPath href="#circleBottomPath" startOffset="50%" textAnchor="middle">
        ★ ĐẠI DIỆN LỚP ★
      </textPath>
    </text>

    {/* Center Subtext */}
    <text
      x="100"
      y="132"
      textAnchor="middle"
      fill="currentColor"
      fontSize="11"
      fontWeight="900"
      letterSpacing="1"
    >
      HSGQG
    </text>
  </svg>
);
