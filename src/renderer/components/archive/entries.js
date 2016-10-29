import React, { Component, PropTypes } from 'react';
import { style } from 'glamor';
import Column from '../column';
import Button from '../button';
import List from './entries-list';
import SearchField from './search-field';

class Entries extends Component {
  handleChange(value) {
    this.props.onFilterChange(value);
  }

  render() {
    const { currentGroup, handleAddEntry } = this.props;
    const addButton = (
      <Button
        onClick={handleAddEntry}
        disabled={Boolean(currentGroup) !== true}
        full
        className={style({
          backgroundColor: 'rgba(0,0,0,.25)'
        })}
        >Add Entry</Button>
    );
    const filterNode = <SearchField onChange={e => this.handleChange(e)}/>;

    return (
      <Column
        className={style({
          backgroundColor: '#31353D',
          color: '#fff'
        })}
        header={filterNode}
        footer={addButton}
        >
        <List {...this.props}/>
      </Column>
    );
  }
}

Entries.propTypes = {
  filter: PropTypes.string,
  entries: PropTypes.array,
  currentEntry: PropTypes.object,
  currentGroup: PropTypes.string,
  onSelectEntry: PropTypes.func,
  onFilterChange: PropTypes.func,
  handleAddEntry: PropTypes.func
};

export default Entries;