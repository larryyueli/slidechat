import React from 'react';
import Button from '@material-ui/core/Button';

import { baseURL } from './config';

/**
 * Slides on the left of the screen
 */
export default function Landing(props) {
	return (
		<div className='landing'>
			<div className='text'>
				<div>
					SlideChat is a content publishing platform that enables better communications around the slides.
				</div>
				<div>Students will be able to use it with the links provided by their instructors.</div>
			</div>
			<Button
				className='demoButton'
				color='primary'
				variant='contained'
				href={`${baseURL}/5f1b35eb3997b943b856e362`}>
				See a Demo
			</Button>
			<br />
			<Button className='instructorButton' variant='contained' href={`${baseURL}/prof`}>
				Instructor Login
			</Button>
		</div>
	);
}
