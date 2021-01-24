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
	const [chatToModify, setChatToModify] = useState({});
	const canvasComponentRef = useRef(null); // this ref is used to read canvas data from chat area
	const [isInstructorView, setIsInstructorView] = useState(true);

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
	 * Go to the next page of slide, should fetch the url and the chat threads list of the new page
	 */
	const nextPage = () => {
		if (page >= pageTotal) return;
		let newPageNum = page + 1;
		setQid(QUESTION_LIST);
		applyPage(newPageNum);
		setDrawingOverlay(false);
	};

	/**
	 * Go to the previous page of slide, should fetch the url and the chat threads list of the new page
	 */
	const prevPage = () => {
		if (page < 2) return;
		let newPageNum = page - 1;
		setQid(QUESTION_LIST);
		applyPage(newPageNum);
		setDrawingOverlay(false);
	};

	/**
	 * go to the page the page the user entered iff it is a valid page
	 */
	const gotoPage = () => {
		let newPageNum = +document.getElementById('pageNum').value;
		if (!Number.isInteger(newPageNum)) {
			document.getElementById('pageNum').value = page;
			return;
		}
		if (newPageNum > pageTotal) {
			newPageNum = pageTotal;
		} else if (newPageNum < 1) {
			newPageNum = 1;
		}
		setDrawingOverlay(false);
		setQid(QUESTION_LIST);
		applyPage(newPageNum);
	};

	const gotoQuestion = (pageNum, qid) => {
		applyPage(pageNum);
		setQid(qid);
	};

	const gotoNewQuestion = () => {
		setQid(NEW_QUESTION);
		setDrawingOverlay(false);
		setDrawing(false);
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
		}
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
			/>
			<div className='main'>
				<Slides
					title={title}
					filename={filename}
					sid={sid}
					pageNum={page}
					pageTotal={pageTotal}
					nextPage={nextPage}
					prevPage={prevPage}
					gotoPage={gotoPage}
					drawingOverlay={drawingOverlay}
					canvasComponentRef={canvasComponentRef}
					isInstructor={isInstructor}
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
							setDrawingOverlay={setDrawingOverlay}
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
