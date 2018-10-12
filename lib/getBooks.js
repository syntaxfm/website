const { promisify } = require('util');
const glob = promisify(require('glob'));
const marked = require('meta-marked');
const { readFile } = require('fs');
const readAFile = promisify(readFile);

let books = {};

var renderer = new marked.Renderer();
renderer.link = function(href, title, text){
  return '<a target="_blank" href="' + href + '"> ' + text + '</a>';
}

const loadBooks = async () => {
  const files = await glob('books/books.md');
  const markdownPromises = files.map(file => readAFile(file, 'utf-8'));
  const booksMarkdown = await Promise.all(markdownPromises);

  books = booksMarkdown
    .map(md => marked(md, { renderer: renderer }))[0] // convert to markdown
}

exports.getBooks = () => {
  return books;
}

loadBooks();
