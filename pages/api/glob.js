import glob from 'glob';
import fs from 'fs';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

export default async function sickPicks(req, res) {
  readdir('./shows/', null, (err, files) => {
    res.json({
      files,
      __dirname,
    });
  });
  return;
  glob('*.*', { cwd: '/' }, (err, files) => {
    res.json({
      files,
      __dirname,
    });
  });
}
