(function(){
  // Form controls
  const el = id => document.getElementById(id);
  const keywords = el('keywords');
  const locationEl = el('location');
  const geo = el('geo');
  const start = el('start');

  // Date controls
  const dateRadios = document.querySelectorAll('input[name="dateMode"]');
  const lookbackValue = el('lookbackValue');
  const lookbackUnit  = el('lookbackUnit');
  const sinceHH = el('sinceHH');
  const sinceMM = el('sinceMM');
  const tz = el('tz');

  // Filters
  const f_WT = el('f_WT');
  const f_E  = el('f_E');
  const f_JT = el('f_JT');
  const f_AL = el('f_AL');
  const f_C  = el('f_C');
  const f_I  = el('f_I');
  const distance = el('distance');
  const sortBy = el('sortBy');

  // Output
  const buildBtn = el('buildBtn');
  const openBtn = el('openBtn');
  const copyBtn = el('copyBtn');
  const urlBox = el('urlBox');
  const debugBox = el('debug');
  const copied = el('copied');

  // helpers
  const getMulti = (select) => Array.from(select.selectedOptions).map(o => o.value).filter(Boolean);
  const enable = (elem, yes) => { elem.disabled = !yes; };
  const base = "https://www.linkedin.com/jobs/search/?";

  function updateDateControls() {
    const mode = document.querySelector('input[name="dateMode"]:checked').value;
    enable(lookbackValue, mode === 'lookback');
    enable(lookbackUnit,  mode === 'lookback');
    const since = mode === 'sinceTime';
    [sinceHH, sinceMM, tz].forEach(c => enable(c, since));
  }
  dateRadios.forEach(r => r.addEventListener('change', updateDateControls));
  updateDateControls();

  function secondsForSinceTime() {
    // Compute seconds between now and "today at HH:MM" in chosen TZ.
    const hh = parseInt(sinceHH.value, 10);
    const mm = parseInt(sinceMM.value, 10);
    if (Number.isNaN(hh) || hh < 0 || hh > 23) return null;
    if (Number.isNaN(mm) || mm < 0 || mm > 59) return null;

    try {
      // Build a Date for today at HH:MM in the selected timezone.
      const now = new Date();
      // Use Intl API to get offset minutes for the target tz at "now".
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz.value,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      // Parse parts
      const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
      const yyyy = parseInt(parts.year,10);
      const MM   = parseInt(parts.month,10);
      const dd   = parseInt(parts.day,10);

      // Create a Date object that represents "today HH:MM" in tz, but as UTC ms epoch.
      // Approach: get the epoch for "today 00:00:00" in tz via trick – format that time and compute offset.
      // Instead, create ISO string and use Temporal-like math via guessing offset.
      // Simpler approach: get the epoch for tz "today 00:00:00" by using that time and then adjusting by the current offset of tz.
      // We'll approximate offset using the difference between local time and time in tz at 'now'.
      const localNow = new Date();
      const localOffsetMin = localNow.getTimezoneOffset();

      // get tz offset at 'now'
      const tzNowStr = fmt.format(now); // not directly an offset, so compute via converting a fixed known UTC time and diff
      // A robust cross-browser offset calc is complex; we'll approximate using Date in target tz via constructing a UTC date string.
      // To avoid complexity, compute seconds since "today at HH:MM" in tz by comparing wall clock values in that tz vs now in same tz.
      // Convert both to the same tz wall-clock and compute difference.
      const fmtHM = new Intl.DateTimeFormat('en-US', { timeZone: tz.value, hour:'2-digit', minute:'2-digit', hour12:false });
      const nowHM = fmtHM.format(now).split(':').map(Number);
      const nowTotalMin = nowHM[0]*60 + nowHM[1];
      const targetTotalMin = hh*60 + mm;

      let diffMin = nowTotalMin - targetTotalMin;
      if (diffMin < 0) diffMin += 24*60; // if target time is in the future today, wrap to previous day

      return diffMin * 60;
    } catch(e) {
      return null;
    }
  }

  function buildUrl() {
    const params = new URLSearchParams();

    if (keywords.value.trim()) params.set('keywords', keywords.value.trim());
    if (locationEl.value.trim()) params.set('location', locationEl.value.trim());
    if (geo.value.trim()) params.set('geo', geo.value.trim());
    const startVal = parseInt(start.value, 10);
    if (!Number.isNaN(startVal) && startVal > 0) params.set('start', String(startVal));

    // Date posted (f_TPR)
    const mode = document.querySelector('input[name="dateMode"]:checked').value;
    if (mode === 'lookback') {
      const n = parseInt(lookbackValue.value, 10);
      if (!Number.isNaN(n) && n > 0) {
        const secs = lookbackUnit.value === 'hours' ? n*3600 : n*86400;
        params.set('f_TPR', 'r' + secs);
      }
    } else if (mode === 'sinceTime') {
      const secs = secondsForSinceTime();
      if (secs !== null) params.set('f_TPR', 'r' + secs);
    }

    // Multi-select filters (comma-separated)
    const wt = getMulti(f_WT);
    if (wt.length) params.set('f_WT', wt.join(','));

    let exp = getMulti(f_E).filter(Boolean);
    if (exp.length) params.set('f_E', exp.join(','));

    const jt = getMulti(f_JT);
    if (jt.length) params.set('f_JT', jt.join(','));

    if (f_AL.value) params.set('f_AL', f_AL.value);

    const comp = f_C.value.replace(/\s+/g,'').replace(/,+$/,''); // clean
    if (comp) params.set('f_C', comp);

    const ind = f_I.value.replace(/\s+/g,'').replace(/,+$/,''); // clean
    if (ind) params.set('f_I', ind);

    const dist = parseInt(distance.value, 10);
    if (!Number.isNaN(dist) && dist > 0) params.set('distance', String(dist));

    if (sortBy.value) params.set('sortBy', sortBy.value);

    const finalUrl = base + params.toString();
    urlBox.textContent = finalUrl;
    debugBox.textContent = JSON.stringify(Object.fromEntries(params), null, 2);

    openBtn.disabled = false;
    copyBtn.disabled = false;
    copied.textContent = '';
    return finalUrl;
  }

  buildBtn.addEventListener('click', buildUrl);
  openBtn.addEventListener('click', () => {
    const url = urlBox.textContent.trim();
    if (url) window.open(url, '_blank', 'noopener');
  });
  copyBtn.addEventListener('click', async () => {
    const url = urlBox.textContent.trim();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      copied.textContent = 'Copied';
      setTimeout(()=> copied.textContent = '', 2000);
    } catch(e) {
      copied.textContent = 'Copy failed';
    }
  });

  // Deep-link: read query params to prefill the form
  function prefillFromHash() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    try {
      const obj = JSON.parse(decodeURIComponent(hash.slice(1)));
      if (obj.keywords) keywords.value = obj.keywords;
      if (obj.location) locationEl.value = obj.location;
      if (obj.geo) geo.value = obj.geo;
      if (obj.start) start.value = obj.start;

      if (obj.dateMode) {
        document.querySelector(`input[name="dateMode"][value="${obj.dateMode}"]`)?.click();
      }
      if (obj.lookbackValue) lookbackValue.value = obj.lookbackValue;
      if (obj.lookbackUnit) lookbackUnit.value = obj.lookbackUnit;
      if (obj.sinceHH!=null) sinceHH.value = obj.sinceHH;
      if (obj.sinceMM!=null) sinceMM.value = obj.sinceMM;
      if (obj.tz) tz.value = obj.tz;

      (obj.f_WT||[]).forEach(v=> {
        const opt = Array.from(f_WT.options).find(o=>o.value===v);
        if (opt) opt.selected = true;
      });
      (obj.f_E||[]).forEach(v=> {
        const opt = Array.from(f_E.options).find(o=>o.value===v);
        if (opt) opt.selected = true;
      });
      (obj.f_JT||[]).forEach(v=> {
        const opt = Array.from(f_JT.options).find(o=>o.value===v);
        if (opt) opt.selected = true;
      });
      if (obj.f_AL) f_AL.value = obj.f_AL;
      if (obj.f_C) f_C.value = obj.f_C;
      if (obj.f_I) f_I.value = obj.f_I;
      if (obj.distance) distance.value = obj.distance;
      if (obj.sortBy) sortBy.value = obj.sortBy;
    } catch(e){}
  }
  prefillFromHash();

  // Persist current config in URL hash for sharing
  function currentConfig() {
    return {
      keywords: keywords.value.trim() || undefined,
      location: locationEl.value.trim() || undefined,
      geo: geo.value.trim() || undefined,
      start: start.value || undefined,
      dateMode: document.querySelector('input[name="dateMode"]:checked')?.value,
      lookbackValue: lookbackValue.value || undefined,
      lookbackUnit: lookbackUnit.value,
      sinceHH: sinceHH.value || undefined,
      sinceMM: sinceMM.value || undefined,
      tz: tz.value,
      f_WT: getMulti(f_WT),
      f_E: getMulti(f_E),
      f_JT: getMulti(f_JT),
      f_AL: f_AL.value || undefined,
      f_C: f_C.value || undefined,
      f_I: f_I.value || undefined,
      distance: distance.value || undefined,
      sortBy: sortBy.value || undefined
    };
  }
  function updateShareHash(){
    const cfg = currentConfig();
    // remove empty arrays and falsy
    Object.keys(cfg).forEach(k => {
      if (cfg[k]==null) delete cfg[k];
      if (Array.isArray(cfg[k]) && cfg[k].length===0) delete cfg[k];
      if (cfg[k]==="") delete cfg[k];
    });
    const encoded = encodeURIComponent(JSON.stringify(cfg));
    history.replaceState(null, '', '#' + encoded);
  }

  document.addEventListener('input', updateShareHash);
  document.addEventListener('change', updateShareHash);
})();