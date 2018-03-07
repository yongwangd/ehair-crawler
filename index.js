const { staticCrawler } = require('sleepydog');
const cheerio = require('cheerio');

let { pageSource$, queueLink, link$ } = staticCrawler({
  domain: 'https://www.goodreads.com',
  startFrom: '/quotes'
});

pageSource$.subscribe(result => {
  console.log(result.url);
  let $ = cheerio.load(result.src);
  $('.quotes .quote .authorOrTitle')
    .toArray()
    .map(a => $(a).text())
    .map(x => console.log(x));

  $('a.next_page')
    .toArray()
    .map(a => $(a).attr('href'))
    .map(queueLink);
});

link$.subscribe(l => console.log(l, 'link'));
