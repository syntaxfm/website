---
number: 657
title: Rust for JS Devs — Part 2
date: 1692792000000
url: https://traffic.libsyn.com/syntax/Syntax_-_657.mp3
---

In this episode of Syntax, Wes and Scott jump into part 2 of their look at Rust for JavaScript developers, including variables in Rust, type systems in Rust, signed and unsigned integers, and more.

## Show Notes

* **[00:10](#t=00:10)** Welcome
* **[00:43](#t=00:43)** Audio issue bugs
* **[03:17](#t=03:17)** Building decks
* **[06:06](#t=06:06)** Variables in Rust
* [Syntax 647: Rust for JavaScript Developers - Node vs Rust Concepts](https://syntax.fm/show/647/rust-for-javascript-developers-node-vs-rust-concepts)

```
let x = 5;  // x is immutable
let mut x = 5; // x is mutable
const MAX_POINTS: u32 = 100_000; // must be defined at compile time
```

* **[10:42](#t=10:42)** Type System in Rust
* **[15:52](#t=15:52)** Types in Rust
* **[19:06](#t=19:06)** Why does Rust have signed and unsigned integers?
* **[23:35](#t=23:35)** Slicing strings with &str
* **[27:35](#t=27:35)** enum
* **[27:55](#t=27:55)** struct
* **[28:19](#t=28:19)** Vec
* **[29:33](#t=29:33)** HashMap and HashSet
* **[33:00](#t=33:00)** Converting Signed to Unsigned Numbers

```
let unsigned_value: u8 = 200;
let signed_value: i8 = unsigned_value as i8;
```

* **[36:12](#t=36:12)** What’s up with &str?
* **[43:31](#t=43:31)** Rust error messages
* **[45:28](#t=45:28)** What is a Struct?

```
struct User {
   username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

// You can create an instance of a struct like this:
let user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};

impl User {
    fn login(&mut self) {
        self.login_count += 1;
    }
}
```

* **[49:17](#t=49:17)** SIIIIICK ××× PIIIICKS ×××

## ××× SIIIIICK ××× PIIIICKS ×××

* Scott: [Thermacell Patio Shield](https://amzn.to/3PZmbXG)
* Wes: [Magnet Phone Mount](https://amzn.to/3OPIHS5)

## Shameless Plugs

* Scott: [Sentry](https://sentry.io)
* Wes: [Wes Bos Tutorials](https://wesbos.com/courses)

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
