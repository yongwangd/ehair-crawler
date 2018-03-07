# Node crawler Demo Project

this project is to crawl the authors of the quotes for all 100 pages from [https://www.goodreads.com/quotes](https://www.goodreads.com/quotes)

### Installing

```
git clone https://github.com/yongwangd/node-crawler-demo

cd node-crawler-demo
npm install
node index.js
```

This project is using a npm package called `sleepydog` I created long time ago. I haven't had time to create the documentation for it.

It comes with a `StaticCrawler`, which is used to crawl static pages, and a `DynamicCrawler`, which is used to crawl ajax based pages.

The api is very simple. [Cheerio](https://github.com/cheeriojs/cheerio) is used to parse the page source. It's pretty like jQuery.

```js
const { staticCrawler } = require('sleepydog');
const cheerio = require('cheerio');

let { pageSource$, queueLink } = staticCrawler({
  domain: 'https://www.goodreads.com',
  startFrom: '/quotes'
});
```

Create a new `staticCrawler` instance. `Domain` is the root domain of the website you want to crawl. `startFrom` is the sub domain. The return value is a object which has the following fileds.
`pageSource$` is a stream of page source, which you need to use cheerio to parse. `queueLink` is a method to queue new link you find from page source to crawl.
`link$` is a url stream that the crawler has crawled

```js
//subscribe the pageSource$ and parse the page source using cheerio.
//result: {src: 'page srouce', url: 'current url'}
pageSource$.subscribe(result => {
  console.log(result.url);
  let $ = cheerio.load(result.src);

  //get all the authors from the page source and print them to console. You are certainly save them to a database as you need
  $('.quotes .quote .authorOrTitle')
    .toArray()
    .map(a => $(a).text())
    .forEach(console.log);

  //get the nextpage URL from the paginator and add it to the url queue. The crawler will pick up next url from the url queue when it finishes crawling current url.
  $('a.next_page')
    .toArray()
    .map(a => $(a).attr('href'))
    .map(queueLink);
});

//Print the urls that has been crawled. This is not necessary, just for logging purpose
link$.subscribe(l => console.log(l, 'link'));
```

Now you should see quote authors from all 100 pages are being printed in the console. Cheers!

`sleepydog` also has some advanced features, like passing data between link, using cookie for login, crawling dynamic web pages using selenium. let me know if you need them.
