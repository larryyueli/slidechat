import React, { useEffect, useState, useRef } from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import axios from 'axios';

import SlideDrawingOverlay from './SlideDrawingOverlay';
import SlideFlipOverlay from './SlideFlipOverlay';
import { serverURL } from './config';
import { randInt } from './util';

const loadingImg = process.env.PUBLIC_URL + '/imgs/loading.png';
const disconnectedImg = process.env.PUBLIC_URL + '/imgs/disconnected.png';
/**
 * Slides on the left of the screen
 */
export default function Slides(props) {
	let [audioSrc, setAudioSrc] = useState('');
	let nextBtnDisable = props.pageNum === props.pageTotal;
	let prevBtnDisable = props.pageNum === 1;
	const [uploading, setUploading] = useState(false);
	const [img, setImg] = useState(loadingImg);
	const fileUpload = useRef(null);

	useEffect(() => {
		setImg(loadingImg);
		if (!props.pageTotal) return;
		fetch(`${serverURL}/api/slideImg?slideID=${props.sid}&pageNum=${props.pageNum}`)
			.then((res) => {
				if (!res.ok) throw res.statusText;
				return res.blob();
			})
			.then((blob) => {
				const src = URL.createObjectURL(blob);
				setImg(src);
			})
			.catch((err) => {
				console.error(err);
				setImg(disconnectedImg);
			});
		axios
			.get(`${serverURL}/api/hasAudio?slideID=${props.sid}&pageNum=${props.pageNum}`)
			.then((res) => {
				if (res.data.audio) {
					setAudioSrc(
						`${serverURL}/api/slideAudio?slideID=${props.sid}&pageNum=${props.pageNum}&random=${randInt(
							10000
						)}`
					);
				} else {
					setAudioSrc('');
				}
			})
			.catch((err) => {
				console.error(err);
			});
		// eslint-disable-next-line
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
				`${serverURL}/api/slideAudio?slideID=${props.sid}&pageNum=${props.pageNum}&random=${randInt(10000)}`
			);
		}
	};

	const deleteAudio = async () => {
		if (!window.confirm(`Are you sure to delete this audio?`)) return;
		setUploading(true);
		axios
			.delete(`${serverURL}/api/audio?sid=${props.sid}&pageNum=${props.pageNum}`)
			.then((res) => {
				setAudioSrc('');
				setUploading(false);
			})
			.catch((err) => {
				console.error(err);
				setUploading(false);
			});
	};

	return (
		<div className='slide-container'>
			<div className='title'>{props.title}</div>
			<div>
				<a className='download-link' href={`${serverURL}/api/downloadPdf?slideID=${props.sid}`}>
					(Download {props.filename})
				</a>
			</div>
			<div className='slide-wrapper'>
				<img id='slide-img' src={img} alt='slide' className='slide' />
				{props.drawing ? (
					<SlideDrawingOverlay ref={props.canvasComponentRef} />
				) : (
					<SlideFlipOverlay
						prevBtnDisable={prevBtnDisable}
						nextBtnDisable={nextBtnDisable}
						prevPage={props.prevPage}
						nextPage={props.nextPage}
					/>
				)}

				<div className='flip-page-btns'>
					<Button variant='contained' disabled={prevBtnDisable} onClick={props.prevPage}>
						PREV
					</Button>
					<Button variant='contained' disabled={nextBtnDisable} onClick={props.nextPage}>
						NEXT
					</Button>
				</div>
				<div>
					Page <input id='pageNum' type='text' defaultValue={props.pageNum} onBlur={props.gotoPage} /> of{' '}
					{props.pageTotal}
				</div>

				<audio className='slide-audio' controls={audioSrc ? true : false} src={audioSrc}>
					Your browser does not support the audio element.
				</audio>

				{props.isInstructor ? (
					<div className='audio-instructor'>
						<input type='file' id='file' className='file' ref={fileUpload} accept='.mp3' />
						<Button variant='contained' onClick={uploadAudio} disabled={uploading} className='upload'>
							{audioSrc ? 'Replace' : 'Upload'} Audio
						</Button>
						{uploading ? <CircularProgress /> : null}
						{audioSrc ? (
							<Button variant='contained' onClick={deleteAudio} disabled={uploading} className='delete'>
								Delete Audio
							</Button>
						) : null}
					</div>
				) : null}
			</div>
		</div>
	);
}
