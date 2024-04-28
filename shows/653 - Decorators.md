---
number: 653
title: JS Fundamentals - Decorators
date: 1692014400681
url: https://traffic.libsyn.com/syntax/Syntax_-_653.mp3
spotify_url: https://open.spotify.com/episode/6rxmTeoO4k5MBRn5RQYLlS
---

In this Hasty Treat, Scott and Wes talk about whether decorators are finally here, what the uses cases are for decorators, how to define a decorator, and what auto accessor is.

## Show Notes

* **[00:25](#t=00:25)** Welcome
* **[01:00](#t=01:00)** Are decorators finally here?
* [TC39 proposal](https://github.com/tc39/proposal-decorators/blob/master/EXTENSIONS.md)
* [How this compares to other versions of decorators](https://github.com/tc39/proposal-decorators#how-does-this-proposal-compare-to-other-versions-of-decorators)
* **[06:47](#t=06:47)** What are use cases for decorators?
* **[10:55](#t=10:55)** How do you define a decorator?
* **[14:20](#t=14:20)** Auto Accessor

on classes

```
@loggged
class C {}
```

on fields

```
class C {
@logged x = 1;
}
```

Auto Accessor

```
class C {
  accessor x = 1;
}
```

sugar for below

```
class C {
  #x = 1; // # means private

  get x() {
    return this.#x;
  }

  set x(val) {
    this.#x = val;
  }
}
```

Can be decorated and decorator can return new get and set and init functions

```
function logged(value, { kind, name }) {
  if (kind === "accessor") {
    let { get, set } = value;

    return {
      get() {
        console.log(`getting ${name}`);

        return get.call(this);
      },

      set(val) {
        console.log(`setting ${name} to ${val}`);

        return set.call(this, val);
      },

      init(initialValue) {
        console.log(`initializing ${name} with value ${initialValue}`);
        return initialValue;
      }
    };
  }

  // ...
}
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
