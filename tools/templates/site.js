(async function(){
  try{
    const resp = await fetch('/toc.json');
    const toc = await resp.json();
    const tocEl = document.getElementById('toc');
    function makeList(sections){
      const ul = document.createElement('ul');
      sections.forEach(s=>{
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = './' + s.filename;
        a.textContent = s.title;
        li.appendChild(a);
        if (s.headings && s.headings.length){
          const sub = document.createElement('ul');
          s.headings.forEach(h=>{
            const shi = document.createElement('li');
            const sha = document.createElement('a');
            sha.href = './' + s.filename + '#' + h.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
            sha.textContent = h.title;
            shi.appendChild(sha);
            sub.appendChild(shi);
          });
          li.appendChild(sub);
        }
        ul.appendChild(li);
      });
      return ul;
    }
    tocEl.appendChild(makeList(toc.sections));
    // pager
    const path = location.pathname.split('/').pop() || 'index.html';
    const fname = path.replace('.html','') + '.md';
    const idx = toc.sections.findIndex(s=>s.filename===fname);
    if (idx>=0){
      const prev = toc.sections[idx-1];
      const next = toc.sections[idx+1];
      const up = toc.title ? './' : null;
      if (prev) { let e=document.getElementById('prev'); e.style.display='inline'; e.href='./' + prev.filename.replace('.md','.html'); }
      if (next) { let e=document.getElementById('next'); e.style.display='inline'; e.href='./' + next.filename.replace('.md','.html'); }
      if (up) { let e=document.getElementById('up'); e.style.display='inline'; e.href='./'; e.textContent='Up'; }
    }
  }catch(e){ console.warn('TOC load failed',e) }
})();
