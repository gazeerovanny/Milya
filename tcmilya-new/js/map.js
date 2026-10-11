/*
 * Интерактивная схема ТРЦ: этажи, подсветка при наведении, поиск с подсветкой.
 * Планировка берется из MILYA.FLOORS (data.js).
 * TODO: схема условная, перерисовать по реальным поэтажным планам.
 */
(function () {
  'use strict';
  var M = window.Milya, D = M.D, esc = M.esc;
  var stage = M.$('[data-map-stage]');
  if (!stage) return;

  var svgWrap = M.$('[data-map-svg]');
  var tabsEl = M.$('[data-map-floors]');
  var listEl = M.$('[data-map-list]');
  var input = M.$('#map-search');
  var clearBtn = M.$('[data-map-clear]');
  var titleEl = M.$('[data-map-floor-title]');
  var noteEl = M.$('[data-map-floor-note]');
  var infoEl = M.$('[data-map-info]');
  var countEl = M.$('[data-map-count]');
  var tip = M.$('[data-map-tip]');
  var legendEl = M.$('[data-map-legend]');

  var W = 1000, H = 560, X0 = 20, TOP = 20, ROW = 220, COR = 80;
  var state = { floor: 1, q: '', selected: null };

  // Где находится каждый арендатор на схеме
  var placed = {};
  D.FLOORS.forEach(function (f) {
    [['top', TOP], ['bottom', TOP + ROW + COR]].forEach(function (r) {
      var x = X0;
      f[r[0]].forEach(function (u) {
        placed[u[0]] = { floor: f.n, x: x, y: r[1], w: u[1], h: ROW };
        x += u[1];
      });
    });
  });

  function wrap(name, w, fs) {
    var maxChars = Math.max(4, Math.floor((w - 24) / (fs * 0.56)));
    var words = name.split(/\s+/), lines = [], line = '';
    words.forEach(function (word) {
      if (!line) line = word;
      else if ((line + ' ' + word).length <= maxChars) line += ' ' + word;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    return lines.map(function (l) { return l.length > maxChars ? l.slice(0, maxChars - 1) + '…' : l; });
  }

  function unitSvg(id) {
    var t = M.tenant(id), p = placed[id];
    if (!t || !p) return '';
    var fs = p.w >= 200 ? 20 : p.w >= 130 ? 16 : 14;
    var lines = wrap(t.name, p.w, fs);
    if (lines.length > 3) { fs -= 2; lines = wrap(t.name, p.w, fs).slice(0, 3); }
    var cx = p.x + p.w / 2, cy = p.y + p.h / 2 - (lines.length - 1) * fs * 0.6;
    var text = lines.map(function (l, i) {
      return '<text x="' + cx + '" y="' + (cy + i * fs * 1.2) + '" text-anchor="middle" font-size="' + fs + '">' + esc(l) + '</text>';
    }).join('');
    return '<g class="unit tone-' + M.tone(t) + '" data-id="' + id + '" tabindex="0" role="button" aria-label="' +
      esc(t.name + ', ' + (t.kind || M.catName(t.cat, true)) + ', секция ' + t.unit) + '">' +
      '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="10"/>' + text +
      '<text class="unit-no" x="' + cx + '" y="' + (p.y + p.h - 18) + '" text-anchor="middle" font-size="12">' + esc(t.unit) + '</text></g>';
  }

  function amenity(x, label, w) {
    var y = TOP + ROW + COR / 2;
    return '<g class="amenity"><rect x="' + (x - w / 2) + '" y="' + (y - 15) + '" width="' + w + '" height="30" rx="15" fill="var(--surface)" stroke="var(--line-strong)" stroke-width="2"/>' +
      '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle">' + label + '</text></g>';
  }

  function floorSvg(f) {
    var units = f.top.concat(f.bottom).map(function (u) { return unitSvg(u[0]); }).join('');
    var corY = TOP + ROW;
    var extra = amenity(330, 'WC', 56) + amenity(500, 'Лифт', 70) + amenity(680, 'Эскалатор', 112);
    if (f.n === 1) {
      extra += '<path class="entrance" d="M0 ' + (corY + 26) + 'h14v-10l16 24-16 24v-10H0z"/>' +
        '<path class="entrance" d="M1000 ' + (corY + 26) + 'h-14v-10l-16 24 16 24v-10h14z"/>' +
        '<text class="entrance-label" x="40" y="' + (corY + 45) + '">ВХОД</text>' +
        '<text class="entrance-label" x="960" y="' + (corY + 45) + '" text-anchor="end">ВХОД</text>';
    }
    return '<svg class="mapx__svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Схема, ' + f.title + '">' +
      '<rect class="corridor" x="' + X0 + '" y="' + TOP + '" width="' + (W - 2 * X0) + '" height="' + (H - 2 * TOP) + '" rx="20"/>' +
      units + extra +
      '<rect class="walls" x="' + X0 + '" y="' + TOP + '" width="' + (W - 2 * X0) + '" height="' + (H - 2 * TOP) + '" rx="20"/>' +
      '</svg>';
  }

  function floorObj(n) { return D.FLOORS.filter(function (f) { return f.n === n; })[0]; }
  function matches() {
    var q = state.q.trim();
    if (!q) return null;
    return M.searchTenants(q).filter(function (t) { return placed[t.id]; });
  }

  /* Этажи */
  tabsEl.innerHTML = D.FLOORS.map(function (f) {
    return '<button type="button" role="tab" id="floor-tab-' + f.n + '" aria-controls="map-panel" aria-selected="false" tabindex="-1" data-floor="' + f.n + '">' +
      f.n + ' этаж<span class="hits" hidden></span></button>';
  }).join('');
  var tabs = M.$$('[data-floor]', tabsEl);
  tabsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-floor]');
    if (b) setFloor(+b.getAttribute('data-floor'));
  });
  tabsEl.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement), n = tabs.length;
    if (i < 0) return;
    var j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : -1;
    if (j > -1) { e.preventDefault(); tabs[j].focus(); setFloor(+tabs[j].getAttribute('data-floor')); }
  });

  /* Легенда */
  if (legendEl) {
    var used = {};
    D.TENANTS.forEach(function (t) { if (placed[t.id]) used[t.cat] = true; });
    legendEl.innerHTML = D.CATEGORIES.filter(function (c) { return used[c.id]; }).map(function (c) {
      return '<span><i class="tone-' + M.tone({ cat: c.id }) + '" style="background:var(--t-bg)"></i>' + esc(c.short || c.name) + '</span>';
    }).join('') + '<span><i style="background:var(--accent)"></i>Найдено</span>';
  }

  function setFloor(n) {
    state.floor = n;
    var f = floorObj(n);
    tabs.forEach(function (t) {
      var on = +t.getAttribute('data-floor') === n;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    M.$('#map-panel').setAttribute('aria-labelledby', 'floor-tab-' + n);
    titleEl.textContent = f.title;
    noteEl.textContent = f.note;
    svgWrap.innerHTML = floorSvg(f);
    paint();
  }

  function paint() {
    var ms = matches();
    var ids = ms ? ms.map(function (t) { return t.id; }) : null;
    M.$$('.unit', svgWrap).forEach(function (u) {
      var id = u.getAttribute('data-id');
      u.classList.toggle('is-match', !!ids && ids.indexOf(id) > -1 && id !== state.selected);
      u.classList.toggle('is-dim', !!ids && ids.indexOf(id) < 0 && id !== state.selected);
      u.classList.toggle('is-selected', id === state.selected);
    });
    tabs.forEach(function (t) {
      var n = +t.getAttribute('data-floor');
      var hits = ms ? ms.filter(function (x) { return placed[x.id].floor === n; }).length : 0;
      var badge = t.querySelector('.hits');
      badge.hidden = !hits;
      badge.textContent = hits;
      t.setAttribute('aria-label', n + ' этаж' + (hits ? ', совпадений: ' + hits : ''));
    });
    renderList(ms);
  }

  function renderList(ms) {
    var items = ms || D.TENANTS.filter(function (t) { return placed[t.id] && placed[t.id].floor === state.floor; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    countEl.textContent = ms ? (ms.length ? 'Найдено: ' + ms.length : 'Ничего не найдено') : 'На этаже: ' + items.length;
    listEl.innerHTML = items.map(function (t) {
      return '<li><button type="button" data-pick="' + t.id + '" aria-pressed="' + (t.id === state.selected ? 'true' : 'false') + '">' +
        M.wordmark(t, '', true) + '<span><strong>' + esc(t.name) + '</strong><small>' + placed[t.id].floor + ' этаж, ' + esc(t.kind || M.catName(t.cat, true)) + '</small></span></button></li>';
    }).join('') || '<li class="muted" style="padding:10px">Попробуйте другое название.</li>';
  }

  function select(id, scroll) {
    var t = M.tenant(id);
    if (!t || !placed[id]) return;
    state.selected = id;
    if (placed[id].floor !== state.floor) setFloor(placed[id].floor); else paint();
    infoEl.hidden = false;
    infoEl.innerHTML = '<div class="map-info__head">' + M.wordmark(t, '', true) + '<div><strong>' + esc(t.name) + '</strong><span>' +
      esc(M.whereOf(t)) + '. ' + esc(M.hoursOf(t)) + '</span></div></div>' +
      '<p class="muted">' + esc(t.desc) + '</p>' +
      '<div class="map-info__actions"><button type="button" class="btn btn--sm btn--dark" data-open-tenant="' + t.id + '" aria-haspopup="dialog">Подробнее</button>' +
      (t.link === 'cinema' ? '<a class="btn btn--sm btn--accent" href="cinema.html">Афиша</a>' : '') + '</div>';
    if (scroll) {
      var unit = M.$('.unit[data-id="' + id + '"]', svgWrap);
      var sc = M.$('.mapx__scroll');
      if (unit && sc && sc.scrollWidth > sc.clientWidth) {
        var p = placed[id];
        sc.scrollLeft = (p.x + p.w / 2) / W * sc.scrollWidth - sc.clientWidth / 2;
      }
    }
    try { var u = new URL(location.href); u.searchParams.set('shop', id); history.replaceState(null, '', u.pathname + u.search); } catch (e) {}
  }

  /* Наведение и клики */
  function hoverUnit(id, on) {
    var u = M.$('.unit[data-id="' + id + '"]', svgWrap);
    if (u) u.classList.toggle('is-hover', on);
    var b = M.$('[data-pick="' + id + '"]', listEl);
    if (b) b.classList.toggle('is-hover', on);
  }
  svgWrap.addEventListener('mouseover', function (e) {
    var u = e.target.closest('.unit');
    if (!u) return;
    var t = M.tenant(u.getAttribute('data-id'));
    hoverUnit(t.id, true);
    tip.innerHTML = esc(t.name) + '<small>' + esc(t.kind || M.catName(t.cat, true)) + ', ' + esc(t.unit) + '</small>';
    tip.hidden = false;
  });
  svgWrap.addEventListener('mousemove', function (e) {
    if (tip.hidden) return;
    var r = stage.getBoundingClientRect();
    tip.style.left = (e.clientX - r.left) + 'px';
    tip.style.top = (e.clientY - r.top) + 'px';
  });
  svgWrap.addEventListener('mouseout', function (e) {
    var u = e.target.closest('.unit');
    if (!u) return;
    hoverUnit(u.getAttribute('data-id'), false);
    tip.hidden = true;
  });
  svgWrap.addEventListener('click', function (e) {
    var u = e.target.closest('.unit');
    if (u) select(u.getAttribute('data-id'));
  });
  svgWrap.addEventListener('keydown', function (e) {
    var u = e.target.closest('.unit');
    if (u && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(u.getAttribute('data-id')); }
  });
  listEl.addEventListener('mouseover', function (e) { var b = e.target.closest('[data-pick]'); if (b) hoverUnit(b.getAttribute('data-pick'), true); });
  listEl.addEventListener('mouseout', function (e) { var b = e.target.closest('[data-pick]'); if (b) hoverUnit(b.getAttribute('data-pick'), false); });
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]');
    if (!b) return;
    select(b.getAttribute('data-pick'), true);
    var again = M.$('[data-pick="' + b.getAttribute('data-pick') + '"]', listEl);
    if (again) again.focus();
  });

  /* Поиск */
  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      state.q = input.value;
      clearBtn.hidden = !state.q;
      var ms = matches();
      if (ms && ms.length && !ms.some(function (t) { return placed[t.id].floor === state.floor; })) setFloor(placed[ms[0].id].floor);
      else paint();
    }, 120);
  });
  input.closest('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var ms = matches();
    if (ms && ms.length) select(ms[0].id, true);
  });
  clearBtn.addEventListener('click', function () { input.value = ''; state.q = ''; clearBtn.hidden = true; paint(); input.focus(); });

  /* Старт */
  var shop = M.param('shop'), q = M.param('q');
  if (q) { input.value = q; state.q = q; clearBtn.hidden = false; }
  setFloor(1);
  if (shop && placed[shop]) select(shop, true);
})();
