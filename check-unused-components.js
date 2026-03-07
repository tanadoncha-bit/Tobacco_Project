#!/usr/bin/env node
/**
 * check-unused-components.js
 * วางไฟล์นี้ไว้ที่ root ของโปรเจกต์ แล้วรัน: node check-unused-components.js
 *
 * สิ่งที่ script นี้ทำ:
 * 1. หา component files ทั้งหมดจาก components/ และ app/
 * 2. หา import statements ในโค้ดทั้งหมด
 * 3. เปรียบเทียบและแสดงว่า component ไหนไม่มีใคร import
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();

// โฟลเดอร์ที่จะหา components
const COMPONENT_DIRS = ['components', 'app'];

// โฟลเดอร์ที่จะสแกนหา imports
const SCAN_DIRS = ['components', 'app', 'lib', 'hooks', 'utils', 'src'];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ไฟล์ที่ไม่นับเป็น component
const IGNORE_PATTERNS = [
  'page.tsx', 'page.ts', 'layout.tsx', 'layout.ts',
  'loading.tsx', 'error.tsx', 'not-found.tsx', 'template.tsx',
  'route.ts', 'route.js',
  'middleware.ts', 'middleware.js',
  'next.config', 'tailwind.config', 'postcss.config',
  'check-unused',
];

// ─── 1. หา Component Files ───────────────────────────────────────────────────

function isComponentFile(filename) {
  if (!EXTENSIONS.includes(path.extname(filename))) return false;
  if (IGNORE_PATTERNS.some(p => filename.endsWith(p))) return false;
  return true;
}

function findComponents(dir, base = '') {
  const components = [];
  const fullDir = path.join(PROJECT_ROOT, dir);
  if (!fs.existsSync(fullDir)) return components;

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const fullPath = path.join(fullDir, entry.name);
    const relPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist', 'api'].includes(entry.name)) continue;
      components.push(...findComponents(relPath));
    } else if (entry.isFile() && isComponentFile(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // เช็คว่ามี export default หรือ export function/const หรือเปล่า
      const hasExport = /export\s+(default\s+)?(function|class|const|async)/.test(content);
      if (hasExport) {
        const name = path.basename(entry.name, path.extname(entry.name));
        components.push({
          name,
          file: relPath,
          fullPath,
        });
      }
    }
  }
  return components;
}

// ─── 2. หา Import statements ─────────────────────────────────────────────────

function getAllFiles(dirs) {
  const files = [];
  for (const dir of dirs) {
    const fullDir = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    collectFiles(fullDir, files);
  }
  return files;
}

function collectFiles(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist'].includes(entry.name)) continue;
      collectFiles(fullPath, files);
    } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
}

function findAllImports(files) {
  // เก็บทั้ง import name และ import path
  const importedNames = new Set();
  const importedPaths = new Set();

  const importPatterns = [
    // import X from '...'
    /import\s+(?:type\s+)?(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    // import { X, Y } from '...'
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
    // import * as X from '...'
    /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    // dynamic import: import('...')
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    // import X from '...'
    let m;
    const p1 = /import\s+(?:type\s+)?(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    while ((m = p1.exec(content)) !== null) {
      importedNames.add(m[1]);
      importedPaths.add(m[2]);
    }

    // import { X, Y } from '...'
    const p2 = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    while ((m = p2.exec(content)) !== null) {
      m[1].split(',').forEach(name => importedNames.add(name.trim().split(' as ')[0].trim()));
      importedPaths.add(m[2]);
    }

    // dynamic import
    const p3 = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = p3.exec(content)) !== null) {
      importedPaths.add(m[1]);
    }

    // JSX usage: <ComponentName หรือ <ComponentName/
    const p4 = /<([A-Z][a-zA-Z0-9]*)/g;
    while ((m = p4.exec(content)) !== null) {
      importedNames.add(m[1]);
    }
  }

  return { importedNames, importedPaths };
}

// ─── 3. Match ─────────────────────────────────────────────────────────────────

function isComponentUsed(component, importedNames, importedPaths) {
  // เช็คชื่อ component
  if (importedNames.has(component.name)) return true;

  // เช็ค import path ที่มีชื่อไฟล์ตรงกัน
  const relFile = component.file.replace(/\\/g, '/').replace(/\.(tsx?|jsx?)$/, '');
  for (const p of importedPaths) {
    const normalizedP = p.replace(/\\/g, '/');
    if (normalizedP.endsWith('/' + component.name) ||
        normalizedP.includes(relFile) ||
        normalizedP.endsWith(component.name)) {
      return true;
    }
  }

  return false;
}

// ─── 4. Main ──────────────────────────────────────────────────────────────────

console.log('\n🔍 กำลังสแกน components...\n');

const components = COMPONENT_DIRS.flatMap(d => findComponents(d));
console.log(`🧩 พบ Component files ทั้งหมด: ${components.length} files\n`);

const allFiles = getAllFiles(SCAN_DIRS);
console.log(`📄 สแกนไฟล์ทั้งหมด: ${allFiles.length} ไฟล์\n`);

const { importedNames, importedPaths } = findAllImports(allFiles);
console.log(`🔗 พบ unique imports: ${importedNames.size} names, ${importedPaths.size} paths\n`);
console.log('─'.repeat(70));

const used = [];
const unused = [];

for (const comp of components) {
  if (isComponentUsed(comp, importedNames, importedPaths)) {
    used.push(comp);
  } else {
    unused.push(comp);
  }
}

console.log(`\n✅ Components ที่ใช้งานอยู่: ${used.length}\n`);

console.log(`\n❌ Components ที่ไม่พบการใช้งาน: ${unused.length}\n`);
if (unused.length === 0) {
  console.log('   ทุก component ถูกใช้งานหมด 🎉');
} else {
  // จัดกลุ่มตาม directory
  const grouped = {};
  for (const c of unused) {
    const dir = path.dirname(c.file);
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(c);
  }

  for (const [dir, comps] of Object.entries(grouped)) {
    console.log(`  📁 ${dir}`);
    for (const c of comps) {
      console.log(`     • ${c.name}  (${path.basename(c.file)})`);
    }
    console.log('');
  }
}

console.log('─'.repeat(70));
console.log(`\n📊 สรุป: ใช้งาน ${used.length} | ไม่ได้ใช้ ${unused.length} จากทั้งหมด ${components.length} components\n`);
console.log('💡 หมายเหตุ: ก่อนลบควรเช็คด้วยตัวเองว่า:');
console.log('   - Component ไม่ได้ถูกเรียกแบบ dynamic เช่น React.lazy(() => import(...))')
console.log('   - Component ไม่ได้ใช้ชื่อ variable ในการ import\n');
