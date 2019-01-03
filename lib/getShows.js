const { promisify } = require('util');
const glob = promisify(require('glob'))
const getConfig = require('next/config');
const marked = require('meta-marked');
const { readFile } = require('fs');
const algoliasearch = require('algoliasearch');
const striptags = require('striptags');

const readAFile = promisify(readFile);
const format = require('date-fns/format');

const pad = num => `000${num}`.substr(-3);

let shows = [];

const renderer = new marked.Renderer();
renderer.link = function(href, title, text) {
  return `<a rel="noopener noreferrer" target="_blank" href="${href}"> ${text}</a>`;
};

const loadShows = async () => {
  const files = await glob('shows/*.md');
  const markdownPromises = files.map(file => readAFile(file, 'utf-8'));
  const showMarkdown = await Promise.all(markdownPromises);

  shows = showMarkdown
    .map(md => marked(md, { renderer })) // convert to markdown
    .map((show, i) => {
      const number = show.meta.number;

      return {
        ...show.meta,
        html: show.html,
        notesFile: files[i],
        displayDate: format(parseFloat(show.meta.date), 'MMM do, yyyy'),
        number,
      };
    }) // flatten
    .map(show => ({ ...show, displayNumber: pad(show.number) })) // pad zeros
    .reverse();
};

const indexShows= async () => {
  const { ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX_NAME } = getConfig().publicRuntimeConfig;

  if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY || !ALGOLIA_INDEX_NAME) {
    return
  }

  const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
  const algoliaIndex = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);

  const showsWithoutHtml = shows.map(show => {
    show.html = striptags(show.html)
    show.objectID = show.number
    return show;
  })

  await algoliaIndex.addObjects(showsWithoutHtml);
}


exports.getShows = () => {
  const now = Date.now();
  return shows.filter(show => show.date < now);
};

exports.getShow = number => {
  const show = shows.find(showItem => showItem.displayNumber === number);
  return show;
};

loadShows();
