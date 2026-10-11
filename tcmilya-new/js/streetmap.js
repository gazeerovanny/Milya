/*
 * Условная схема проезда (SVG). Рисуется в любой [data-street-map].
 * Это не карта в масштабе, а понятная иллюстрация: метро, улица, центр, парковка.
 * TODO: сверить взаимное расположение метро, входов и парковки с реальностью
 * или заменить на встроенную Яндекс Карту (iframe с конструктора карт).
 */
(function () {
  'use strict';
  var maps = document.querySelectorAll('[data-street-map]');
  if (!maps.length) return;

  var svg =
    '<svg class="street-map" viewBox="0 0 600 460" role="img" aria-labelledby="sm-title sm-desc" preserveAspectRatio="xMidYMid meet">' +
    '<title id="sm-title">Схема проезда к ТРЦ «Миля»</title>' +
    '<desc id="sm-desc">Условная схема: метро Жулебино, улица Генерала Кузнецова, торговый центр «Миля» и парковка.</desc>' +
    '<rect width="600" height="460" fill="var(--m-bg)"/>' +
    // кварталы
    '<g fill="var(--line)">' +
    '<rect x="-10" y="-10" width="170" height="150" rx="14"/><rect x="190" y="-10" width="180" height="150" rx="14"/>' +
    '<rect x="400" y="-10" width="220" height="150" rx="14"/>' +
    '<rect x="-10" y="290" width="170" height="190" rx="14"/><rect x="400" y="290" width="220" height="190" rx="14"/>' +
    '</g>' +
    '<path d="M28 330c40-20 90-10 110 20s10 80-30 100-90 10-100-30 0-70 20-90z" fill="var(--m-park)"/>' +
    '<path d="M430 40c50-30 120-20 150 10s20 60-20 70-110 0-130-30-20-40 0-50z" fill="var(--m-park)"/>' +
    // дороги
    '<g stroke="var(--surface)" stroke-linecap="round" fill="none">' +
    '<path d="M-20 215H620" stroke-width="34"/>' +
    '<path d="M175 -20V480" stroke-width="18"/><path d="M385 -20V480" stroke-width="18"/>' +
    '</g>' +
    '<path d="M-20 215H620" stroke="var(--line-strong)" stroke-width="1.5" stroke-dasharray="14 12" fill="none"/>' +
    '<text x="24" y="206" font-weight="600">ул. Генерала Кузнецова</text>' +
    // ТЦ и парковка
    '<rect x="200" y="252" width="170" height="130" rx="18" fill="var(--plum)"/>' +
    '<g fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"><path d="M244 340v-34a14 14 0 0 1 28 0v34M272 306a14 14 0 0 1 28 0v34M300 306a14 14 0 0 1 28 0v34"/></g>' +
    '<rect x="200" y="396" width="170" height="54" rx="12" fill="var(--surface)" stroke="var(--line-strong)" stroke-dasharray="6 6"/>' +
    '<text x="214" y="428" font-weight="600" fill="var(--ink)">P  парковка, 350 мест</text>' +
    // метро
    '<path d="M108 160C150 190 170 235 205 262" fill="none" stroke="var(--ink)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>' +
    '<circle cx="96" cy="150" r="22" fill="#8d5b9e"/>' +
    '<path d="M86 160l4-18 6 11 6-11 4 18" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<rect x="24" y="96" width="132" height="30" rx="15" fill="var(--surface)"/>' +
    '<text x="38" y="116" font-weight="600" fill="var(--ink)">м. Жулебино</text>' +
    // метка
    '<g transform="translate(285 236)"><rect x="-58" y="-62" width="116" height="44" rx="22" fill="var(--accent)"/>' +
    '<path d="M-8 -18 0 -6 8 -18z" fill="var(--accent)"/>' +
    '<text class="sm-pin-label" x="0" y="-33" text-anchor="middle">Миля, 22</text></g>' +
    '<text x="582" y="446" text-anchor="end" font-size="12">Схема условная</text>' +
    '</svg>';

  Array.prototype.forEach.call(maps, function (el) { el.innerHTML = svg; });
})();
