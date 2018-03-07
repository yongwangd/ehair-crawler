const { staticCrawler } = require('sleepydog');
const cheerio = require('cheerio');

require('ssl-root-cas').inject();
let { pageSource$, queueLink, link$ } = staticCrawler({
  domain: 'https://www.ehairoutlet.com',
  startFrom: '/'
});

const getKey = label =>
  label
    .split(' ')
    .map(a => a.toLowerCase())
    .join('-');

pageSource$.subscribe(result => {
  console.log(result.url);
  let $ = cheerio.load(result.src);
  //   console.log(result.src);

  const mainTag = $('ul#main-nav>li');

  //   mainTag.toArray().map(tg => {
  //     console.log(
  //       $(tg)
  //         .children('a')
  //         .text()
  //     );
  //   });

  console.log(mainTag.length, 'ddd');
  let links = mainTag.toArray().map(tag => {
    link = $(tag).find(
      '.mega-stack>li>a, .nested>li>a, .submenu>li:not(.nest)> a'
    );
    return link
      .toArray()
      .map(a => $(a))
      .map(elm => ({
        key: getKey(elm.text()),
        href: elm.attr('href'),
        label: elm.text()
      }));
    //   .map(t => ({}))
    //   .map(a => console.log(a.length));
  });

  console.log(links);

  //   $('ul#main-nav>li>a')
  //     .toArray()
  //     .map(a => $(a).text())
  //     .map(x => console.log(x));

  //   $('.quotes .quote .authorOrTitle')
  //     .toArray()
  //     .map(a => $(a).text())
  //     .map(x => console.log(x));

  //   $('a.next_page')
  //     .toArray()
  //     .map(a => $(a).attr('href'))
  //     .map(queueLink);
});

link$.subscribe(l => console.log(l, 'link'));
