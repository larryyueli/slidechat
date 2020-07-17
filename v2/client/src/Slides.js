import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import axios from 'axios';

import { serverURL } from './config';


/**
 * Slides on the left of the screen
 */
export default function Slides(props) {
	let [audioSrc, setAudioSrc] = useState('');
	let nextBtnDisable = props.pageNum === props.pageTotal;
	let prevBtnDisable = props.pageNum === 1;

	useEffect(() => {
		if (props.protectLevel === 'unknown') return;
		axios.get(`${serverURL}/api/hasAudio?slideID=${props.sid}&pageNum=${props.pageNum}`).then(res => {
			if (res.data.audio) {
				setAudioSrc(`${serverURL}${props.protectLevel}/api/slideAudio?slideID=${props.sid}&pageNum=${props.pageNum}`);
			} else {
				setAudioSrc('');
			}
		}).catch(err => {
			console.error(err);
		});
	}, [props.protectLevel, props.pageNum]);

	return (
		<div className="slide-container">
			<div className="title">{props.title}</div>
			<div>(<a className="download-link" href={`${serverURL}${props.protectLevel}/api/downloadPdf?slideID=${props.sid}`}>{props.filename}</a>)</div>
			<div>
				<img src={props.pageTotal
					? `${serverURL}${props.protectLevel}/api/slideImg?slideID=${props.sid}&pageNum=${props.pageNum}`
					: "default.png"} alt="slide" className="slide" />
				<audio className="slideAudio"
					controls={audioSrc ? true : false}
					src={audioSrc}>
					Your browser does not support the audio element.
				</audio>
			</div>
			<Button variant="contained" disabled={prevBtnDisable} onClick={props.prevPage}>PREV</Button>
			<Button variant="contained" disabled={nextBtnDisable} onClick={props.nextPage}>NEXT</Button>
			<div>Page <input id="pageNum" type="text" defaultValue={props.pageNum} onBlur={props.gotoPage} /> of {props.pageTotal}</div>
		</div>
	);
}
