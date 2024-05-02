---
number: 711
title: The Surprisingly Exciting World of Print + PDF CSS
date: 1704110400502
url: https://traffic.libsyn.com/syntax/Syntax_-_711fix.mp3
---

In this episode of Syntax, Wes and Scott talk about things to consider when printing something from your website or app including loading CSS only for printing, using units in CSS, CSS counters, creating a PDF, naming pages when printing, and more.

### Show Notes

* **[00:25:15](#t=00:25:15)** Welcome
* **[01:27:04](#t=01:27:04)** Syntax Brought to you by Sentry
* **[01:52:00](#t=01:52:00)** Examples of how Wes uses print CSS
* **[03:42:16](#t=03:42:16)** Using it for invoices or receipts
* **[05:08:24](#t=05:08:24)** Delivering a book as a PDF
* **[05:42:16](#t=05:42:16)** How do you load CSS only for printing?
* **[10:41:08](#t=10:41:08)** Using units in CSS
* **[11:29:15](#t=11:29:15)** CSS Counters
* [MDN: CSS Counters](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_counter_styles/Using_CSS_counters)
```

body {
counter-reset: chapter; /* create a chapter counter scope */
}

h1:before {
content: "Section " counter(chapter) " ";
counter-increment: chapter; /* add 1 to chapter */

}
h1 {
        counter-reset: subchapter; /* set section to 0 */
    }
    h2:before {
        content: counter(chapter) "." counter(subchapter) " ";
        counter-increment: subchapter;
    }
    h2 {
        counter-reset: section;
        font-size: 23px;
    }
```
* **[14:31:10](#t=14:31:10)** Named Pages
```
@page title {
  @top {
    /* no header for title pages */
    content: “”;
   }
}

@page chapter {
  @top {
    content: “This is a chapter page”;
   }
}
```
* **[15:27:09](#t=15:27:09)** Margins, Headers + footers, Page Numbers
* **[18:01:18](#t=18:01:18)** Debugging Print CSS
* **[19:57:18](#t=19:57:18)** Getting into a PDF
* [Docraptor](http://docraptor.com/)
* [Playwright](https://playwright.dev/)
* [Puppeteer](https://pptr.dev/)
* [JSPdf](https://www.npmjs.com/package/jspdf)
* **[24:45:04](#t=24:45:04)** Other Things to consider

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)