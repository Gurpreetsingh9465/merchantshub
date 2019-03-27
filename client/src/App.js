import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Oauth } from './components/Oauth';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Add } from './components/Add';

class App extends Component {
  render() {
    return (
        <div>
          <Switch>
            <Route exact path = '/' component = {Header} />
            <Route exact path = '/signup' component = {Oauth} />
            <Route exact path = '/login' component = {Login} />
            <Route exact path = '/dashboard' component = {Dashboard} />
            <Route exact path = '/addproduct' component = {Add} />
          </Switch>
        </div>
    );
  }
}

export default App;
