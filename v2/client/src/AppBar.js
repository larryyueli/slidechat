import React, { useState } from 'react';
import { ClickAwayListener } from '@material-ui/core';
import { Link } from 'react-router-dom';

import { baseURL } from './config';
import { getUserName, setUserName } from './util'

/**
 * App bar: consisting the logo and some menu buttons
 */
function AppBar(props) {
	const [userDropDown, setUserDropDown] = useState('');

	const setNewName = async () => {
		let name = document.getElementById('anonymous-name').value;
		console.log(name.match(/^[\w- ]+$/));
		if (name.length > 30 || !name.match(/^[\w- ]+$/)) {
			document.getElementById('anonymous-name').value = getUserName(); 
		}else{
			setUserName(name);
		}
	};

	return (
		<div className='appbar'>
			<img className='appbar-logo' src={`${baseURL}/imgs/logo.png`} alt='SlideChat' />
			<div className='appbar-items'>
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
				{props.isAnyone ? (<div className='appbar-item anonymous-name-bar'>
					<div>Anonymous As</div> <input id='anonymous-name' type='text' defaultValue={getUserName()} onBlur={setNewName} maxLength={30} />
				</div>) : null}
			</div>
		</div>
	);
}

export default AppBar;
