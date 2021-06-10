import React from "react";
import logo from './logo.svg';
import './App.css';
import AuthPage from "./LoginPage";
import Table from "./UserTable"
import AdminTable from "./AdminTable"

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";
import { Tab } from '@material-ui/core';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // componentDidCatch(error, info) {
  //   // Display fallback UI
  //   this.setState({ hasError: true });
  // }

  render() {
    // if (this.state.hasError) {
    //   // You can render any custom fallback UI
    //   return <h1>Something went wrong.</h1>;
    // }
    return this.props.children;
  }
}

function AuthChecker({page})
{
  try {
    debugger
    let token = JSON.parse(localStorage.token)
    console.log(token)
    if (!token || !token.jwt)
      return <Redirect to="/login" />
    if (token.user.isModerator)
      return <Redirect to="/admin" />
    return page;
  } catch (err) {
    console.log(err);
    return <Redirect to="/login" />
  }
}


function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Switch>
            <Route path="/login">
              <AuthPage />
            </Route>
            <Route path="/admin">
              <AdminTable />
            </Route>
            <Route path="/">
              <AuthChecker page={<Table/>} />
            </Route>
          </Switch>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
