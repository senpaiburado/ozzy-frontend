import logo from './logo.svg';
import './App.css';
import AuthPage from "./LoginPage";
import Table from "./UserTable"

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";
import { Tab } from '@material-ui/core';

function AuthChecker({page})
{
  try {
    let token = JSON.parse(localStorage.token)
    console.log(token)
    if (!token || !token.jwt)
      return <Redirect to="/login" />
    return page;
  } catch (err) {
    console.log(err);
    return <Redirect to="/login" />
  }
}


function App() {
  return (
    <Router>
      <Switch>
          <Route path="/login">
            <AuthPage />
          </Route>
          <Route path="/">
            <AuthChecker page={<Table/>} />
          </Route>
        </Switch>
    </Router>
  );
}

export default App;
