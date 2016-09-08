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
import io from 'socket.io-client';
import Select from 'react-select';

class App extends Component {

  constructor(props){
    super(props);

    this.state = {
      files: [],
      fileProperties: [],
      activeFile: [],
      filedsTypes: [],
      values: [],
      inputShow: false,
      queryTypes: [{value: "equal", label: "equal"}, {value: "greater", label: "greater"}, {value: "smaller", label: "smaller"}, {value: "invariance", label: "invariance"}],
      queryValues: [],
      queries: []
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

      var types = new Array();

      var values = data[1];
      for (var key in values) {
        if (values.hasOwnProperty(key)) {
          var d = new Date(values[key]);
          if(d.getYear() && d.getMonth() && d.getDay()){
            types.push({value: key, label: key});
          } else if(isNaN(parseFloat(values[key]))){
            types.push({value: key, label: key});
          } else
          types.push({value: key, label: key});
        }
      }
      this.setState({fieldsTypes: types});
    });


    socket.on('parsedXML', (data) => {
      var fields = Object.getOwnPropertyNames(data.response.row[0].row[0]);

      this.setState({fileProperties: fields});
      var types = new Array();

      for (var key of fields)
          types.push({value: key, label: key});

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
    return this.state.files.map(el => <button onClick={this.getParsed.bind({el})}>{el}</button>);
  }


  logChange = (val) => {
      this.setState({values: val});
  }

  logChangeQuery = (val) => {
    this.setState({queryValues: val});
  }

  getParsed = (file) => {
    this.setState({fieldsTypes: []});
    this.setState({values: []});
    this.setState({activeFile: file.target.innerHTML});
    var socket = io('http://localhost:4000');
    var splitted = file.target.innerHTML.split(".");
    if(splitted[1] == "xml"){
      socket.emit('parseXML', file.target.innerHTML);
    }else{
      socket.emit('parse', file.target.innerHTML);
    }
  }

formSubmitted = (e) =>
{
  e.preventDefault();
  var temp = new Array();
  var tempObject = {
    file: this.state.activeFile,
    field: this.state.values.value,
    value: this.refs.queryValue.value,
    type: this.state.queryValues.value,
  };
  temp.push(tempObject);
  for(var i of this.state.queries)
    temp.push(i);
  this.setState({queries: temp});
}

returnSavedExp = ()  => {
  return this.state.queries.map(el => (<span>
    <p>Plik {el.file}</p>
    <p>field {el.field}</p>
    <p>value: {el.value}</p>
    <p>type: {el.type}</p>
    </span>));
}

build = () => {
  var socket = io('http://localhost:4000');
  var splitted = this.state.activeFile.split(".");
  if(splitted[1] == "xml"){
  socket.emit('buildXML', this.state.queries);
  } else{
    socket.emit('build', this.state.queries);
  }
}

  render() {
    var wyrazenia = this.returnSavedExp();
    var t = this.availableFiles();
    return !this.props.error ? (
      <div>
        <p>Available files: {t}</p>
        <p>Available fields in {this.state.activeFile} </p>
        <form className="form-control" onSubmit={this.formSubmitted}>
          <Select
              name="form-field-name"
              options={this.state.fieldsTypes}
              onChange={this.logChange}
              value={this.state.values}
          />
          <Select
              name="form-field-query"
              options={this.state.queryTypes}
              onChange={this.logChangeQuery}
              value={this.state.queryValues}
          />
          <input type="text" placeholder="wartosc" name="valueOfQuery" ref="queryValue"/>
          <input type="submit" name="dodajWyrazenie" value="Dodaj ograniczenie" className="btn btn-primary"/>
        </form>
        {wyrazenia}
        <button onClick={this.build} type="button" className="btn btn-primary">Buduj raport</button>
      </div>

    ) : this.props.children;
  }
}

export default App;
