import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, TextField, CircularProgress } from '@material-ui/core';
import markdownIt from 'markdown-it';
import markdownItMathJax from 'markdown-it-mathjax';
import highlight from 'highlight.js';

import { serverURL, baseURL } from './config';
import { formatTime, formatNames, getUserName, isInstructor, getCookie } from './util';


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
	}
});
md.use(markdownItMathJax());


/**
 * This is the chat area on the right of the page.
 */
export default function ChatArea(props) {
	const [state, setState] = useState("list");
	const [questions, setQuestions] = useState([]);
	const [chatDetails, setChatDetails] = useState([]);
	const [qid, setQid] = useState(-1);
	const [managing, setManaging] = useState(false);
	const userName = getUserName();
	const titleRef = useRef(null);
	const bodyRef = useRef(null);
	const chatRef = useRef(null);
	const [uploading, setUploading] = useState(false);
	const fileUpload = useRef(null);

	// fetch questions when page is changed
	useEffect(() => {
		if (props.protectLevel === "unknown") return;
		if (props.protectLevel && !getCookie("isLogin")) {
			window.location.href = `${baseURL}/p/login/${props.sid}/${window.location.hash.substring(1)}`;
		}
		axios.get(`${serverURL}${props.protectLevel}/api/questions?slideID=${props.sid}&pageNum=${props.pageNum}`)
			.then(res => {
				setState("list");
				setQuestions(res.data);
			}).catch(err => {
				console.error(err);
			});
	}, [props.sid, props.pageNum, props.protectLevel]);

	// render math in chat details
	useEffect(() => {
		if (state === "chat-details") window.MathJax.typeset();
	});

	const changeManageStatus = () => {
		setManaging(!managing);
	}

	const createNewChat = () => {
		setState("new-chat")
	}

	const sendNewQuestion = () => {
		axios.post(`${serverURL}${props.protectLevel}/api/addQuestion/`, {
			sid: props.sid,
			pageNum: props.pageNum,
			title: titleRef.current.value,
			body: bodyRef.current.value,
			user: userName
		}).then(res => {
			backToList();
		}).catch(err => {
			console.error(err);
		});
	}

	const sendNewChat = () => {
		axios.post(`${serverURL}${props.protectLevel}/api/addChat/`, {
			sid: props.sid,
			pageNum: props.pageNum,
			qid: qid,
			body: chatRef.current.value,
			user: userName
		}).then(res => {
			chatRef.current.value = "";
			fetchChatDetails(qid);
		}).catch(err => {
			console.error(err);
		});
	}

	const fetchChatList = async () => {
		axios.get(`${serverURL}${props.protectLevel}/api/questions?slideID=${props.sid}&pageNum=${props.pageNum}`).then(res => {
			setQuestions(res.data);
		}).catch(err => {
			console.error(err);
		});
	}

	const fetchChatDetails = (qid) => {
		axios.get(`${serverURL}${props.protectLevel}/api/chats?slideID=${props.sid}&pageNum=${props.pageNum}&qid=${qid}`).then(res => {
			setQid(qid);
			setChatDetails(res.data);
			setState("chat-details");
		}).catch(err => {
			console.error(err);
		});
	}

	// like, if the user is an instructor, endorse
	const likeChat = (cid) => {
		axios.post(`${serverURL}${props.protectLevel}/api/like/`, {
			sid: props.sid,
			pageNum: props.pageNum,
			qid: qid,
			cid: cid,
			user: userName,
		}).then(res => {
			fetchChatDetails(qid);
		}).catch(err => {
			console.error(err);
		});
	}

	// onClick handler for back button to go back to the chat list
	const backToList = () => {
		fetchChatList().then(() => setState("list")).catch(err => console.error(err));
	}

	const deleteQuestion = (e, qid) => {
		if (!window.confirm(`Are you sure to delete "${questions[qid].title}"?`)) return e.stopPropagation();

		axios.delete(`${serverURL}/p/api/question?sid=${props.sid}&qid=${qid}&pageNum=${props.pageNum}`, {
			data: { user: userName }
		}).then(res => {
			backToList();
		}).catch(err => {
			console.error(err);
		});
	}

	const deleteChat = (e, cid) => {
		if (!window.confirm(`Are you sure to delete this chat?`)) return e.stopPropagation();

		axios.delete(`${serverURL}/p/api/chat?sid=${props.sid}&qid=${qid}&pageNum=${props.pageNum}&cid=${cid}`, {
			data: { user: userName }
		}).then(res => {
			fetchChatDetails(qid);
		}).catch(err => {
			console.error(err);
		});
	}

	const uploadAudio = async () => {
		if (fileUpload.current.files.length !== 1) return;

		let formData = new FormData();
		formData.append("sid", props.sid);
		formData.append("pageNum", props.pageNum);
		formData.append("file", fileUpload.current.files[0]);
		try {
			setUploading(true);
			await axios.post(`${serverURL}/p/api/audio/`, formData);
		} catch (err) {
			console.log(err);
		} finally {
			setUploading(false);
			let audio = document.getElementById("slideAudio");
			audio.src = `${serverURL}${props.protectLevel}/api/slideAudio?slideID=${props.sid}&pageNum=${props.pageNum}`;
			audio.controls = true;
		}
	}

	let content, title;
	switch (state) {
		case "list":	// list of all chat threads
			title = "Discussion";

			let chats = [
				isInstructor() && managing
					? <div className="audio-btn-row" key={-2}>
						<input type="file" name="file" ref={fileUpload} />
						<Button
							onClick={uploadAudio}
							disabled={uploading}
							variant="contained"
							color="primary">Upload Audio</Button>
						{uploading ? <CircularProgress /> : null}
					</div>
					: <div></div>
				,
				<div className="new-chat-btn-row" key={-1}>
					<Button variant="contained" color="primary" onClick={createNewChat}>
						Ask a new question
					</Button>
				</div>
			];

			for (let i = 0; i < questions.length; i++) {
				if (!questions[i]) {
					continue;
				}
				chats.push(
					<div className="chat" key={i} onClick={e => fetchChatDetails(i)}>
						<div className="title-row">
							<div className="title">{questions[i].title}</div>
							{managing
								? <span className="material-icons icon" onClick={e => deleteQuestion(e, i)}>
									delete_forever
								</span>
								: null}
						</div>
						<div className="info">
							<div className="author">{questions[i].user}</div>
							<div className="time">{formatTime(questions[i].time)}</div>
						</div>
					</div>
				);
			}
			content = (
				<div className="chat-list">
					{chats}
				</div>
			);
			break;

		// view for creating a new chat thread
		case "new-chat":
			title = "Ask a new question";
			content = (
				<div className="new-chat-form" key={-1}>
					<div><TextField
						variant='outlined'
						id={`new-title`}
						placeholder="Title: briefly summarize your question"
						inputRef={titleRef} /></div>
					<div><TextField
						variant='outlined'
						id={`new-body`}
						multiline
						rows="6"
						placeholder="Describe your question in more details"
						inputRef={bodyRef} /></div>
					<div><Button variant="contained" color="primary" onClick={sendNewQuestion}>Send</Button></div>
				</div>
			);
			break;

		// the content of the chat thread
		case "chat-details":
			title = questions[qid].title;
			let chatsList = [
				<div className="title" key={-2}>{title}</div>
			];
			for (let i = 0; i < chatDetails.length; i++) {
				let message = chatDetails[i];
				if (!message) {
					continue;
				}

				let endorsements = message.endorsement && message.endorsement.length > 0
					? <div className="endorsement">{`endorsed by ${formatNames(message.endorsement)}`}</div>
					: null;

				chatsList.push(
					<div className="chat" key={i}>
						<div className="info">
							<div>
								<span className="author">{message.user}</span>
								<span className="time">{formatTime(message.time)}</span>
							</div>
							<div className="icons">
								{message.endorsement.length
									? <span className="material-icons endorsement icon">
										verified
										</span>
									: null}
								<span className={`icon ${message.likes.length ? 'liked' : 'nobody-liked'}`}>
									<span>{message.likes.length ? message.likes.length : ''}</span>
									<span className="material-icons" onClick={e => likeChat(i)}>favorite</span>
								</span>
								{managing
									? <span className="material-icons delete icon" onClick={e => deleteChat(e, i)}>
										delete_forever
										</span>
									: null}
							</div>

						</div>
						<div className="body" dangerouslySetInnerHTML={{ __html: md.render(message.body) }}></div>
						<div className="info-bottom">
							{endorsements}
						</div>
					</div>
				);
			}
			chatsList.push(
				<div className='send-message-bar' key={-1}>
					<TextField
						variant='outlined'
						id={`chat-response`}
						multiline
						rowsMax="4"
						inputRef={chatRef} />
					<Button variant="contained" color="primary" onClick={sendNewChat}>Send</Button>
				</div>
			);
			content = (
				<div className="chat-details">{chatsList}</div>
			);
			break;

		default:
			content = <div>something went wrong</div>
	}


	return (
		<div className='chat-area'>
			<div className="chat-area-title">
				{state !== "list"
					? <div className="back-button" onClick={e => backToList()}>
						<span className="material-icons">arrow_back_ios</span>
					</div>
					: <div className="placeholder">&nbsp;</div>}
				<div className="title">{title}</div>
				{isInstructor()
					? <span className={`manage ${managing ? "managing" : ""}`}
						onClick={changeManageStatus}>
						<span className='material-icons icon'>settings</span>
					</span>
					: <div className="placeholder">&nbsp;</div>}
			</div>
			{content}
		</div>
	);
}
