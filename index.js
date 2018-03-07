const { staticCrawler } = require('sleepydog');
const cheerio = require('cheerio');
const firebase = require('firebase');

var config = {
  apiKey: 'AIzaSyBnX1Yt1Drfb51N7GTELUaOQcTM3yiVA3Q',
  authDomain: 'ehair-expo-dev.firebaseapp.com',
  databaseURL: 'https://ehair-expo-dev.firebaseio.com',
  projectId: 'ehair-expo-dev',
  storageBucket: 'ehair-expo-dev.appspot.com',
  messagingSenderId: '401113474249'
};
firebase.initializeApp(config);

require('ssl-root-cas').inject();
let { pageSource$, queueLink, link$ } = staticCrawler({
  domain: 'https://www.ehairoutlet.com',
  startFrom: '/'
});

const getKeyFromHref = href => {
  const arr = href.split('/');
  return arr[arr.length - 1];
};

//get all the menus
pageSource$.take(1).subscribe(result => {
  console.log(result.url);
  let $ = cheerio.load(result.src);
  //   console.log(result.src);

  const mainTags = $('ul#main-nav>li');

  const getTagFromElm = elm => ({
    key: getKeyFromHref(elm.attr('href')),
    label: elm.text(),
    href: elm.attr('href')
  });

  const mainTagLinks = $('ul#main-nav>li>a')
    .toArray()
    .map(a => $(a))
    .map(getTagFromElm);

  let leafTags = mainTags
    .toArray()
    .map(tag => {
      link = $(tag).find(
        '.mega-stack>li>a, .nested>li>a, .submenu>li:not(.nest)> a'
      );
      const parentKey = getKeyFromHref(
        $(tag)
          .children('a')
          .attr('href')
      );

      return link
        .toArray()
        .map(a => $(a))
        .map(getTagFromElm)
        .map(child => {
          child.parentTagSet = {
            [parentKey]: true
          };
          return child;
        });
    })
    .reduce((acc, cur) => acc.concat(cur), []);

  //   console.log(leafTags);

  var links = leafTags
    .slice(0, 3)
    .map(link => queueLink(link.href, { parent: link, level: 1 }));
  //   console.log(links);
});

// pageSource$
//   .skip(1)
//   .filter(result => result.data && result.data.level == 1)
//   .subscribe(result => {
//     console.log('real data', result.url, result.data);
//   });

pageSource$
  .filter(result => result.data && result.data.level == 1)
  .subscribe(result => {
    // console.log('lvellll 11', result.url, result.data);

    const $ = cheerio.load(result.src);
    const hrefs = $('#product-loop .product-info-inner a')
      .toArray()
      .map(a => $(a).attr('href'))
      .reduce((acc, cur) => acc.concat(cur));
    console.log(hrefs);
  });

link$.subscribe(l => console.log(l, 'link'));
