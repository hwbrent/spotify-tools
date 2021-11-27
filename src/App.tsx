import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import {
  HomePage,
  Callback,
  TokenAcquired,
} from "./components/page-components";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" exact={true} component={HomePage} />
        <Route path="/callback" exact={true} component={Callback} />
        <Route path="/tokenacquired" exact={true} component={TokenAcquired} />
      </Switch>
    </Router>
  );
}

export default App;
