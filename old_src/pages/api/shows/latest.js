import Cors from 'cors';
import { getShows } from '../../../lib/getShows';
import initMiddleware from '../../../lib/initMiddleware';

const cors = initMiddleware(
  Cors({
    methods: ['GET', 'OPTIONS'],
  })
);

export default async function latest(req, res) {
  await cors(req, res);

  const shows = await getShows();
  const show = shows[0];
  if (show) {
    res.json(show);
    return;
  }
  res.status(404).json({
    message: `Sorry not found. Out of all the ${shows.length} shows, we didn't find this one.`,
  });
}
