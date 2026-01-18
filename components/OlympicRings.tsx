import React from "react";

export default function OlympicRings({ className = "" }: { className?: string }) {
  const strokeW = 6;
  const r = 34;

  // centers for 3-top / 2-bottom
  const blue  = { cx: 52,  cy: 52 };
  const black = { cx: 112, cy: 52 };
  const red   = { cx: 172, cy: 52 };
  const yellow= { cx: 82,  cy: 92 };
  const green = { cx: 142, cy: 92 };

  return (
    <svg
      className={className}
      viewBox="0 0 224 144"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" strokeWidth={strokeW} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round">
        <circle cx={blue.cx}   cy={blue.cy}   r={r} stroke="#0085C7" />
        <circle cx={black.cx}  cy={black.cy}  r={r} stroke="#000000" />
        <circle cx={red.cx}    cy={red.cy}    r={r} stroke="#DF0024" />
        <circle cx={yellow.cx} cy={yellow.cy} r={r} stroke="#F4C300" />
        <circle cx={green.cx}  cy={green.cy}  r={r} stroke="#009F3D" />
      </g>
    </svg>
  );
}
