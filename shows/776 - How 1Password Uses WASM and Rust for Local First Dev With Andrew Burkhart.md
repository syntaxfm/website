---
number: 776
title: How 1Password Uses WASM and Rust for Local First Dev With Andrew Burkhart
date: 1717153200000
url: https://traffic.libsyn.com/syntax/Syntax_-_776.mp3
youtube_url: https://www.youtube.com/watch?v=DjfnxkqANIk
guest:
  name: Andrew Burkhart
  github: DrewBurkhart
  twitter: Andrew_Burkhart
  of: 1Password
  url: https://1password.com/
  social: https://www.linkedin.com/in/andrewburkhartdev/
---

Today we're serving up an episode on 1Password with Senior Rust Developer Andrew Burkhart, delving into how 1Password works, tackling conflict resolution and security challenges, and exploring the benefits of using Rust.

### Show Notes

* **[00:00](#t=00:00)** Welcome to Syntax
* **[00:57](#t=00:57)** Who is Andrew Burkhart?
* **[01:36](#t=01:36)** How does 1Password work?
* **[03:24](#t=03:24)** What's the data flow on creating a new login?
* **[05:40](#t=05:40)** The conflict resolution challenges of pull first, push second.
* **[06:46](#t=06:46)** Merging strategies: How do you chose which device wins the conflict?
* **[08:27](#t=08:27)** 1Password's sync is fast and reliable.
* **[11:20](#t=11:20)** Nuances of the extension.
* **[12:59](#t=12:59)** The value of Hackathons.
* **[13:40](#t=13:40)** What's the main benefit of 1Password using Rust?
* **[15:41](#t=15:41)** [Watchtower](https://watchtower.1password.com/) processing.
* **[17:15](#t=17:15)** [1Password SSH](https://1password.com/developers/ssh).
* **[18:17](#t=18:17)** 1Password env.
* **[19:11](#t=19:11)** Some other cool tools.
* **[20:33](#t=20:33)** Does the increased security make developing challenging?
* **[25:26](#t=25:26)** What's 1Password's security onboarding like?
* **[27:47](#t=27:47)** 1Password and WASM.
* **[31:45](#t=31:45)** [Tokio](https://tokio.rs/) as the asynchronous runtime for Rust.
* **[34:25](#t=34:25)** Scott's Rust based video app.
* **[35:03](#t=35:03)** What is an FFI?
* **[38:13](#t=38:13)** How did you learn Rust?
  * [Jon Gjengset - Rust Nation UK YouTube](https://www.youtube.com/watch?v=qfknfCsICUM).
  * [Let's Get Rusty YouTube](https://www.youtube.com/@letsgetrusty).
* **[41:13](#t=41:13)** Why is the 1Password team so big?
* **[42:40](#t=42:40)** Are there teams that manage individual applications for errors?
* **[43:45](#t=43:45)** Challenges with WASM.
* **[48:59](#t=48:59)** Syntax horror stories.
  * [Episode 586 with Eric Sartorius](https://syntax.fm/show/586/supper-club-digital-nomad-with-eric-sartorius).
* **[52:50](#t=52:50)** Sick Picks + Shameless Plugs.

### Sick Picks

- Andrew: [Nix Mini 3](https://www.nixsensor.com/mini-3-color-sensor/), [Asynchronous Programming in Rust](https://rust-lang.github.io/async-book/).

### Shameless Plugs

- Andrew: [1Password](https://1password.com/).

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott:[X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)
