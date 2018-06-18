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
import Explorer from './stome/Explorer';
import './css/style.css'
import './stome/css/style.css'

const RES_PREFIX = '/res';
const RES_PREFIX_SLASH = '/res/';
const RES_PREFIX_LEN = RES_PREFIX.length;

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
    const pathname = window.location.pathname;
    if (pathname.startsWith(RES_PREFIX_SLASH) || pathname === RES_PREFIX) {
      return <Explorer
        rootPath={'/'}
        currentPath={pathname.substring(RES_PREFIX_LEN)}
      />;
    }
    return (
      <div id="root-page" className="ez">
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
