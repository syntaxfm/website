import glob from 'glob';
import fs from 'fs';
import { promisify } from 'util';
// eslint-disable-next-line no-unused-vars
import path from 'path';

const readdir = promisify(fs.readdir);

export default async function sickPicks(req, res) {
  // readdir(path.join(__dirname, 'shows'), null, (err, files) => {
  readdir('/tmp', null, (err, files) => {
    res.json({
      files,
      __dirname,
    });
  });
  return;
  // eslint-disable-next-line no-unreachable
  glob('*.*', { cwd: '/' }, (err, files) => {
    res.json({
      files,
      __dirname,
    });
  });
}
