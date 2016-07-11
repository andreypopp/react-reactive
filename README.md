# React Reactive

[![Travis build status](https://img.shields.io/travis/andreypopp/react-reactive/master.svg)](https://travis-ci.org/andreypopp/react-reactive)
[![npm](https://img.shields.io/npm/v/react-reactive.svg)](https://www.npmjs.com/package/react-reactive)

React Reactive allows to define [React][] components which re-render when reactive
values (defined in terms of [derivable][]) used in `render()` change.

## Installation

Install from npm (`react` and `derivable` are peer dependencies and must be
installed for an application too):

```
% npm install react
% npm install derivable
% npm install react-reactive
```

## Usage

##### Model application state

Define your application state in terms of [derivable][]:

```js
import {atom} from 'derivable'

let message = atom('Hello, World!')
```

##### Define UI

Define a React component which accepts and uses in render a reactive value
`message`:

```js
import React from 'react'

let Hello = props =>
  <div>{props.message.get()}</div>
```

##### Make UI reactive

Now produce a new reactive component using higher-order `reactive` component

```js
import reactive from 'react-reactive'

let ReactiveHello = reactive(Hello)
```

Or you can define reactive components right away:

```js
let ReactiveHello = reactive(props =>
  <div>{props.message.get()}</div>)
```

Or using ES2015 class syntax:

```js
let ReactiveHello = reactive(
  class extends React.Component {

    render() {
      return <div>{this.props.message.get()}</div>
    }
  }
)
```

##### Render into DOM

Render `<ReactiveHello />` into DOM and pass it a reactive `message` value:

```js
import ReactDOM from 'react-dom'

ReactDOM.render(<Hello message={message} />, ...)
```

##### Update model

Each time reactive value updates - component gets rerendered:

```js
message.set('Works!')
```

## API

### `reactive(Component)`

As shown in the usage section above `reactive(Component)` decorator produces a
reactive component out of original one.

Reactive components re-render when one of the reactive values references from
within `render()` change.

### `pure(Component)`

Also makes component reactive but also define `shouldComponentUpdate` which
compares `props` and `state` with respect to reactive values.

That allows to get rid of unnecessary re-renders.

### `pure(Component).withEquality(eq)`

Same as using `pure(Component)` but with a custom equality function which is
used to compare props/state and reactive values.

Useful when using with libraries like [Immutable.js][immutable] which provide
its equality definition:

```js
import * as Immutable from 'immutable'
import {pure} from 'react-reactive'

let Reactive = pure(Component).withEquality(Immutable.is)
```

[React]: https://reactjs.org
[derivable]: https://github.com/ds300/derivablejs
[immutable]: https://github.com/facebook/immutable-js
