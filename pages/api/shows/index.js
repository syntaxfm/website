import Cors from 'cors';
import { getShows } from '../../../lib/getShows';
import initMiddleware from '../../../lib/initMiddleware';

const cors = initMiddleware(
  Cors({
    methods: ['GET', 'OPTIONS'],
  })
);

export default async function shows(req, res) {
  await cors(req, res);
  res.json(await getShows());
}
