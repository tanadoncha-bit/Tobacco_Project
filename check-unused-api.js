#!/usr/bin/env node
/**
 * check-unused-api.js
 * วางไฟล์นี้ไว้ที่ root ของโปรเจกต์ แล้วรัน: node check-unused-api.js
 *
 * สิ่งที่ script นี้ทำ:
 * 1. หา API routes ทั้งหมดจาก app/api/
 * 2. หา fetch() / axios calls ในโค้ดทั้งหมด
 * 3. เปรียบเทียบและแสดงว่า route ไหนไม่มีใครเรียก
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const API_DIR = path.join(PROJECT_ROOT, 'app', 'api');
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks', 'utils', 'pages', 'src'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ─── 1. หา API Routes ทั้งหมด ───────────────────────────────────────────────

function findApiRoutes(dir, base = '') {
  const routes = [];
  if (!fs.existsSync(dir)) return routes;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const routePath = base + '/' + entry.name;

    if (entry.isDirectory()) {
      routes.push(...findApiRoutes(fullPath, routePath));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      // แปลง path เป็น API endpoint
      // เช่น /products/[id]/route.ts → /api/products/[id]
      const endpoint = '/api' + base;
      const methods = extractMethods(fullPath);
      routes.push({ endpoint, file: fullPath.replace(PROJECT_ROOT, ''), methods });
    }
  }
  return routes;
}

function extractMethods(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const methods = [];
  const methodPatterns = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  for (const m of methodPatterns) {
    if (new RegExp(`export\\s+(async\\s+)?function\\s+${m}|export\\s+const\\s+${m}`).test(content)) {
      methods.push(m);
    }
  }
  return methods.length ? methods : ['UNKNOWN'];
}

// ─── 2. หา fetch/axios calls ทั้งหมด ─────────────────────────────────────────

function getAllFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', '.git', 'dist'].includes(entry.name)) {
      files.push(...getAllFiles(fullPath));
    } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function findApiCalls(files) {
  const calls = new Set();

  // regex patterns สำหรับหา API calls
  const patterns = [
    // fetch("/api/xxx") หรือ fetch(`/api/xxx`)
    /fetch\s*\(\s*[`'"](\/api\/[^`'"?\s]+)/g,
    // fetch(url) where url = "/api/xxx"  หรือ  `${baseUrl}/api/xxx`
    /[`'"](\/api\/[^`'"?\s]+)[`'"]/g,
    // axios.get("/api/xxx")
    /axios\s*\.\s*(?:get|post|put|patch|delete)\s*\(\s*[`'"](\/api\/[^`'"?\s]+)/g,
  ];

  for (const file of files) {
    // ข้ามไฟล์ที่อยู่ใน api/ เอง และไฟล์ check script นี้
    if (file.includes('/api/') || file.includes('check-unused-api')) continue;

    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        // normalize: ตัด query string และ trailing slash
        let endpoint = match[1].split('?')[0].replace(/\/$/, '');
        calls.add(endpoint);
      }
    }
  }
  return calls;
}

// ─── 3. Match Routes กับ Calls ────────────────────────────────────────────────

function normalizeForMatch(endpoint) {
  // แปลง dynamic segments: /api/products/[id] → /api/products/:id
  return endpoint.replace(/\[([^\]]+)\]/g, ':$1');
}

function isRouteCalledDynamically(route, calls) {
  // ตรวจสอบแบบ loose: ถ้า prefix ของ route ตรงกับ call ใดๆ
  const base = route.endpoint.replace(/\/\[[^\]]+\].*$/, ''); // ตัด dynamic part
  for (const call of calls) {
    if (call.startsWith(base) || base.startsWith(call.replace(/\/[^/]+$/, ''))) {
      return true;
    }
  }
  return false;
}

function matchRoute(route, calls) {
  const normalized = normalizeForMatch(route.endpoint);

  for (const call of calls) {
    // exact match
    if (call === route.endpoint) return true;
    // dynamic match: /api/products/123 matches /api/products/[id]
    const regex = new RegExp('^' + normalized.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(call)) return true;
  }

  // loose match สำหรับ dynamic routes
  if (route.endpoint.includes('[')) {
    return isRouteCalledDynamically(route, calls);
  }

  return false;
}

// ─── 4. Main ──────────────────────────────────────────────────────────────────

console.log('\n🔍 กำลังสแกนโปรเจกต์...\n');

// หา routes
const routes = findApiRoutes(API_DIR);
console.log(`📁 พบ API Routes ทั้งหมด: ${routes.length} routes\n`);

// หา source files
const allFiles = SCAN_DIRS.flatMap(d => getAllFiles(path.join(PROJECT_ROOT, d)));
console.log(`📄 สแกนไฟล์ทั้งหมด: ${allFiles.length} ไฟล์\n`);

// หา calls
const apiCalls = findApiCalls(allFiles);
console.log(`🔗 พบ API calls: ${apiCalls.size} unique endpoints\n`);
console.log('─'.repeat(60));

// จับคู่
const used = [];
const unused = [];
const dynamic = [];

for (const route of routes) {
  if (matchRoute(route, apiCalls)) {
    used.push(route);
  } else if (route.endpoint.includes('[')) {
    dynamic.push(route); // dynamic route อาจจะถูกเรียกแต่ detect ยาก
  } else {
    unused.push(route);
  }
}

// แสดงผล
console.log(`\n✅ Routes ที่ใช้งานอยู่ (${used.length})\n`);
for (const r of used) {
  console.log(`   ${r.methods.join(', ').padEnd(20)} ${r.endpoint}`);
}

if (dynamic.length > 0) {
  console.log(`\n⚠️  Dynamic Routes (ตรวจสอบเองอีกที) (${dynamic.length})\n`);
  for (const r of dynamic) {
    console.log(`   ${r.methods.join(', ').padEnd(20)} ${r.endpoint}`);
    console.log(`   ${''.padEnd(20)} ${r.file}`);
  }
}

console.log(`\n❌ Routes ที่ไม่พบการเรียกใช้ (${unused.length})\n`);
if (unused.length === 0) {
  console.log('   ทุก route ถูกใช้งานหมด 🎉');
} else {
  for (const r of unused) {
    console.log(`   ${r.methods.join(', ').padEnd(20)} ${r.endpoint}`);
    console.log(`   ${''.padEnd(20)} 📄 ${r.file}\n`);
  }
}

console.log('─'.repeat(60));
console.log(`\n📊 สรุป: ใช้งาน ${used.length} | Dynamic ${dynamic.length} | ไม่ได้ใช้ ${unused.length} จากทั้งหมด ${routes.length} routes\n`);
console.log('💡 หมายเหตุ: "ไม่พบการเรียกใช้" อาจหมายความว่า:');
console.log('   - Route ถูกเรียกจาก external service (webhook, cron job)');
console.log('   - URL ถูก build จาก variable เช่น `/api/${type}/action`');
console.log('   - Route ถูกเรียกจาก middleware โดยตรง\n');
