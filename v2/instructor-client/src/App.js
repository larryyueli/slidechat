import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import MyCourses from './MyCourses';
import ReorderQuestions from './ReorderQuestions';
import Logout from './Logout';
import { baseURL, instructorURL } from './config';

/**
 * The main entrance of the application
 * Switch to Logout, reorder, courses page based on URL
 */
function App() {
	let date = new Date();
	date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
	document.cookie = 'isI=yes; expires=' + date.toUTCString() + '; path=/;';
	return (
		<Router>
			<Switch>
				<Route path={`${baseURL}/logout`} exact component={Logout} />
				<Route path={`${baseURL}${instructorURL}/reorderQuestions/:slideId`} component={ReorderQuestions} />
				<Route path={`${baseURL}${instructorURL}`} component={MyCourses} />
			</Switch>
		</Router>
	);
}

export default App;
