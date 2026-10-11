/*
 * Общий код всех страниц: утилиты, статус «Открыто/Закрыто», шапка,
 * мобильное меню, быстрый поиск, карточки, cookie-баннер, анимации.
 * Без модулей, чтобы сайт открывался с диска (file://).
 */
(function () {
  'use strict';

  var D = window.MILYA;
  var doc = document;
  doc.documentElement.classList.add('js');

  var root = (doc.body && doc.body.getAttribute('data-root')) || '';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Утилиты ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  }
  function page(name, query) {
    var href = name === 'index' ? root + 'index.html' : root + 'pages/' + name + '.html';
    return href + (query || '');
  }
  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var s = hash(String(seed)) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return (s % 100000) / 100000;
    };
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"'’`]/g, '').trim(); }

  /* ---------- Время (Москва) ---------- */

  function moscowNow() {
    var d = new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(d);
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var h = parseInt(o.hour, 10) % 24;
      return { h: h, m: parseInt(o.minute, 10), iso: o.year + '-' + o.month + '-' + o.day, minutes: h * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var msk = new Date(d.getTime() + (d.getTimezoneOffset() + 180) * 60000);
      var y = msk.getFullYear(), mo = ('0' + (msk.getMonth() + 1)).slice(-2), da = ('0' + msk.getDate()).slice(-2);
      return { h: msk.getHours(), m: msk.getMinutes(), iso: y + '-' + mo + '-' + da, minutes: msk.getHours() * 60 + msk.getMinutes() };
    }
  }
  function toMin(hhmm) { var p = hhmm.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function fmtMin(min) { var h = Math.floor(min / 60) % 24, m = min % 60; return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2); }

  // Статус по режиму работы { open, close } в формате "HH:MM"
  function openStatus(hours, now) {
    now = now || moscowNow();
    var o = toMin(hours.open), c = toMin(hours.close), t = now.minutes;
    if (t >= o && t < c) {
      var left = c - t;
      return {
        open: true,
        short: 'Открыто до ' + hours.close,
        text: left <= 60 ? 'Открыто, закроется через ' + left + ' ' + plural(left, 'минуту', 'минуты', 'минут') : 'Открыто до ' + hours.close,
        big: 'Открыто', sub: 'до ' + hours.close, mini: 'до ' + hours.close
      };
    }
    var tomorrow = t >= c;
    return {
      open: false,
      short: tomorrow ? 'Закрыто до ' + hours.open : 'Откроемся в ' + hours.open,
      text: tomorrow ? 'Закрыто, откроемся завтра в ' + hours.open : 'Закрыто, откроемся в ' + hours.open,
      big: 'Закрыто', sub: (tomorrow ? 'откроемся завтра в ' : 'откроемся в ') + hours.open, mini: 'с ' + hours.open
    };
  }

  function updateStatuses() {
    var now = moscowNow();
    $$('[data-status]').forEach(function (el) {
      var key = el.getAttribute('data-status') || 'center';
      var st = openStatus(D.HOURS[key] || D.HOURS.center, now);
      var mode = el.getAttribute('data-status-mode') || 'short';
      el.classList.toggle('is-open', st.open);
      el.classList.toggle('is-closed', !st.open);
      var txt = el.querySelector('.status__text');
      if (txt) txt.textContent = st[mode];
      var sub = el.querySelector('.status__sub');
      if (sub) sub.textContent = st.sub;
    });
    $$('[data-clock]').forEach(function (el) { el.textContent = fmtMin(now.minutes); });
  }

  /* ---------- Даты ---------- */

  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  function parseISO(iso) { var p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function isoOf(d) { return d.toISOString().slice(0, 10); }
  function fmtDate(iso, withYear) {
    var d = parseISO(iso);
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + (withYear ? ' ' + d.getUTCFullYear() : '');
  }

  /* ---------- Данные ---------- */

  var tenantMap = {}, catMap = {}, typeMap = {};
  D.TENANTS.forEach(function (t) { tenantMap[t.id] = t; });
  D.CATEGORIES.forEach(function (c) { catMap[c.id] = c; });
  D.NEWS_TYPES.forEach(function (t) { typeMap[t.id] = t; });
  var CAT_TONE = { products: 2, fashion: 1, kids: 5, electronics: 6, beauty: 4, pets: 3, books: 1, food: 3, fun: 6, services: 5 };
  var NEWS_TONE = { promo: 2, event: 1, news: 3, cinema: 6 };

  function tone(t) { return CAT_TONE[t.cat] || 1; }
  function catName(id, short) { var c = catMap[id]; return c ? (short && c.short ? c.short : c.name) : ''; }
  function hoursOf(t) { return t.hours || D.HOURS.center.label; }
  function phoneOf(t) { return t.phone || D.PHONE_STUB; }
  function telHref(p) { return 'tel:' + p.replace(/[^\d+]/g, '').replace(/^8/, '+7'); }
  function whereOf(t) { return t.noUnit ? t.floor + ' этаж, ' + t.unit : t.floor + ' этаж, секция ' + t.unit; }

  // Словесный знак вместо логотипа. TODO: когда появятся логотипы, задайте t.logo
  function initials(name) {
    var w = name.replace(/[«»"']/g, '').split(/[\s-]+/).filter(Boolean);
    if (name.length <= 4) return name;
    return w.length > 1 ? (w[0][0] + w[1][0]).toUpperCase() : w[0].slice(0, 2);
  }
  // mini: маленький значок с инициалами (для списков и подсказок)
  function wordmark(t, extra, mini) {
    var style = hash(t.id) % 4;
    var cls = 'wm tone-' + tone(t) + (style === 1 ? ' wm--caps' : style === 2 ? ' wm--serif' : style === 3 ? ' wm--light' : '') + (extra ? ' ' + extra : '');
    if (t.logo) return '<span class="' + cls + '"><img src="' + root + esc(t.logo) + '" alt="" loading="lazy"></span>';
    return '<span class="' + cls + (mini ? ' wm--mini' : '') + '" aria-hidden="true">' + esc(mini ? initials(t.name) : t.name) + '</span>';
  }

  /* ---------- SVG-обложки (плейсхолдеры) ----------
   * Рисуют аккуратную обложку по seed. Цвета берутся из CSS-переменных тона,
   * поэтому работают в светлой и темной теме.
   * TODO: заменить на реальные фото, когда они появятся (поле image/poster в data.js).
   */
  function art(seed, opts) {
    opts = opts || {};
    var r = rng(seed);
    var w = opts.w || 400, h = opts.h || 300;
    var kind = opts.kind != null ? opts.kind : Math.floor(r() * 5);
    var g = '';
    var fg = 'currentColor';
    var acc = 'var(--accent)';
    var i, j;
    if (kind === 0) { // концентрические дуги
      var cx = w * (0.55 + r() * 0.4), cy = h * (0.6 + r() * 0.5);
      for (i = 1; i <= 9; i++) g += '<circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + (i * w * 0.09).toFixed(0) + '" fill="none" stroke="' + fg + '" stroke-opacity="' + (0.12 + i * 0.03).toFixed(2) + '" stroke-width="2"/>';
      g += '<circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + (w * 0.07).toFixed(0) + '" fill="' + acc + '"/>';
    } else if (kind === 1) { // сетка точек: паттерн + несколько акцентных точек
      var step = 22 + Math.floor(r() * 10);
      var pid = 'dots-' + hash(String(seed) + w);
      g += '<defs><pattern id="' + pid + '" width="' + step + '" height="' + step + '" patternUnits="userSpaceOnUse">' +
        '<circle cx="' + step / 2 + '" cy="' + step / 2 + '" r="2.2" fill="' + fg + '" fill-opacity=".35"/></pattern></defs>' +
        '<rect width="' + w + '" height="' + h + '" fill="url(#' + pid + ')"/>';
      for (i = 0; i < 7; i++) {
        g += '<circle cx="' + (step / 2 + Math.floor(r() * (w / step)) * step) + '" cy="' + (step / 2 + Math.floor(r() * (h / step)) * step) + '" r="7" fill="' + acc + '"/>';
      }
    } else if (kind === 2) { // диагональные полосы
      var sw = 18 + Math.floor(r() * 16);
      for (i = -h; i < w + h; i += sw * 2) g += '<path d="M' + i + ' ' + h + 'L' + (i + h) + ' 0" stroke="' + fg + '" stroke-opacity=".14" stroke-width="' + sw + '"/>';
      g += '<rect x="' + (w * 0.08).toFixed(0) + '" y="' + (h * 0.12).toFixed(0) + '" width="' + (w * 0.3).toFixed(0) + '" height="' + (w * 0.3).toFixed(0) + '" rx="' + (w * 0.15).toFixed(0) + '" fill="' + acc + '"/>';
    } else if (kind === 3) { // арки, как галерея ТЦ
      var n = 4 + Math.floor(r() * 3), aw = w / n;
      for (i = 0; i < n; i++) {
        var top = h * (0.25 + r() * 0.35);
        g += '<path d="M' + (i * aw + 6).toFixed(0) + ' ' + h + 'V' + (top + aw / 2).toFixed(0) + 'a' + (aw / 2 - 6).toFixed(0) + ' ' + (aw / 2 - 6).toFixed(0) + ' 0 0 1 ' + (aw - 12).toFixed(0) + ' 0V' + h + 'z" fill="' + (i === 1 ? acc : fg) + '" fill-opacity="' + (i === 1 ? 1 : 0.16 + (i % 2) * 0.08) + '"/>';
      }
    } else { // волны
      for (i = 0; i < 7; i++) {
        var y = h * 0.2 + i * h * 0.11, a = 16 + r() * 22;
        g += '<path d="M0 ' + y.toFixed(0) + ' C ' + (w * 0.25) + ' ' + (y - a).toFixed(0) + ', ' + (w * 0.5) + ' ' + (y + a).toFixed(0) + ', ' + w + ' ' + (y - a / 2).toFixed(0) + '" fill="none" stroke="' + (i === 3 ? acc : fg) + '" stroke-opacity="' + (i === 3 ? 1 : 0.25) + '" stroke-width="' + (i === 3 ? 10 : 3) + '" stroke-linecap="round"/>';
      }
    }
    var label = opts.label ? '<text x="' + (w * 0.06).toFixed(0) + '" y="' + (h * 0.9).toFixed(0) + '" fill="' + fg + '" font-family="Unbounded, Arial Black, sans-serif" font-weight="600" font-size="' + (opts.labelSize || 28) + '" letter-spacing="-1">' + esc(opts.label) + '</text>' : '';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + g + label + '</svg>';
  }

  function artBox(seed, toneN, cls, opts, img, alt) {
    if (img) return '<div class="art tone-' + toneN + ' ' + cls + '"><img src="' + root + esc(img) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async"></div>';
    return '<div class="art tone-' + toneN + ' ' + cls + '">' + art(seed, opts) + '</div>';
  }

  /* ---------- Карточки ---------- */

  function newsCard(n, opts) {
    opts = opts || {};
    var type = typeMap[n.type] || { name: '' };
    var href = page('news-item', '?id=' + encodeURIComponent(n.id));
    var hTag = opts.hTag || 'h3';
    return '<article class="news-card">' +
      '<span class="badge ' + (n.type === 'promo' ? 'badge--accent' : 'badge--dark') + ' news-card__badge">' + esc(type.name) + '</span>' +
      artBox(n.id, NEWS_TONE[n.type] || 1, 'news-card__art', {}, n.image, '') +
      '<p class="news-card__meta"><time datetime="' + n.date + '">' + fmtDate(n.date) + '</time>' +
      (n.tenant && tenantMap[n.tenant] ? '<span aria-hidden="true">·</span><span>' + esc(tenantMap[n.tenant].name) + '</span>' : '') + '</p>' +
      '<' + hTag + ' class="news-card__title"><a href="' + href + '">' + esc(n.title) + '</a></' + hTag + '>' +
      '<p class="news-card__lead">' + esc(n.lead) + '</p>' +
      '</article>';
  }

  function tenantCard(t) {
    return '<article class="tenant" data-id="' + t.id + '">' +
      wordmark(t) +
      '<div class="tenant__body">' +
      '<p class="tenant__cat">' + esc(t.kind || catName(t.cat, true)) + '</p>' +
      '<h3 class="tenant__name"><button type="button" data-open-tenant="' + t.id + '" aria-haspopup="dialog">' + esc(t.name) + '</button></h3>' +
      '<p class="tenant__desc">' + esc(t.desc) + '</p>' +
      '<ul class="tenant__meta">' +
      '<li>' + icon('layers') + '<span>' + esc(whereOf(t)) + '</span></li>' +
      '<li>' + icon('clock') + '<span>' + esc(hoursOf(t)) + '</span></li>' +
      '<li>' + icon('phone') + '<span>' + esc(phoneOf(t)) + '</span></li>' +
      '</ul></div></article>';
  }

  /* ---------- Диалог арендатора ---------- */

  var dialog;
  function openTenant(id, opener) {
    var t = tenantMap[id];
    if (!t) return;
    if (!dialog) {
      dialog = doc.createElement('dialog');
      dialog.className = 'tdialog';
      dialog.setAttribute('aria-labelledby', 'tdialog-title');
      doc.body.appendChild(dialog);
      dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
      dialog.addEventListener('close', function () {
        if (dialog._opener && doc.body.contains(dialog._opener)) dialog._opener.focus();
        if (dialog._onclose) dialog._onclose();
      });
    }
    var phone = phoneOf(t);
    var extra = '';
    if (t.site) extra += '<a class="btn btn--sm" href="' + esc(t.site) + '" target="_blank" rel="noopener">' + icon('arrow-ne') + 'Сайт</a>';
    if (t.telegram) extra += '<a class="btn btn--sm" href="' + esc(t.telegram) + '" target="_blank" rel="noopener">' + icon('arrow-ne') + 'Telegram</a>';
    if (t.link === 'cinema') extra = '<a class="btn btn--sm btn--accent" href="' + page('cinema') + '">' + icon('film') + 'Афиша</a>' + extra;
    dialog.innerHTML =
      '<button type="button" class="icon-btn tdialog__close" aria-label="Закрыть">' + icon('close') + '</button>' +
      wordmark(t) +
      '<div class="tdialog__body">' +
      '<p class="tenant__cat">' + esc(t.kind || catName(t.cat)) + '</p>' +
      '<h2 id="tdialog-title">' + esc(t.name) + '</h2>' +
      '<p class="muted">' + esc(t.desc) + '</p>' +
      '<ul class="facts">' +
      '<li>' + icon('layers') + '<div><strong>' + esc(whereOf(t)) + '</strong><span>Где найти</span></div></li>' +
      '<li>' + icon('clock') + '<div><strong>' + esc(hoursOf(t)) + '</strong><span>Часы работы</span></div></li>' +
      '<li>' + icon('phone') + '<div><strong><a href="' + telHref(phone) + '">' + esc(phone) + '</a></strong><span>Телефон</span></div></li>' +
      '</ul>' +
      (t.tags && t.tags.length ? '<p class="tdialog__tags">' + t.tags.map(function (x) { return '<span class="badge">' + esc(x) + '</span>'; }).join('') + '</p>' : '') +
      '<div class="tdialog__actions">' +
      (t.noUnit ? '' : '<a class="btn btn--dark btn--sm" href="' + page('map', '?shop=' + t.id) + '">' + icon('plan') + 'Показать на схеме</a>') +
      extra + '</div></div>';
    dialog.querySelector('.tdialog__close').addEventListener('click', function () { dialog.close(); });
    dialog._opener = opener || doc.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }
  function onDialogClose(fn) { if (dialog) dialog._onclose = fn; else setTimeout(function () { if (dialog) dialog._onclose = fn; }, 0); }

  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-open-tenant]');
    if (b) { e.preventDefault(); openTenant(b.getAttribute('data-open-tenant'), b); }
  });

  /* ---------- Поиск ---------- */

  function searchTenants(q) {
    q = norm(q);
    if (!q) return [];
    var out = [];
    D.TENANTS.forEach(function (t) {
      var name = norm(t.name);
      var score = 0;
      if (name.indexOf(q) === 0) score = 3;
      else if (name.indexOf(q) > -1) score = 2;
      else if (norm(catName(t.cat) + ' ' + (t.kind || '') + ' ' + (t.tags || []).join(' ')).indexOf(q) > -1) score = 1;
      if (score) out.push({ t: t, s: score });
    });
    out.sort(function (a, b) { return b.s - a.s || a.t.name.localeCompare(b.t.name, 'ru'); });
    return out.map(function (x) { return x.t; });
  }

  // Быстрый поиск-комбобокс (главная)
  function initQuickSearch(form) {
    var input = form.querySelector('input');
    var list = form.querySelector('.qsearch__list');
    var live = form.querySelector('[data-live]');
    var items = [], active = -1;

    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
    function render() {
      var q = input.value;
      if (!q.trim()) { close(); return; }
      items = searchTenants(q).slice(0, 6);
      active = -1;
      if (!items.length) {
        list.innerHTML = '<li class="qsearch__empty" role="presentation">Ничего не нашли. Попробуйте «обувь» или «кофе».</li>';
      } else {
        list.innerHTML = items.map(function (t, i) {
          return '<li role="presentation"><a class="qsearch__opt" role="option" id="qs-opt-' + i + '" aria-selected="false" href="' + page('shops', '?shop=' + t.id) + '">' +
            wordmark(t, '', true) + '<span><strong>' + esc(t.name) + '</strong><span>' + esc(t.kind || catName(t.cat, true)) + ' · ' + esc(whereOf(t)) + '</span></span></a></li>';
        }).join('');
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (live) live.textContent = items.length ? 'Найдено: ' + items.length : 'Ничего не найдено';
    }
    function move(d) {
      if (!items.length) return;
      active = (active + d + items.length) % items.length;
      $$('.qsearch__opt', list).forEach(function (el, i) { el.setAttribute('aria-selected', i === active ? 'true' : 'false'); });
      input.setAttribute('aria-activedescendant', 'qs-opt-' + active);
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', function () { if (input.value.trim()) render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) render(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Escape') { close(); }
      else if (e.key === 'Enter' && active > -1) { e.preventDefault(); location.href = $$('.qsearch__opt', list)[active].href; }
    });
    doc.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      location.href = page('shops', q ? '?q=' + encodeURIComponent(q) : '');
    });
    $$('[data-q]', form.parentNode).forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-q'); input.focus(); render(); });
    });
  }

  /* ---------- Сеансы кино ----------
   * TODO: заглушка. Сеансы генерируются по дате, пока нет выгрузки расписания «Киномакс».
   */
  function sessions(iso) {
    return D.FILMS.map(function (f, idx) {
      var r = rng(iso + f.id);
      var hall = (idx % 6) + 1;
      var t = 600 + Math.round(r() * 18) * 5 + idx * 10;
      var list = [];
      while (t + 30 <= 23 * 60 + 30 && list.length < 6) {
        list.push({ time: t, hall: hall, dolby: f.dolby && (hall <= 2 || r() > 0.5) });
        t += f.duration + 20 + Math.round(r() * 10) * 5 + (r() > 0.6 ? 60 : 0);
        t = Math.ceil(t / 5) * 5;
      }
      return { film: f, list: list };
    });
  }

  /* ---------- Шапка и меню ---------- */

  function initHeader() {
    var header = $('.header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    var burger = $('.burger');
    var menu = $('#mnav');
    if (!burger || !menu) return;
    function setOpen(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      menu.classList.toggle('is-open', open);
      doc.body.classList.toggle('menu-open', open);
      if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
      if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
    }
    menu.setAttribute('inert', '');
    burger.addEventListener('click', function () { setOpen(burger.getAttribute('aria-expanded') !== 'true'); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setOpen(false); burger.focus(); }
    });
    // Фокус не уходит за пределы открытого меню
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('a, button', menu);
      if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); burger.focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); burger.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && menu.classList.contains('is-open')) setOpen(false); });
  }

  /* ---------- Cookie ---------- */

  function initCookie() {
    var KEY = 'milya-cookie-accepted';
    var ok = false;
    try { ok = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (ok) return;
    var el = doc.createElement('div');
    el.className = 'cookie';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Уведомление о cookie');
    el.innerHTML = '<p>Мы используем cookie, чтобы сайт работал удобнее. Подробнее в <a href="https://www.tcmilya.ru/policy/">политике конфиденциальности</a>.</p>' +
      '<button type="button" class="btn btn--accent btn--sm">Принять</button>';
    doc.body.appendChild(el);
    el.querySelector('button').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      el.remove();
    });
  }

  /* ---------- Появление и счетчики ---------- */

  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length) return;
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var out = el.querySelector('.num') || el;
      if (reduceMotion) { out.textContent = target; return; }
      var start = null, dur = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        out.textContent = Math.round(target * e);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (el) {
      if (!reduceMotion) { var out = el.querySelector('.num') || el; out.textContent = '0'; }
      io.observe(el);
    });
  }

  /* ---------- Старт ---------- */

  window.Milya = {
    D: D, root: root, esc: esc, $: $, $$: $$, icon: icon, page: page, param: param, rng: rng, hash: hash, plural: plural, norm: norm,
    moscowNow: moscowNow, openStatus: openStatus, fmtMin: fmtMin, toMin: toMin, fmtDate: fmtDate, parseISO: parseISO, isoOf: isoOf,
    MONTHS: MONTHS, MONTHS_SHORT: MONTHS_SHORT, WEEKDAYS: WEEKDAYS,
    tenant: function (id) { return tenantMap[id]; }, cat: function (id) { return catMap[id]; }, newsType: function (id) { return typeMap[id]; },
    catName: catName, tone: tone, NEWS_TONE: NEWS_TONE, hoursOf: hoursOf, phoneOf: phoneOf, telHref: telHref, whereOf: whereOf,
    wordmark: wordmark, art: art, artBox: artBox, newsCard: newsCard, tenantCard: tenantCard, openTenant: openTenant, onDialogClose: onDialogClose,
    searchTenants: searchTenants, sessions: sessions, reduceMotion: reduceMotion, initReveal: initReveal
  };

  initHeader();
  updateStatuses();
  setInterval(updateStatuses, 30000);
  $$('form.qsearch').forEach(initQuickSearch);
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  $$('[data-route]').forEach(function (a) { a.href = D.ROUTE_URL; });
  $$('[data-kinomax]').forEach(function (a) { a.href = D.KINOMAX_URL; });
  $$('[data-mapurl]').forEach(function (a) { a.href = D.MAP_URL; });
  // Скрипты подключены с defer: DOMContentLoaded наступит после скриптов страниц,
  // поэтому анимации увидят и динамически отрисованные блоки.
  var started = false;
  function start() {
    if (started) return;
    started = true;
    initReveal();
    initCounters();
    initCookie();
  }
  if (doc.readyState === 'complete') start();
  else doc.addEventListener('DOMContentLoaded', start);
})();
