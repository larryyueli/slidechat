import React from 'react';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import './Slides.scss';

/**
 * Slides on the left of the screen
 */
function Slides(props) {
	let nextBtnDisable = props.pageNum === props.pageTotal;
	let prevBtnDisable = props.pageNum === 1;

	return (
		<div className="slide-container">
			<div>
				<img src={props.pageImg} alt="slide" className="slide" />
			</div>
			<Button variant="contained" disabled={prevBtnDisable} onClick={props.prevPage}>PREV</Button>
			<Button variant="contained" disabled={nextBtnDisable} onClick={props.nextPage}>NEXT</Button>
			<Typography>Page {props.pageNum} of {props.pageTotal}</Typography>
		</div>
	);
}

export default Slides;
