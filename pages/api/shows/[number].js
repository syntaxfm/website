import { getShow } from '../../../lib/getShows'

export default async (req, res) => {
  const show = await getShow(req.query.number);
  if (show) {
    res.json(show);
    return;
  }
  res.status(404).json({ message: 'Sorry not found' });
}