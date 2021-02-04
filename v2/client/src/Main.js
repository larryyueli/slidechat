import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Slides from './components/slide/Slides';
import AppBar from './components/AppBar';
import ModifyChat from './components/chat/ModifyChat';
import NewQuestion from './components/chat/NewQuestion';
import QuestionList from './components/chat/QuestionList';
import QuestionDetails from './components/chat/QuestionDetails';
import { baseURL, serverURL } from './config';
import { QUESTION_LIST, NEW_QUESTION, MODIFY_CHAT } from './util';

/**
 * Main page of the application: the slides and chats of a given set of slides, given
 * from the URL.
 */
function Main(props) {
	const sid = props.match.params.slideId;
	const [pageTotal, setPageTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [title, setTitle] = useState('');
	const [filename, setFilename] = useState('');
	const [drawable, setDrawable] = useState(false);
	const [drawingOverlay, setDrawingOverlay] = useState(false);
	const [isInstructor, setIsInstructor] = useState(false);
	const [uid, setUid] = useState('');
	const [username, setUsername] = useState('');
	const [anonymity, setAnonymity] = useState('A');
	const [qid, setQid] = useState(QUESTION_LIST);
	const [drawing, setDrawing] = useState(false);
	const [showTempDrawingBtn, setShowTempDrawingBtn] = useState(true);
	const [showCarouselPanel, setShowCarouselPanel] = useState(true);
	const [chatToModify, setChatToModify] = useState({});
	const canvasComponentRef = useRef(null); // this ref is used to read canvas data from chat area
	const [isInstructorView, setIsInstructorView] = useState(true);
	const [record, setRecord] = useState({ uploaded: false, recording: false, recordingFile: null, recordingSrc: '' });

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
				setPageTotal(res.data.pageTotal);
				setTitle(res.data.title);
				setFilename(res.data.filename);
				setDrawable(Boolean(res.data.drawable));
				document.getElementById('pageNum').value = currentPage;
				setPage(currentPage);
				if (questionId || questionId === 0) setQid(questionId);
			})
			.catch((err) => {
				console.error(err);
			});
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
		applyPage(pageNum);
	};

	const gotoQuestion = (pageNum, qid) => {
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

	const goToModify = (chat, cid) => {
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

	return (
		<>
			<AppBar
				anonymity={anonymity}
				uid={uid}
				username={username}
				loginURL={`${serverURL}/p/login/${sid}/${page}`}
				isInstructor={isInstructor}
				isInstructorView={isInstructorView}
				setIsInstructorView={setIsInstructorView}
				showCarouselPanel={showCarouselPanel}
				setShowCarouselPanel={setShowCarouselPanel}
			/>
			<div className='main'>
				<Slides
					title={title}
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
				/>
				<div className='chat-area'>
					{qid === QUESTION_LIST ? (
						<QuestionList
							sid={sid}
							pageNum={page}
							isInstructor={isInstructor}
							askNewQuestion={gotoNewQuestion}
							goToQuestion={gotoQuestion}
							isInstructorView={isInstructorView}
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
						/>
					) : qid === MODIFY_CHAT ? (
						<ModifyChat sid={sid} pageNum={page} old={chatToModify} back={back} />
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
							goToModify={goToModify}
							back={back}
							isInstructorView={isInstructorView}
						/>
					)}
				</div>
			</div>
		</>
	);
}

export default Main;
