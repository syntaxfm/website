const { promisify } = require('util');
const glob = promisify(require('glob'));
const marked = require('meta-marked');
const { readFile } = require('fs');

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

exports.getShows = () => {
  const now = Date.now();
  return shows.filter(show => show.date < now);
};

exports.getShow = number => {
  const show = shows.find(showItem => showItem.displayNumber === number);
  return show;
};

loadShows();
