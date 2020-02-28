exports.handler = async function http() {
  return {
    headers: { 'content-type': 'text/html; charset=utf8' },
    body: `
    <!DOCTYPE html>
<html>
<head>
  <meta charset=utf-8/>
  <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui">
  <title>GraphQL Playground</title>
  <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
  <link rel="shortcut icon" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
  <script src="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
<style>
header {
  padding: 10px;
  background: black;
  color:white;
  align-items: center;
}

header, #account {
  display: flex;
}

header h1 {
  flex-grow: 1;

}

#account img {
  border-radius: 30px;
  border: 3px solid lightgrey;
  width: 30px;
  height: 30px;
}

header #account button {
  background: white;
  font-weight: bolder;
  border: 2px solid lightgrey;
  padding: 10px;
  border-radius: 10px;
  margin-left: 10px;
}
</style>
</head>
<body>
<header>
  <h1>Architect &#10084; GraphQL</h1>
  <div id=account></div>
</header>
<div id=root>
  <style>
    body {
      background-color: rgb(23, 42, 58);
      font-family: Open Sans, sans-serif;
      height: 90vh;
    }

    #root {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading {
      font-size: 32px;
      font-weight: 200;
      color: rgba(255, 255, 255, .6);
      margin-left: 20px;
    }

    img {
      width: 78px;
      height: 78px;
    }

    .title {
      font-weight: 400;
    }
  </style>
  <img src='//cdn.jsdelivr.net/npm/graphql-playground-react/build/logo.png' alt=''>
  <div class="loading"> Loading
    <span class="title">GraphQL Playground</span>
  </div>
</div>

<script>
  let endpoint = '/graphql'

  // start the playground
  GraphQLPlayground.init(document.getElementById('root'), {
    endpoint,
    settings: {
      'request.credentials': 'include'
    }
  })
</script>
</body>
</html>

`,
  };
};
