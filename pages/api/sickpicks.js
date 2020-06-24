import Cors from 'cors';
import { getAllShowSickPicks } from '../../lib/getShows';
import initMiddleware from '../../lib/initMiddleware';

const cors = initMiddleware(
  Cors({
    methods: ['GET', 'OPTIONS'],
  })
);

export default async function sickPicks(req, res) {
  await cors(req, res);
  res.json(await getAllShowSickPicks());
}
