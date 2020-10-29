const { promisify } = require('util');
const path = require('path');
const marked = require('meta-marked');
const { readFile, readdir } = require('fs');
const slug = require('speakingurl');

const readAFile = promisify(readFile);
const readDirContents = promisify(readdir);
const format = require('date-fns/format');

const pad = num => `000${num}`.substr(-3);

let shows;

const renderer = new marked.Renderer();
renderer.link = function(href, title, text) {
  return `<a rel="noopener noreferrer" target="_blank" href="${href}"> ${text}</a>`;
};

const loadShows = async () => {
  // Cached shows
  if (shows) {
    return shows;
  }

  const showsDir = path.join(process.cwd(), 'shows');
  const files = (await readDirContents(showsDir)).filter(file =>
    file.endsWith('.md')
  );

  const markdownPromises = files.map(file =>
    readAFile(path.join(showsDir, file), 'utf-8')
  );
  const showMarkdown = await Promise.all(markdownPromises);

  shows = showMarkdown
    .map(md => marked(md, { renderer })) // convert to markdown
    .map((show, i) => {
      const { number } = show.meta;

      return {
        ...show.meta,
        slug: `/show/${number}/${slug(show.meta.title)}`,
        html: show.html,
        notesFile: files[i],
        displayDate: format(parseFloat(show.meta.date), 'MMM do, yyyy'),
        displayNumber: pad(number),
      };
    }) // flatten
    .reverse();

  return shows;
};

async function getShows(filter) {
  // eslint-disable-next-line no-shadow
  const showsForGetShows = await loadShows();
  const now = Date.now();
  return filter === 'all'
    ? showsForGetShows
    : showsForGetShows.filter(show => show.date < now);
}

async function getShow(number) {
  const showsForGetShow = await loadShows();
  const show = showsForGetShow.find(
    showItem => showItem.displayNumber === number
  );
  return show;
}

async function getAllShowSickPicks() {
  // Since the sick picks parsed markdown id is not consistent,
  // this RegEx finds the first <h2> tag with an id that contains
  // the sequential characters "icks" from "picks" and selects
  // characters from the string up until the next <h2> tag
  // i.e. the next section (usually Shameless Plugs)
  const sickPickRegex = /(<h2 id=".*(icks).*">*[\s\S]*?(?=<h2))/g;
  const headerRegex = /[\s\S]*(?=<\/h2)/; // finds all characters up until the first closing </h2>
  const showsForSickPicks = await getShows();
  return showsForSickPicks.reduce((sickPicksAcc, show) => {
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
}

module.exports = {
  getShows,
  getShow,
  getAllShowSickPicks,
};
