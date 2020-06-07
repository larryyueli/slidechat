import React from 'react';
import Button from '@material-ui/core/Button';


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
			<div>Page <input id="pageNum" type="text" defaultValue={props.pageNum} onBlur={props.gotoPage} /> of {props.pageTotal}</div>
		</div>
	);
}

export default Slides;
