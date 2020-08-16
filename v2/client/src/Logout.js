import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from './config';

/**
 * Log out page of the app. If logout is successful, the user successfully logs out from
 * our server. Yet, if their UTORID login session is not expired yet, when they click on 
 * the login button, they gets logged in immediately. The UTORID login uses a session cookie,
 * exiting the browser clears the cookie and ends the session.
 * Note if the user uses chrome setting "on start up: continue where you left off", session
 * cookies will not be cleared!
 */
export default function Logout(props) {
	let [success, setSuccess] = useState('unknown');
	useEffect(() => {
		axios
			.get(`${serverURL}/api/logout`)
			.then((_) => setSuccess('success'))
			.catch((err) => {
				console.error(err);
				setSuccess('fail');
			});
	}, []);
	if (success === 'unknown') return <div></div>;
	else if (success === 'success') {
		return (
			<div style={{ margin: '3rem auto', textAlign: 'center', fontSize: '1.5rem' }}>
				Please close your browser to complete the logout.
			</div>
		);
	} else {
		return <div style={{ margin: '3rem auto', textAlign: 'center', fontSize: '1.5rem' }}>Logout failed.</div>;
	}
}
