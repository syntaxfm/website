const express = require('express');
const next = require('next');
const Router = require('./routes').Router;

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 6969;
const app = next({ dev });
const handle = app.getRequestHandler();
const { getShows, getShow } = require('./lib/getShows');

app.prepare().then(() => {
  const server = express();

  // API endpoints
  server.get('/api/shows', (req, res) => {
    res.json(getShows());
  });

  server.get('/api/shows/:number', (req, res) => {
    const show = getShow(req.params.number);
    if (show) {
      res.json(show);
      return;
    }
    res.status(404).json({ message: 'Sorry not found' });
  });

  // Custom Next.js URLs
  Router.forEachPrettyPattern((page, pattern, defaultParams) => {
    server.get(pattern, (req, res) => {
      app.render(
        req,
        res,
        `/${page}`,
        Object.assign({}, defaultParams, req.query, req.params)
      );
    });
  });

  // everything else
  server.get('*', (req, res) => handle(req, res));
  server.listen(port, () => `Listening on ${port}`);
});
