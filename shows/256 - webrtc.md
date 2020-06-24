---
number: 256
title: WebRTC and Peer-to-Peer Video Calling with Ian Ramzy
date: 1591794000494
url: https://traffic.libsyn.com/syntax/Syntax256.mp3
---

In this episode of Syntax, Scott and Wes talk with Ian Ramzy about ZipCall.io — how he built it, why, and some of the surprising choices he made along the way.

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Stackbit - Sponsor
Stackbit offers developers tools that enable things like inline content editing, live previewing of content changes, and collaboration features on your Jamstack site, without code changes. That's why Stackbit is the best way to Jamstack. [stackbit.com](https://stackbit.com)

## Guests
* [Ian Ramzy](https://ianramzy.com/)

## Show Notes

02:08 - Who are you and what's your background?

05:34 - Why did you build this?

13:55 - What is it built in?

* Express server
* Web sockets

16:10 - Why is there no tooling?

* GetUserMedia
* WebRTC
* Twilio STUN/TURN/ICE infrastructure
  * [https://www.twilio.com/docs/stun-turn/faq](https://www.twilio.com/docs/stun-turn/faq)

```jsx
VideoChat.peerConnection = new RTCPeerConnection({
        iceServers: token.iceServers,
      });
```

24:31 - How does your server deal with an influx of users?

27:11 - How do each of these features work?

* Auto-scaling video quality
* Text chat
* Screen sharing
* Picture in picture
* Live captions
* Loading animation
* No download required, entirely browser based
* Direct peer to peer connection ensures lowest latency
* Single use disposable chat rooms

41:32 - Have you looked into any of the recording APIs?

## Links
* [ZipCall](https://github.com/ianramzy/decentralized-video-chat)
* [Zoom](https://zoom.us/)
* [jQuery](https://jquery.com/)
* [WebTorrent](https://webtorrent.io/)
* [Heroku](https://www.heroku.com/)
* [Adopter.js](https://github.com/webrtc/adapter)
* [Figma](https://www.figma.com/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Ian: [Notion](https://www.notion.so/)
* Scott: [Summoning Salt](https://www.youtube.com/channel/UCtUbO6rBht0daVIOGML3c8w)
* Wes: [4 Channel WiFi Momentary Inching Relay Self-Lock Switch Module](https://amzn.to/3e4WfE4)

## Shameless Plugs
* Ian [ZipCall](https://zipcall.io/)
* Scott: [All Courses](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
