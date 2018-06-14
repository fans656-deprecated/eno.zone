import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import $ from 'jquery';

import Todo from './todo';
import Header from './Header';
import Footer from './Footer';
import Login from './Login';
import Signup from './Signup';
import Profile from './Profile';
import NoteList from './NoteList';
import EditNote from './EditNote';
import Note from './Note';

//import { getNote } from './util';

import './css/style.css'

//const style = document.body.style;

import './test.css'
class App2 extends React.Component {
  state = {
    focused: false,

    selectionAnchorRange: null,
  }

  render() {
    return (
      <div
        onFocus={this.onFocus}
        onBlur={this.onBlur}
      >
        <div
          style={{
            fontSize: '3em',
            margin: '1em',
            border: '1px solid black',
            minHeight: '10em',
            fontFamily: 'Consolas',
          }}
          className={`test ${this.state.focused ? 'focused' : ''}`}
          tabIndex="0"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onMouseMove={this.onMouseMove}
        >
          <span>hello world</span>
          <br/>
          <span
            style={{}}
          ></span>
          <br/>
          <span>foo bar baz</span>
        </div>
        <input
          ref={ref => this.input = ref}
        />
      </div>
    );
  }

  onFocus = () => {
    this.input.focus();
    this.setState({focused: true});
  }

  onBlur = () => {
    this.setState({focused: false});
  }

  onMouseDown = (ev) => {
    const range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    this.setState({selectionAnchorRange: range});
  }

  onMouseUp = (ev) => {
    this.setState({selectionAnchorRange: null});
  }

  onMouseMove = (ev) => {
    const anchorRange = this.state.selectionAnchorRange;
    if (!anchorRange) return;

    const anchorNode = anchorRange.startContainer;
    const anchorOffset = anchorRange.startOffset;

    const pointRange = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    const pointNode = pointRange.startContainer;
    const pointOffset = pointRange.startOffset;

    if (pointNode.nodeType === Node.TEXT_NODE) {
      const selRange = new Range();
      if (pointRange.comparePoint(anchorNode, anchorOffset) > 0) {
        selRange.setStart(pointNode, pointOffset);
        selRange.setEnd(anchorNode, anchorOffset);
      } else {
        selRange.setStart(anchorNode, anchorOffset);
        selRange.setEnd(pointNode, pointOffset);
      }

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selRange);
    }
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      consoleHandlers: [],
    }
  }

  render() {
    const visitor = this.props.visitor;
    const owner = this.props.owner;
    return (
      <div id="root-page">
        <Header user={visitor}
          consoleHandlers={this.state.consoleHandlers}
        />
        <main id="main">
          <Switch>
            <Route exact path='/todo'
              render={() => <Todo/>}
            />
            
            <Route exact path='/'
              render={() => <NoteList owner={owner} visitor={visitor}/>}
            />

            <Route exact path='/login'
              render={() => <Login/>}
            />

            <Route exact path='/signup'
              render={() => <Signup/>}
            />

            <Route exact path='/profile/:username'
              render={({match}) => (
                <Profile visitor={visitor} username={match.params.username}/>
              )}
            />

            <Route exact path='/new-note'
              render={() => <EditNote owner={owner} visitor={visitor}/>}
            />

            <Route exact path='/note/:id/edit'
              render={({match}) => (
                <EditNote
                  owner={owner}
                  visitor={visitor}
                  id={match.params.id}
                />
              )}
            />

            <Route exact path='/note/:id'
              render={({match}) => (
                <Note
                  owner={owner}
                  visitor={visitor}
                  id={match.params.id}
                  isSingleView={true}
                />
              )}
            />
        </Switch>
      </main>
      <Footer owner={owner}/>
    </div>
    );
  }

  registerConsoleHandler = (handler) => {
    this.setState(prevState => {
      const handlers = prevState.consoleHandlers;
      handlers.push(handler);
      return {
        consoleHandlers: handlers,
      }
    });
  }

  unregisterConsoleHandler = (target_handler) => {
    this.setState(prevState => {
      const handlers = prevState.consoleHandlers;
      for (let i = 0; i < handlers.length; ++i) {
        const handler = handlers[i];
        if (handler === target_handler) {
          handlers.splice(i, 1);
          break;
        }
      }
      return {
        consoleHandlers: handlers,
      }
    });
  }

  async componentDidMount() {
    $('body').keypress(this.onKeyPress);
    //const theme = await getNote({owner: this.props.owner, id: '_theme'});
  }

  onKeyPress = (ev) => {
    const body = $('body');
    if (ev.key === 's' && ev.target === body[0]) {
      $('#console input').focus();
      ev.preventDefault();
      ev.stopPropagation();
    }
  }
}

App = withRouter(App);  // in order for App.props.history when App.onLogout

export default App;
