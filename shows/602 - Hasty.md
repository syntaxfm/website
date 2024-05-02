---
number: 602
title: Modals, Popups, Popovers, Lightboxes
date: 1681732800237
url: https://traffic.libsyn.com/syntax/Syntax_-_602.mp3
---

In this Hasty Treat, Scott and Wes talk through the differences between modals, popups, popovers, lightboxes, and dialog boxes.

## Show Notes

* **[00:31](#t=00:31)** Welcome
* **[02:25](#t=02:25)** What's popping up?
* **[02:59](#t=02:59)** What's a modal?
* **[08:33](#t=08:33)** Pop overs and lightboxes
* **[10:41](#t=10:41)** Explicit dismiss and light dismiss
* **[11:30](#t=11:30)** Inert property
* [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert)
* **[16:30](#t=16:30)** Backdrop pseudo element
* [Dialog with animation](https://codepen.io/geckotang/post/dialog-with-animation)
* **[19:26](#t=19:26)** Dialog
* **[28:12:11](#t=28:12:11)** Making accessibility easier

```
const showButton = document.getElementById('showDialog');
const favDialog = document.getElementById('favDialog');
const outputBox = document.querySelector('output');
const selectEl = favDialog.querySelector('select');
const confirmBtn = favDialog.querySelector('#confirmBtn');

// "Show the dialog" button opens the <dialog> modally
showButton.addEventListener('click', () => {
    favDialog.showModal();
});
// "Favorite animal" input sets the value of the submit button
selectEl.addEventListener('change', (e) => {
  confirmBtn.value = selectEl.value;
});
// "Confirm" button of form triggers "close" on dialog because of [method="dialog"]
favDialog.addEventListener('close', () => {
  outputBox.value = `ReturnValue: ${favDialog.returnValue}.`;
});
```

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
