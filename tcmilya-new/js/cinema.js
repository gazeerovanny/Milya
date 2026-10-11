/*
 * Афиша «Киномакс»: переключатель дней и сеансы.
 * TODO: сеансы генерируются заглушкой (Milya.sessions). Подключить реальное расписание.
 */
(function () {
  'use strict';
  var M = window.Milya, D = M.D, esc = M.esc;
  var daysEl = M.$('[data-days]');
  var filmsEl = M.$('[data-films]');
  if (!daysEl || !filmsEl) return;

  var now = M.moscowNow();
  var base = M.parseISO(now.iso);
  var days = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(base.getTime() + i * 86400000);
    days.push({
      iso: M.isoOf(d),
      top: i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : M.WEEKDAYS[d.getUTCDay()],
      label: d.getUTCDate() + ' ' + M.MONTHS_SHORT[d.getUTCMonth()]
    });
  }
  var current = 0;
  var wanted = M.param('day');
  days.forEach(function (d, i) { if (d.iso === wanted) current = i; });

  daysEl.innerHTML = days.map(function (d, i) {
    return '<button type="button" class="day" role="tab" id="day-' + i + '" aria-controls="films-panel" aria-selected="false" tabindex="-1">' +
      '<span>' + d.top + '</span><strong>' + d.label + '</strong></button>';
  }).join('');
  var tabs = M.$$('.day', daysEl);

  function select(i, focus) {
    current = i;
    tabs.forEach(function (t, j) {
      t.setAttribute('aria-selected', j === i ? 'true' : 'false');
      t.tabIndex = j === i ? 0 : -1;
    });
    if (focus) tabs[i].focus();
    M.$('#films-panel').setAttribute('aria-labelledby', 'day-' + i);
    render();
  }

  daysEl.addEventListener('click', function (e) {
    var b = e.target.closest('.day');
    if (b) select(tabs.indexOf(b), false);
  });
  daysEl.addEventListener('keydown', function (e) {
    var k = e.key, n = tabs.length;
    if (k === 'ArrowRight') { e.preventDefault(); select((current + 1) % n, true); }
    else if (k === 'ArrowLeft') { e.preventDefault(); select((current - 1 + n) % n, true); }
    else if (k === 'Home') { e.preventDefault(); select(0, true); }
    else if (k === 'End') { e.preventDefault(); select(n - 1, true); }
  });

  function render() {
    var day = days[current];
    var isToday = current === 0;
    var nowMin = M.moscowNow().minutes;
    var dateEl = M.$('[data-afisha-date]');
    if (dateEl) dateEl.textContent = (isToday ? 'Сегодня, ' : current === 1 ? 'Завтра, ' : '') + M.fmtDate(day.iso) + '. Нажмите на время, чтобы купить билет.';

    filmsEl.innerHTML = M.sessions(day.iso).map(function (s) {
      var f = s.film;
      var times = s.list.map(function (x) {
        var t = M.fmtMin(x.time);
        var sub = 'Зал ' + x.hall + (x.dolby ? ', Dolby' : '');
        if (isToday && x.time <= nowMin) {
          return '<li><span class="session is-past"><strong>' + t + '</strong><span>' + sub + '</span><span class="visually-hidden">, сеанс уже начался</span></span></li>';
        }
        return '<li><a class="session" href="' + esc(D.KINOMAX_URL) + '" target="_blank" rel="noopener" aria-label="' + t + ', ' + sub + '. Купить билет на «' + esc(f.title) + '» на сайте кинотеатра">' +
          '<strong>' + t + '</strong><span>' + sub + '</span></a></li>';
      }).join('');
      var left = s.list.filter(function (x) { return !isToday || x.time > nowMin; }).length;
      var h = Math.floor(f.duration / 60), m = f.duration % 60;
      return '<li class="film">' +
        M.artBox(f.id, [1, 2, 3, 4, 5, 6][M.hash(f.id) % 6], 'film__poster', { w: 300, h: 450 }, f.poster, 'Постер фильма «' + f.title + '»') +
        '<div class="film__info">' +
        '<h3 class="film__title">' + esc(f.title) + '</h3>' +
        '<p class="film__meta"><span>' + esc(f.genre) + '</span><span class="badge badge--line">' + esc(f.age) + '</span><span>' + h + ' ч ' + m + ' мин</span>' +
        (f.dolby ? '<span class="badge badge--accent">' + M.icon('sound') + 'Dolby</span>' : '') + '</p>' +
        (left ? '' : '<p class="film__meta">На сегодня сеансов больше нет</p>') +
        '</div>' +
        '<ul class="film__sessions" aria-label="Сеансы">' + times + '</ul>' +
        '</li>';
    }).join('');
  }

  select(current, false);
})();
