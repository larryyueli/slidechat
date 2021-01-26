import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, Snackbar, TextField } from '@material-ui/core';

import markdownIt from 'markdown-it';
import markdownItMathJax from 'markdown-it-mathjax';
import highlight from 'highlight.js';

import ChatAreaTitle from './ChatAreaTitle';
import { baseURL, serverURL } from '../../config';
import { formatTime, formatNames, getDisplayName, anonymityMessage } from '../../util';

const md = markdownIt({
	breaks: true,
	highlight: function (str, lang) {
		if (lang && highlight.getLanguage(lang)) {
			try {
				return highlight.highlight(lang, str).value;
			} catch (err) {
				console.error(err);
			}
		}
		return '';
	},
});
md.use(markdownItMathJax());

export default function QuestionDetails(props) {
	const [managing, setManaging] = useState(false);
	const [messages, setMessages] = useState({ title: 'Loading...', chats: [] });
	const [showToast, setShowToast] = useState(false);
	const chatRef = useRef(null);

	useEffect(() => {
		fetchQuestionDetails();
		props.setDrawingOverlay(false);
		props.setDrawing(false);
		props.setShowTempDrawingBtn(false);
		// eslint-disable-next-line
	}, [props.sid, props.pageNum, props.qid]);

	// render math in chat details
	useEffect(() => {
		window.MathJax.typeset();
	});

	const fetchQuestionDetails = async () => {
		try {
			const res = await axios.get(
				`${serverURL}/api/chats?slideID=${props.sid}&pageNum=${props.pageNum}&qid=${props.qid}`
			);
			setMessages(res.data);
			window.history.replaceState(null, null, `${baseURL}/${props.sid}/${props.pageNum}/${props.qid}`);
			if (res.data.drawing && props.drawable) {
				props.setDrawingOverlay(true);
				props.canvasComponentRef.current.setState({ readOnly: true });
				props.canvasComponentRef.current.lines = res.data.drawing;
				props.canvasComponentRef.current.redraw();
			}
		} catch (err) {
			console.error(err);
		}
	};

	const toggleManaging = () => {
		setManaging(!managing);
	};

	const sendNewChat = () => {
		if (!chatRef.current.value) return;
		axios
			.post(`${serverURL}/api/addChat/`, {
				sid: props.sid,
				pageNum: props.pageNum,
				qid: props.qid,
				body: chatRef.current.value,
				user: getDisplayName(),
			})
			.then((res) => {
				chatRef.current.value = '';
			})
			.then(fetchQuestionDetails)
			.catch((err) => {
				console.error(err);
			});
	};

	const endorseChat = (cid) => {
		axios
			.post(`${serverURL}/api/endorse/`, {
				sid: props.sid,
				pageNum: props.pageNum,
				qid: props.qid,
				cid: cid,
			})
			.then(fetchQuestionDetails)
			.catch((err) => {
				console.error(err);
			});
	};

	// like
	const likeChat = (cid) => {
		axios
			.post(`${serverURL}/api/like/`, {
				sid: props.sid,
				pageNum: props.pageNum,
				qid: props.qid,
				cid: cid,
				user: getDisplayName(),
			})
			.then(fetchQuestionDetails)
			.catch((err) => {
				console.error(err);
			});
	};

	const deleteChat = (e, cid) => {
		e.stopPropagation();
		if (!window.confirm(`Are you sure to delete this chat?`)) return;

		axios
			.delete(`${serverURL}/api/chat?sid=${props.sid}&qid=${props.qid}&pageNum=${props.pageNum}&cid=${cid}`)
			.then(fetchQuestionDetails)
			.catch((err) => {
				console.error(err);
			});
	};

	const showOrHideToast = () => {
		setShowToast(!showToast);
	};

	const copyLink = async () => {
		navigator.clipboard.writeText(
			`[@${props.filename}/Page ${props.pageNum}/Q${props.qid}](${window.location.href})`
		);
		showOrHideToast();
	};

	return (
		<>
			<ChatAreaTitle
				title={messages.title}
				showManage={props.isInstructor}
				managing={managing}
				toggleManaging={toggleManaging}
				showBackBtn={true}
				back={props.back}
			/>
			<div className='chat-details'>
				<div className='title' key={-2}>
					{messages.title}
				</div>
				<Snackbar
					className='toast'
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					open={showToast}
					onClose={showOrHideToast}
					autoHideDuration={2500}
					message='Link copied to clipboard!'
				/>
				{messages.chats.map((message, i) => {
					if (!message) return null;
					return (
						<div className='chat' key={i}>
							<div className='info'>
								<div>
									<span className='author'>{`${message.user}${
										props.isInstructor && message.uid && props.isInstructorView
											? ` (${message.uid})`
											: ''
									}`}</span>
									<span className='time'>
										{(message.modified ? 'Modified ' : '') + formatTime(message.time)}
									</span>
								</div>
								<div className='icons'>
									{i === 0 ? (
										<span
											className='material-icons icon quote'
											title='quote this question'
											onClick={copyLink}>
											link
										</span>
									) : null}
									{message.endorsement.length ? (
										<span className='material-icons endorsed icon' onClick={(e) => endorseChat(i)}>
											verified
										</span>
									) : props.isInstructor ? (
										<span
											className='material-icons not-endorsed icon'
											onClick={(e) => endorseChat(i)}>
											verified
										</span>
									) : null}
									<span className={`icon ${message.likes.length ? 'liked' : 'nobody-liked'}`}>
										<span>{message.likes.length ? message.likes.length : ''}</span>
										<span className='material-icons' onClick={(e) => likeChat(i)}>
											favorite
										</span>
									</span>
									{managing && i > 0 ? (
										<span className='material-icons delete icon' onClick={(e) => deleteChat(e, i)}>
											delete_forever
										</span>
									) : null}
								</div>
							</div>
							<div className='body' dangerouslySetInnerHTML={{ __html: md.render(message.body) }}></div>
							<div className='info-bottom'>
								{message.uid === props.uid ? (
									<div className='modify-btn' onClick={(e) => props.goToModify(message, i)}>
										Modify
									</div>
								) : null}
								{message.endorsement && message.endorsement.length > 0 ? (
									<div className='endorsement'>{`Verified by ${formatNames(
										message.endorsement
									)}`}</div>
								) : null}
							</div>
						</div>
					);
				})}
				<div className='send-message-bar' key={-1}>
					<TextField variant='outlined' id={`chat-response`} multiline rowsMax='4' inputRef={chatRef} />
					<Button variant='contained' color='primary' onClick={sendNewChat}>
						Send
					</Button>
				</div>
				<div className='anonymity'>{anonymityMessage(props.anonymity, props.username)}</div>
			</div>
		</>
	);
}
