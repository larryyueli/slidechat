import React, { useState } from 'react';
import { ClickAwayListener, Button, Switch } from '@material-ui/core';
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

	/**
	 * update input value and check if input is valid (controlled input element)
	 * @param {Event} e input onChange event
	 */
	const setNewName = (e) => {
		let input = e.target.value;
		if (input.length > 30 || !input.match(NAME_FORMAT)) {
			setInputInvalid('invalid');
		} else {
			setInputInvalid('ok');
		}
		setName(input);
	};

	/**
	 * update displayName iff newName is valid
	 * @param {String} newName
	 */
	const confirmName = (newName) => {
		if (newName > 30 || !newName.match(NAME_FORMAT)) {
			setName(getDisplayName());
		} else {
			setDisplayName(newName);
		}
	};

	/**
	 * update showCarouselPanel
	 * @param {Event} e input onChange event
	 */
	const setShowCarouselPanel = (e) => {
		props.setShowCarouselPanel(e.target.checked);
	};

	const toggleLargerSlide = (e) => {
		props.setLargerSlide(e.target.checked);
		localStorage.setItem('slidechat_larger_slide', e.target.checked ? '1' : '0');
	};

	return (
		<div className='appbar'>
			<Link to={`${baseURL}/`} className='logo-link'>
				<img className='appbar-logo' src={`${baseURL}/imgs/logo.png`} alt='SlideChat' />
			</Link>
			<div className='appbar-items'>
				<ClickAwayListener onClickAway={(e) => setUserDropDown('')}>
					<span className='dropdown' onClick={(e) => setUserDropDown('open')}>
						<span className='appbar-item'>
							Hi, {props.anonymity === 'C' ? props.username : name}
							{props.anonymity === 'D' && props.isInstructor
								? props.isInstructorView
									? "(Instructor's View)"
									: "(Student's View)"
								: ' '}
							!
						</span>
						<div className={`dropdown-content ${userDropDown}`}>
							{props.anonymity !== 'C' ? (
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
							<div className='dropdown-item'>
								Display thumbnails
								<Switch checked={props.showCarouselPanel} onChange={setShowCarouselPanel}></Switch>
							</div>
							<div className='dropdown-item'>
								Larger slide
								<Switch checked={props.largerSlide} onChange={toggleLargerSlide}></Switch>
							</div>
							{props.uid ? (
								<>
									<div className='dropdown-item'>
										Signed in as <b>{props.uid}</b>
									</div>
									{props.isInstructor ? (
										<div
											className='dropdown-item clickable'
											onClick={(e) => props.setIsInstructorView(!props.isInstructorView)}>
											{props.isInstructorView
												? "Change to Student's View"
												: "Change to Instructor's View"}
										</div>
									) : null}
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
