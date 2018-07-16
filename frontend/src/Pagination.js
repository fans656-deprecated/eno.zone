import React from 'react';
import { withRouter } from 'react-router-dom'
import IconCaretLeft from 'react-icons/lib/fa/caret-left'
import IconCaretRight from 'react-icons/lib/fa/caret-right'
//import IconPlus from 'react-icons/lib/md/add'
import qs from 'qs'
//import $ from 'jquery'

import { Icon } from './common'
//import { fetchData } from './utils'

class Pagination extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: null,
    };
  }

  componentWillReceiveProps(props) {
    this.setState({page: props.page});
  }

  onCurrentPageInputChange = ({target}) => {
    let page = target.value;
    if (page) {
      this.setState({page: page});
    }
  }

  navigateToNthPage = (page) => {
    window.location.href = this.getNavigationURL(page);
  }

  getNavigationURL = (page) => {
    page = parseInt(page, 10);

    const query = qs.parse(window.location.search.slice(1));

    page = Math.min(page, this.props.nPages);
    page = Math.max(page, 1);

    query.page = page;
    query.tags = [...new Set(
      (this.props.tags || []).concat(query.tags || [])
    )];
    if (!query.tags) {
      delete query.tags;
    }
    if (query.page === 1) {
      delete query.page;
    }

    const queryString = qs.stringify(query)
    const url = '/' + (queryString ? '?' + queryString : '');
    return url;
  }

  onKeyUp = (ev) => {
    if (ev.key === 'Enter') {
      this.navigateToNthPage(this.state.page);
    }
  }
  
  render() {
    if (this.props.nPages <= 1) {
      return null;
    }
    return <div id="pagination">
      <a href={this.getNavigationURL(this.state.page - 1)}>
        <Icon type={IconCaretLeft} size="large"/>
      </a>
      <input
        id="current-page"
        type="text"
        value={this.state.page == null ? 1 : this.state.page}
        onChange={this.onCurrentPageInputChange}
        onKeyUp={this.onKeyUp}
      />
      <span>&nbsp;/&nbsp;</span>
      <span className="n-pages">{this.props.nPages}</span>
      <a href={this.getNavigationURL(this.state.page + 1)}>
        <Icon type={IconCaretRight} size="large"/>
      </a>
    </div>
  }
}
Pagination = withRouter(Pagination);
export default Pagination;
