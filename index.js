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

const contactsRef = firebase.database().ref('contacts/');
const tagsRef = firebase.database().ref('contactTags/');

let existingTags = [];
let existingContacts = [];

tagsRef.on('value', v => {
  const ob = v.val() || [];
  existingTags = Object.entries(ob).map(([id, value]) => {
    value._id = id;
    return value;
  });
});

contactsRef.on('value', v => {
  const ob = v.val() || [];
  existingContacts = Object.entries(ob).map(([id, value]) => {
    value._id = id;
    return value;
  });
});

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
pageSource$
  .take(1)
  .delay(3000)
  .subscribe(result => {
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

    //   console.log(mainTagLinks);

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

    //   console.log(leafTags);

    leafTags
      // .filter(tag => tag.key == '3d-mink')
      //   .slice(0, 1)
      .map(link => queueLink(link.href, { parent: link, level: 1 }));
    //   console.log(links);

    const allTags = mainTagLinks.concat(leafTags);

    // allTags
    //   .filter(tg => !existingTags.find(e => e.key == tg.key))
    //   .forEach(tag => {
    //     var newTag = tagsRef.push();
    //     newTag.set(tag);
    //   });
  });

pageSource$
  .filter(result => result.data && result.data.level == 1)
  .subscribe(result => {
    const $ = cheerio.load(result.src);
    const hrefs = $('#product-loop .product-info-inner a')
      .toArray()
      .map(a => $(a).attr('href'));

    var ec = existingContacts.map(c => c.ehairKey);

    hrefs.filter(href => !ec.includes(href.split('/').reverse()[0])).map(f =>
      queueLink(f, {
        parent: result.data.parent,
        level: 2,
        href: f
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

    const length = [];
    const lengthDivs = $length.children('div');

    lengthDivs.toArray().forEach(div => {
      const available = $(div).hasClass('available');
      length.push({ label: $(div).attr('data-value'), available });
    });

    // availables
    //   .toArray()
    //   .map(a => $(a).attr('data-value'))
    //   //   .forEach(v => (length[v] = true));
    //   .forEach(v => length.push({ label: v, available: true }));

    // const soldOut = $length.children('div.soldout');
    // soldOut
    //   .toArray()
    //   .map(a => $(a).attr('data-value'))
    //   .forEach(v => length.push({ label: v, available: false }));

    const $refer = $des.find('.rte');
    const comment = $refer.children('p').text();
    const subtitle = $refer.children('h2').text();
    const spec = $refer
      .find('ul li')
      .toArray()
      .map(a => $(a).text())
      .map(t => t.replace(/(\r\n\t|\n|\r\t)/gm, ''));

    // const primaryImage = $('.bigimage img').attr('src');
    const smallImages = $('.thumbnail-slider .slide a')
      .toArray()
      .map(a => $(a).attr('data-image'));

    // console.log(length);

    const href = result.data.href;
    const ehairKey = href.split('/').reverse()[0];

    const product = {
      name,
      length,
      comment,
      subtitle,
      inStock: true,
      spec,
      images: smallImages,
      tagKeySet: {
        [result.data.parent.key]: true
      },
      href: result.data.href,
      ehairKey
    };
    console.log(product);
    console.log('-----------------');
    console.log('-----------------');
    console.log('-----------------');

    // if (!existingContacts.find(c => c.ehairKey == ehairKey)) {
    //   var newRecord = contactsRef.push();
    //   newRecord.set(product);
    // }
  });

// link$.subscribe(l => console.log(l, 'link'));
