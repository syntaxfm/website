import Cors from 'cors';
import { getShow } from '../../../lib/getShows';
import initMiddleware from '../../../lib/initMiddleware';

const cors = initMiddleware(
  Cors({
    methods: ['GET', 'OPTIONS'],
  })
);

export default async function showByNumber(req, res) {
  await cors(req, res);

  const show = await getShow(req.query.number);
  if (show) {
    res.json(show);
    return;
  }
  res
    .status(404)
    .json({ message: `Sorry, we could not find show #${req.query.number}` });
}
