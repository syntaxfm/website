import glob from 'glob';

export default async function sickPicks(req, res) {
  const files = await glob('*/*.*', { cwd: '/' });
  res.json({
    files,
    __dirname,
  });
}
