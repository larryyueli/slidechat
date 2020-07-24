import React, { useEffect, useState, useRef } from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import axios from 'axios';

import SlideOverlay from './SlideOverlay';
import { serverURL } from './config';
import { getIsInstructor, randInt } from './util';

/**
 * Slides on the left of the screen
 */
export default function Slides(props) {
	let [audioSrc, setAudioSrc] = useState('');
	let nextBtnDisable = props.pageNum === props.pageTotal;
	let prevBtnDisable = props.pageNum === 1;
	const [uploading, setUploading] = useState(false);
	const fileUpload = useRef(null);

	useEffect(() => {
		axios
			.get(`${serverURL}/api/hasAudio?slideID=${props.sid}&pageNum=${props.pageNum}`)
			.then((res) => {
				if (res.data.audio) {
					setAudioSrc(
						`${serverURL}/api/slideAudio?slideID=${props.sid}&pageNum=${
							props.pageNum
						}&random=${randInt(10000)}`
					);
				} else {
					setAudioSrc('');
				}
			})
			.catch((err) => {
				console.error(err);
			});
	}, [props.pageNum]);

	const uploadAudio = async () => {
		if (fileUpload.current.files.length !== 1) return;

		let formData = new FormData();
		formData.append('sid', props.sid);
		formData.append('pageNum', props.pageNum);
		formData.append('file', fileUpload.current.files[0]);
		try {
			setUploading(true);
			await axios.post(`${serverURL}/api/audio/`, formData);
		} catch (err) {
			console.log(err);
		} finally {
			setUploading(false);
			document.getElementById('file').value = '';
			setAudioSrc(
				`${serverURL}/api/slideAudio?slideID=${props.sid}&pageNum=${
					props.pageNum
				}&random=${randInt(10000)}`
			);
		}
	};

	const deleteAudio = async () => {
		if (!window.confirm(`Are you sure to delete this audio?`)) return;

		axios
			.delete(`${serverURL}/api/audio?sid=${props.sid}&pageNum=${props.pageNum}`)
			.then((res) => {
				setAudioSrc('');
			})
			.catch((err) => {
				console.error(err);
			});
	};

	let audioRow;
	if (getIsInstructor()) {
		if (audioSrc) {
			audioRow = (
				<>
					<input type='file' id='file' className='file' ref={fileUpload} />
					{uploading ? (
						<CircularProgress size='1.5rem' className='progress' />
					) : (
						<span className='material-icons upload icon' onClick={uploadAudio}>
							publish
						</span>
					)}
					<audio className='slideAudio' id='slideAudio' controls={true} src={audioSrc}>
						Your browser does not support the audio element.
					</audio>
					<span className='material-icons delete icon' onClick={deleteAudio}>
						delete_forever
					</span>
				</>
			);
		} else {
			audioRow = (
				<>
					<input type='file' id='file' className='file' ref={fileUpload} />
					<Button variant='contained' color='primary' onClick={uploadAudio} disabled={uploading}>
						Upload Audio
					</Button>
					{uploading ? <CircularProgress /> : null}
				</>
			);
		}
	} else {
		audioRow = (
			<audio className='slideAudio' controls={audioSrc ? true : false} src={audioSrc}>
				Your browser does not support the audio element.
			</audio>
		);
	}

	return (
		<div className='slide-container'>
			<div className='title'>{props.title}</div>
			<div>
				<a
					className='download-link'
					href={`${serverURL}/api/downloadPdf?slideID=${props.sid}`}>
					(Download {props.filename})
				</a>
			</div>
			<div>
				<div className='slide-wrapper'>
					<img
						id='slide-img'
						src={
							props.pageTotal
								? `${serverURL}/api/slideImg?slideID=${props.sid}&pageNum=${props.pageNum}`
								: 'default.png'
						}
						alt='slide'
						className='slide'
					/>
					{props.drawing ? <SlideOverlay ref={props.canvasComponentRef} /> : null}
				</div>
				<div className='audio-row'>{audioRow}</div>
			</div>
			<Button variant='contained' disabled={prevBtnDisable} onClick={props.prevPage}>
				PREV
			</Button>
			<Button variant='contained' disabled={nextBtnDisable} onClick={props.nextPage}>
				NEXT
			</Button>
			<div>
				Page <input id='pageNum' type='text' defaultValue={props.pageNum} onBlur={props.gotoPage} /> of{' '}
				{props.pageTotal}
			</div>
		</div>
	);
}
