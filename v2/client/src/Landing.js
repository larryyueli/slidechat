import React from 'react';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';

import { baseURL } from './config';

/**
 * Landing page of SlideChat
 */
export default function Landing(props) {
	return (
		<>
			<div className='appbar'>
				<div className='appbar-left'>
					<Link to={`${baseURL}/`} className='logo-link'>
						<img className='appbar-logo' src={`${baseURL}/imgs/logo.png`} alt='SlideChat' />
					</Link>
					<div className='title'>{props.title}</div>
				</div>
				<div>&nbsp;</div>
			</div>
			<div className='landing'>
				<div className='text'>
					<div>
						SlideChat is a content publishing platform that enables better communications around the slides.
					</div>
					<div>Students will be able to use it with the links provided by their instructors.</div>
				</div>
				<Button className='demoButton' variant='contained' href={`${baseURL}/5f1b35eb3997b943b856e362`}>
					See a Demo
				</Button>
				<br />
				<Button className='instructorButton' variant='contained' href={`${baseURL}/prof/`}>
					Instructor Login
				</Button>
			</div>
		</>
	);
}
