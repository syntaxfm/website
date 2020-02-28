const {http } = require('@architect/functions')
const { getShows } = require('@architect/shared/shows');// eslint-disable-line
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');

const fs = require('fs');
const path = require('path');

// 1. read the schema
const typeDefs = fs
  .readFileSync(path.join(__dirname, 'schema.graphql'))
  .toString();

// 2. combine resolvers and schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: { shows: getShows },
  },
});

// 3. make some middleware
async function query(req) {
  try {
    const result = await graphql(
      schema,
      req.body.query,
      {},
      req.session,
      req.body.variables,
      req.body.operationName
    );
    return {
      json: result,
    };
  } catch (e) {
    return {
      json: { error: e.name, message: e.message, stack: e.stack }
    };
  }
};

exports.handler = http.async(query)
