---
number: 358
title: React + TypeScript
date: 1622638800141
url: https://traffic.libsyn.com/syntax/Syntax358.mp3
---

In this episode of Syntax, Scott and Wes talk about using React with Typescript — how to set it up, components, state, props, passing data, custom hooks, and more!

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Linode - Sponsor
Whether you’re working on a personal project or managing enterprise infrastructure, you deserve simple, affordable, and accessible cloud computing solutions that allow you to take your project to the next level. Simplify your cloud infrastructure with Linode’s Linux virtual machines and develop, deploy, and scale your modern applications faster and easier. Get started on Linode today with a $100 in free credit for listeners of Syntax. You can find all the details at [linode.com/syntax](https://linode.com/syntax). Linode has 11 global data centers and provides 24/7/365 human support with no tiers or hand-offs regardless of your plan size. In addition to shared and dedicated compute instances, you can use your $100 in credit on S3-compatible object storage, Managed Kubernetes, and more. Visit [linode.com/syntax](https://linode.com/syntax) and click on the “Create Free Account” button to get started.

## Show Notes
04:55 - Components
* Strategies
* Example:
```html
type Props = {
   value: string;
}

const App = (props: Props) => <div />
```
* Return type? JSX.Element
* FC or FunctionComponent
* It's discouraged for this reason: `It means that all components accept children, even if they're not supposed to`
* It could be useful for a return type

12:13 - Props
* Default props:
```jsx
const defaultJoke: JokeProps = {
  joke: 'LOL JOE',
  id: 'YEAH',
  status: 200,
};

function JokeItem({ joke = defaultJoke }: JokeProps): JSX.Element {
  return (
    <li>
      {joke.joke} = {joke.id}
    </li>
  );
}
```
* Because props are always destructured, you often have to make a new type for your props. You can't just type each argument by itself.

18:38 - State
* Just like Generics, State can be inferred
* If your type is simple and you're using useState, it just works:
`const [user, setUser] = useState<User | null>(null);`

22:27 - useEffect
* Nothing special required
* Good use of void: If you want to use a Promise function but not worry about await or .then(), you can pop a void in front of it:
```jsx
useEffect(() => {
console.log('Mounted');
// getJoke().then(console.log).catch(console.error);
void getJoke();
}, [getJoke]);
```

26:09 - Refs
* Very similar to state however some interesting things with null:
`const ref1 = useRef<HTMLElement>(null!);`
* "Instantiating the ref with a current value of null but lying to TypeScript that it's not null."

29:33 - Custom Hooks
* This is a great use case for Tuples

31:00 - Context
* This is probably the most complex thing in this list
* First define the types
* Use generic to pass in types OR null
* This can also be non-null if you have default values in createContext:
`const AppCtx = React.createContext<AppContextInterface | null>(null);`

35:21 - Events
* The React events system is better than Vanilla JS
* Can handle them inline and have it inferred: `onClick={e ⇒ yeah(e.target)}`
```jsx
const onSetType = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setType(e.target.value)
```
* React has a bunch of events built in — many of them take a Generic argument so you can specify the type of element that triggered it. Handy for native API methods like play and pause.

39:27 - ForwardRef
* Again use of <> to pass in forwarded ref type as param 1, Props types as param 2:
```jsx
type Props = { children: React.ReactNode; type: "submit" | "button" };
export type Ref = HTMLButtonElement;
export const FancyButton = React.forwardRef<Ref, Props>((props, ref) => (
  <button ref={ref} className="MyClassName" type={props.type}>
    {props.children}
  </button>
));
```

41:30 - ESLint
* Typescript-react is good
* Extend your own
* Most JS rules apply to TS

46:20 - React as Global React 17

- Also add JSX: True to eslint globals for typing things like JSX.Element
- global.d.ts

```jsx
import * as react from "react"
import * as react_dom from "react-dom"

declare global {
    type React = typeof react
    type ReactDOM = typeof react_dom
}
```

48:08 - TSConfig
* `jsx: "react"`
* React emit .js files with JSX changed
* Preserve .jsx file output
* React-native → .js files with jsx not changed

53:05 - Frameworks?
* [Next.js](https://nextjs.org/) makes this a TREAT
* [Gatsby](https://www.gatsbyjs.com/) just use .tsx extensions
  * [https://www.gatsbyjs.com/plugins/gatsby-plugin-ts-config/](https://www.gatsbyjs.com/plugins/gatsby-plugin-ts-config/)

## Links
* [https://github.com/typescript-cheatsheets/react](https://github.com/typescript-cheatsheets/react)
* [Tanner Linsley](https://tannerlinsley.com/)
* [https://github.com/wesbos/eslint-config-wesbos](https://github.com/wesbos/eslint-config-wesbos)
* [Deno](https://deno.land/)
* [Architect](https://arc.codes/)
* [https://fav.farm/](https://fav.farm/)
* [Snowpack](https://www.snowpack.dev/)
* [Vite](https://vitejs.dev/)
* [Parcel 2](https://v2.parceljs.org/)
* [Foam](https://marketplace.visualstudio.com/items?itemName=foam.foam-vscode)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Obsidian](https://obsidian.md/)
* Wes: [Folding Allen Keys](https://amzn.to/3nHjqKu) 

## Shameless Plugs
* Scott:
  * 1: [Level Up Tutorials Pro Spring Sale](https://www.leveluptutorials.com/pro) - 50% off annual subscriptions!
  * 2: [SvelteKit Course](https://www.leveluptutorials.com/pro)
* Wes: [Beginner Javascript Course](https://beginnerjavascript.com/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets