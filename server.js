const express = require('express');
const next = require('next');

const { getShows, getShow } = require('./lib/getShows');
const { Router } = require('./routes');

const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  server.get('/api/shows', (req, res) => {
    res.status(200).json(getShows());
  });

  server.get('/api/shows/:number', (req, res) => {
    const show = getShow(req.params.number);
    res.status(show ? 200 : 404).json(show || { message: 'Sorry not found' });
  });


  // custom Next.js URLs
  Router.forEachPattern((page, pattern, defaultParams) => {
    server.get(pattern, (req, res) => {
      app.render(req, res, `/${page}`, Object.assign({}, defaultParams, req.query, req.params));
    });
  });

  // everything else
  server.get('*', handle);
  server.listen(port);
});
