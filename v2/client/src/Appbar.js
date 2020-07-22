import React from 'react';

import { baseURL } from './config';

/**
 * App bar: consisting the logo and some menu buttons
 */
function AppBar() {
	return (
		<div className='appbar'>
			<div className='appbar-logo'>SlideChat</div>
			<div>
				<span className='appbar-item'>Notification</span>
				{/* <a className="appbar-item" href={`${baseURL}/p/prof`}>
					My Courses
				</a> */}
			</div>
		</div>
	);
}

export default AppBar;
