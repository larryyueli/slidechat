import React, { useEffect, useState, useRef } from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import axios from 'axios';

import SlideDrawingOverlay from './SlideDrawingOverlay';
import SlideFlipOverlay from './SlideFlipOverlay';
import { serverURL } from '../../config';
import { randInt } from '../../util';

const loadingImg = process.env.PUBLIC_URL + '/imgs/loading.png';
const disconnectedImg = process.env.PUBLIC_URL + '/imgs/disconnected.png';

/**
 * Slides on the left side of the screen
 */
export default function Slides(props) {
	const [audioSrc, setAudioSrc] = useState('');
	const [nextDisable, setNextDisable] = useState(true);
	const [prevDisable, setPrevDisable] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [img, setImg] = useState(loadingImg);
	const fileUpload = useRef(null);

	useEffect(() => {
		if (!props.pageTotal) return;
		fetch(`${serverURL}/api/slideImg?slideID=${props.sid}&pageNum=${props.pageNum}`)
			.then((res) => {
				if (!res.ok) throw res.statusText;
				return res.blob();
			})
			.then((blob) => {
				const src = URL.createObjectURL(blob);
				setImg(src);
				setNextDisable(props.pageNum === props.pageTotal);
				setPrevDisable(props.pageNum === 1);
			})
			.catch((err) => {
				console.error(err);
				setImg(disconnectedImg);
				setNextDisable(props.pageNum === props.pageTotal);
				setPrevDisable(props.pageNum === 1);
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
	}, [props.pageTotal, props.pageNum]);

	/**
	 * upload audio to server
	 */
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

	/**
	 * delete the audio on this page
	 */
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

	/**
	 * go to next page
	 * @param {Event} onClick event
	 */
	const nextPage = (e) => {
		setNextDisable(true);
		props.nextPage();
	};

	/**
	 * go to prev page
	 * @param {Event} onClick event
	 */
	const prevPage = (e) => {
		setPrevDisable(true);
		props.prevPage();
	};

	return (
		<div className='slide-container'>
			<div className='title'>{props.title}</div>
			<div className='slide-bar'>
				<a className='download-link' href={`${serverURL}/api/downloadPdf?slideID=${props.sid}`}>
					(Download {props.filename})
				</a>

				{props.showTempDrawingBtn ? (
					<div className='drawing-toggle' title='Temporary Drawing'>
						{props.drawing ? (
							<span className={`material-icons icon drawing`} onClick={props.cancelDrawing}>
								close
							</span>
						) : (
							<span className={`material-icons icon`} onClick={props.startDrawing}>
								brush
							</span>
						)}
					</div>
				) : null}
			</div>

			<div className='slide-wrapper'>
				<img id='slide-img' src={img} alt='slide' className='slide' />
				{props.drawingOverlay ? (
					<SlideDrawingOverlay ref={props.canvasComponentRef} drawing={props.drawing} />
				) : (
					<SlideFlipOverlay
						prevBtnDisable={prevDisable}
						nextBtnDisable={nextDisable}
						prevPage={prevPage}
						nextPage={nextPage}
					/>
				)}

				<div className='page-panel'>
					<span
						className={`material-icons ${props.pageNum <= 1 ? 'disable' : ''}`}
						onClick={() => props.gotoPage(1)}>
						first_page
					</span>
					<span className={`material-icons ${props.pageNum <= 1 ? 'disable' : ''}`} onClick={prevPage}>
						navigate_before
					</span>
					<div className='page-input'>
						Page{' '}
						<input
							id='pageNum'
							type='tel'
							defaultValue={props.pageNum}
							onBlur={props.gotoInputPage}
							onKeyDown={(e) => {
								if (e.key === 'Enter') document.getElementById('pageNum').blur();
							}}
						/>{' '}
						of {props.pageTotal}
					</div>
					<span
						className={`material-icons ${props.pageNum >= props.pageTotal ? 'disable' : ''}`}
						onClick={nextPage}>
						navigate_next
					</span>
					<span
						className={`material-icons ${props.pageNum >= props.pageTotal ? 'disable' : ''}`}
						onClick={() => props.gotoPage(props.pageTotal)}>
						last_page
					</span>
				</div>

				<audio className='slide-audio' controls={audioSrc ? true : false} src={audioSrc}>
					Your browser does not support the audio element.
				</audio>

				{props.isInstructor && props.isInstructorView ? (
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
