import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import AppBar from './Appbar.js';
import MyCourses from './MyCourses';
import ReorderQuestions from './ReorderQuestions';
import Logout from './Logout';
import { baseURL, instructorURL } from './config';

/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
function App() {
	let date = new Date();
	date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
	document.cookie = 'isI=yes; expires=' + date.toUTCString() + '; path=/;';
	return (
		<Router>
			<AppBar />
			<Switch>
				<Route path={`${baseURL}/logout`} exact component={Logout} />
				<Route path={`${baseURL}${instructorURL}/reorderQuestions/:slideId`} component={ReorderQuestions} />
				<Route path={`${baseURL}${instructorURL}`} component={MyCourses} />
			</Switch>
		</Router>
	);
}

export default App;
