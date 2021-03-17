import { useEffect, useState, useRef, useCallback } from 'react';
import { Snackbar } from '@material-ui/core';
import axios from 'axios';

import SlideDrawingOverlay from './SlideDrawingOverlay';
import SlideFlipOverlay from './SlideFlipOverlay';
import ColourPicker, { palette } from './ColourPicker';
import { fullURL, serverURL } from '../../config';
import { randInt, range } from '../../util';
import AudioUploadPanel from './AudioUploadPanel';

const loadingImg = process.env.PUBLIC_URL + '/imgs/loading.png';
const disconnectedImg = process.env.PUBLIC_URL + '/imgs/disconnected.png';

/**
 * Slides on the left side of the screen
 */
export default function Slides(props) {
	const [audioInfo, setAudioInfo] = useState({});
	const [nextDisable, setNextDisable] = useState(true);
	const [prevDisable, setPrevDisable] = useState(true);
	const [img, setImg] = useState(loadingImg);
	const [showToast, setShowToast] = useState(false);
	const [fullscreenPortrait, setFullscreenPortrait] = useState(false);
	const [strokeColour, setStrokeColour] = useState(palette[0]);
	const carousel = useRef(null);

	// fetch page image
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
	}, [props.sid, props.pageTotal, props.pageNum]);

	// center carousel to the current page
	useEffect(() => {
		if (props.showCarouselPanel && !props.fullscreen) {
			const thumbnail = carousel.current.querySelector(`#thumbnail-${props.pageNum}`);
			if (!thumbnail) return;
			carousel.current.scroll({
				top: 0,
				left: thumbnail.offsetLeft - carousel.current.clientWidth / 2 + 40,
				behavior: 'smooth',
			});
		}
	}, [props.pageNum, props.pageTotal, props.showCarouselPanel, props.fullscreen]);

	const fetchAudioInfo = useCallback(async () => {
		try {
			const res = await axios.get(`${serverURL}/api/hasAudio?slideID=${props.sid}`);
			setAudioInfo(res.data);
		} catch (err) {
			console.error(err);
		}
	}, [props.sid]);

	useEffect(() => {
		fetchAudioInfo();
	}, [fetchAudioInfo]);

	const hasAudio = Boolean(audioInfo[props.pageNum]);

	/**
	 * go to next page
	 * @param {Event} onClick event
	 */
	const nextPage = (e) => {
		setNextDisable(true);
		props.gotoPage(props.pageNum + 1);
	};

	/**
	 * go to prev page
	 * @param {Event} onClick event
	 */
	const prevPage = (e) => {
		setPrevDisable(true);
		props.gotoPage(props.pageNum - 1);
	};

	const copyLink = async () => {
		if (!navigator.clipboard) return alert('Your browser does not support accessing clipboard!');
		await navigator.clipboard.writeText(
			`[@${props.filename}/Page ${props.pageNum}](${fullURL()}/${props.sid}/${props.pageNum})`
		);
		setShowToast(true);
	};

	const adjustAspectRatio = () => {
		const img = document.getElementById('slide-img');
		const imgAspectRatio = img.naturalWidth / img.naturalHeight;
		const container = document.querySelector('.slide-wrapper');
		const containerAspectRatio = container.clientWidth / container.clientHeight;
		setFullscreenPortrait(containerAspectRatio > imgAspectRatio);
	};
	const startFullscreen = async () => {
		try {
			await document.querySelector('.main').requestFullscreen();
		} catch (err) {
			alert('Full screen is not allowed!');
		}
	};
	useEffect(() => {
		if (!props.fullscreen) return;
		adjustAspectRatio();
	}, [props.fullscreen, props.fullscreenChatOpen]);

	return (
		<div className='slide-container'>
			{props.fullscreen ? null : (
				<div className='slide-toolbar'>
					<div className='draw-buttons'>
						{props.drawing ? (
							<>
								<div
									className='icon-btn'
									title='Clear drawing'
									onClick={() => props.canvasComponentRef.current.clear()}>
									<span className='material-icons'>delete_forever</span>
								</div>
								<div
									className='icon-btn'
									title='Undo'
									onClick={() => props.canvasComponentRef.current.undo()}>
									<span className='material-icons'>undo</span>
								</div>
								<ColourPicker currentColour={strokeColour} setColour={setStrokeColour} />
							</>
						) : null}
						{props.showTempDrawingBtn ? (
							props.drawing ? (
								<div className='icon-btn drawing' title='Clear and stop drawing'>
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
					</div>
					<div className='icon-btn' title='Quote this page'>
						<span className='material-icons' onClick={copyLink}>
							link
						</span>
					</div>

					{props.downloadable ? (
						<div className='icon-btn' title='Download PDF'>
							<a className='material-icons' href={`${serverURL}/api/downloadPdf?slideID=${props.sid}`}>
								file_download
							</a>
						</div>
					) : null}
					<div className='icon-btn fullscreen-btn' title='Fullscreen'>
						<span className='material-icons' onClick={() => startFullscreen()}>
							fullscreen
						</span>
					</div>
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

			<div className={`slide-wrapper ${props.fullscreen && fullscreenPortrait ? 'fullscreen-portrait' : ''}`}>
				<img id='slide-img' src={img} alt='slide' className='slide' />
				{props.drawingOverlay ? (
					<SlideDrawingOverlay
						ref={props.canvasComponentRef}
						drawing={props.drawing}
						fullscreen={props.fullscreen}
						fullscreenChatOpen={props.fullscreenChatOpen}
						strokeColour={strokeColour}
					/>
				) : (
					<SlideFlipOverlay
						prevBtnDisable={prevDisable}
						nextBtnDisable={nextDisable}
						prevPage={prevPage}
						nextPage={nextPage}
						fullscreen={props.fullscreen}
						fullscreenChatOpen={props.fullscreenChatOpen}
					/>
				)}

				<div className={`page-panel ${props.fullscreen ? 'fullscreen' : ''}`}>
					<div className='buttons'>
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
								onKeyDown={(e) => {
									if (e.key === 'Enter') document.getElementById('pageNum').blur();
								}}
								onBlur={() => {
									props.isTypingRef.current = false;
									props.gotoInputPage();
								}}
								onFocus={() => {
									props.isTypingRef.current = true;
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

						{props.fullscreen ? (
							<>
								{props.showTempDrawingBtn ? (
									props.drawing ? (
										<>
											<span
												className='material-icons smaller'
												title='Clear and stop drawing'
												onClick={props.cancelDrawing}>
												close
											</span>
											<ColourPicker currentColour={strokeColour} setColour={setStrokeColour} />
											<span
												className='material-icons smaller'
												title='Undo'
												onClick={() => props.canvasComponentRef.current.undo()}>
												undo
											</span>
											<span
												className='material-icons smaller'
												title='Clear drawing'
												onClick={() => props.canvasComponentRef.current.clear()}>
												delete_forever
											</span>
										</>
									) : (
										<span
											className='material-icons smaller'
											title='Temporary drawing'
											onClick={props.startDrawing}>
											brush
										</span>
									)
								) : null}
							</>
						) : null}
					</div>
					{props.fullscreen && hasAudio ? (
						<audio
							className='slide-audio'
							controls
							src={`${serverURL}/api/slideAudio?slideID=${props.sid}&pageNum=${
								props.pageNum
							}&random=${randInt(10000)}`}>
							Your browser does not support the audio element.
						</audio>
					) : null}
				</div>

				{props.fullscreen ? (
					<span className='material-icons chat-handle' onClick={props.openOrHideChat}>
						chat
					</span>
				) : null}

				{props.showCarouselPanel && !props.fullscreen ? (
					<div className='carousel' ref={carousel}>
						{range(1, props.pageTotal + 1).map((i) => (
							<div
								className={`thumbnail-container ${props.pageNum === i ? 'current-slide' : ''}`}
								id={`thumbnail-${i}`}
								onClick={() => props.gotoPage(i)}
								key={i}>
								<img
									src={`${serverURL}/api/slideThumbnail?slideID=${props.sid}&pageNum=${i}`}
									alt='thumbnail'
								/>
							</div>
						))}
					</div>
				) : null}

				{!props.fullscreen && hasAudio ? (
					<audio
						className='slide-audio'
						controls
						src={`${serverURL}/api/slideAudio?slideID=${props.sid}&pageNum=${
							props.pageNum
						}&random=${randInt(10000)}`}>
						Your browser does not support the audio element.
					</audio>
				) : null}

				{props.isInstructor && props.isInstructorView && !props.fullscreen ? (
					<AudioUploadPanel
						record={props.record}
						setRecord={props.setRecord}
						hasAudio={hasAudio}
						sid={props.sid}
						pageNum={props.pageNum}
						fetchAudioInfo={fetchAudioInfo}
					/>
				) : null}
			</div>
		</div>
	);
}
