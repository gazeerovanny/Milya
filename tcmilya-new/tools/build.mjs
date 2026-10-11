#!/usr/bin/env node
/*
 * Синхронизация общих блоков сайта. Без зависимостей, нужен только Node 18+.
 *
 *   node tools/build.mjs
 *
 * Что делает:
 *  1. Вставляет в каждую страницу общий <head> (tools/partials/head.html),
 *     шапку (header.html + sprite.svg) и подвал (footer.html) между маркерами
 *     <!-- layout:head --> ... <!-- /layout:head --> и т. д.
 *  2. Встраивает css/critical.css в <style> (критичный CSS).
 *  3. Проставляет aria-current="page" активному пункту меню по <body data-page>.
 *  4. Пересобирает sitemap.xml.
 *
 * Страницы остаются обычными HTML-файлами: их можно править руками,
 * а скрипт просто обновляет общие куски.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://www.tcmilya.ru/'; // TODO: поменять, если сайт переедет на другой домен
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (f) => readFileSync(join(ROOT, 'tools/partials', f), 'utf8');

const minifyCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};:,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

const critical = minifyCss(readFileSync(join(ROOT, 'css/critical.css'), 'utf8'));
const version = createHash('md5').update(readFileSync(join(ROOT, 'css/main.css'))).digest('hex').slice(0, 8);
const head = P('head.html');
const header = P('sprite.svg') + P('header.html');
const footer = P('footer.html');

const files = [
  'index.html', '404.html',
  ...readdirSync(join(ROOT, 'pages')).filter((f) => f.endsWith('.html')).map((f) => 'pages/' + f)
];

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const block = (html, name, content) => {
  const re = new RegExp(`(<!-- layout:${name} -->)[\\s\\S]*?(<!-- /layout:${name} -->)`);
  if (!re.test(html)) throw new Error(`Нет маркера layout:${name}`);
  return html.replace(re, `$1\n${content.trim()}\n$2`);
};

for (const file of files) {
  const path = join(ROOT, file);
  let html = readFileSync(path, 'utf8');
  // 404 отдается Netlify по любому адресу, поэтому пути в ней абсолютные
  const root = file === '404.html' ? '/' : file.includes('/') ? '../' : '';
  const pageId = (html.match(/<body[^>]*data-page="([^"]+)"/) || [])[1] || '';
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'ТРЦ «Миля»';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const url = file === 'index.html' ? SITE : SITE + file;

  const fill = (tpl) => tpl
    .replaceAll('{{root}}', root)
    .replaceAll('{{site}}', SITE)
    .replaceAll('{{version}}', version)
    .replace('{{critical}}', () => critical)
    .replace(/data-nav="([^"]+)"/g, (m, id) => (id === pageId ? `${m} aria-current="page"` : m));

  const meta = [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`
  ].join('\n');

  html = block(html, 'head', meta + '\n' + fill(head));
  html = block(html, 'header', fill(header));
  html = block(html, 'footer', fill(footer));
  if (!/<body[^>]*data-root=/.test(html)) html = html.replace('<body', `<body data-root="${root}"`);
  writeFileSync(path, html);
  console.log('ok', relative(ROOT, path));
}

/* sitemap.xml */
const data = readFileSync(join(ROOT, 'js/data.js'), 'utf8');
const newsIds = [...data.matchAll(/\{ id: '([^']+)', date: '(\d{4}-\d{2}-\d{2})', type:/g)];
const today = new Date().toISOString().slice(0, 10);
const urls = [
  ['', 'daily', '1.0'],
  ...files.filter((f) => f.startsWith('pages/') && f !== 'pages/news-item.html').map((f) => [f, 'weekly', '0.8']),
  ...newsIds.map((m) => [`pages/news-item.html?id=${m[1]}`, 'monthly', '0.5', m[2]])
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, freq, pr, mod]) => `  <url><loc>${escAttr(SITE + u).replace(/&quot;/g, '"')}</loc><lastmod>${mod || today}</lastmod><changefreq>${freq}</changefreq><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log('ok sitemap.xml,', urls.length, 'адресов');
