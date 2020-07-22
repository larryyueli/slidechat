import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import AppBar from './Appbar.js';
import Main from './Main.js';
import Landing from './Landing';
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
				<Route path={`${baseURL}/:slideId`} component={Main} />
				<Route path={`${baseURL}/`} component={Landing} />
			</Switch>
		</Router>
	);
}

export default App;
