/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component, PropTypes } from 'react';
import emptyFunction from 'fbjs/lib/emptyFunction';
import s from './App.css';
import Header from '../Header';
import io from 'socket.io-client';

class App extends Component {

  constructor(props){
    super(props);

    this.state = {
      files: [],
      fileProperties: [],
      activeFile: [],
      filedsTypes: []
    }
  }

  static propTypes = {
    context: PropTypes.shape({
      insertCss: PropTypes.func,
      setTitle: PropTypes.func,
      setMeta: PropTypes.func,
    }),
    children: PropTypes.element.isRequired,
    error: PropTypes.object,
  };

  static childContextTypes = {
    insertCss: PropTypes.func.isRequired,
    setTitle: PropTypes.func.isRequired,
    setMeta: PropTypes.func.isRequired,
  };

  getChildContext() {
    const context = this.props.context;
    return {
      insertCss: context.insertCss || emptyFunction,
      setTitle: context.setTitle || emptyFunction,
      setMeta: context.setMeta || emptyFunction,
    };
  }

  componentDidMount() {
    const { insertCss } = this.props.context;
    this.removeCss = insertCss(s);
    var socket = io('http://localhost:4000');
    var t = this;
    socket.on('getFiles', function(data){
      t._setFiles(t, data);
    });

    // Add a connect listener
    socket.on('parsed', (data) => {
      var fields = Object.getOwnPropertyNames(data[0]);
      this.setState({fileProperties: fields});

      var types = new Map();

      var values = data[1];
      for (var key in values) {
        if (values.hasOwnProperty(key)) {
          var d = new Date(values[key]);
          console.log(!isNaN(parseFloat((values[key]))));
          if(d.getYear() && d.getMonth() && d.getDay()){
            types.set(key, "data");
          } else if(isNaN(parseFloat(values[key]))){
            types.set(key, "number");
          } else
          types.set(key, "string");
        }
      }
console.log(types);
      this.setState({fieldsTypes: types});
    });
  }

  _setFiles = (t, data) =>{
    this.setState({files: data});
    this.availableFiles();
  }

  componentWillUnmount() {
    this.removeCss();
  }

  availableFiles = () => {
    var t = this.state.files.map(el => <button onClick={this.getParsed.bind({el})}>{el}</button>);
    return t;
  }

  getFileProperties = () => {
    return this.state.fileProperties.map(el => <tr>
      <th>
      {el}
      </th>
      <th>
      {this.state.fieldsTypes.get(el)};
      </th>
      <th>
      dzialanie
      </th>
      </tr>);
  }

  getParsed = (file) => {
    this.setState({activeFile: file.target.innerHTML});
    var socket = io('http://localhost:4000');
    socket.emit('parse', file.target.innerHTML);
  }


  render() {
    var t = this.availableFiles();
    var fileProp = this.getFileProperties();
    return !this.props.error ? (
      <div>
        <Header />
        <p>Available files: {t}</p>
        <p>Available fields in {this.state.activeFile} </p>
        <table>
        {fileProp}
        </table>
      </div>
    ) : this.props.children;
  }
}

export default App;
