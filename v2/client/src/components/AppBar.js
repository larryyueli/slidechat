import React, { useState } from 'react';
import { ClickAwayListener, Button } from '@material-ui/core';
import { Link } from 'react-router-dom';

import { baseURL } from '../config';
import { getDisplayName, setDisplayName, getRandomName } from '../util';

const NAME_FORMAT = /^[\w- ]+$/;

/**
 * App bar: consisting the logo and some menu buttons
 */
function AppBar(props) {
	const [userDropDown, setUserDropDown] = useState('');
	const [name, setName] = useState(getDisplayName());
	const [inputInvalid, setInputInvalid] = useState('ok');

	const setNewName = (e) => {
		let input = e.target.value;
		if (input.length > 30 || !input.match(NAME_FORMAT)) {
			setInputInvalid('invalid');
		} else {
			setInputInvalid('ok');
		}
		setName(input);
	};

	const confirmName = (newName) => {
		if (newName > 30 || !newName.match(NAME_FORMAT)) {
			setName(getDisplayName());
		} else {
			setDisplayName(newName);
		}
	};

	return (
		<div className='appbar'>
			<Link to={`${baseURL}/`}>
				<img className='appbar-logo' src={`${baseURL}/imgs/logo.png`} alt='SlideChat' />
			</Link>
			<div className='appbar-items'>
				{/* <span className='appbar-item'>Notification</span> */}
				<ClickAwayListener onClickAway={(e) => setUserDropDown('')}>
					<span className='dropdown' onClick={(e) => setUserDropDown('open')}>
						<span className='appbar-item'>
							Hi, {props.anonymity === 'nonymous' ? props.username : name} !
						</span>
						<div className={`dropdown-content ${userDropDown}`}>
							{props.anonymity !== 'nonymous' ? (
								<>
									<div className='dropdown-item input-label'>Set display name: </div>
									<div className='dropdown-item anonymous-name-bar'>
										<input
											type='text'
											value={name}
											onChange={setNewName}
											onBlur={(e) => confirmName(name)}
											maxLength={30}
										/>
										<Button
											onClick={(e) => {
												let rand = getRandomName();
												setName(rand);
												confirmName(rand);
											}}>
											Random
										</Button>
									</div>
									<div className={`dropdown-item error ${inputInvalid}`}>
										Display name must be 1-30 characters long and consists only a-z, A-Z, 0-9, _, -
										and space.
									</div>
								</>
							) : null}
							{props.uid ? (
								<>
									<div className='dropdown-item'>
										Signed in as <b>{props.uid}</b>
									</div>
									<Link className='dropdown-item clickable' to={`${baseURL}/logout`}>
										Logout
									</Link>
								</>
							) : (
								<a href={props.loginURL} className='dropdown-item'>
									Sign In
								</a>
							)}
						</div>
					</span>
				</ClickAwayListener>
			</div>
		</div>
	);
}

export default AppBar;
