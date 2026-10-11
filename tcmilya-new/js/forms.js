/*
 * Формы: валидация на клиенте и отправка-заглушка.
 * TODO: подключить реальную отправку (свой API, Netlify Forms или почтовый сервис).
 */
(function () {
  'use strict';
  var M = window.Milya;

  var MSG = {
    required: 'Заполните это поле',
    name: 'Имя должно быть не короче 2 букв',
    email: 'Проверьте почту, например name@mail.ru',
    phone: 'Введите номер полностью: +7 и 10 цифр',
    select: 'Выберите вариант из списка',
    area: 'Укажите площадь от 5 до 5000 м²',
    consent: 'Нужно согласие на обработку данных'
  };

  function digits(v) { return v.replace(/\D/g, ''); }

  // Маска телефона +7 (XXX) XXX-XX-XX
  function formatPhone(v) {
    var d = digits(v);
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  function check(el) {
    var v = (el.value || '').trim();
    if (el.type === 'checkbox') return el.required && !el.checked ? MSG.consent : '';
    if (el.required && !v) return el.tagName === 'SELECT' ? MSG.select : MSG.required;
    if (!v) return '';
    if (el.hasAttribute('data-phone')) return digits(v).length === 11 ? '' : MSG.phone;
    if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : MSG.email;
    if (el.type === 'number') {
      var n = Number(v), min = Number(el.min), max = Number(el.max);
      return isFinite(n) && n >= min && n <= max ? '' : MSG.area;
    }
    if (el.minLength > 0 && v.length < el.minLength) return MSG.name;
    return '';
  }

  function show(el, msg) {
    var field = el.closest('.field, .check');
    var errId = (el.getAttribute('aria-describedby') || '').split(' ').filter(function (id) { return /-err$/.test(id); })[0];
    var err = errId && document.getElementById(errId);
    if (field) field.classList.toggle('is-invalid', !!msg);
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    if (err) err.innerHTML = msg ? M.icon('alert') + '<span>' + msg + '</span>' : '';
  }

  M.$$('form[data-form]').forEach(function (form) {
    var fields = M.$$('input, select, textarea', form).filter(function (el) { return el.name; });
    var status = M.$('[data-form-status]', form);

    fields.forEach(function (el) {
      if (el.hasAttribute('data-phone')) {
        el.addEventListener('input', function () { el.value = formatPhone(el.value); });
        el.addEventListener('focus', function () { if (!el.value) el.value = '+7 ('; });
        el.addEventListener('blur', function () { if (digits(el.value).length <= 1) el.value = ''; });
      }
      el.addEventListener('blur', function () { if (el.value || el.dataset.touched) { el.dataset.touched = '1'; show(el, check(el)); } });
      el.addEventListener('input', function () { if (el.dataset.touched) show(el, check(el)); });
      el.addEventListener('change', function () { el.dataset.touched = '1'; show(el, check(el)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null, bad = 0;
      fields.forEach(function (el) {
        el.dataset.touched = '1';
        var msg = check(el);
        show(el, msg);
        if (msg) { bad++; if (!firstBad) firstBad = el; }
      });
      if (firstBad) {
        if (status) status.textContent = 'Форма не отправлена: проверьте ' + bad + ' ' + M.plural(bad, 'поле', 'поля', 'полей') + '.';
        firstBad.focus();
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Отправляем…';

      // TODO: заглушка отправки. Заменить на fetch() к реальному обработчику.
      setTimeout(function () {
        var ok = document.createElement('div');
        ok.className = 'form-success';
        ok.setAttribute('role', 'status');
        ok.tabIndex = -1;
        ok.innerHTML = M.icon('check') + '<h3>Заявка отправлена</h3><p>Спасибо! Менеджер по аренде свяжется с вами по указанному телефону или почте.</p>' +
          '<p><button type="button" class="btn btn--dark btn--sm">Отправить еще одну</button></p>';
        form.hidden = true;
        form.parentNode.insertBefore(ok, form.nextSibling);
        ok.focus();
        ok.querySelector('button').addEventListener('click', function () {
          form.reset();
          fields.forEach(function (el) { delete el.dataset.touched; show(el, ''); });
          btn.removeAttribute('aria-busy');
          btn.textContent = 'Отправить заявку';
          ok.remove();
          form.hidden = false;
          fields[0].focus();
        });
      }, 900);
    });
  });
})();
