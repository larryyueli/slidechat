import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Main from './Main.js';
import Landing from './Landing';
import Logout from './Logout';
import { baseURL } from './config';

/**
 * The main entrance of the application
 * Switch to Logout, Main, Landing page based on URL
 */
function App() {
	return (
		<Router>
			<Switch>
				<Route path={`${baseURL}/logout`} component={Logout} />
				<Route path={`${baseURL}/:slideId/:pageNum/:qid`} component={Main} />
				<Route path={`${baseURL}/:slideId/:pageNum`} component={Main} />
				<Route path={`${baseURL}/:slideId`} component={Main} />
				<Route path={`${baseURL}/`} component={Landing} />
			</Switch>
		</Router>
	);
}

export default App;
