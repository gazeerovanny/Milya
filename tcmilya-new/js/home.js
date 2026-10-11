/* Главная: лента акций, кино, бренды, счетчики категорий. */
(function () {
  'use strict';
  var M = window.Milya, D = M.D, esc = M.esc;

  // «Что сейчас в Миле»: 6 свежих новостей и акций
  var rail = M.$('[data-news-rail]');
  if (rail) {
    var news = D.NEWS.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
    rail.innerHTML = news.map(function (n) { return M.newsCard(n); }).join('');
  }

  // Количество арендаторов в плитках категорий
  M.$$('[data-cat-count]').forEach(function (el) {
    var id = el.getAttribute('data-cat-count');
    var list = D.TENANTS.filter(function (t) { return t.cat === id; });
    if (el.textContent.trim()) return;
    var names = list.filter(function (t) { return !t.stub; }).slice(0, 3).map(function (t) { return t.name; });
    el.textContent = names.length ? names.join(', ') + (list.length > names.length ? ' и другие' : '') :
      list.length + ' ' + M.plural(list.length, 'место', 'места', 'мест');
  });

  // Кино: ближайшие сеансы сегодня
  var now = M.moscowNow();
  var today = M.sessions(now.iso);
  var films = M.$('[data-films-teaser]');
  if (films) {
    films.innerHTML = today.slice(0, 4).map(function (s) {
      var f = s.film;
      var upcoming = s.list.filter(function (x) { return x.time > now.minutes; }).slice(0, 4);
      return '<article class="film-mini">' +
        M.artBox(f.id, [1, 2, 3, 4, 5, 6][M.hash(f.id) % 6], 'film-mini__poster', { w: 300, h: 450 }, f.poster, 'Постер фильма «' + f.title + '»') +
        '<h3 class="film-mini__title">' + esc(f.title) + '</h3>' +
        '<p class="film-mini__meta">' + esc(f.genre) + ', ' + esc(f.age) + (f.dolby ? ', Dolby' : '') + '</p>' +
        (upcoming.length ?
          '<ul class="film-mini__times" aria-label="Сеансы сегодня">' + upcoming.map(function (x) { return '<li>' + M.fmtMin(x.time) + '</li>'; }).join('') + '</ul>' :
          '<p class="film-mini__meta">Сегодня сеансов больше нет</p>') +
        '</article>';
    }).join('');
  }

  // Ближайший сеанс в карточке статуса
  var nextEl = M.$('[data-next-session]');
  if (nextEl) {
    var next = null;
    today.forEach(function (s) {
      s.list.forEach(function (x) { if (x.time > now.minutes && (!next || x.time < next.time)) next = { time: x.time, film: s.film }; });
    });
    nextEl.textContent = next ? 'Ближайший сеанс ' + M.fmtMin(next.time) : 'Афиша на завтра';
  }

  // Бренды: бегущая строка из реальных арендаторов (без заглушек)
  var brands = M.$('[data-brands]');
  if (brands) {
    var real = D.TENANTS.filter(function (t) { return !t.stub; });
    var half = Math.ceil(real.length / 2);
    var row = function (list, rev) {
      var chips = function (hidden) {
        return list.map(function (t) {
          return '<a href="' + M.page('shops', '?shop=' + t.id) + '"' + (hidden ? ' tabindex="-1" aria-hidden="true"' : '') + '>' +
            M.wordmark(t, 'brand-chip').replace(' aria-hidden="true"', '') + '</a>';
        }).join('');
      };
      return '<div class="marquee__row' + (rev ? ' marquee__row--rev' : '') + '">' + chips(false) + '<span class="marquee__dup" aria-hidden="true">' + chips(true) + '</span></div>';
    };
    brands.innerHTML = row(real.slice(0, half), false) + row(real.slice(half), true);
  }
})();
