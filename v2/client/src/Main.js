import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io/client-dist/socket.io';

import Slides from './components/slide/Slides';
import AppBar from './components/AppBar';
import ModifyChat from './components/chat/ModifyChat';
import NewQuestion from './components/chat/NewQuestion';
import QuestionList from './components/chat/QuestionList';
import QuestionDetails from './components/chat/QuestionDetails';
import { baseURL, serverURL, socketURL, socketPath } from './config';
import { QUESTION_LIST, NEW_QUESTION, MODIFY_CHAT } from './util';

const slideStats = {};
let slideStartTime = Date.now();

/**
 * Add viewCount and timeViewed stats for a page
 */
const addSlideStats = (page) => {
	const timeViewed = Date.now() - slideStartTime;

	if (page in slideStats) {
		slideStats[page].viewCount += 1;
		slideStats[page].timeViewed += timeViewed
	} else {
		slideStats[page] = { 'viewCount': 1, 'timeViewed': timeViewed };
	}

	slideStartTime = Date.now();
};

/**
 * Main page of the application: the slides and chats of a given set of slides, given
 * from the URL.
 */
function Main(props) {
	const sid = props.match.params.slideId;
	const [connected, setConnected] = useState(false);
	const [pageTotal, setPageTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [title, setTitle] = useState('');
	const [filename, setFilename] = useState('');
	const [drawable, setDrawable] = useState(false);
	const [downloadable, setDownloadable] = useState(true);
	const [drawingOverlay, setDrawingOverlay] = useState(false);
	const [isInstructor, setIsInstructor] = useState(false);
	const [uid, setUid] = useState('');
	const [username, setUsername] = useState('');
	const [anonymity, setAnonymity] = useState('A');
	const [qid, setQid] = useState(QUESTION_LIST);
	const [drawing, setDrawing] = useState(false);
	const [showTempDrawingBtn, setShowTempDrawingBtn] = useState(true);
	const [chatToModify, setChatToModify] = useState({});
	const canvasComponentRef = useRef(null); // this ref is used to read canvas data from chat area
	const [record, setRecord] = useState({ uploaded: false, recording: false, recordingFile: null, recordingSrc: '' });
	const [largerSlide, setLargerSlide] = useState(() => localStorage.getItem('SlideChat_LargerSlide') === '1');
	const [showCarouselPanel, setShowCarouselPanel] = useState(
		() => localStorage.getItem('SlideChat_HideCarousel') !== '1'
	); // default true for null
	const [isInstructorView, setIsInstructorView] = useState(
		() => localStorage.getItem('SlideChat_StudentView') !== '1'
	); // default true for null
	const [fullscreen, setFullscreen] = useState(false);
	const [fullscreenChatOpen, setFullscreenChatOpen] = useState(false);
	const isTypingRef = useRef(false);
	const questionListRef = useRef(null);
	const questionDetailsRef = useRef(null);
	const pageNumRef = useRef(-1);
	const gotoPageRef = useRef(() => {});

	const [darkTheme, setDarkTheme] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

	/**
	 * fetch slide info from server and redirect to login if needed
	 */
	useEffect(() => {
		axios
			.get(`${serverURL}/api/slideInfo?slideID=${sid}`)
			.then((res) => {
				if (res.data.anonymity !== 'A' && !res.data.loginUser) {
					window.location.href = `${serverURL}/p/login/${window.location.pathname.substring(baseURL.length)}`;
				} else {
					return res;
				}
			})
			.then((res) => {
				let currentPage = 1;
				let questionId;
				if (props.match.params.pageNum) {
					let n = +props.match.params.pageNum;
					if (n <= res.data.pageTotal) {
						currentPage = n;
						questionId = +props.match.params.qid;
					}
				}

				setAnonymity(res.data.anonymity);
				if (res.data.loginUser) {
					setUid(res.data.loginUser);
					setUsername(res.data.username);
				}
				if (res.data.isInstructor) setIsInstructor(true);
				setTitle(res.data.title);
				setFilename(res.data.filename);
				setDrawable(Boolean(res.data.drawable));
				setDownloadable(Boolean(res.data.downloadable));
				document.getElementById('pageNum').value = currentPage;
				setPage(currentPage);
				if (questionId || questionId === 0) setQid(questionId);
				setPageTotal(res.data.pageTotal);
			})
			.catch((err) => {
				console.error(err);
			});

		const socket = io(socketURL(), {
			path: socketPath,
			transports: ['polling'], // web socket doesn't work on the reverse proxy yet...
		});
		socket.emit('join slide room', sid);
		socket.on('connect', () => {
			console.log('socket connected');
			setConnected(true);
		});
		socket.on('disconnect', (reason) => {
			console.log('socket disconnected, reason: ', reason);
			setConnected(false);
		});
		socket.on('new question', (data) => {
			if (questionListRef.current) questionListRef.current.onNewQuestionEvent(data);
		});
		socket.on('new reply', (data) => {
			if (questionListRef.current) questionListRef.current.onNewReplyEvent(data);
			if (questionDetailsRef.current) questionDetailsRef.current.onNewReplyEvent(data);
		});
		socket.on('like', (data) => {
			if (questionDetailsRef.current) questionDetailsRef.current.onLikeEvent(data);
		});
		socket.on('modify', (data) => {
			if (questionDetailsRef.current) questionDetailsRef.current.onModifyEvent(data);
		});
		socket.on('delete chat', (data) => {
			if (questionDetailsRef.current) questionDetailsRef.current.onDeleteEvent(data);
		});
		socket.on('endorse', (data) => {
			if (questionListRef.current) questionListRef.current.onEndorseEvent(data);
			if (questionDetailsRef.current) questionDetailsRef.current.onEndorseEvent(data);
		});
		socket.on('error', (msg) => alert(msg));
		return () => {
			socket.close();
		};
	}, [sid, props.match.params]);

	/**
	 * apply the new page number
	 * @param {number} newPageNum
	 */
	const applyPage = (newPageNum) => {
		document.getElementById('pageNum').value = newPageNum;
		window.history.replaceState(null, null, `${baseURL}/${sid}/${newPageNum}`);
		setPage(newPageNum);
	};

	/**
	 * Go to the page user entered in the input
	 */
	const gotoInputPage = () => {
		let newPageNum = +document.getElementById('pageNum').value;
		if (!Number.isInteger(newPageNum)) {
			document.getElementById('pageNum').value = page;
			return;
		}
		gotoPage(newPageNum);
	};

	/**
	 * Go to the page pageNum iff it is a valid page
	 */
	const gotoPage = (pageNum) => {
		if (record.recording) {
			if (
				window.confirm(
					'Go to another page will lose your current recording progress. Do you want to discard it?'
				)
			) {
				if (window.audioRecorder) {
					window.audioRecorder.stop();
					delete window.audioRecorder;
				}
				setRecord({ ...record, recording: false });
			} else return;
		} else if (record.recordingSrc !== '' && !record.uploaded) {
			if (window.confirm("You haven't uploaded your recording. Do you want to discard it?")) {
				setRecord({ ...record, recordingFile: null, recordingSrc: '' });
			} else return;
		}
		if (pageNum > pageTotal) {
			pageNum = pageTotal;
		} else if (pageNum < 1) {
			pageNum = 1;
		}
		if (pageNum === page) return;
		if (qid !== QUESTION_LIST) {
			setQid(QUESTION_LIST);
			setDrawing(false);
			setDrawingOverlay(false);
			setShowTempDrawingBtn(true);
		} else if (drawing) {
			canvasComponentRef.current.clear();
		}

		addSlideStats(page);
		applyPage(pageNum);
	};

	const gotoQuestion = (pageNum, qid) => {
		if (drawing) {
			// exit temp drawing mode
			canvasComponentRef.current.clear();
			setDrawing(false);
		}
		applyPage(pageNum);
		setQid(qid);
		setShowTempDrawingBtn(false);
	};

	const gotoNewQuestion = () => {
		setQid(NEW_QUESTION);
		setDrawingOverlay(false);
		setDrawing(false);
		setShowTempDrawingBtn(false);
	};

	const gotoModify = (chat, cid) => {
		setChatToModify({ ...chat, cid, qid });
		setQid(MODIFY_CHAT);
	};

	/**
	 * onClick handler for back button to go back to the chat list
	 */
	const back = () => {
		if (qid === MODIFY_CHAT) {
			gotoQuestion(page, chatToModify.qid);
		} else {
			setQid(QUESTION_LIST);
			setDrawingOverlay(false);
			window.history.replaceState(null, null, `${baseURL}/${sid}/${page}`);
			setShowTempDrawingBtn(true);
		}
		setDrawing(false);
	};

	const startDrawing = (e) => {
		setDrawing(true);
		setDrawingOverlay(true);
	};

	const cancelDrawing = (e) => {
		setDrawing(false);
		canvasComponentRef.current.clear();
		setDrawingOverlay(false);
	};

	const openOrHideChat = () => {
		setFullscreenChatOpen(!fullscreenChatOpen);
	};

	pageNumRef.current = page;
	gotoPageRef.current = gotoPage;
	useEffect(() => {
		document.querySelector('.main').addEventListener('fullscreenchange', () => {
			setFullscreen(Boolean(document.fullscreenElement));
			if (canvasComponentRef.current) canvasComponentRef.current.resize();
			if (Boolean(document.fullscreenElement)) {
				setFullscreenChatOpen(false);
				setQid(QUESTION_LIST);
				setShowTempDrawingBtn(true);
			}
		});

		window.addEventListener('keydown', (e) => {
			if (isTypingRef.current) return;
			if (e.key === 'ArrowLeft') {
				gotoPageRef.current(pageNumRef.current - 1);
			} else if (e.key === 'ArrowRight') {
				gotoPageRef.current(pageNumRef.current + 1);
			} else if (e.key === ' ' && document.fullscreenElement) {
				gotoPageRef.current(pageNumRef.current + 1);
			}
		});
		
		window.addEventListener('beforeunload', (e) => {
			e.preventDefault();
			addSlideStats(pageNumRef.current);
			axios.post(`${serverURL}/api/slideStats?slideID=${sid}`, slideStats);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<AppBar
				title={title}
				anonymity={anonymity}
				uid={uid}
				username={username}
				loginURL={`${serverURL}/p/login/${sid}/${page}`}
				isInstructor={isInstructor}
				isInstructorView={isInstructorView}
				setIsInstructorView={setIsInstructorView}
				showCarouselPanel={showCarouselPanel}
				setShowCarouselPanel={setShowCarouselPanel}
				largerSlide={largerSlide}
				setLargerSlide={setLargerSlide}
				darkTheme={darkTheme}
				setDarkTheme={setDarkTheme}
				isTypingRef={isTypingRef}
			/>
			<div className={`main ${largerSlide ? 'larger-slide' : ''} ${fullscreen ? 'fullscreen' : ''}`}>
				<Slides
					filename={filename}
					sid={sid}
					pageNum={page}
					pageTotal={pageTotal}
					gotoPage={gotoPage}
					gotoInputPage={gotoInputPage}
					drawingOverlay={drawingOverlay}
					drawing={drawing}
					showTempDrawingBtn={showTempDrawingBtn}
					startDrawing={startDrawing}
					cancelDrawing={cancelDrawing}
					canvasComponentRef={canvasComponentRef}
					isInstructor={isInstructor}
					isInstructorView={isInstructorView}
					showCarouselPanel={showCarouselPanel}
					record={record}
					setRecord={setRecord}
					fullscreen={fullscreen}
					fullscreenChatOpen={fullscreenChatOpen}
					openOrHideChat={openOrHideChat}
					isTypingRef={isTypingRef}
					downloadable={downloadable}
				/>
				{!fullscreen || fullscreenChatOpen ? (
					<div className='chat-area'>
						{qid === QUESTION_LIST ? (
							<QuestionList
								sid={sid}
								pageNum={page}
								isInstructor={isInstructor}
								askNewQuestion={gotoNewQuestion}
								goToQuestion={gotoQuestion}
								isInstructorView={isInstructorView}
								connected={connected}
								ref={questionListRef}
							/>
						) : qid === NEW_QUESTION ? (
							<NewQuestion
								sid={sid}
								pageNum={page}
								anonymity={anonymity}
								username={username}
								back={back}
								drawable={drawable}
								drawing={drawing}
								startDrawing={startDrawing}
								cancelDrawing={cancelDrawing}
								canvasComponentRef={canvasComponentRef}
								isTypingRef={isTypingRef}
							/>
						) : qid === MODIFY_CHAT ? (
							<ModifyChat
								sid={sid}
								pageNum={page}
								old={chatToModify}
								back={back}
								isTypingRef={isTypingRef}
							/>
						) : (
							<QuestionDetails
								sid={sid}
								filename={filename}
								pageNum={page}
								qid={qid}
								uid={uid}
								anonymity={anonymity}
								username={username}
								isInstructor={isInstructor}
								drawable={drawable}
								setDrawing={setDrawing}
								setDrawingOverlay={setDrawingOverlay}
								setShowTempDrawingBtn={setShowTempDrawingBtn}
								canvasComponentRef={canvasComponentRef}
								gotoModify={gotoModify}
								back={back}
								isInstructorView={isInstructorView}
								connected={connected}
								ref={questionDetailsRef}
								isTypingRef={isTypingRef}
							/>
						)}
					</div>
				) : null}
			</div>
		</>
	);
}

export default Main;
