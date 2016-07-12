# React Reactive

[![Travis build status](https://img.shields.io/travis/andreypopp/react-reactive/master.svg)](https://travis-ci.org/andreypopp/react-reactive)
[![npm](https://img.shields.io/npm/v/react-reactive.svg)](https://www.npmjs.com/package/react-reactive)

React Reactive allows to define [React][] components which re-render when reactive
values (defined in terms of [derivable][]) used in `render()` change.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`reactive(Component)`](#reactivecomponent)
  - [`pure(Component)`](#purecomponent)
  - [`pure(Component).withEquality(eq)`](#purecomponentwithequalityeq)
- [Guides](#guides)
  - [Local component state](#local-component-state)
  - [Flux/Redux-like unidirectional data flow](#fluxredux-like-unidirectional-data-flow)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install from npm (`react` and `derivable` are peer dependencies and must be
installed for an application too):

```
% npm install react
% npm install derivable
% npm install react-reactive
```

## Usage

Define your application state in terms of [derivable][]:

```js
import {atom} from 'derivable'

let message = atom('Hello, World!')
```

Define a React component which accepts and uses in render a reactive value
`message`:

```js
import React from 'react'

let Hello = props =>
  <div>{props.message.get()}</div>
```

Now produce a new reactive component using higher-order `reactive` component

```js
import reactive from 'react-reactive'

let ReactiveHello = reactive(Hello)
```

Render `<ReactiveHello />` into DOM and pass it a reactive `message` value:

```js
import ReactDOM from 'react-dom'

ReactDOM.render(<ReactiveHello message={message} />, ...)
```

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

```js
import React from 'react'
import {reactive} from 'react-reactive'

let Reactive = reactive(props =>
  <div>{props.message.get()}</div>)

let ReactiveClassBased = reactive(class extends React.Component {

  render() {
    return <div>{this.props.message.get()}</div>
  }
})
```

### `pure(Component)`

Makes component reactive and defines `shouldComponentUpdate` which compares
`props` and `state` with respect to reactive values.

That allows to get rid of unnecessary re-renders.

```js
import React from 'react'
import {pure} from 'react-reactive'

let Reactive = pure(props =>
  <div>{props.message.get()}</div>)

let ReactiveClassBased = pure(class extends React.Component {

  render() {
    return <div>{this.props.message.get()}</div>
  }
})
```

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

## Guides

### Local component state

React has its own facilities for managing local component state. In my mind it
is much more convenient to have the same mechanism serve both local component
state and global app state management needs. That way composing code which uses
different state values and updates becomes much easier. Also refactorings which
change from where state is originated from are frictionless with this approach.

As any component produced with `reactive(Component)` reacts on changes to
reactive values dereferenced in its `render()` method we can take advantage of
this.

Just store some atom on a component instance and use it to render UI and update
its value when needed.

That's all it takes to introduce local component state:

```js
import {Component} from 'react'
import {atom} from 'derivable'
import {reactive} from 'react-reactive'

class Counter extends Component {

  counter = atom(1)

  onClick = () =>
    this.counter.swap(value => value + 1)

  render() {
    return (
      <div>
        <div>{this.counter.get()}</div>
        <button onClick={this.onClick}>Next</button>
      </div>
    )
  }
}

Counter = reactive(Counter)
```

### Flux/Redux-like unidirectional data flow

Flux (or more Redux) like architecture can be implemented easily with reactive
values.

You would need to create a Flux architecture blueprint as a function which
initialises an atom with some initial state and sets up action dispatching as a
reducer (a-la Redux):

```js
import {atom} from 'derivable'

function createApp(apply, initialState = {}) {
  let state = atom(initialState)
  return {
    state: state.derive(state => state),
    dispatch(action) {
      state.swap(state => apply(state, action))
    }
  }
}
```

Now we can use `createApp(...)` function to define an application in terms of
initial state and actions which transform application state:

```js
let todoApp = createApp(
  (state, action) => {
    if (action.type === 'create-todo') {
      return {
        ...state,
        todoList: state.todoList.concat({text: action.text})
      }
    }
    return state
  },
  {todoList: []}
)

function createTodo(text) {
  todoApp.dispatch({type: 'create-todo', text})
}
```

Now it is easy to render app state into UI and subscribe to state changes
through the `reactive(Component)` decorator:

```js
import React from 'react'
import {reactive} from 'react-reactive'

let App = reactive(() =>
  <ul>
    {todoApp.state.get().todoList.map(item => <li>{item.text}</li>)}
  </ul>
)
```

[React]: https://reactjs.org
[derivable]: https://github.com/ds300/derivablejs
[immutable]: https://github.com/facebook/immutable-js
