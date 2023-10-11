---
number: 656
title: 8 Tricks When Using the Fetch() API
date: 1692619200247
url: https://traffic.libsyn.com/syntax/Syntax_-_656.mp3
---

In this Hasty Treat, Scott and Wes talk about 8 tricks to try when using the Fetch() API.

## Show Notes

* **[00:23](#t=00:23)** Welcome
* **[02:14](#t=02:14)** 1) Stream The Result

```
// Create a new TextDecoder instance
const decoder = new TextDecoder();

// Make the fetch request
fetch('https://api.example.com/streaming-data')
  .then(response => {
    // Check if the response is valid
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Stream the response data using a TextDecoder
    const reader = response.body.getReader();

    // Function to read the streamed chunks
    function read() {
      return reader.read().then(({ done, value }) => {
        // Check if the streaming is complete
        if (done) {
          console.log('Streaming complete');
          return;
        }

        // Decode and process the streamed data
        const decodedData = decoder.decode(value, { stream: true });
        console.log(decodedData);

        // Continue reading the next chunk
        return read();
      });
    }

    // Start reading the chunks
    return read();
  })
  .catch(error => {
    // Handle errors
    console.log('Error:', error);
  });
  ```

* **[06:05](#t=06:05)** 2) Download Progress
* [Download progress example](https://twitter.com/wesbos/status/1688914467864903684)
* **[09:40](#t=09:40)** 3) Cancel Streams - Abort Controller

```
// Create an AbortController instance
const controller = new AbortController();

// Set a timeout to abort the request after 5 seconds
const timeout = setTimeout(() => {
controller.abort();
}, 5000);

// Fetch request with the AbortController
fetch('https://api.example.com/data', { signal: controller.signal })
```

* **[11:32](#t=11:32)** 4) Testing if JSON is returned
* **[13:18](#t=13:18)** 5) async + await + catch

`const data = await fetch().catch(err => console.log(err));`

* **[14:42](#t=14:42)** 6) to awaited - return error and data at top level

```
const [err, data] = collect(fetch())
if(err) // ....
```

* [await-to-js - npm](https://www.npmjs.com/package/await-to-js)
* **[16:58](#t=16:58)** 7) Dev tools - Copy as fetch
* **[17:54](#t=17:54)** 8) You can programatically create a Request, Response and Headers objects

```
const myRequest = new Request('https://traffic.libsyn.com/syntax/Syntax_-_641.mp3', {
   headers: {
      'Content-Type': 'text/plain',
   }
});

fetch(myRequest)
```

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
* [Wes Bos on Bluesky](https://bsky.app/profile/wesbos.com)
* [Scott on Bluesky](https://bsky.app/profile/tolin.ski)
* [Syntax on Bluesky](https://bsky.app/profile/syntax.fm)
