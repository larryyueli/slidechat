import React, { useState } from 'react';
import { ClickAwayListener } from '@material-ui/core';
import { Link } from 'react-router-dom';

import { baseURL } from './config';

/**
 * App bar: consisting the logo and some menu buttons
 */
function AppBar(props) {
	const [userDropDown, setUserDropDown] = useState('');

	return (
		<div className='appbar'>
			<div className='appbar-logo'>SlideChat</div>
			<div>
				{/* <span className='appbar-item'>Notification</span> */}
				{props.user ? (
					<ClickAwayListener onClickAway={(e) => setUserDropDown('')}>
						<span className='dropdown' onClick={(e) => setUserDropDown('open')}>
							<span className='appbar-item'>Hi, {props.user} !</span>
							<div className={`dropdown-content ${userDropDown}`}>
								<Link className='dropdown-item' to={`${baseURL}/logout`}>
									Logout
								</Link>
							</div>
						</span>
					</ClickAwayListener>
				) : props.loginURL ? (
					<a href={props.loginURL} className='appbar-item'>
						Sign In
					</a>
				) : null}
			</div>
		</div>
	);
}

export default AppBar;
