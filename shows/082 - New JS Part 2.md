---
number: 82
title: Top 18 New Things in JS - Part 2
date: 1539176400685
url: https://traffic.libsyn.com/syntax/Syntax082.mp3
---

In this episode Wes and Scott continue the discussion of their favorite top 18 new things in Javascript.

## Freshbooks - Sponsor

Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put **SYNTAX** in the "How did you hear about us?" section.

## Graph CMS - Sponsor

GraphCMS is trying to be the world’s most developer friendly CMS. It's a great way to build a GraphQL API without having to write a custom GraphQL server. Try out the API-first CMS of the future today at [graphcms.com/syntaxfm](https://graphcms.com/syntaxfm).

## Show Notes

3:30

* Spread

```javascript
const array1 = [1, 2, 3]
const array2 = [0, ...array1]
```

8:40

* Rests

```javascript
const teams = [player1, player2, player3]
const [leader, ...members] = teams
```

11:54

* Arrow Functions

```javascript
const add = (x, y) => {
  return x + y
}
// equal to
const add = (x, y) => x + y
```

15:48

* Default Function Arguments

```javascript
function mul(x, y = 1) {
  return x * y
}
mul(2, 3) // 2 * 3 = 6
mul(2) // 2 * 1 = 2
```

19:47

* Named params

```javascript
function ({ array, element }) {
  return [element, ...array]
}
```

21:26

* Modules

```javascript
// @ a.js
export const param = 1
const defaultParam = 2
export default defaultParam

// @ b.js
import defaultParam, { param } from './a'

// rename import module
import newDefaultParam from './a' // rename default export directly
import { param as newParam} from './a' // use `as` for rename
```

35:35

* Classes

```javascript
class Polygon {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }

  get area() {
    return this.calcArea();
  }
  
  calcArea() {
    return this.height * this.width;
  }
}

class Square extends Polygon {
  ...
}
```

41:54

* Things we never use

```javascript
await const users = fetchUser().catch(e => ...)

for(let element of array) { ... }

const set1 = new Set([1, 2, 3, 4, 5]);
```

## Links
* [Jake’s Minesweeper](https://twitter.com/jaffathecake/status/1045055482933768194)
* [parcel](https://parceljs.org/)

## ××× SIIIIICK ××× PIIIICKS ×××

* Scott: [Trader Joe's Everything by the Bagel Sesame Seasoning Blend](https://www.amazon.com/Trader-Joes-Everything-Sesame-Seasoning/dp/B06W9N8X9H)
* Wes: [Trader Joe's Green Dragon Hot Sauce](https://www.amazon.com/Trader-Joes-Green-Dragon-Sauce/dp/B014E037TM)

## Shameless Plugs

* [Scott's Better Javascript Course](https://LevelUpTutorials.com/pro)
* [Wes' ES6 For Everyone](https://es6.io/)

## Tweet us your tasty treats!

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
