export const FILE_SYSTEM = {
  IGNORE_PATTERNS: [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'coverage',
    '.DS_Store',
    '*.log',
    '.env.local',
    '.turbo'
  ],
  
  IMPORTANT_FILES: [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'next.config.mjs',
    'tailwind.config.js',
    'README.md',
    '.env.example',
    'playwright.config.ts'
  ],
  
  MAX_SCAN_DEPTH: 3,
} as const;
