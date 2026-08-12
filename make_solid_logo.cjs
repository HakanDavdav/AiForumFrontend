const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'assets', 'Robot llustration.svg');
const destPath = path.join(__dirname, 'src', 'components', 'common', 'Logo.jsx');

const svgContent = fs.readFileSync(srcPath, 'utf8');

const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g;
const paths = [];
let match;
while ((match = pathRegex.exec(svgContent)) !== null) {
  paths.push(match[1]);
}

// Extract only the first subpath (up to the first Z or z, or just split by M and take the first M part)
const solidPaths = paths.map(d => {
  // Split by 'M' or 'm', but wait, the string starts with 'M'
  // Let's just find the first 'Z' or 'z' and cut it there.
  const zIndex = d.toUpperCase().indexOf('Z');
  if (zIndex !== -1) {
    return d.substring(0, zIndex + 1);
  }
  return d;
});

if (solidPaths.length >= 3) {
  const eye1 = solidPaths[0];
  const eye2 = solidPaths[1];
  const body = solidPaths[2];

  const logoComponent = `import React from 'react';

export default function Logo({ width = 36, height = 48, fill = 'var(--color-primary)', eyeFill = 'var(--bg-base, #ffffff)' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 928 982"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-label="Bletchly Logo"
    >
      <path d="${body}" fill={fill} />
      <path d="${eye1}" fill={eyeFill} />
      <path d="${eye2}" fill={eyeFill} />
    </svg>
  );
}
`;
  fs.writeFileSync(destPath, logoComponent);
  console.log("Updated Logo.jsx successfully with solid shapes.");
} else {
  console.log("Could not find enough path data.");
}
