#!/usr/bin/env node
// Usage: node split-by-h2.js INPUT_MD OUT_DIR
const fs = require('fs');
const path = require('path');
const md = fs.readFileSync(process.argv[2], 'utf8');
const out = process.argv[3] || 'build';
if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
const sectionsDir = path.join(out, 'sections');
if (!fs.existsSync(sectionsDir)) fs.mkdirSync(sectionsDir, { recursive: true });

const lines = md.split(/\r?\n/);
let title = '';
let current = null;
let currentLines = [];
const toc = [];
let currentH1 = null;

function flush() {
  if (!current) return;
  const filename = current.filename;
  const content = [title ? `# ${title}` : '', ''].concat(currentLines).join('\n');
  fs.writeFileSync(path.join(sectionsDir, filename), content, 'utf8');
  toc.push({
    title: current.title,
    filename,
    headings: current.h3 || []
  });
}

for (let i=0;i<lines.length;i++){
  const line = lines[i];
  const h1 = line.match(/^#\s+(.*)/);
  const h2 = line.match(/^##\s+(.*)/);
  const h3 = line.match(/^###\s+(.*)/);
  if (h1){
    title = h1[1].trim();
    currentH1 = title;
    continue;
  }
  if (h2){
    if (current) flush();
    const slug = h2[1].trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'section';
    current = { title: h2[1].trim(), filename: `${slug}.md`, h3: [] };
    currentLines = [line]; // include H2 as first line
    continue;
  }
  if (h3 && current){
    current.h3.push({ title: h3[1].trim() });
    currentLines.push(line);
    continue;
  }
  if (current){
    currentLines.push(line);
  }
}
// final flush
if (current) flush();
// write toc.json and book.md (concatenated)
fs.writeFileSync(path.join(out,'toc.json'), JSON.stringify({ title, sections: toc }, null, 2),'utf8');
// concatenated md for downloads
let bookMd = `# ${title}\n\n` + toc.map(s => {
  const txt = fs.readFileSync(path.join(sectionsDir, s.filename),'utf8');
  return txt;
}).join('\n\n');
fs.writeFileSync(path.join(out,'book.md'), bookMd,'utf8');
console.log('Wrote', toc.length, 'sections to', sectionsDir);
