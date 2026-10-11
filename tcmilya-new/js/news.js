/* Лента акций и новостей + страница отдельной новости (news-item.html?id=...). */
(function () {
  'use strict';
  var M = window.Milya, D = M.D, esc = M.esc;
  var all = D.NEWS.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });

  /* ---------- Лента ---------- */
  var list = M.$('[data-news-list]');
  if (list) {
    var filter = M.$('[data-news-filter]');
    var countEl = M.$('[data-news-count]');
    var type = M.param('type') || '';
    if (type && !M.newsType(type)) type = '';
    var types = [{ id: '', plural: 'Все' }].concat(D.NEWS_TYPES);
    filter.innerHTML = types.map(function (t) {
      var n = t.id ? all.filter(function (x) { return x.type === t.id; }).length : all.length;
      return '<button type="button" class="chip" data-type="' + t.id + '" aria-pressed="false">' + esc(t.plural) + ' <span class="chip__count">' + n + '</span></button>';
    }).join('');

    var render = function () {
      var items = all.filter(function (n) { return !type || n.type === type; });
      list.innerHTML = items.map(function (n, i) {
        return '<li class="' + (i === 0 ? 'is-featured' : '') + '">' + M.newsCard(n, { hTag: 'h2' }) + '</li>';
      }).join('');
      M.$$('[data-type]', filter).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-type') === type ? 'true' : 'false'); });
      countEl.textContent = items.length + ' ' + M.plural(items.length, 'публикация', 'публикации', 'публикаций');
    };
    filter.addEventListener('click', function (e) {
      var b = e.target.closest('[data-type]');
      if (!b) return;
      type = b.getAttribute('data-type');
      render();
      try {
        var u = new URL(location.href);
        if (type) u.searchParams.set('type', type); else u.searchParams.delete('type');
        history.replaceState(null, '', u.pathname + u.search);
      } catch (err) {}
    });
    render();
  }

  /* ---------- Отдельная новость ---------- */
  var art = M.$('[data-article]');
  if (art) {
    var id = M.param('id');
    var n = all.filter(function (x) { return x.id === id; })[0];
    var titleEl = M.$('[data-article-title]');
    var bodyEl = M.$('[data-article-body]');
    var metaEl = M.$('[data-article-meta]');
    if (!n) {
      titleEl.textContent = 'Новость не найдена';
      bodyEl.innerHTML = '<p class="article__lead">Возможно, ссылка устарела. Загляните в ленту, там все свежие акции и события.</p>';
      document.title = 'Новость не найдена · ТРЦ «Миля»';
      return;
    }
    var t = M.newsType(n.type);
    var tenant = n.tenant && M.tenant(n.tenant);
    document.title = n.title + ' · ТРЦ «Миля»';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', n.lead);
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute('href', canon.getAttribute('href') + '?id=' + encodeURIComponent(n.id));
    M.$('[data-crumb]').textContent = n.title;
    metaEl.innerHTML = '<span class="badge ' + (n.type === 'promo' ? 'badge--accent' : 'badge--dark') + '">' + esc(t.name) + '</span>' +
      '<time datetime="' + n.date + '">' + M.fmtDate(n.date, true) + '</time>';
    titleEl.textContent = n.title;
    bodyEl.innerHTML =
      M.artBox(n.id, M.NEWS_TONE[n.type] || 1, 'article__art', { w: 800, h: 450 }, n.image, '') +
      '<p class="article__lead">' + esc(n.lead) + '</p>' +
      '<div class="article__body">' + (n.body || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      (tenant ? '<div class="article__tenant">' + M.wordmark(tenant) +
        '<div><strong>' + esc(tenant.name) + '</strong><span>' + esc(M.whereOf(tenant)) + ', ' + esc(M.hoursOf(tenant)) + '</span></div>' +
        '<button type="button" class="btn btn--sm" data-open-tenant="' + tenant.id + '" aria-haspopup="dialog">О магазине</button>' +
        (tenant.noUnit ? '' : '<a class="btn btn--sm btn--dark" href="' + M.page('map', '?shop=' + tenant.id) + '">' + M.icon('plan') + 'На схеме</a>') +
        '</div>' : '');

    var more = all.filter(function (x) { return x.id !== n.id; }).slice(0, 3);
    var moreBox = M.$('[data-more]');
    if (moreBox && more.length) {
      M.$('[data-more-list]').innerHTML = more.map(function (x) { return M.newsCard(x); }).join('');
      moreBox.hidden = false;
    }
  }
})();
