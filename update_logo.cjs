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

if (paths.length > 0) {
  const logoComponent = `import React from 'react';

export default function Logo({ width = 36, height = 48, fill = 'var(--color-primary)' }) {
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
${paths.map(d => `      <path fillRule="evenodd" clipRule="evenodd" d="${d}" fill={fill} />`).join('\n')}
    </svg>
  );
}
`;
  fs.writeFileSync(destPath, logoComponent);
  console.log("Updated Logo.jsx successfully.");
} else {
  console.log("Could not find path data.");
}
