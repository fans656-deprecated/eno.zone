import React from 'react'
import { withRouter } from 'react-router-dom'
import qs from 'qs'

import Explorer from './Explorer'

class App extends React.Component {
  render() {
    const params = qs.parse(this.props.location.search.substring(1));
    return (
      <div className="stome">
        <Explorer rootPath={'/'} currentPath={this.props.location.pathname}/>
      </div>
    );
  }
}

App = withRouter(App);  // in order to have App.props.history

export default App;
