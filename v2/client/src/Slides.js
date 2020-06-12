import React from 'react';
import Button from '@material-ui/core/Button';

import { serverURL } from './config';


/**
 * Slides on the left of the screen
 */
export default function Slides(props) {
	let nextBtnDisable = props.pageNum === props.pageTotal;
	let prevBtnDisable = props.pageNum === 1;

	return (
		<div className="slide-container">
			<div className="title">{props.title}</div>
			<div>(<a className="download-link" href={`${serverURL}/api/downloadPdf?slideID=${props.sid}`}>{props.filename}</a>)</div>			
			<div>
				<img src={props.pageTotal
					? `${serverURL}/api/slideImg?slideID=${props.sid}&pageNum=${props.pageNum}`
					: "default.png"} alt="slide" className="slide" />
			</div>
			<Button variant="contained" disabled={prevBtnDisable} onClick={props.prevPage}>PREV</Button>
			<Button variant="contained" disabled={nextBtnDisable} onClick={props.nextPage}>NEXT</Button>
			<div>Page <input id="pageNum" type="text" defaultValue={props.pageNum} onBlur={props.gotoPage} /> of {props.pageTotal}</div>
		</div>
	);
}
