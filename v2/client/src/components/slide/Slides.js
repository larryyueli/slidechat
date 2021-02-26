import React, { useEffect, useState, useRef } from 'react';
import { Button, CircularProgress, Snackbar } from '@material-ui/core';
import axios from 'axios';

import SlideDrawingOverlay from './SlideDrawingOverlay';
import SlideFlipOverlay from './SlideFlipOverlay';
import { fullURL, serverURL } from '../../config';
import { randInt, range } from '../../util';

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
	const [showToast, setShowToast] = useState(false);
	const fileUpload = useRef(null);
	const carousel = useRef(null);

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

	const uploadRecording = async () => {
		setUploading(true);
		let formData = new FormData();
		formData.append('sid', props.sid);
		formData.append('pageNum', props.pageNum);
		formData.append('file', props.record.recordingFile);
		try {
			setUploading(true);
			await axios.post(`${serverURL}/api/audio/`, formData);
			setAudioSrc(
				`${serverURL}/api/slideAudio?slideID=${props.sid}&pageNum=${props.pageNum}&random=${randInt(10000)}`
			);
			props.setRecord({ ...props.record, uploaded: true });
		} catch (err) {
			console.log(err);
		} finally {
			setUploading(false);
			props.setRecord({ ...props.record, recordingFile: null, recordingSrc: '' });
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
		props.gotoPage(props.pageNum + 1);
		centerCarousel(props.pageNum + 1);
	};

	/**
	 * go to prev page
	 * @param {Event} onClick event
	 */
	const prevPage = (e) => {
		setPrevDisable(true);
		props.gotoPage(props.pageNum - 1);
		centerCarousel(props.pageNum - 1);
	};

	const gotoPageAndCenterCarousel = (pageNum) => {
		props.gotoPage(pageNum);
		centerCarousel(pageNum);
	};

	const centerCarousel = (pageNum) => {
		if (!props.showCarouselPanel || props.fullscreen) return;
		const thumbnail = carousel.current.querySelector(`#thumbnail-${pageNum}`);
		if (!thumbnail) return;
		carousel.current.scroll({
			top: 0,
			left: thumbnail.offsetLeft - carousel.current.clientWidth / 2 + 40,
			behavior: 'smooth',
		});
	};

	const startRecording = async () => {
		if (!navigator.mediaDevices) {
			window.alert("Your browser doesn't support using microphone. Are you using HTTPS?");
			return;
		}
		if (props.record.recordingSrc !== '' && !props.record.uploaded) {
			if (!window.confirm("You haven't uploaded your recording. Do you want to discard it?")) return;
		}
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then(async () => {
				const MicRecorder = (await import('mic-recorder-to-mp3')).default;
				window.audioRecorder = new MicRecorder({ bitRate: 128 });
				window.audioRecorder
					.start()
					.then(() => {
						props.setRecord({ ...props.record, recording: true });
					})
					.catch((err) => console.error(err));
			})
			.catch(() => {
				window.alert('Audio permission denied.');
			});
	};

	const stopRecording = () => {
		window.audioRecorder
			.stop()
			.getMp3()
			.then(([buffer, blob]) => {
				props.setRecord({
					...props.record,
					recording: false,
					uploaded: false,
					recordingFile: new File(buffer, 'recording.mp3', { type: blob.type, lastModified: Date.now() }),
					recordingSrc: URL.createObjectURL(blob),
				});
			})
			.catch((err) => console.error(err));
		delete window.audioRecorder;
	};

	const copyLink = async () => {
		if (!navigator.clipboard) return alert('Your browser does not support accessing clipboard!');
		await navigator.clipboard.writeText(
			`[@${props.filename}/Page ${props.pageNum}](${fullURL()}/${props.sid}/${props.pageNum})`
		);
		setShowToast(true);
	};

	const startFullscreen = async () => {
		try {
			await document.querySelector('.main').requestFullscreen();
		} catch (err) {
			alert('Full screen is not allowed!');
		}
	};

	return (
		<div className='slide-container'>
			{props.fullscreen ? null : (
				<div className='slide-toolbar'>
					{props.showTempDrawingBtn ? (
						props.drawing ? (
							<div className='icon-btn drawing' title='Clear drawing'>
								<span className={`material-icons icon`} onClick={props.cancelDrawing}>
									close
								</span>
							</div>
						) : (
							<div className='icon-btn' title='Temporary drawing'>
								<span className={`material-icons icon`} onClick={props.startDrawing}>
									brush
								</span>
							</div>
						)
					) : null}
					<div className='icon-btn' title='Quote this page'>
						<span className='material-icons' onClick={copyLink}>
							link
						</span>
					</div>
					<div className='icon-btn' title='Download PDF'>
						<a className='material-icons' href={`${serverURL}/api/downloadPdf?slideID=${props.sid}`}>
							file_download
						</a>
					</div>
					{props.fullscreen ? (
						<div className='icon-btn' title='Fullscreen'>
							<span className='material-icons' onClick={() => document.exitFullscreen()}>
								fullscreen_exit
							</span>
						</div>
					) : (
						<div className='icon-btn' title='Fullscreen'>
							<span className='material-icons' onClick={() => startFullscreen()}>
								fullscreen
							</span>
						</div>
					)}
					<Snackbar
						className='toast'
						anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
						open={showToast}
						onClose={() => setShowToast(false)}
						autoHideDuration={2500}
						message='Link copied to clipboard!'
					/>
				</div>
			)}

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
						onClick={() => gotoPageAndCenterCarousel(1)}>
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
						onClick={() => gotoPageAndCenterCarousel(props.pageTotal)}>
						last_page
					</span>
				</div>

				{props.showCarouselPanel && !props.fullscreen ? (
					<div className='carousel' ref={carousel}>
						{range(1, props.pageTotal + 1).map((i) => (
							<div
								className={`thumbnail-container ${props.pageNum === i ? 'current-slide' : ''}`}
								id={`thumbnail-${i}`}
								onClick={() => gotoPageAndCenterCarousel(i)}
								key={i}>
								<img
									src={`${serverURL}/api/slideThumbnail?slideID=${props.sid}&pageNum=${i}`}
									alt='thumbnail'
								/>
							</div>
						))}
					</div>
				) : null}

				<audio className='slide-audio' controls={audioSrc ? true : false} src={audioSrc}>
					Your browser does not support the audio element.
				</audio>

				{props.isInstructor && props.isInstructorView && !props.fullscreen ? (
					<>
						<div className='audio-instructor'>
							<input type='file' id='file' className='file' ref={fileUpload} accept='.mp3' />
							<Button variant='contained' onClick={uploadAudio} disabled={uploading} className='upload'>
								{audioSrc ? 'Replace' : 'Upload'} audio
							</Button>
							{uploading ? <CircularProgress /> : null}
							{audioSrc ? (
								<Button
									variant='contained'
									onClick={deleteAudio}
									disabled={uploading}
									className='delete'>
									Delete Audio
								</Button>
							) : null}
							{props.record.recording ? (
								<Button variant='contained' className='stop' onClick={stopRecording}>
									<span className='material-icons stop-icon'>stop</span>
									Stop recording
								</Button>
							) : (
								<Button variant='contained' className='start' onClick={startRecording}>
									<span className='material-icons start-icon'>radio_button_checked</span>
									Start recording
								</Button>
							)}
						</div>
						{props.record.recordingSrc ? (
							<div className='recording'>
								<audio className='recording-audio' controls={true} src={props.record.recordingSrc}>
									Your browser does not support the audio element.
								</audio>
								<Button
									variant='contained'
									onClick={uploadRecording}
									disabled={uploading}
									className='upload'>
									{audioSrc ? 'Replace' : 'Upload'} audio
								</Button>
							</div>
						) : null}
					</>
				) : null}
			</div>
		</div>
	);
}
