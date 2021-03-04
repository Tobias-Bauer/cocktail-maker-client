import React from 'react';
import Home from './components/Home'
import { Route, BrowserRouter as Router, Switch, Redirect } from 'react-router-dom';
import './App.css';

const domain = "http://cocktail-maker:10000";
const wsDomain = "ws:///cocktail-maker:10000/ws";
export default class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Router>
          <Switch>
            <Route path="/home" render={() => <Home wsDomain={wsDomain} domain={domain} />} />
            <Redirect path="*" to="/home" />
          </Switch>
        </Router>
      </div>
    );
  }
}
