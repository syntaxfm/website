const { promisify } = require('util');
const { readFile } = require('fs');
const { join } = require('path');

const glob = promisify(require('glob'));
const marked = require('meta-marked');
const spacetime = require('spacetime');

const readAFile = promisify(readFile);
const format = (epoc, fmt) => spacetime(epoc).unixFmt(fmt);
const pad = num => `000${num}`.substr(-3);

const renderer = new marked.Renderer();
renderer.link = function(href, title, text) {
  return `<a rel="noopener noreferrer" target="_blank" href="${href}"> ${text}</a>`;
};

// deliberate let!
let cache = false

async function loadShows () {
  if (cache === false) {
    const files = await glob(join(__dirname, 'shows', '*.md'));
    const markdownPromises = files.map(file => readAFile(file, 'utf-8'));
    const showMarkdown = await Promise.all(markdownPromises);

    cache = showMarkdown.map(md => marked(md, { renderer })).map((show, i) => {
              const { number } = show.meta;
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
  }
  return cache
};

async function getShows() {
  let shows = await loadShows()
  const now = Date.now();
  return shows.filter(show => show.date < now);
};

async function getShow(number) {
  let shows = await loadShows()
  let show = shows.find(showItem => showItem.displayNumber === Number(number));
  if (!show)
    show = shows.find(showItem => showItem.number === Number(number));
  return show;
};

async function getSickPicks() {
  // Since the sick picks parsed markdown id is not consistent,
  // this RegEx finds the first <h2> tag with an id that contains
  // the sequential characters "icks" from "picks" and selects
  // characters from the string up until the next <h2> tag
  // i.e. the next section (usually Shameless Plugs)
  const sickPickRegex = /(<h2 id=".*(icks).*">*[\s\S]*?(?=<h2))/g;
  const headerRegex = /[\s\S]*(?=<\/h2)/; // finds all characters up until the first closing </h2>

  return (await getShows()).reduce((sickPicksAcc, show) => {
    const episode = `<h2>Episode Number: ${show.number} - Sick Picks`;
    const sickPickMatch = show.html.match(sickPickRegex);

    if (sickPickMatch) {
      const html = sickPickMatch[0].replace(headerRegex, episode);
      const sickPick = {
        id: show.number,
        html,
      };

      return sickPicksAcc.concat(sickPick);
    }

    return sickPicksAcc;
  }, []);
};

module.exports = {getShow, getShows, getSickPicks}
