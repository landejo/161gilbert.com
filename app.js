(() => {
  const TOTAL = 30;

  // Theme toggle (light/dark)
  const themeKey = "loft12_theme";
  const themeBtn = document.getElementById("themeToggle");
  const savedTheme = window.localStorage.getItem(themeKey);

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(themeKey, theme);
  }

  // Default to OS preference unless user previously chose
  if (!savedTheme) {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  // Build list: images/photo1.jpeg ... images/photo30.jpeg
  const photos = Array.from({ length: TOTAL }, (_, i) => {
    const n = i + 1;
    return { n, src: `images/photo${n}.jpeg`, alt: `Photo ${n}` };
  });

  const galleryEl = document.getElementById("gallery");
  const lightboxEl = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const metaEl = document.getElementById("lightboxMeta");
  const captionEl = document.getElementById("lightboxCaption");
  const yearEl = document.getElementById("year");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const closeBtn = document.getElementById("closeBtn");
  const openViewerBtn = document.getElementById("openViewerBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");

  let currentIndex = 0;

  function setYear(){
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function getActiveList(){
    return window.__loft_gallery_list || photos;
  }

  function renderGallery(list){
    if (!galleryEl) return;
    galleryEl.innerHTML = "";

    list.forEach((p, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "thumb";
      btn.dataset.index = String(idx);
      btn.setAttribute("aria-label", `Open ${p.alt}`);

      const img = document.createElement("img");
      img.src = p.src;
      img.alt = p.alt;
      img.loading = "lazy";

      const badge = document.createElement("div");
      badge.className = "count";
      badge.textContent = `${p.n}/${TOTAL}`;

      btn.appendChild(img);
      btn.appendChild(badge);
      btn.addEventListener("click", () => openAtIndex(idx, list));

      galleryEl.appendChild(btn);
    });
  }

  function openAtIndex(idx, list = photos){
    currentIndex = idx;
    const p = list[currentIndex];
    if (!p) return;

    lightboxImg.src = p.src;
    lightboxImg.alt = p.alt;

    if (metaEl) metaEl.textContent = `Photo ${p.n} of ${TOTAL}`;
    if (captionEl) captionEl.textContent = "";

    lightboxEl.classList.add("is-open");
    lightboxEl.setAttribute("aria-hidden", "false");

    const url = new URL(window.location.href);
    url.searchParams.set("photo", String(p.n));
    window.history.replaceState({}, "", url.toString());
  }

  function closeViewer(){
    lightboxEl.classList.remove("is-open");
    lightboxEl.setAttribute("aria-hidden", "true");

    const url = new URL(window.location.href);
    url.searchParams.delete("photo");
    url.searchParams.delete("viewer");
    window.history.replaceState({}, "", url.toString());
  }

  function step(delta){
    const list = getActiveList();
    const next = (currentIndex + delta + list.length) % list.length;
    openAtIndex(next, list);
  }

  function enableBackdropClose(){
    lightboxEl.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close) closeViewer();
    });
  }

  function enableKeyboard(){
    window.addEventListener("keydown", (e) => {
      if (!lightboxEl.classList.contains("is-open")) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  function enableTouch(){
    let x0 = null;
    lightboxImg.addEventListener("touchstart", (e) => {
      x0 = e.touches && e.touches[0] ? e.touches[0].clientX : null;
    }, { passive: true });

    lightboxImg.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const x1 = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
      if (x1 === null) return;
      const dx = x1 - x0;
      if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
      x0 = null;
    });
  }

  function hookButtons(){
    prevBtn?.addEventListener("click", () => step(-1));
    nextBtn?.addEventListener("click", () => step(1));
    closeBtn?.addEventListener("click", closeViewer);

    openViewerBtn?.addEventListener("click", () => {
      const list = getActiveList();
      openAtIndex(0, list);
    });

    shuffleBtn?.addEventListener("click", () => {
      const list = [...photos].sort(() => Math.random() - 0.5);
      window.__loft_gallery_list = list;
      renderGallery(list);
    });
  }

  function autoOpenFromURL(){
    const url = new URL(window.location.href);
    const photoParam = url.searchParams.get("photo");
    const viewerParam = url.searchParams.get("viewer");
    if (!photoParam && !viewerParam) return;

    const n = Number(photoParam || "1");
    if (!Number.isFinite(n) || n < 1 || n > TOTAL) return;

    const list = getActiveList();
    const idx = list.findIndex(p => p.n === n);
    openAtIndex(idx >= 0 ? idx : (n - 1), list);
  }

  function init(){
    setYear();
    renderGallery(photos);
    hookButtons();
    enableBackdropClose();
    enableKeyboard();
    enableTouch();
    autoOpenFromURL();
  }

  init();
})();