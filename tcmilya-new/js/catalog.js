/*
 * Каталог арендаторов: поиск, фильтр по категории и этажу, карточки, диалог.
 * Используется на страницах «Магазины», «Еда», «Развлечения», «Услуги».
 * <section data-catalog data-cat="food"> фиксирует категорию (фильтр категорий скрыт).
 */
(function () {
  'use strict';
  var M = window.Milya, D = M.D, esc = M.esc;
  var box = M.$('[data-catalog]');
  if (!box) return;

  var fixedCat = box.getAttribute('data-cat') || '';
  var input = M.$('[data-catalog-search]', box);
  var clearBtn = M.$('[data-catalog-clear]', box);
  var chipsEl = M.$('[data-catalog-chips]', box);
  var floorsEl = M.$('[data-catalog-floors]', box);
  var countEl = M.$('[data-catalog-count]', box);
  var grid = M.$('[data-catalog-grid]', box);
  var emptyEl = M.$('[data-catalog-empty]', box);

  var pool = D.TENANTS.filter(function (t) { return !fixedCat || t.cat === fixedCat; })
    .sort(function (a, b) { return (a.stub ? 1 : 0) - (b.stub ? 1 : 0) || a.name.localeCompare(b.name, 'ru'); });

  var state = {
    q: M.param('q') || '',
    cat: fixedCat || M.param('cat') || '',
    floor: M.param('floor') || ''
  };
  if (state.cat && !M.cat(state.cat)) state.cat = '';
  if (input) input.value = state.q;

  // Чипы категорий
  if (chipsEl && !fixedCat) {
    var cats = [{ id: '', name: 'Все' }].concat(D.CATEGORIES);
    chipsEl.innerHTML = cats.map(function (c) {
      var n = c.id ? D.TENANTS.filter(function (t) { return t.cat === c.id; }).length : D.TENANTS.length;
      return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="false">' +
        (c.icon ? M.icon(c.icon) : '') + esc(c.short || c.name) + ' <span class="chip__count">' + n + '</span></button>';
    }).join('');
    chipsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      state.cat = b.getAttribute('data-cat');
      render(true);
    });
  }

  // Этажи
  if (floorsEl) {
    var floors = [''].concat(D.FLOORS.map(function (f) { return String(f.n); }));
    floorsEl.innerHTML = floors.map(function (f) {
      return '<button type="button" data-floor="' + f + '" aria-pressed="false">' + (f ? f + ' этаж' : 'Все этажи') + '</button>';
    }).join('');
    floorsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-floor]');
      if (!b) return;
      state.floor = b.getAttribute('data-floor');
      render(true);
    });
  }

  function filtered() {
    var list = state.q.trim() ? M.searchTenants(state.q).filter(function (t) { return pool.indexOf(t) > -1; }) : pool.slice();
    return list.filter(function (t) {
      return (!state.cat || t.cat === state.cat) && (!state.floor || String(t.floor) === state.floor);
    });
  }

  function syncUrl() {
    try {
      var u = new URL(location.href);
      ['q', 'cat', 'floor'].forEach(function (k) {
        var v = k === 'cat' && fixedCat ? '' : state[k];
        if (v) u.searchParams.set(k, v); else u.searchParams.delete(k);
      });
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }

  function render(updateUrl) {
    var list = filtered();
    grid.innerHTML = list.map(function (t) { return '<li>' + M.tenantCard(t) + '</li>'; }).join('');
    emptyEl.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    var filteredNow = state.q || (state.cat && !fixedCat) || state.floor;
    countEl.textContent = list.length ? (filteredNow ? 'Найдено: ' : 'Всего: ') + list.length + ' ' + M.plural(list.length, 'место', 'места', 'мест') : 'Ничего не найдено';
    if (chipsEl) M.$$('[data-cat]', chipsEl).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === state.cat ? 'true' : 'false'); });
    if (floorsEl) M.$$('[data-floor]', floorsEl).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-floor') === state.floor ? 'true' : 'false'); });
    if (clearBtn) clearBtn.hidden = !state.q;
    if (updateUrl) syncUrl();
  }

  if (input) {
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.q = input.value; render(true); }, 120);
    });
    input.closest('form').addEventListener('submit', function (e) { e.preventDefault(); state.q = input.value; render(true); });
  }
  if (clearBtn) clearBtn.addEventListener('click', function () { input.value = ''; state.q = ''; render(true); input.focus(); });

  M.$$('[data-catalog-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.q = ''; state.floor = ''; if (!fixedCat) state.cat = '';
      if (input) input.value = '';
      render(true);
      if (input) input.focus();
    });
  });

  render(false);

  // ?shop=id открывает карточку сразу
  var shop = M.param('shop');
  if (shop && M.tenant(shop)) {
    M.openTenant(shop);
    M.onDialogClose(function () {
      try { var u = new URL(location.href); u.searchParams.delete('shop'); history.replaceState(null, '', u.pathname + u.search); } catch (e) {}
    });
  }
  if (location.hash === '#catalog-search' && input) input.focus();
})();
