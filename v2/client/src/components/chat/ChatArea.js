import React, { useState, useEffect } from 'react';

import ModifyChat from './ModifyChat';
import NewQuestion from './NewQuestion';
import QuestionList from './QuestionList';
import QuestionDetails from './QuestionDetails';

/**
 * This is the chat area on the right side of the page.
 */
export default function ChatArea(props) {
	const [state, setState] = useState('list');
	const [chatToModify, setChatToModify] = useState({});
	const [qid, setQid] = useState(-1);
	const [drawing, setDrawing] = useState(false);

	// when first mounting, if the URL contains questions number, go to the question
	useEffect(() => {
		if (props.qid !== undefined) {
			goToQuestionDetails(props.qid);
		}
		// eslint-disable-next-line
	}, [props.qid]);

	const askNewQuestion = () => {
		setState('new-question');
		props.setSlideDrawing(false);
		setDrawing(false);
	};

	const goToQuestionDetails = (qid) => {
		setQid(qid);
		setState('details');
	};

	const goToModify = (chat, id) => {
		setChatToModify({ ...chat, id });
		setState('modify');
	};

	/**
	 * onClick handler for back button to go back to the chat list
	 */
	const back = () => {
		if (state !== 'modify') {
			setState('list');
			props.setSlideDrawing(false);
			window.history.replaceState(null, null, `#${props.pageNum}`);
		} else {
			goToQuestionDetails(qid);
		}
	};

	const startDrawing = (e) => {
		setDrawing(true);
		props.setSlideDrawing(true);
	};

	const cancelDrawing = (e) => {
		setDrawing(false);
		props.canvasComponentRef.current.clear();
		props.setSlideDrawing(false);
	};

	return (
		<div className='chat-area'>
			{state === 'list' ? (
				<QuestionList
					sid={props.sid}
					pageNum={props.pageNum}
					isInstructor={props.isInstructor}
					askNewQuestion={askNewQuestion}
					goToQuestionDetails={goToQuestionDetails}
				/>
			) : state === 'details' ? (
				<QuestionDetails
					sid={props.sid}
					pageNum={props.pageNum}
					qid={qid}
					uid={props.uid}
					isInstructor={props.isInstructor}
					drawable={props.drawable}
					setSlideDrawing={props.setSlideDrawing}
					canvasComponentRef={props.canvasComponentRef}
					goToModify={goToModify}
					back={back}
				/>
			) : state === 'new-question' ? (
				<NewQuestion
					sid={props.sid}
					pageNum={props.pageNum}
					back={back}
					drawable={props.drawable}
					drawing={drawing}
					startDrawing={startDrawing}
					cancelDrawing={cancelDrawing}
					canvasComponentRef={props.canvasComponentRef}
				/>
			) : state === 'modify' ? (
				<ModifyChat
					sid={props.sid}
					pageNum={props.pageNum}
					qid={qid}
					old={chatToModify}
					back={(e) => goToQuestionDetails(qid)}
				/>
			) : (
				'something went wrong'
			)}
		</div>
	);
}
