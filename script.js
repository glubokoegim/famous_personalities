/* =============================================================
   Знаменитые личности Глубокского края — script.js
   StPageFlip + Fancybox 5 + Hash navigation + QR + Preloader + JSON Fetch
   ============================================================= */
(function () {
  'use strict';

  const PAGE_W = 680;
  const PAGE_H = 880;
  const TOTAL = 16;

  const NAV_ITEMS = [
    { label: 'Обложка', num: '', idx: 0 },
    { label: 'Вступление', num: '', idx: 1 },
    { label: 'Буйницкий Игнат Терентьевич', num: '', idx: 3 },
    { label: 'Дроздович Язеп Нарцисович', num: '', idx: 5 },
    { label: 'Корсак Иосиф Львович', num: '', idx: 7 },
    { label: 'Лапырь Болеслав Никодимович', num: '', idx: 9 },
    { label: 'Ломако Владимир Андреевич', num: '', idx: 11 },
    { label: 'Сухой Павел Осипович', num: '', idx: 13 },
    { label: 'Обложка', num: '', idx: 15 },
  ];

  /* if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
  
          // Если уже есть ждущий SW — сразу активируем
          if (registration.waiting) {
            registration.waiting.postMessage('SKIP_WAITING');
          }
  
          // Следим за появлением нового SW
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] Доступно обновление. Перезагрузите страницу.');
                // Можно показать тост «Доступно обновление — обновить?»
              }
            });
          });
        })
        .catch((error) => console.log('SW registration failed:', error));
    });
  } */

  /* ══════════════════════════════════════════════
     ФУНКЦИЯ ГЕНЕРАЦИИ СТРАНИЦ ИЗ JSON ДАННЫХ
     ══════════════════════════════════════════════ */
  function renderAuthorsPages(authorsData) {
    const anchor = document.getElementById('dynamic-authors-anchor');
    if (!anchor) return;

    authorsData.forEach((author, index) => {
      const leftPageNum = (index * 2) + 3;
      const rightPageNum = (index * 2) + 4;

      // Сборка субтитров для главного видео
      let mainSubsHTML = '';
      let mainCcMenuHTML = '<button class="vid-cc-opt" data-lang="off">Выкл</button>';
      if (author.mainVideo.subs && author.mainVideo.subs.length > 0) {
        author.mainVideo.subs.forEach(sub => {
          mainSubsHTML += `<track kind="subtitles" srclang="${sub.lang}" label="${sub.label}" src="${sub.src}">`;
          mainCcMenuHTML += `<button class="vid-cc-opt" data-lang="${sub.lang}">${sub.label}</button>`;
        });
      }

      // ЛЕВАЯ СТРАНИЦА (Главное видео)
      const leftPage = document.createElement('div');
      leftPage.className = 'page';
      leftPage.innerHTML = `
        <div class="photo-page">
          <video class="photo-page-video" src="${author.mainVideo.src}" playsinline poster="${author.mainVideo.poster}" preload="none">
            ${mainSubsHTML}
          </video>
          <div class="photo-page-vignette"></div>
          <div class="vid-layer">
            <div class="vid-center-btn is-play"><span class="vcb-icon">&#9654;</span></div>
            <div class="vid-controls vid-controls--hidden">
              <div class="vid-progress-wrap">
                <div class="vid-progress-bar"><div class="vid-progress-fill"></div><div class="vid-progress-thumb"></div></div>
              </div>
              <div class="vid-controls-row">
                <span class="vid-time">0:00 / 0:00</span>
                <div class="vid-controls-right">
                  ${mainSubsHTML ? `
                  <div class="vid-cc-wrap">
                    <button class="vid-ctrl-btn vid-cc-btn" title="Субтитры">CC</button>
                    <div class="vid-cc-menu vid-cc-menu--hidden">${mainCcMenuHTML}</div>
                  </div>` : ''}
                  <button class="vid-ctrl-btn vid-vol-btn" title="Звук">&#128266;</button>
                  <button class="vid-ctrl-btn vid-fs-btn" title="Полный экран">&#x26F6;</button>
                </div>
              </div>
            </div>
          </div>
          <div class="photo-page-caption">
            <div class="ppc-rule"></div>
            <h3 class="ppc-title">${author.name}</h3>
            <p class="ppc-sub">${author.dates}</p>
            <div class="ppc-rule"></div>
          </div>
        </div>
      `;

      // ПРАВАЯ СТРАНИЦА (Текст и медиа)
      const bioHTML = author.bio.map(p => `<p class="scroll-text">${p}</p>`).join('');
      const factsHTML = author.facts.map(f => `<li><span class="fd">◆</span>${f}</li>`).join('');
      const linksHTML = author.links && author.links.length ? author.links.map(l => `<a class="scroll-link" href="${l.url}" target="_blank" rel="noopener"><span class="sl-d">◆</span>${l.title}</a>`).join('') : '';
      const galleryHTML = author.gallery && author.gallery.length ? author.gallery.map(img => `<a class="sg-item" href="${img}" data-fancybox="gal-${author.id}" data-caption=""><img src="${img}" alt="" loading="lazy"><span class="sg-label"></span></a>`).join('') : '';

      let extraVideoHTML = '';
      if (author.extraVideo) {
        let extraSubsHTML = '';
        let extraCcMenuHTML = '<button class="vid-cc-opt" data-lang="off">Выкл</button>';
        if (author.extraVideo.subs && author.extraVideo.subs.length > 0) {
          author.extraVideo.subs.forEach(sub => {
            extraSubsHTML += `<track kind="subtitles" srclang="${sub.lang}" label="${sub.label}" src="${sub.src}">`;
            extraCcMenuHTML += `<button class="vid-cc-opt" data-lang="${sub.lang}">${sub.label}</button>`;
          });
        }

        extraVideoHTML = `
          <section class="scroll-section">
            <div class="scroll-sec-head"><span class="ssh-orn">&#9654;</span><h3>Видео</h3><div class="ssh-line"></div></div>
            <div class="scroll-video" data-default-sub="ru">
              <video class="sv-player" src="${author.extraVideo.src}" poster="${author.extraVideo.poster}" preload="none" playsinline>
                ${extraSubsHTML}
              </video>
              <div class="sv-layer">
                <div class="vid-center-btn is-play"><span class="vcb-icon">&#9654;</span></div>
                <div class="vid-controls vid-controls--hidden">
                  <div class="vid-progress-wrap">
                    <div class="vid-progress-bar"><div class="vid-progress-fill"></div><div class="vid-progress-thumb"></div></div>
                  </div>
                  <div class="vid-controls-row">
                    <span class="vid-time">0:00 / 0:00</span>
                    <div class="vid-controls-right">
                      ${extraSubsHTML ? `
                      <div class="vid-cc-wrap">
                        <button class="vid-ctrl-btn vid-cc-btn" title="Субтитры">CC</button>
                        <div class="vid-cc-menu vid-cc-menu--hidden">${extraCcMenuHTML}</div>
                      </div>` : ''}
                      <button class="vid-ctrl-btn vid-vol-btn" title="Звук">&#128266;</button>
                      <button class="vid-ctrl-btn vid-fs-btn" title="Полный экран">&#x26F6;</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="sv-caption">${author.extraVideo.caption}</div>
          </section>
        `;
      }

      const rightPage = document.createElement('div');
      rightPage.className = 'page';
      rightPage.innerHTML = `
        <div class="page-inner page-right page-scrollable" style="--page-bg-img:url('img/linen-bg.jpg')">
          <div class="page-emb-border">
            <div class="emb-corner emb-tl"></div><div class="emb-corner emb-tr"></div>
            <div class="emb-corner emb-bl"></div><div class="emb-corner emb-br"></div>
            <div class="emb-edge emb-edge-t"></div><div class="emb-edge emb-edge-b"></div>
          </div>
          <header class="page-header">
            <span class="ph-chapter"></span>
            <span class="ph-book">Знаменитые личности Глубокского края</span>
          </header>
          <div class="scroll-area" id="scroll-${author.id}">
            
            <section class="scroll-section">
              <div class="scroll-sec-head"><span class="ssh-orn">◆</span><h3>Биография</h3><div class="ssh-line"></div></div>
              ${bioHTML}
            </section>
            
            <section class="scroll-section">
              <div class="scroll-sec-head"><span class="ssh-orn">&#10022;</span><h3>Интересные факты</h3><div class="ssh-line"></div></div>
              <ul class="scroll-facts">${factsHTML}</ul>
            </section>

            ${linksHTML ? `
            <section class="scroll-section">
              <div class="scroll-sec-head"><span class="ssh-orn">◆</span><h3>Полезные ссылки</h3><div class="ssh-line"></div></div>
              <div class="scroll-links">${linksHTML}</div>
            </section>` : ''}

            ${galleryHTML ? `
            <section class="scroll-section">
              <div class="scroll-sec-head"><span class="ssh-orn">&#10022;</span><h3>Фотогалерея</h3><div class="ssh-line"></div></div>
              <div class="scroll-gallery">${galleryHTML}</div>
            </section>` : ''}

            ${extraVideoHTML}

            <div class="scroll-ender">◆ · ◆ · ◆</div>
          </div>
          <footer class="page-footer">
            <span class="pf-num"></span><span class="pf-orn">◆</span><span class="pf-num">${rightPageNum}</span>
          </footer>
        </div>
      `;

      anchor.parentNode.insertBefore(leftPage, anchor);
      anchor.parentNode.insertBefore(rightPage, anchor);
    });
  }

  /* ── Звук перелистывания ── */
  let soundMuted = localStorage.getItem('flipMuted') === '1';
  const flipAudio = new Audio('page-flip-sound.mp3');
  flipAudio.preload = 'auto';

  function playFlipSound() {
    if (soundMuted) return;
    try {
      flipAudio.currentTime = 0;
      flipAudio.play().catch(() => { });
    } catch (_) { }
  }

  /* ── Состояние ── */
  let pageFlip = null, lastIdx = 0;
  let soundFiredByCode = false;

  function getIdx() { return pageFlip ? pageFlip.getCurrentPageIndex() : lastIdx; }
  function getNavIdx(i) { for (let n = NAV_ITEMS.length - 1; n >= 0; n--) if (i >= NAV_ITEMS[n].idx) return n; return 0; }

  /* ── Тень переплёта ── */
  function updateGutterShadow(idx) {
    const gutter = document.getElementById('book-gutter-shadow');
    if (!gutter) return;
    const isCover = idx === 0 || idx >= TOTAL - 1;
    gutter.classList.toggle('hidden', isCover);
  }

  /* ── МАСШТАБИРОВАНИЕ КНИГИ ── */
  function scaleBook() {
    const vw = window.innerWidth - 40;
    const vh = window.innerHeight - 40;
    const scale = Math.min(1, vw / (PAGE_W * 2), vh / PAGE_H);

    const wrapper = document.getElementById('book-wrapper');
    const positioner = document.getElementById('book-positioner');
    if (!wrapper || !positioner) return;

    wrapper.style.transform = `scale(${scale})`;

    const idx = getIdx();
    let tx = 0;
    if (idx === 0) tx = -(PAGE_W / 2) * scale;
    else if (idx >= TOTAL - 1) tx = (PAGE_W / 2) * scale;

    positioner.style.transform = `translateX(${tx}px)`;
  }

  /* ── ХЭШ-НАВИГАЦИЯ ── */
  function updateHash() {
    if (!pageFlip) return;
    const idx = pageFlip.getCurrentPageIndex();
    if (window.location.hash !== `#page-${idx}`) {
      window.location.hash = `page-${idx}`;
    }
  }

  function goToHash() {
    if (!pageFlip) return;
    const hash = window.location.hash;
    if (hash && hash.startsWith('#page-')) {
      const pageNum = parseInt(hash.replace('#page-', ''));
      if (!isNaN(pageNum) && pageNum >= 0 && pageNum < TOTAL && pageNum !== getIdx()) {
        soundFiredByCode = true;
        pageFlip.flip(pageNum);
      }
    }
  }

  window.addEventListener('popstate', () => {
    if (pageFlip) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#page-')) {
        const pageNum = parseInt(hash.replace('#page-', ''));
        if (!isNaN(pageNum) && pageNum !== getIdx()) {
          soundFiredByCode = true;
          pageFlip.flip(pageNum);
        }
      }
    }
  });

  function copyCurrentPageLink() {
    const idx = getIdx();
    const url = new URL(window.location.href);
    url.hash = `page-${idx}`;

    navigator.clipboard.writeText(url.toString())
      .then(() => showToast('📎 Ссылка на страницу скопирована!'))
      .catch(() => {
        const tempInput = document.createElement('input');
        tempInput.value = url.toString();
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('📎 Ссылка скопирована!');
      });
  }

  /* ── QR-КОД ── */
  function showQRCode() {
    const idx = getIdx();
    const url = new URL(window.location.href);
    url.hash = `page-${idx}`;
    const linkText = url.toString();
    let modal = document.querySelector('.qr-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'qr-modal';
      modal.innerHTML = `
        <div class="qr-modal-content">
          <span class="qr-close">&times;</span>
          <h3>📖 Ссылка на эту страницу</h3>
          <div class="qr-code-container"><div id="qrcode"></div></div>
          <p class="qr-url"></p>
          <div class="qr-buttons">
            <button class="qr-copy">Копировать ссылку</button>
            <button class="qr-share">Поделиться</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('.qr-close').onclick = () => modal.classList.remove('show');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
    }

    const qrContainer = modal.querySelector('#qrcode');
    qrContainer.innerHTML = '';

    try {
      if (typeof QRCodeStyling !== 'undefined') {
        const qrCode = new QRCodeStyling({
          width: 220,
          height: 220,
          type: 'svg',
          data: linkText,
          image: 'img/ornament-corner.svg', /* <-- Добавлен орнамент в центр */
          qrOptions: {
            errorCorrectionLevel: 'H' /* H позволяет перекрывать до 30% кода картинкой */
          },
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: 8,          /* Отступ от точек QR-кода до орнамента */
            imageSize: 0.35     /* Размер орнамента относительно QR-кода (35%) */
          },
          dotsOptions: {
            color: '#9B1C1C',
            type: 'rounded'
          },
          backgroundOptions: {
            color: '#F8F2E6'
          },
          cornersSquareOptions: {
            color: '#6A0E0E',
            type: 'extra-rounded'
          },
          cornersDotOptions: {
            color: '#9B1C1C',
            type: 'dot'
          }
        });
        qrCode.append(qrContainer);
      }
      else {
        qrContainer.innerHTML = `<div style="padding:20px;text-align:center;">QR library not loaded</div>`;
      }
    } catch (e) {
      console.warn('QR generation error', e);
      qrContainer.innerHTML = `<div style="padding:20px;text-align:center;">⚠️ Ошибка генерации QR-кода</div>`;
    }

    modal.querySelector('.qr-url').textContent = linkText;
    modal.querySelector('.qr-copy').onclick = async () => {
      await navigator.clipboard.writeText(linkText);
      showToast('📎 Ссылка скопирована!');
      modal.classList.remove('show');
    };

    const shareBtn = modal.querySelector('.qr-share');
    shareBtn.onclick = async () => {
      if (navigator.share) {
        try { await navigator.share({ title: document.title, text: `Страница ${idx + 1} из ${TOTAL}`, url: linkText }); } catch (_) { }
      } else {
        await navigator.clipboard.writeText(linkText);
        showToast('📎 Ссылка скопирована!');
      }
      modal.classList.remove('show');
    };

    modal.classList.add('show');
  }

  function showToast(message) {
    let toast = document.querySelector('.toast-message');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-message';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  /* ── ВИДЕОПЛЕЕР ── */
  function fmtTime(s) {
    if (isNaN(s) || s < 0) return '0:00';
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  function setVideoSubtitles(video, lang) {
    if (!video || !video.textTracks) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      const t = video.textTracks[i];
      if (lang !== 'off' && t.language === lang) t.mode = 'hidden';
      else t.mode = 'disabled';
    }
  }

  function initFullPlayer(video, layer, defaultSub) {
    defaultSub = defaultSub || 'off';
    const centerBtn = layer.querySelector('.vid-center-btn');
    const centerIcon = layer.querySelector('.vcb-icon');
    const controls = layer.querySelector('.vid-controls');
    const progWrap = layer.querySelector('.vid-progress-wrap');
    const progBar = layer.querySelector('.vid-progress-bar');
    const progFill = layer.querySelector('.vid-progress-fill');
    const progThumb = layer.querySelector('.vid-progress-thumb');
    const timeEl = layer.querySelector('.vid-time');
    const volBtn = layer.querySelector('.vid-vol-btn');
    const fsBtn = layer.querySelector('.vid-fs-btn');
    const ccBtn = layer.querySelector('.vid-cc-btn');
    const ccMenu = layer.querySelector('.vid-cc-menu');

    if (!centerBtn) return;
    let state = 'initial';
    let ccLang = defaultSub;
    let subDisplay = layer.querySelector('.sv-sub-text');

    if (!subDisplay) {
      subDisplay = document.createElement('div');
      subDisplay.className = 'sv-sub-text';
      const ctrlBlock = layer.querySelector('.vid-controls');
      if (ctrlBlock) layer.insertBefore(subDisplay, ctrlBlock);
      else layer.appendChild(subDisplay);
    }

    function updateSubDisplay() {
      let html = '';
      for (let i = 0; i < video.textTracks.length; i++) {
        const tr = video.textTracks[i];
        if (tr.mode === 'hidden' && tr.activeCues && tr.activeCues.length) {
          for (let j = 0; j < tr.activeCues.length; j++) {
            if (html) html += '<br>';
            const tmp = document.createElement('div');
            tmp.textContent = tr.activeCues[j].text;
            html += tmp.innerHTML;
          }
          break;
        }
      }
      subDisplay.innerHTML = html;
      subDisplay.classList.toggle('sv-sub-text--visible', html !== '');
    }

    function bindCueChange() {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].removeEventListener('cuechange', updateSubDisplay);
        if (video.textTracks[i].mode !== 'disabled') {
          video.textTracks[i].addEventListener('cuechange', updateSubDisplay);
        }
      }
    }

    function setState(s) {
      state = s;
      if (s === 'playing') {
        centerBtn.classList.add('vid-center-btn--hidden');
        centerBtn.classList.remove('is-play');
      } else if (s === 'paused') {
        centerBtn.classList.remove('vid-center-btn--hidden');
        centerBtn.classList.remove('is-play');
        if (centerIcon) centerIcon.textContent = '\u23F8';
      } else {
        centerBtn.classList.remove('vid-center-btn--hidden');
        centerBtn.classList.add('is-play');
        if (centerIcon) centerIcon.textContent = '\u25B6';
      }
      if (s === 'initial') {
        if (controls) controls.classList.add('vid-controls--hidden');
      } else {
        if (controls) controls.classList.remove('vid-controls--hidden');
      }
    }

    function updateProgress() {
      const dur = video.duration || 0;
      const cur = video.currentTime;
      const pct = dur ? (cur / dur * 100) : 0;
      if (progFill) progFill.style.width = pct + '%';
      if (progThumb) progThumb.style.left = pct + '%';
      if (timeEl) timeEl.textContent = fmtTime(cur) + ' / ' + fmtTime(dur);
    }

    function applyDefaultSub() {
      setVideoSubtitles(video, ccLang);
      bindCueChange();
      updateSubDisplay();
      if (ccMenu) {
        ccMenu.querySelectorAll('.vid-cc-opt').forEach(o => o.classList.toggle('cc-selected', o.dataset.lang === ccLang));
      }
      if (ccBtn) ccBtn.classList.toggle('cc-active', ccLang !== 'off');
    }

    if (video.readyState >= 1) applyDefaultSub();
    else video.addEventListener('loadedmetadata', applyDefaultSub, { once: true });

    Array.from(video.querySelectorAll('track')).forEach(trackEl => trackEl.addEventListener('load', applyDefaultSub));
    video.addEventListener('play', applyDefaultSub);
    if (video.textTracks) video.textTracks.addEventListener('change', () => { setVideoSubtitles(video, ccLang); bindCueChange(); });

    layer.addEventListener('mouseenter', () => layer.classList.add('vid-hover'));
    layer.addEventListener('mouseleave', () => layer.classList.remove('vid-hover'));

    centerBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (state === 'playing') { video.pause(); setState('paused'); }
      else { video.play().catch(() => { }); setState('playing'); }
    });

    layer.addEventListener('click', e => {
      if (e.target.closest('.vid-controls') || e.target.closest('.vid-center-btn')) return;
      e.stopPropagation();
      if (state === 'playing') { video.pause(); setState('paused'); }
      else { video.play().catch(() => { }); setState('playing'); }
    });

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('ended', () => setState('ended'));

    if (progWrap && progBar) {
      progWrap.addEventListener('click', e => {
        e.stopPropagation();
        const rect = progBar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        video.currentTime = ratio * (video.duration || 0);
      });
    }

    if (volBtn) {
      volBtn.addEventListener('click', e => {
        e.stopPropagation();
        video.muted = !video.muted;
        volBtn.innerHTML = video.muted ? '&#128263;' : '&#128266;';
      });
    }

    if (fsBtn) {
      fsBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          const fsTarget = layer.closest('.scroll-video') || layer.closest('.photo-page') || video;
          fsTarget.requestFullscreen?.().catch(() => { });
        }
      });
    }

    if (ccBtn && ccMenu) {
      ccBtn.addEventListener('click', e => { e.stopPropagation(); ccMenu.classList.toggle('vid-cc-menu--hidden'); });
      ccMenu.querySelectorAll('.vid-cc-opt').forEach(opt => {
        opt.addEventListener('click', e => {
          e.stopPropagation();
          ccLang = opt.dataset.lang;
          setVideoSubtitles(video, ccLang);
          bindCueChange();
          updateSubDisplay();
          ccMenu.querySelectorAll('.vid-cc-opt').forEach(o => o.classList.remove('cc-selected'));
          opt.classList.add('cc-selected');
          ccBtn.classList.toggle('cc-active', ccLang !== 'off');
          ccMenu.classList.add('vid-cc-menu--hidden');
        });
      });
      document.addEventListener('click', e => {
        if (!ccMenu.contains(e.target) && e.target !== ccBtn) ccMenu.classList.add('vid-cc-menu--hidden');
      });
    }

    setState('initial');
  }

  function resetPlayer(layer) {
    if (!layer) return;
    const btn = layer.querySelector('.vid-center-btn');
    const icon = layer.querySelector('.vcb-icon');
    const ctrl = layer.querySelector('.vid-controls');
    const ccMenu = layer.querySelector('.vid-cc-menu');
    if (btn) { btn.classList.remove('vid-center-btn--hidden'); btn.classList.add('is-play'); }
    if (icon) icon.textContent = '\u25B6';
    if (ctrl) ctrl.classList.add('vid-controls--hidden');
    if (ccMenu) ccMenu.classList.add('vid-cc-menu--hidden');
    layer.classList.remove('vid-hover');
  }

  function stopAllVideos() {
    document.querySelectorAll('.photo-page-video').forEach(video => {
      if (!video.paused) { video.pause(); video.currentTime = 0; }
      resetPlayer(video.closest('.photo-page')?.querySelector('.vid-layer'));
    });
    document.querySelectorAll('.scroll-video .sv-player').forEach(video => {
      if (!video.paused) { video.pause(); video.currentTime = 0; }
      resetPlayer(video.closest('.scroll-video')?.querySelector('.sv-layer'));
    });
  }

  function initVideoPlayers() {
    document.querySelectorAll('.photo-page').forEach(page => {
      const video = page.querySelector('.photo-page-video');
      const layer = page.querySelector('.vid-layer');
      if (!video || !layer) return;
      initFullPlayer(video, layer, page.dataset.defaultSub || 'ru');
    });

    document.querySelectorAll('.scroll-video').forEach(wrap => {
      const video = wrap.querySelector('.sv-player');
      const layer = wrap.querySelector('.sv-layer');
      if (!video || !layer) return;
      initFullPlayer(video, layer, wrap.dataset.defaultSub || 'ru');
    });
  }

  function updateUI() {
    const idx = getIdx(); lastIdx = idx;
    if (!soundFiredByCode) playFlipSound();
    soundFiredByCode = false;

    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = ((idx / (TOTAL - 1)) * 100) + '%';
    document.querySelectorAll('#side-nav ul li a').forEach((a, i) =>
      a.classList.toggle('active', i === getNavIdx(idx)));

    const prev = document.getElementById('btn-prev');
    const next = document.getElementById('btn-next');
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= TOTAL - 1;

    updateGutterShadow(idx);
    stopAllVideos();
    scaleBook();

    if (!window._skipHashUpdate) updateHash();
    window._skipHashUpdate = false;
  }

  function blockFlip(el) {
    if (!el) return;
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev =>
      el.addEventListener(ev, e => e.stopPropagation(), { passive: false })
    );
  }

  function bindScrollAreas() {
    document.querySelectorAll('.scroll-area').forEach(a => {
      a.addEventListener('wheel', e => e.stopPropagation(), { passive: false });
      a.addEventListener('pointerdown', e => e.stopPropagation(), { passive: false });
      a.addEventListener('mousedown', e => e.stopPropagation());
      a.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
    });
  }

  function initPageFlip() {
    const bookEl = document.getElementById('book');
    if (!bookEl || typeof St === 'undefined') { console.warn('StPageFlip not loaded'); return; }

    pageFlip = new St.PageFlip(bookEl, {
      width: PAGE_W, height: PAGE_H,
      size: 'fixed',
      minWidth: PAGE_W, maxWidth: PAGE_W,
      minHeight: PAGE_H, maxHeight: PAGE_H,
      showCover: true,
      usePortrait: false,
      startZIndex: 0,
      autoSize: false,
      maxShadowOpacity: 0.6,
      drawShadow: true,
      flippingTime: 1000,
      useMouseEvents: true,
      swipeDistance: 50,
      clickEventForward: false,
      mobileScrollSupport: false,
      showPageCorners: false
    });

    pageFlip.loadFromHTML(document.querySelectorAll('#book .page'));
    pageFlip.on('flip', updateUI);

    const btnOpen = document.getElementById('btn-open');
    if (btnOpen) {
      blockFlip(btnOpen);
      btnOpen.addEventListener('click', e => { e.stopPropagation(); goTo(1); });
    }

    document.querySelectorAll('.nav-card[data-goto]').forEach(card => {
      blockFlip(card);
      card.addEventListener('click', e => {
        e.stopPropagation();
        goTo(parseInt(card.getAttribute('data-goto')) || 0);
      });
    });

    bindScrollAreas();

    document.querySelectorAll('.scroll-link, .sg-item, .pvb-thumb').forEach(el => blockFlip(el));
    document.querySelectorAll('.vid-layer, .sv-layer').forEach(el => blockFlip(el));
    document.querySelectorAll('.photo-page-caption').forEach(el => blockFlip(el));
    document.querySelectorAll('.scroll-video').forEach(el => blockFlip(el));

    updateUI();

    setTimeout(() => {
      window._skipHashUpdate = true;
      goToHash();
    }, 100);
  }

  function goNext() { if (!pageFlip) return; soundFiredByCode = true; playFlipSound(); pageFlip.flipNext(); }
  function goPrev() { if (!pageFlip) return; soundFiredByCode = true; playFlipSound(); pageFlip.flipPrev(); }
  function goTo(idx) { if (!pageFlip) return; soundFiredByCode = true; playFlipSound(); pageFlip.flip(idx); }

  function initFancybox() {
    if (typeof Fancybox === 'undefined') return;
    document.querySelectorAll('[data-fancybox]').forEach(el => blockFlip(el));
    Fancybox.bind('[data-fancybox]', {
      l10n: Fancybox.l10n.ru_RU,
      on: {
        init: () => document.body.setAttribute('data-fb-open', '1'),
        destroy: () => document.body.removeAttribute('data-fb-open'),
      },
      Thumbs: { showOnStart: false },
      Toolbar: {
        display: { left: ['infobar'], middle: ["zoomIn", "zoomOut"], right: ['slideshow', 'fullscreen', 'thumbsToggle', 'close'] },
      },
      Html: { videoTpl: '<iframe class="fancybox__html5video" src="{src}" allow="autoplay; fullscreen" allowfullscreen></iframe>' },
    });
    document.addEventListener('pointerdown', e => { if (document.body.hasAttribute('data-fb-open')) e.stopImmediatePropagation(); }, true);
  }

  function buildNav() {
    const nav = document.getElementById('side-nav'); if (!nav) return;
    const h = document.createElement('div'); h.className = 'nav-header';
    h.innerHTML = '<span>Содержание</span>'; nav.appendChild(h);
    const ul = document.createElement('ul');
    NAV_ITEMS.forEach(item => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = 'javascript:void(0)';
      a.innerHTML = `<span class="nav-num">${item.num}</span>${item.label}`;
      a.addEventListener('click', () => { closeNav(); goTo(item.idx); });
      li.appendChild(a); ul.appendChild(li);
    });
    nav.appendChild(ul);
  }

  function closeNav() { document.getElementById('side-nav')?.classList.remove('open'); }
  function toggleNav() { document.getElementById('side-nav')?.classList.toggle('open'); }

  function bindButtons() {
    document.getElementById('btn-prev')?.addEventListener('click', goPrev);
    document.getElementById('btn-next')?.addEventListener('click', goNext);
  }

  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (document.body.hasAttribute('data-fb-open')) return;
      if (document.activeElement?.closest?.('.scroll-area')) return;
      if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) { e.preventDefault(); goNext(); }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') closeNav();
    });
  }

  function bindNavToggle() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('side-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', toggleNav);
    document.addEventListener('click', e => { if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav(); });
  }

  function showKeyHint() {
    if (sessionStorage.getItem('hint-shown')) return;
    const hint = document.getElementById('key-hint'); if (!hint) return;
    setTimeout(() => {
      hint.classList.add('visible');
      setTimeout(() => { hint.classList.remove('visible'); sessionStorage.setItem('hint-shown', '1'); }, 3500);
    }, 1400);
  }

  function buildMuteBtn() {
    const btn = document.getElementById('btn-mute');
    if (!btn) return;
    const updateIcon = () => {
      btn.innerHTML = soundMuted ? '🔇' : '🔊';
      btn.title = soundMuted ? 'Включить звук' : 'Отключить звук';
      btn.classList.toggle('muted', soundMuted);
    };
    updateIcon();
    btn.addEventListener('click', () => {
      soundMuted = !soundMuted;
      localStorage.setItem('flipMuted', soundMuted ? '1' : '0');
      updateIcon();
    });
  }

  function buildShareBtn() {
    const btn = document.getElementById('btn-share');
    if (!btn) return;
    btn.addEventListener('click', copyCurrentPageLink);
  }

  function buildQRBtn() {
    const btn = document.getElementById('btn-qr');
    if (!btn) return;
    btn.addEventListener('click', showQRCode);
  }

  /* ── ИНИЦИАЛИЗАЦИЯ И FETCH JSON ── */
  document.addEventListener('DOMContentLoaded', () => {
    updateGutterShadow(0);
    scaleBook();
    window.addEventListener('resize', scaleBook);

    buildNav();
    buildMuteBtn();
    buildShareBtn();
    buildQRBtn();
    bindButtons();
    bindKeyboard();
    bindNavToggle();
    showKeyHint();

    // ЗАГРУЖАЕМ ДАННЫЕ ИЗ DATA.JSON
    fetch('data.json')
      .then(response => {
        if (!response.ok) throw new Error('Сетевая ошибка при загрузке data.json');
        return response.json();
      })
      .then(data => {
        // 1. ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ СТРАНИЦ
        renderAuthorsPages(data);

        // 2. ИНИЦИАЛИЗАЦИЯ ПЛАГИНОВ
        initFancybox();
        initVideoPlayers();

        // 3. ИНИЦИАЛИЗАЦИЯ КНИГИ
        const tryInit = (n) => {
          if (typeof St !== 'undefined' && St.PageFlip) initPageFlip();
          else if (n > 0) setTimeout(() => tryInit(n - 1), 150);
          else console.error('StPageFlip not available');
        };
        tryInit(15);
      })
      .catch(error => {
        console.error('Ошибка загрузки данных:', error);
        alert('Не удалось загрузить данные книги. Убедитесь, что вы запустили проект через локальный сервер (например, Live Server), а не просто открыли файл в браузере.');
      });
  });

  /* ── ПРЕЛОАДЕР ── */
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add('preloader--hidden');
        setTimeout(() => preloader.remove(), 800);
      }, 300);
    }
  });

  window.MagicBook = { goNext, goPrev, goTo, copyCurrentPageLink, showQRCode };
})();