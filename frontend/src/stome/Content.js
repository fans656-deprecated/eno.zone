import React from 'react'

import Items from './Items'
import ContentPanel from './ContentPanel'

export default class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      renaming: false,
    };
    window.on('keyup', this.onKeyUp);
  }

  render() {
    return (
      <div className="content"
        onClick={() => this.props.onClick(null)}
        onDragOver={ev => ev.preventDefault()}
        onDrop={this.onDrop}
      >
        <Items
          dirs={this.props.currentDir.dirs}
          files={this.props.currentDir.files}
          onClick={this.props.onClick}
          onMouseDown={(ev) => ev.preventDefault()}
          onStopRename={this.onStopRename}
          renaming={this.state.renaming}
        />
        <ContentPanel
          item={this.props.currentItem}
          currentDir={this.props.currentDir}
          deleteItem={this.deleteItem}
          onItemChange={this.props.onItemChange}
        />
      </div>
    );
  }

  onKeyUp = (ev) => {
    switch (ev.key) {
      case 'Delete':
        this.deleteItem(this.props.currentItem);
        break;
      case 'F2':
        this.renameItem(this.props.currentItem);
        break;
      default:
        break;
    }
  }

  deleteItem = async (item) => {
    if (!item) return;
    await item.delete();
    this.props.onItemDeleted(item);
    this.props.onItemChange();
  }

  renameItem = async (item) => {
    if (!item) return;
    this.setState({
      renaming: true,
    });
  }

  stopRename = () => {
    this.setState({
      renaming: false,
    });
  }

  onStopRename = () => {
    this.stopRename();
  }
}
