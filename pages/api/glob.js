import glob from 'glob';

export default async function sickPicks(req, res) {
  const files = await glob('*.*');
  res.json({
    files,
    __dirname,
  });
}
