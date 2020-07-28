import React from 'react';
import { Link } from 'react-router-dom';

import { baseURL } from './config';

/**
 * App bar: consisting the logo and some menu buttons
 */
function AppBar(props) {
	return (
		<div className='appbar'>
			<div className='appbar-logo'>SlideChat</div>
			{props.buttons ? (
				<div>
					{/* <span className='appbar-item'>Notification</span> */}
					<Link className='appbar-item' to={`${baseURL}/logout`}>
						Logout
					</Link>
				</div>
			) : (
				<div></div>
			)}
		</div>
	);
}

export default AppBar;
