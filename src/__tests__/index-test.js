/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {atom} from 'derivable';
import * as Immutable from 'immutable';

import {shallowEqual, reactive, pure} from '../index';

function markup(element) {
  return element.innerHTML.replace(/ data\-reactroot="[^"]*"/g, '');
}

describe('react-derivable', function() {
  describe('shallowEqual', function() {
    it('compares two object for eq', function() {
      expect(shallowEqual({}, {})).toBe(true);
      expect(shallowEqual({a: 1}, {a: 1})).toBe(true);
      expect(shallowEqual({a: 1}, {})).toBe(false);
      expect(shallowEqual({a: 1}, {a: 2})).toBe(false);
      expect(shallowEqual({a: {}}, {a: {}})).toBe(false);
      expect(shallowEqual(1, 2)).toBe(false);
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(undefined, undefined)).toBe(true);
      expect(shallowEqual('', '')).toBe(true);
      expect(shallowEqual(true, true)).toBe(true);
      expect(shallowEqual(false, false)).toBe(true);
    });

    it('compares reactive values', function() {
      let a1 = atom(1);
      let a2 = atom(1);
      let onDerivableReplace = jest.fn();
      expect(shallowEqual({a: a1}, {a: a2}, undefined, onDerivableReplace)).toBe(true);
      expect(onDerivableReplace.mock.calls.length).toBe(1);
      expect(onDerivableReplace.mock.calls[0]).toEqual([a1, a2]);
      a2.set(2);
      expect(shallowEqual({a: a1}, {a: a2}), undefined, onDerivableReplace).toBe(false);
      expect(onDerivableReplace.mock.calls.length).toBe(1);
    });

    it('compares reactive values w/ diff eq', function() {
      let almostEq = (a, b) => Math.abs(a - b) < 5;
      let a1 = atom(1).withEquality(almostEq);
      let a2 = atom(1);
      let onDerivableReplace = jest.fn();
      expect(shallowEqual({a: a1}, {a: a2}, undefined, onDerivableReplace)).toBe(false);
      expect(onDerivableReplace.mock.calls.length).toBe(0);
    });

    it('compares reactive values w/ custom eq', function() {
      let almostEq = (a, b) => Math.abs(a - b) < 5;
      let a1 = atom(1).withEquality(almostEq);
      let a2 = atom(1).withEquality(almostEq);
      let onDerivableReplace = jest.fn();
      expect(shallowEqual({a: a1}, {a: a2}, undefined, onDerivableReplace)).toBe(true);
      expect(onDerivableReplace.mock.calls.length).toBe(1);
      expect(onDerivableReplace.mock.calls[0]).toEqual([a1, a2]);
      a2.set(2);
      expect(shallowEqual({a: a1}, {a: a2}, undefined, onDerivableReplace)).toBe(true);
      expect(onDerivableReplace.mock.calls.length).toBe(2);
      expect(onDerivableReplace.mock.calls[1]).toEqual([a1, a2]);
      a2.set(20);
      expect(shallowEqual({a: a1}, {a: a2}, undefined, onDerivableReplace)).toBe(false);
      expect(onDerivableReplace.mock.calls.length).toBe(2);
    });
  });

  describe('decorators', function() {
    let renderCount;
    let root;

    class ClassBased extends React.Component {
      render() {
        let {title, message, x} = this.props;
        renderCount += 1;
        return (
          <div title={title} x={x && x.get()}>
            {message.get()}
          </div>
        );
      }
    }

    function Functional({title, message, x}) {
      renderCount += 1;
      return (
        <div title={title} x={x && x.get()}>
          {message.get()}
        </div>
      );
    }

    beforeEach(function() {
      renderCount = 0;
      root = document.createElement('div');
    });

    afterEach(function() {
      ReactDOM.unmountComponentAtNode(root);
    });

    describe('common cases for reactive(Component) and pure(Component)', function() {
      [
        reactive(ClassBased),
        reactive(Functional),
        pure(ClassBased),
        pure(Functional),
      ].forEach(function(Component) {
        describe(Component.displayName || Component.name, function() {
          it('renders', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');
          });

          it('reacts', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            message.set('Andrey');

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">Andrey</div>');
          });

          it('ignore re-render if reactive value does not change', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            message.set('World');

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');
          });

          it('re-renders on reactive prop change', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            let nextMessage = atom('NextWorld');
            ReactDOM.render(<Component message={nextMessage} title="ok" />, root);

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">NextWorld</div>');
          });

          it('re-renders on regular prop change', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            ReactDOM.render(<Component message={message} title="ok!!!" />, root);

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok!!!">World</div>');
          });

          it('ignores inactive value changes', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            let nextMessage = atom('NextWorld');
            ReactDOM.render(<Component message={nextMessage} title="ok" />, root);

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">NextWorld</div>');

            message.set('Nope');

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">NextWorld</div>');
          });

          it('batches updates (via react and via derivable)', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            ReactDOM.unstable_batchedUpdates(() => {
              ReactDOM.render(<Component message={message} title="ok!!!" />, root);
              message.set('!!!');
            });

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok!!!">!!!</div>');
          });

          it('batches updates (both via derivable)', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            ReactDOM.unstable_batchedUpdates(() => {
              message.set('oops');
              message.set('!!!');
            });

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">!!!</div>');
          });

          it('batches updates (both via derivable, different)', function() {
            let message = atom('World');
            let x = atom('x');
            ReactDOM.render(<Component message={message} title="ok" x={x} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok" x="x">World</div>');

            ReactDOM.unstable_batchedUpdates(() => {
              x.set('oops');
              message.set('!!!');
            });

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok" x="oops">!!!</div>');
          });

          it('does not update if values does not change', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');

            message.set('World');

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');
          });

          it('does not update after unmount', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');

            ReactDOM.unmountComponentAtNode(root);
            message.set('!!!');

            expect(renderCount).toBe(1);
          });
        });
      });
    });

    describe('reactive(Component)', function() {
      makeComponentDecoratorTestSuite(reactive);

      [reactive(ClassBased), reactive(Functional)].forEach(function(Component) {
        describe(Component.displayName || Component.name, function() {
          it('re-renders on reactive prop change (same value)', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            let nextMessage = atom('World');
            ReactDOM.render(<Component message={nextMessage} title="ok" />, root);

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">World</div>');
          });

          it('re-renders on regular prop change (same prop value)', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">World</div>');
          });
        });
      });
    });

    describe('pure(Component)', function() {
      makeComponentDecoratorTestSuite(pure);

      [pure(ClassBased), pure(Functional)].forEach(function(Component) {
        describe(Component.displayName || Component.name, function() {
          it('ignores reactive prop change (same value)', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            let nextMessage = atom('World');
            ReactDOM.render(<Component message={nextMessage} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');
          });

          it('ignores reactive prop change (same value) but re-subscribes', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            let nextMessage = atom('World');
            ReactDOM.render(<Component message={nextMessage} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            message.set('x');
            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            nextMessage.set('y');
            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div title="ok">y</div>');

            nextMessage.set('z');
            expect(renderCount).toBe(3);
            expect(markup(root)).toBe('<div title="ok">z</div>');
          });

          it('ignores regular prop change (same prop value)', function() {
            let message = atom('World');
            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            ReactDOM.render(<Component message={message} title="ok" />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');
          });
        });
      });
    });

    describe('pure(Component) w/ custom equality', function() {
      makeComponentDecoratorTestSuite(Component =>
        pure(Component).withEquality(Immutable.is),
      );

      class ClassBased extends React.Component {
        render() {
          let {title, message, x} = this.props;
          renderCount += 1;
          return (
            <div title={title ? title.get('a') : undefined} x={x && x.get()}>
              {message.get().get('a')}
            </div>
          );
        }
      }

      function Functional({title, message, x}) {
        renderCount += 1;
        return (
          <div title={title ? title.get('a') : undefined} x={x && x.get()}>
            {message.get().get('a')}
          </div>
        );
      }

      [
        pure(ClassBased).withEquality(Immutable.is),
        pure(Functional).withEquality(Immutable.is),
      ].forEach(function(Component) {
        describe(Component.displayName || Component.name, function() {
          it('ignores reactive prop change (same value)', function() {
            let message = atom(Immutable.Map().set('a', 'World'));
            ReactDOM.render(<Component message={message} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');

            let nextMessage = atom(Immutable.Map().set('a', 'World'));
            ReactDOM.render(<Component message={nextMessage} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');
          });

          it('ignores reactive prop change (same value) but re-subscribes', function() {
            let message = atom(Immutable.Map().set('a', 'World'));
            ReactDOM.render(<Component message={message} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');

            let nextMessage = atom(Immutable.Map().set('a', 'World'));
            ReactDOM.render(<Component message={nextMessage} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');

            message.update(m => m.set('a', 'x'));
            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div>World</div>');

            nextMessage.update(m => m.set('a', 'y'));
            expect(renderCount).toBe(2);
            expect(markup(root)).toBe('<div>y</div>');

            nextMessage.update(m => m.set('a', 'z'));
            expect(renderCount).toBe(3);
            expect(markup(root)).toBe('<div>z</div>');
          });

          it('ignores regular prop change (same prop value)', function() {
            let message = atom(Immutable.Map().set('a', 'World'));
            let title = Immutable.Map().set('a', 'ok');
            ReactDOM.render(<Component message={message} title={title} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');

            let nextTitle = Immutable.Map().set('a', 'ok');
            ReactDOM.render(<Component message={message} title={nextTitle} />, root);

            expect(renderCount).toBe(1);
            expect(markup(root)).toBe('<div title="ok">World</div>');
          });
        });
      });
    });
  });
});

function makeComponentDecoratorTestSuite(decorate) {
  it('preserves displayName for class based components', function() {
    class X extends React.Component {
      render() {
        return null;
      }
    }
    expect(decorate(X).displayName).toBe('X');
  });

  it('preserves displayName for class based components with custom displayName', function() {
    class X extends React.Component {
      static displayName = 'Y';
      render() {
        return null;
      }
    }
    expect(decorate(X).displayName).toBe('Y');
  });

  it('preserves displayName for functional components', function() {
    function X() {
      return null;
    }
    expect(decorate(X).displayName).toBe('X');
  });

  it('preserves displayName for functional components with custom displayName', function() {
    function X() {
      return null;
    }
    X.displayName = 'Y';
    expect(decorate(X).displayName).toBe('Y');
  });

  it('preserves propTypes for class components', function() {
    class X extends React.Component {
      static propTypes = {x: PropTypes.string};
      render() {
        return null;
      }
    }
    expect(decorate(X).propTypes.x).toBe(PropTypes.string);
  });

  it('preserves propTypes for functional components', function() {
    function X() {
      return null;
    }
    X.propTypes = {x: PropTypes.string};
    expect(decorate(X).propTypes.x).toBe(PropTypes.string);
  });

  it('preserves contextTypes for class components', function() {
    class X extends React.Component {
      static contextTypes = {x: PropTypes.string};
      render() {
        return null;
      }
    }
    expect(decorate(X).contextTypes.x).toBe(PropTypes.string);
  });

  it('preserves contextTypes for functional components', function() {
    function X() {
      return null;
    }
    X.contextTypes = {x: PropTypes.string};
    expect(decorate(X).contextTypes.x).toBe(PropTypes.string);
  });

  it('preserves defaultProps for class components', function() {
    class X extends React.Component {
      static defaultProps = {x: 42};
      render() {
        return null;
      }
    }
    expect(decorate(X).defaultProps.x).toBe(42);
  });

  it('preserves defaultProps for functional components', function() {
    function X() {
      return null;
    }
    X.defaultProps = {x: 42};
    expect(decorate(X).defaultProps.x).toBe(42);
  });
}
