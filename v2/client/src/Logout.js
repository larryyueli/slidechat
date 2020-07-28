import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from './config';

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
