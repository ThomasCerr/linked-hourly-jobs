(function(){
  const el = id => document.getElementById(id);
  const keywords = el('keywords');
  const locationEl = el('location');
  const geo = el('geo');
  const dateRadios = document.querySelectorAll('input[name="dateMode"]');
  const lookbackValue = el('lookbackValue');
  const lookbackUnit  = el('lookbackUnit');
  const f_WT = el('f_WT');
  const f_E  = el('f_E');
  const f_JT = el('f_JT');
  const f_AL = el('f_AL');
  const f_C  = el('f_C');
  const f_I  = el('f_I');
  const distance = el('distance');
  const sortBy = el('sortBy');
  const buildBtn = el('buildBtn');
  const openBtn = el('openBtn');
  const copyBtn = el('copyBtn');
  const urlBox = el('urlBox');
  const copied = el('copied');
  const base = "https://www.linkedin.com/jobs/search/?";
  const getMulti = (select) => Array.from(select.selectedOptions).map(o=>o.value).filter(Boolean);

  function updateDateControls() {
    const mode = document.querySelector('input[name="dateMode"]:checked').value;
    const isLookback = mode === 'lookback';
    lookbackValue.disabled = !isLookback;
    lookbackUnit.disabled = !isLookback;
  }
  dateRadios.forEach(r => r.addEventListener('change', updateDateControls));
  updateDateControls();

  function buildUrl() {
    const params = new URLSearchParams();
    if (keywords.value.trim()) params.set('keywords', keywords.value.trim());
    if (locationEl.value.trim()) params.set('location', locationEl.value.trim());
    if (geo.value.trim()) params.set('geo', geo.value.trim());

    const mode = document.querySelector('input[name="dateMode"]:checked').value;
    if (mode === 'lookback') {
      const n = parseInt(lookbackValue.value, 10);
      if (!Number.isNaN(n) && n > 0) {
        const secs = lookbackUnit.value === 'hours' ? n*3600 : n*86400;
        params.set('f_TPR', 'r' + secs);
      }
    }

    const wt = getMulti(f_WT).filter(v => v !== "");
    if (wt.length) params.set('f_WT', wt.join(','));
    const exp = getMulti(f_E).filter(v=>v!=="");
    if (exp.length) params.set('f_E', exp.join(','));
    const jt = getMulti(f_JT).filter(v=>v!=="");
    if (jt.length) params.set('f_JT', jt.join(','));
    if (f_AL.value) params.set('f_AL', f_AL.value);
    if (f_C.value.trim()) params.set('f_C', f_C.value.trim());
    if (f_I.value.trim()) params.set('f_I', f_I.value.trim());
    const dist = parseInt(distance.value, 10);
    if (!Number.isNaN(dist) && dist > 0) params.set('distance', String(dist));
    if (sortBy.value) params.set('sortBy', sortBy.value);

    const finalUrl = base + params.toString();
    urlBox.textContent = finalUrl;
    openBtn.disabled = false;
    copyBtn.disabled = false;
    copied.textContent = '';
    return finalUrl;
  }

  buildBtn.addEventListener('click', buildUrl);
  openBtn.addEventListener('click', ()=>{ const url = urlBox.textContent.trim(); if(url) window.open(url,'_blank'); });
  copyBtn.addEventListener('click', async ()=>{ const url = urlBox.textContent.trim(); if(!url) return; try{ await navigator.clipboard.writeText(url); copied.textContent='Copied!'; setTimeout(()=>copied.textContent='',2000);}catch(e){copied.textContent='Copy failed';}});
})();