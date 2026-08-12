const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'assets', 'Vector copy.svg');
const destPath = path.join(__dirname, 'src', 'components', 'common', 'Logo.jsx');

const svgContent = fs.readFileSync(srcPath, 'utf8');
const dMatch = svgContent.match(/d="([^"]+)"/);
if (dMatch) {
  const d = dMatch[1];
  const subpaths = d.split('M').filter(p => p.trim().length > 0).map(p => 'M' + p);
  
  const bodyPaths = subpaths.slice(0, subpaths.length - 2).join('');
  const leftHole = subpaths[subpaths.length - 2];
  const rightHole = subpaths[subpaths.length - 1];

  const logoComponent = `import React from 'react';

export default function Logo({ width = 36, height = 48, fill = 'var(--color-primary)' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 702 873"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-label="Bletchly Logo"
    >
      <path d="${bodyPaths}" fill={fill} />
      <path d="${leftHole}" fill={fill} />
      <path d="${rightHole}" fill={fill} />
    </svg>
  );
}
`;
  fs.writeFileSync(destPath, logoComponent);
  console.log("Created Logo.jsx successfully.");
} else {
  console.log("Could not find path data.");
}
