import { getAllShowSickPicks } from '../../lib/getShows'

export default async (req, res) => {
  res.json(await getAllShowSickPicks());
}