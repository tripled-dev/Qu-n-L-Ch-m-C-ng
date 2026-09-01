import React from 'react';

/**
 * High-fidelity Vector Signatures matching the user's uploaded payslip document
 */
export const ManagerSignatureSvg: React.FC<{ className?: string }> = ({ className = 'w-48 h-20' }) => (
  <svg
    viewBox="0 0 260 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`stroke-slate-900 ${className}`}
    style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
  >
    {/* Stylized authentic signature for Đặng Tuấn Anh */}
    <path
      d="M45 85 L75 25 L88 78 L125 15 L80 95"
      stroke="currentColor"
      strokeWidth="2.4"
    />
    <path
      d="M60 55 C85 45 110 50 145 42 C165 38 185 40 195 48"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path
      d="M100 48 L140 85 C160 90 190 75 205 60 C215 50 225 65 210 82 C190 100 130 98 90 92"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M110 30 Q120 70 145 65"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export const FinanceSignatureSvg: React.FC<{ className?: string }> = ({ className = 'w-48 h-20' }) => (
  <svg
    viewBox="0 0 260 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`stroke-slate-900 ${className}`}
    style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
  >
    {/* Stylized authentic signature for Trần Hạnh Dung */}
    <path
      d="M60 18 L60 92"
      stroke="currentColor"
      strokeWidth="2.6"
    />
    <path
      d="M42 62 C42 45 62 35 78 45 C95 55 90 85 70 88 C50 90 35 70 48 50 C60 32 82 25 105 38 C120 48 115 78 95 85 C80 90 70 75 75 60"
      stroke="currentColor"
      strokeWidth="2.3"
    />
    <path
      d="M100 60 C115 50 135 48 145 65 C155 78 170 50 185 62 C195 72 205 68 215 75"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path
      d="M50 92 C80 96 150 94 220 85"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);
