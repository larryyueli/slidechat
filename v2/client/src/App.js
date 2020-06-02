import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import AppBar from './Appbar.js'
import Main from './Main.js';
import Profile from './Profile.js';
import { baseURL } from './config';


/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
function App() {
    return (
        <Router>
            <AppBar />
            <Switch>
                <Route path={`${baseURL}/profile`} exact component={Profile} />
                <Route path={`${baseURL}/:slideId`} component={Main} />
            </Switch>
        </Router>
    );
}


export default App;
