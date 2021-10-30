import Cors from 'cors';
import { getShowsPaginated } from '../../../lib/getShows';
import initMiddleware from '../../../lib/initMiddleware';

const cors = initMiddleware(
  Cors({
    methods: ['GET', 'OPTIONS'],
  })
);

export default async function showsPaginated(req, res) {
  await cors(req, res);

  const shows = await getShowsPaginated(req.query.offset,req.query.limit);
  if (shows) {
    res.json(shows);
    return;
  }
  res
    .status(404)
    .json({ message: `Sorry, we could not find shows between ${req.query.offset} and ${req.query.limit}` });
}
