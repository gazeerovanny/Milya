/*
 * Контент сайта ТРЦ «Миля».
 * Здесь лежат все данные, которые выводятся на страницах: режим работы,
 * арендаторы, новости и акции, афиша кино, схема этажей.
 * Файл подключается обычным <script>, поэтому сайт работает и с диска (file://).
 *
 * Поиск заглушек: ищите по коду "TODO".
 */
window.MILYA = (function () {
  'use strict';

  /* ---------- Константы ---------- */

  // TODO: заменить на прямую ссылку на страницу кинотеатра «Киномакс» в ТРЦ «Миля»
  var KINOMAX_URL = 'https://kinomax.ru/';

  var ADDRESS = 'Москва, ул. Генерала Кузнецова, д. 22';
  var ROUTE_URL = 'https://yandex.ru/maps/?mode=routes&rtext=~' +
    encodeURIComponent('Москва, улица Генерала Кузнецова, 22');
  var MAP_URL = 'https://yandex.ru/maps/?text=' +
    encodeURIComponent('ТРЦ Миля, Москва, улица Генерала Кузнецова, 22');

  // Режим работы. Время московское, минуты от полуночи считаются в core.js.
  var HOURS = {
    center: { open: '10:00', close: '22:00', label: 'Ежедневно 10:00-22:00' },
    perekrestok: { open: '08:00', close: '23:00', label: 'Ежедневно 08:00-23:00' }
  };

  // TODO: заменить на реальные телефон и почту администрации
  var CONTACTS = {
    phone: '+7 (495) 000-00-00',
    phoneHref: 'tel:+74950000000',
    leaseEmail: 'arenda@tcmilya.ru',
    infoEmail: 'info@tcmilya.ru',
    vk: 'https://vk.com/trc.milya'
  };

  // TODO: заглушка телефона для магазинов без реального номера
  var PHONE_STUB = '+7 (495) 000-00-00';

  /* ---------- Категории ---------- */

  // section: в каком разделе сайта живет категория
  var CATEGORIES = [
    { id: 'products', name: 'Продукты', section: 'shops', icon: 'cart' },
    { id: 'fashion', name: 'Одежда и обувь', section: 'shops', icon: 'shirt' },
    { id: 'kids', name: 'Дети и спорт', section: 'shops', icon: 'ball' },
    { id: 'electronics', name: 'Электроника и связь', section: 'shops', icon: 'device' },
    { id: 'beauty', name: 'Красота, здоровье, украшения', short: 'Красота и здоровье', section: 'shops', icon: 'beauty' },
    { id: 'pets', name: 'Зоотовары', section: 'shops', icon: 'paw' },
    { id: 'books', name: 'Книги', section: 'shops', icon: 'book' },
    { id: 'food', name: 'Еда', section: 'food', icon: 'food' },
    { id: 'fun', name: 'Развлечения и досуг', short: 'Развлечения', section: 'fun', icon: 'spark' },
    { id: 'services', name: 'Услуги', section: 'services', icon: 'bell' }
  ];

  /* ---------- Арендаторы ----------
   * id       уникальный ключ, используется в ссылках (?shop=id) и на схеме
   * floor    этаж, unit номер помещения
   * hours    если не указано, берется режим центра
   * phone    если не указано, показывается заглушка PHONE_STUB
   * stub     true, если арендатор придуман и его нужно заменить реальным
   * logo     путь к логотипу (assets/img/brands/...), пока null: рисуется словесный знак
   *
   * TODO: этажи и номера помещений условные, сверить с реальной планировкой.
   */
  var TENANTS = [
    // Продукты
    { id: 'perekrestok', name: 'Перекресток', cat: 'products', floor: 1, unit: '1-01',
      hours: HOURS.perekrestok.label, desc: 'Гипермаркет: продукты, готовая еда и товары для дома. Работает дольше центра, с 08:00 до 23:00.',
      tags: ['гипермаркет', 'супермаркет', 'продукты'], site: 'https://www.perekrestok.ru/' },
    { id: 'kantata', name: 'Кантата', cat: 'products', floor: 1, unit: '1-02',
      desc: 'Чай и кофе со всего мира, сладости к чаю и всё для заваривания.', tags: ['чай', 'кофе', 'подарки'] },

    // Электроника и связь
    { id: 'dns', name: 'DNS', cat: 'electronics', floor: 1, unit: '1-03',
      desc: 'Цифровая и бытовая техника, компьютеры, смартфоны и аксессуары.', tags: ['техника', 'ноутбуки', 'смартфоны'], site: 'https://www.dns-shop.ru/' },
    { id: 'beeline', name: 'билайн', cat: 'electronics', floor: 1, unit: '1-04',
      desc: 'Салон связи: тарифы, сим-карты, домашний интернет и смартфоны.', tags: ['связь', 'сим-карта'] },
    { id: 'tele2', name: 'Теле2', cat: 'electronics', floor: 1, unit: '1-05',
      desc: 'Салон связи: тарифы, сим-карты и смартфоны.', tags: ['связь', 'сим-карта'] },

    // Дети и спорт
    { id: 'sportmaster', name: 'Спортмастер', cat: 'kids', floor: 2, unit: '2-01',
      desc: 'Спортивная одежда, обувь и инвентарь для взрослых и детей.', tags: ['спорт', 'кроссовки', 'инвентарь'], site: 'https://www.sportmaster.ru/' },
    { id: 'detmir', name: 'Детский мир', cat: 'kids', floor: 2, unit: '2-02',
      desc: 'Игрушки, одежда, коляски и всё для детей.', tags: ['игрушки', 'дети', 'коляски'], site: 'https://www.detmir.ru/' },
    { id: 'acoola', name: 'Acoola', cat: 'kids', floor: 2, unit: '2-03',
      desc: 'Одежда для детей и подростков.', tags: ['детская одежда', 'школа'] },
    { id: 'kapika', name: 'Kapika', cat: 'kids', floor: 2, unit: '2-04',
      desc: 'Детская обувь.', tags: ['детская обувь'] },

    // Одежда и обувь
    { id: 'ostin', name: "O'STIN", cat: 'fashion', floor: 2, unit: '2-05',
      desc: 'Повседневная одежда для всей семьи.', tags: ['одежда', 'джинсы'] },
    { id: 'royalspirit', name: 'RoyalSpirit', cat: 'fashion', floor: 2, unit: '2-06',
      desc: 'Одежда и аксессуары.', tags: ['одежда'] },
    { id: 'tervolina', name: 'TERVOLINA', cat: 'fashion', floor: 2, unit: '2-07',
      desc: 'Обувь, сумки и аксессуары.', tags: ['обувь', 'сумки'] },
    { id: 'ralf-ringer', name: 'Ralf Ringer', cat: 'fashion', floor: 2, unit: '2-08',
      desc: 'Мужская и женская обувь.', tags: ['обувь'] },
    { id: 'respect', name: 'Respect', cat: 'fashion', floor: 2, unit: '2-09',
      desc: 'Обувь и аксессуары.', tags: ['обувь'] },
    { id: 'milavitsa', name: 'Milavitsa', cat: 'fashion', floor: 2, unit: '2-10',
      desc: 'Нижнее белье и купальники.', tags: ['белье', 'купальники'] },
    { id: 'marmalato', name: 'Marmalato', cat: 'fashion', floor: 2, unit: '2-12',
      desc: 'Сумки и рюкзаки на каждый день.', tags: ['сумки', 'рюкзаки', 'аксессуары'] },

    // Красота, здоровье, украшения
    { id: 'letual', name: "Л'Этуаль", cat: 'beauty', floor: 2, unit: '2-11',
      desc: 'Парфюмерия, косметика и уход.', tags: ['косметика', 'парфюм'] },
    { id: 'happy-look', name: 'Счастливый взгляд', cat: 'beauty', floor: 1, unit: '1-08',
      desc: 'Оптика: очки, контактные линзы, проверка зрения.', tags: ['оптика', 'очки', 'линзы'] },
    { id: 'adamas', name: 'ADAMAS', cat: 'beauty', floor: 1, unit: '1-10',
      desc: 'Ювелирные украшения.', tags: ['ювелирный', 'украшения'] },
    { id: 'sunlight', name: 'Sunlight', cat: 'beauty', floor: 1, unit: '1-09',
      desc: 'Ювелирные украшения и часы.', tags: ['ювелирный', 'украшения', 'часы'] },

    // Зоотовары
    { id: 'chetyre-lapy', name: 'Четыре Лапы', cat: 'pets', floor: 1, unit: '1-07',
      phone: '8 800 770-00-22', site: 'https://4lapy.ru/', telegram: 'https://t.me/zoo_4lapy',
      desc: 'Более 25 000 наименований товаров для животных, собственные марки кормов. В сети есть ветеринарные центры и груминг-салоны.',
      tags: ['зоомагазин', 'корм', 'груминг', 'ветеринар'] },

    // Книги
    { id: 'chitay-gorod', name: 'Читай-город', cat: 'books', floor: 2, unit: '2-13',
      desc: 'Книги, канцелярия, настольные игры и подарки.', tags: ['книги', 'канцтовары', 'игры'], site: 'https://www.chitai-gorod.ru/' },

    // Развлечения
    { id: 'kinomax', name: 'Киномакс', cat: 'fun', floor: 3, unit: '3-01',
      desc: 'Кинотеатр на 6 залов, формат Dolby. Афиша и билеты на сайте кинотеатра.',
      tags: ['кино', 'кинотеатр', 'фильмы'], link: 'cinema' },
    // TODO: заглушка, заменить реальным арендатором
    { id: 'ostrov', name: 'Игровая «Остров»', cat: 'fun', floor: 3, unit: '3-02', stub: true,
      desc: 'Детская игровая комната с лабиринтом и зоной для малышей.', tags: ['дети', 'игровая', 'праздник'] },
    // TODO: заглушка, заменить реальным арендатором
    { id: 'uroven', name: 'Игровая зона «Уровень»', cat: 'fun', floor: 3, unit: '3-03', stub: true,
      desc: 'Игровые автоматы, аэрохоккей и VR-аттракционы.', tags: ['игры', 'vr', 'автоматы'] },

    // Еда. TODO: все заведения ниже заглушки, заменить реальными
    { id: 'testo', name: 'Тесто и сыр', cat: 'food', floor: 3, unit: '3-10', stub: true, kind: 'Пицца',
      desc: 'Пицца на тонком тесте и сырные закуски.', tags: ['пицца', 'фудкорт'] },
    { id: 'wok', name: 'Вок-станция', cat: 'food', floor: 3, unit: '3-11', stub: true, kind: 'Азиатская кухня',
      desc: 'Лапша и рис в воке, собираете блюдо сами.', tags: ['вок', 'лапша', 'фудкорт'] },
    { id: 'burger22', name: 'Бургерная №22', cat: 'food', floor: 3, unit: '3-12', stub: true, kind: 'Бургеры',
      desc: 'Бургеры, картофель и милкшейки.', tags: ['бургеры', 'фудкорт'] },
    { id: 'sup', name: 'Суп и хлеб', cat: 'food', floor: 3, unit: '3-13', stub: true, kind: 'Домашняя кухня',
      desc: 'Супы, горячее и комплексные обеды.', tags: ['обед', 'супы', 'фудкорт'] },
    { id: 'ris', name: 'Рис и рыба', cat: 'food', floor: 3, unit: '3-14', stub: true, kind: 'Роллы и поке',
      desc: 'Роллы, поке и онигири.', tags: ['роллы', 'суши', 'фудкорт'] },
    { id: 'blinnaya', name: 'Блинная на Миле', cat: 'food', floor: 3, unit: '3-15', stub: true, kind: 'Блины',
      desc: 'Сладкие и сытные блины, чай из самовара.', tags: ['блины', 'фудкорт'] },
    { id: 'zerno', name: 'Зерно и пенка', cat: 'food', floor: 3, unit: '3-16', stub: true, kind: 'Кофейня',
      desc: 'Кофе с собой, десерты и завтраки.', tags: ['кофе', 'десерты', 'кофейня'] },

    // Услуги. TODO: все услуги ниже заглушки, заменить реальными
    { id: 'apteka', name: 'Аптека', cat: 'services', floor: 1, unit: '1-06', stub: true,
      desc: 'Лекарства, витамины и товары для здоровья.', tags: ['аптека', 'лекарства'] },
    { id: 'master', name: 'Ремонт обуви и ключи', cat: 'services', floor: 1, unit: '1-11', stub: true,
      desc: 'Ремонт обуви, изготовление ключей, заточка.', tags: ['ремонт', 'ключи'] },
    { id: 'pvz', name: 'Пункт выдачи заказов', cat: 'services', floor: 1, unit: '1-12', stub: true,
      desc: 'Получение и возврат заказов из интернет-магазинов.', tags: ['пвз', 'заказы'] },
    { id: 'himchistka', name: 'Химчистка', cat: 'services', floor: 1, unit: '1-13', stub: true,
      desc: 'Химчистка одежды и текстиля, срочный прием.', tags: ['химчистка', 'стирка'] },
    { id: 'fix', name: 'Ремонт телефонов', cat: 'services', floor: 3, unit: '3-17', stub: true,
      desc: 'Замена экранов и батарей, защитные стекла.', tags: ['ремонт', 'телефон'] },
    { id: 'atm', name: 'Банкоматы', cat: 'services', floor: 1, unit: 'у входа', stub: true, noUnit: true,
      desc: 'Банкоматы у главного входа.', tags: ['банкомат', 'наличные'] }
  ];

  /* ---------- Схема этажей ----------
   * Упрощенная схема: два ряда помещений (top, bottom) вдоль центральной галереи.
   * Ширины в условных единицах, сумма в каждом ряду 960.
   * TODO: условная планировка, перерисовать по реальным поэтажным планам.
   */
  var FLOORS = [
    { n: 1, title: '1 этаж', note: 'Перекресток, техника, зоотовары, услуги',
      top: [['perekrestok', 380], ['kantata', 100], ['dns', 180], ['beeline', 100], ['tele2', 100], ['apteka', 100]],
      bottom: [['chetyre-lapy', 200], ['happy-look', 120], ['sunlight', 120], ['adamas', 120], ['master', 100], ['pvz', 150], ['himchistka', 150]] },
    { n: 2, title: '2 этаж', note: 'Одежда, обувь, дети, книги',
      top: [['sportmaster', 260], ['detmir', 220], ['acoola', 120], ['kapika', 120], ['ostin', 240]],
      bottom: [['royalspirit', 130], ['tervolina', 110], ['ralf-ringer', 110], ['respect', 110], ['milavitsa', 100], ['letual', 150], ['marmalato', 100], ['chitay-gorod', 150]] },
    { n: 3, title: '3 этаж', note: 'Киномакс, фудкорт, развлечения',
      top: [['kinomax', 480], ['ostrov', 240], ['uroven', 240]],
      bottom: [['testo', 120], ['wok', 120], ['burger22', 120], ['sup', 120], ['ris', 120], ['blinnaya', 120], ['zerno', 120], ['fix', 120]] }
  ];

  /* ---------- Новости и акции ----------
   * type: promo (акция), event (событие), news (новость), cinema (кино)
   * image: путь к картинке. Пока null, вместо фото рисуется SVG-обложка.
   * TODO: добавить реальные фото (assets/img/news/<id>.jpg) и полные тексты.
   */
  var NEWS = [
    { id: 'korm-oktyabr', date: '2026-10-01', type: 'promo', tenant: 'chetyre-lapy', image: null,
      title: 'Скидки на корм для собак и кошек',
      lead: 'В «Четырех Лапах» минус 15% на сухой корм Ownat для собак и минус 30% на второй сухой корм Mealfeel для кошек.',
      body: ['Хороший повод пополнить запас корма на осень. Сроки и условия акции уточняйте у консультантов в магазине.'] },
    { id: 'den-zhivotnyh', date: '2026-09-28', type: 'event', tenant: 'chetyre-lapy', image: null,
      title: 'Всемирный день животных в Миле',
      lead: 'Отмечаем праздник тех, кто встречает нас дома у двери. В «Четырех Лапах» помогут выбрать корм, лакомства и игрушки.',
      body: ['Всемирный день животных отмечают 4 октября. Приходите с семьей и выбирайте подарки для питомцев.'] },
    { id: 'melochi', date: '2026-09-23', type: 'news', image: null,
      title: 'Мелочи, которые спасают день',
      lead: 'Зарядка для телефона, тушь, батарейки или подарок в последний момент. В Миле такие вещи находятся за пару минут.',
      body: ['Зарядки и аксессуары ищите в DNS и салонах связи, косметику в «Л\'Этуаль», подарки в «Читай-городе» и «Кантате». Все магазины удобно найти на схеме центра.'] },
    { id: 'korm-sentyabr', date: '2026-09-11', type: 'promo', tenant: 'chetyre-lapy', image: null,
      title: 'Корм для кошек и щенков дешевле',
      lead: 'Mealfeel: минус 30% на второй корм. ABBA: минус 15% на сухой корм для щенков.',
      body: ['Акция проходит в магазине «Четыре Лапы». Подробности и сроки уточняйте у консультантов.'] },
    { id: 'osenniy-apgreyd', date: '2026-09-08', type: 'news', image: null,
      title: 'Осенний апгрейд? Легко',
      lead: 'Теплая куртка, удобная обувь, новый аромат или ноутбук к учебе. Обновиться к осени можно за один визит.',
      body: ['Одежда и обувь в O\'STIN, TERVOLINA, Ralf Ringer и Respect, техника в DNS, ароматы и уход в «Л\'Этуаль».'] },
    { id: '1-sentyabrya', date: '2026-09-01', type: 'news', image: null,
      title: 'С 1 Сентября!',
      lead: 'Поздравляем школьников, студентов, родителей и учителей. Пусть учеба будет интересной, а перемены длинными.',
      body: ['Тетради, книги и рюкзаки в «Читай-городе» и Marmalato, школьная форма и обувь в Acoola и Kapika, спортивная форма в «Спортмастере».'] },
    { id: 'znaniya-na-vkus', date: '2026-08-25', type: 'event', image: null,
      title: 'Ярмарка «Знания на вкус» и розыгрыш сертификатов',
      lead: 'Ярмарка дополнительного образования: кружки, секции и студии района в одном месте. Для гостей розыгрыш сертификатов.',
      body: ['Хороший способ выбрать занятие для ребенка на новый учебный год и задать вопросы педагогам вживую.'] },
    { id: 'marmalato-kollekciya', date: '2026-08-24', type: 'news', tenant: 'marmalato', image: null,
      title: 'Новая коллекция Marmalato',
      lead: 'В Marmalato пришли новые сумки и рюкзаки. Есть модели для учебы, работы и прогулок.',
      body: ['Где найти магазин, подскажет схема центра.'] },
    { id: 'dobrolap', date: '2026-08-06', type: 'event', tenant: 'chetyre-lapy', image: null,
      title: '«Добролап»: 20 лет благотворительности',
      lead: 'Присоединяйтесь к акции «Добролап» в «Четырех Лапах» и помогите животным из приютов.',
      body: ['Как принять участие, подскажут консультанты в магазине.'] },
    { id: 'vse-v-kino', date: '2026-07-29', type: 'cinema', tenant: 'kinomax', image: null,
      title: 'Все в кино!',
      lead: 'Летние премьеры в «Киномаксе»: 6 залов и формат Dolby. Расписание и билеты на сайте кинотеатра.',
      body: ['Смотрите афишу на сайте и выбирайте сеанс заранее.'] },
    { id: 'acoola-shkola', date: '2026-07-24', type: 'news', tenant: 'acoola', image: null,
      title: 'Школьная коллекция ACOOLA',
      lead: 'Новая школьная коллекция ACOOLA уже в магазине. Удобная одежда к учебному году для детей и подростков.',
      body: ['Где найти магазин, подскажет схема центра.'] },
    { id: 'chitay-gorod-podarki', date: '2026-07-21', type: 'promo', tenant: 'chitay-gorod', image: null,
      title: 'Подарок за покупку в «Читай-городе»',
      lead: 'При покупке от 2000 рублей в «Читай-городе» вас ждет подарок.',
      body: ['Условия и сроки акции уточняйте в магазине.'] },
    { id: 'grandin', date: '2026-07-07', type: 'promo', tenant: 'chetyre-lapy', image: null,
      title: 'Корм Grandin со скидкой 15%',
      lead: 'В «Четырех Лапах» скидка 15% на корм Grandin.',
      body: ['Сроки и условия уточняйте в магазине.'] },
    { id: 'leto-knigi', date: '2026-07-02', type: 'news', tenant: 'chitay-gorod', image: null,
      title: 'Лето, вдохновленное книгами',
      lead: 'Книги для отпуска, дачи и долгой дороги. Заходите в «Читай-город» выбрать что-нибудь на лето.',
      body: ['Консультанты помогут подобрать книгу под настроение.'] },
    { id: 'marmalato-sale', date: '2026-06-25', type: 'promo', tenant: 'marmalato', image: null,
      title: 'Marmalato: скидки до 50%',
      lead: 'Сумки и рюкзаки Marmalato со скидкой до 50%.',
      body: ['Количество товаров ограничено, условия уточняйте в магазине.'] }
  ];

  var NEWS_TYPES = [
    { id: 'promo', name: 'Акция', plural: 'Акции' },
    { id: 'event', name: 'Событие', plural: 'События' },
    { id: 'news', name: 'Новость', plural: 'Новости' },
    { id: 'cinema', name: 'Кино', plural: 'Кино' }
  ];

  /* ---------- Афиша ----------
   * TODO: все фильмы ниже заглушки. Подключить реальное расписание «Киномакс»
   * (API или выгрузку) и заменить poster на реальные постеры.
   * Сеансы генерируются в js/cinema.js детерминированно по дате.
   */
  var FILMS = [
    { id: 'severny-veter', title: 'Северный ветер', genre: 'Драма', age: '16+', duration: 124, poster: null, dolby: true },
    { id: 'piksel-i-kot', title: 'Пиксель и Кот', genre: 'Анимация', age: '6+', duration: 92, poster: null, dolby: false },
    { id: 'posledniy-reys', title: 'Последний рейс', genre: 'Триллер', age: '18+', duration: 108, poster: null, dolby: true },
    { id: 'kanikuly', title: 'Каникулы на краю карты', genre: 'Комедия', age: '12+', duration: 101, poster: null, dolby: false },
    { id: 'orbita', title: 'Орбита', genre: 'Фантастика', age: '12+', duration: 137, poster: null, dolby: true },
    { id: 'dom-u-ozera', title: 'Дом у озера', genre: 'Семейный', age: '6+', duration: 95, poster: null, dolby: false }
  ];

  return {
    KINOMAX_URL: KINOMAX_URL,
    ADDRESS: ADDRESS,
    ROUTE_URL: ROUTE_URL,
    MAP_URL: MAP_URL,
    HOURS: HOURS,
    CONTACTS: CONTACTS,
    PHONE_STUB: PHONE_STUB,
    CATEGORIES: CATEGORIES,
    TENANTS: TENANTS,
    FLOORS: FLOORS,
    NEWS: NEWS,
    NEWS_TYPES: NEWS_TYPES,
    FILMS: FILMS
  };
})();
