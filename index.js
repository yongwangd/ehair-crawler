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

  const rootTags = $('ul#main-nav>li')
    .toArray()
    .filter(
      li =>
        !['Sale', 'Before & After'].includes(
          $(li)
            .children('a')
            .text()
        )
    );

  const getTagFromElm = elm => ({
    key: getKeyFromHref(elm.attr('href')).trim(),
    label: elm.text().trim(),
    href: elm.attr('href').trim()
  });

  const mainTagLinks = rootTags
    .map(li => $(li).children('a'))
    .map(getTagFromElm);

  console.log(mainTagLinks);

  let leafTags = rootTags
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

  console.log(leafTags);

  leafTags
    // .filter(tag => tag.key == '3d-mink')
    .slice(0, 1)
    .map(link => queueLink(link.href, { parent: link, level: 1 }));
  //   console.log(links);
});

pageSource$
  .filter(result => result.data && result.data.level == 1)
  .subscribe(result => {
    const $ = cheerio.load(result.src);
    const hrefs = $('#product-loop .product-info-inner a')
      .toArray()
      .map(a => $(a).attr('href'));

    hrefs.map(f =>
      queueLink(f, {
        parent: result.data.parent,
        level: 2
      })
    );
  });

pageSource$
  .filter(result => result.data && result.data.level == 2)
  .subscribe(result => {
    const $ = cheerio.load(result.src);
    const $des = $('#product-description');

    const name = $des.children('h1').text();

    const $length = $des.find('div.swatch');

    const availables = $length.children('div.available');

    const length = {};
    availables
      .toArray()
      .map(a => $(a).attr('data-value'))
      .forEach(v => (length[v] = true));

    const soldOut = $length.children('div.soldout');
    soldOut
      .toArray()
      .map(a => $(a).attr('data-value'))
      .forEach(v => (length[v] = false));

    const $refer = $des.find('.rte');
    const comment = $refer.children('p').text();
    const subtitle = $refer.children('h2').text();
    const spec = $refer
      .find('ul li')
      .toArray()
      .map(a => $(a).text());

    const primaryImage = $('.bigimage img').attr('src');
    const smallImages = $('.thumbnail-slider .slide a')
      .toArray()
      .map(a => $(a).attr('data-image'));

    // console.log(length);

    const product = {
      name,
      length,
      comment,
      subtitle,
      spec,
      images: [primaryImage].concat(smallImages),
      tagKeySet: {
        [result.data.parent.key]: true
      }
    };
    console.log(product);
  });

// link$.subscribe(l => console.log(l, 'link'));
