/**
 * .vue 脚本体检：`npm run typecheck` 不检查 <script setup> 内部，Vite 的 esbuild 也只剥离类型。
 * 本工具把每个 SFC 的脚本体抽成同目录临时 .ts，再用一个继承项目 tsconfig 的临时配置统一编译，
 * 从而抓出未定义标识符、类型错误与语法错误。
 *
 * 用法：node scripts/check-vue-scripts.mjs
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';
const TMP_TS = 'tsconfig.vuecheck.json';
const created = [];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith('.vue')) acc.push(p);
  }
  return acc;
}

/** 路径转合法文件名，保留可读性 */
function tmpName(file) {
  return file.replace(/[\\/]/g, '__') + '.ts';
}

const files = walk(SRC);
const tempFiles = [];

for (const f of files) {
  const raw = readFileSync(f, 'utf-8');
  const m = raw.match(/<script[^>]*setup[^>]*>([\s\S]*?)<\/script>/);
  if (!m) continue;
  // 与被检文件同目录，保证相对导入可解析
  const tmp = join(f, '..', `.vuecheck-${tmpName(f)}`);
  writeFileSync(tmp, m[1]);
  created.push(tmp);
  tempFiles.push(tmp.split('\\').join('/'));
}

// 继承项目 tsconfig，保留 paths 别名与 compilerOptions
const cfg = {
  extends: './tsconfig.json',
  compilerOptions: { noEmit: true, noUnusedLocals: false, noUnusedParameters: false },
  include: [...tempFiles, 'src/**/*.d.ts'],
};
writeFileSync(TMP_TS, JSON.stringify(cfg, null, 2));
created.push(TMP_TS);

const r = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', TMP_TS], {
  encoding: 'utf-8',
});

const text = `${r.stdout || ''}${r.stderr || ''}`;
const byFile = new Map();
for (const rawLine of text.split('\n')) {
  // Windows 下行尾带 \r，而 \r 是正则的行终止符，不剥掉会让整条匹配失配
  const line = rawLine.replace(/\r$/, '');
  if (!/error TS\d+/.test(line)) continue;
  const mm = line.match(/^(.+?)\((\d+),(\d+)\): (error TS\d+): (.*)$/);
  if (!mm) continue;
  const path = mm[1].split('\\').join('/');
  const hit = tempFiles.find((t) => path === t || path.endsWith('/' + t.split('/').pop()));
  if (!hit) continue;
  // 反向还原临时文件对应的真实 SFC 路径
  const original = hit.replace(/^.*?\.vuecheck-/, '');
  const real = original.replace(/__/g, '/').replace(/\.ts$/, '');
  if (!byFile.has(real)) byFile.set(real, []);
  byFile.get(real).push(`${mm[4]}: ${mm[5]} (行 ${mm[2]})`);
}

for (const p of created) {
  try { unlinkSync(p); } catch { /* 忽略清理失败 */ }
}
try { rmSync(TMP_TS, { force: true }); } catch { /* 同上 */ }

if (byFile.size === 0) {
  console.log(`\n已体检 ${tempFiles.length} 个 SFC 脚本，全部通过`);
} else {
  for (const [f, errs] of byFile) {
    console.log('FAIL', f);
    errs.slice(0, 8).forEach((e) => console.log('   ', e));
  }
  console.log(`\n${byFile.size} / ${tempFiles.length} 个 SFC 脚本存在问题`);
  process.exitCode = 1;
}
