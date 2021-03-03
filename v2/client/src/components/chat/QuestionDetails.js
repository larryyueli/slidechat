import React from 'react';
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

export default class QuestionDetails extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			managing: false,
			messages: { title: 'Loading...', chats: [] },
			showToast: false,
		};
		this.chatRef = React.createRef();
		this.sendNewChat = this.sendNewChat.bind(this);
		this.copyLink = this.copyLink.bind(this);
	}

	componentDidMount() {
		this.fetchQuestionDetails();
		window.MathJax.typeset();
	}

	componentDidUpdate(prevProps) {
		if (
			this.props.sid !== prevProps.sid ||
			this.props.pageNum !== prevProps.pageNum ||
			this.props.qid !== prevProps.qid ||
			(this.props.connected && !prevProps.connected)
		) {
			this.fetchQuestionDetails();
			this.props.setDrawingOverlay(false);
			this.props.setDrawing(false);
			this.props.setShowTempDrawingBtn(false);
		}
		window.MathJax.typeset();
	}

	async fetchQuestionDetails() {
		try {
			const res = await axios.get(
				`${serverURL}/api/chats?slideID=${this.props.sid}&pageNum=${this.props.pageNum}&qid=${this.props.qid}`
			);
			this.setState({ messages: res.data });
			window.history.replaceState(
				null,
				null,
				`${baseURL}/${this.props.sid}/${this.props.pageNum}/${this.props.qid}`
			);
			if (res.data.drawing && this.props.drawable) {
				this.props.setDrawingOverlay(true);
				this.props.canvasComponentRef.current.setState({ readOnly: true });
				this.props.canvasComponentRef.current.lines = res.data.drawing;
				this.props.canvasComponentRef.current.redraw();
			}
		} catch (err) {
			console.error(err);
		}
	}

	sendNewChat() {
		if (!this.chatRef.current.value) return;
		axios
			.post(`${serverURL}/api/addChat/`, {
				sid: this.props.sid,
				pageNum: this.props.pageNum,
				qid: this.props.qid,
				body: this.chatRef.current.value,
				user: getDisplayName(),
			})
			.then((res) => {
				this.chatRef.current.value = '';
			})
			.catch((err) => {
				console.error(err);
			});
	}

	endorseChat(cid) {
		axios
			.post(`${serverURL}/api/endorse/`, {
				sid: this.props.sid,
				pageNum: this.props.pageNum,
				qid: this.props.qid,
				cid: cid,
			})
			.catch((err) => {
				console.error(err);
			});
	}

	likeChat(cid) {
		axios
			.post(`${serverURL}/api/like/`, {
				sid: this.props.sid,
				pageNum: this.props.pageNum,
				qid: this.props.qid,
				cid: cid,
				user: getDisplayName(),
			})
			.catch((err) => {
				console.error(err);
			});
	}

	deleteChat(e, cid) {
		e.stopPropagation();
		if (!window.confirm(`Are you sure to delete this chat?`)) return;

		axios
			.delete(
				`${serverURL}/api/chat?sid=${this.props.sid}&qid=${this.props.qid}&pageNum=${this.props.pageNum}&cid=${cid}`
			)
			.catch((err) => {
				console.error(err);
			});
	}

	async copyLink() {
		if (!navigator.clipboard) return alert('Your browser does not support accessing clipboard!');
		await navigator.clipboard.writeText(
			`[@${this.props.filename}/Page ${this.props.pageNum}/Q${this.props.qid}](${window.location.href})`
		);
		this.setState({ showToast: true });
	}

	onNewReplyEvent(data) {
		if (this.props.pageNum === data.pageNum && this.props.qid === data.qid) {
			delete data.pageNum;
			delete data.qid;
			this.setState((state) => ({
				messages: { ...state.messages, chats: [...state.messages.chats, data] },
			}));
		}
	}

	onLikeEvent(data) {
		this.setState((state, props) => {
			if (props.pageNum === data.pageNum && props.qid === data.qid) {
				const likes = state.messages.chats[data.cid].likes;
				if (data.likeCountChange > 0) {
					likes.push(data.user);
				} else {
					likes.splice(
						likes.findIndex((name) => name === data.user),
						1
					);
				}
				return { messages: state.messages };
			}
		});
	}

	onModifyEvent(data) {
		if (this.props.pageNum === data.pageNum && this.props.qid === data.qid) {
			const chats = this.state.messages.chats;
			chats[data.cid].body = data.body;
			chats[data.cid].modified = true;
			chats[data.cid].time = data.time;
			this.setState((state) => ({
				messages: { ...state.messages, chats: [...chats] },
			}));
		}
	}

	onDeleteEvent(data) {
		if (this.props.pageNum === data.pageNum && this.props.qid === data.qid) {
			const chats = this.state.messages.chats;
			chats[data.cid] = null;
			this.setState((state) => ({
				messages: { ...state.messages, chats: [...chats] },
			}));
		}
	}

	onEndorseEvent(data) {
		this.setState((state, props) => {
			if (props.pageNum === data.pageNum && props.qid === data.qid) {
				const endorsement = state.messages.chats[data.cid].endorsement;
				if (data.endorseCountChange > 0) {
					endorsement.push(data.user);
				} else {
					endorsement.splice(
						endorsement.findIndex((name) => name === data.user),
						1
					);
				}
				return { messages: state.messages };
			}
		});
	}

	render() {
		const { managing, messages, showToast } = this.state;
		return (
			<>
				<ChatAreaTitle
					title={messages.title}
					showManage={this.props.isInstructor && this.props.isInstructorView}
					managing={managing}
					toggleManaging={() => this.setState({ managing: !this.state.managing })}
					showBackBtn={true}
					back={this.props.back}
				/>
				<div className='chat-area-main chat-details'>
					<div className='title' key={-2}>
						{messages.title}
					</div>
					<Snackbar
						className='toast'
						anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
						open={showToast}
						onClose={() => this.setState({ showToast: false })}
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
											this.props.isInstructor && message.uid && this.props.isInstructorView
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
												title='Quote this question'
												onClick={this.copyLink}>
												link
											</span>
										) : null}
										{message.endorsement.length ? (
											<span
												className='material-icons endorsed icon'
												onClick={(e) => this.endorseChat(i)}>
												verified
											</span>
										) : this.props.isInstructor && this.props.isInstructorView ? (
											<span
												className='material-icons not-endorsed icon'
												onClick={(e) => this.endorseChat(i)}>
												verified
											</span>
										) : null}
										<span className={`icon ${message.likes.length ? 'liked' : 'nobody-liked'}`}>
											<span>{message.likes.length ? message.likes.length : ''}</span>
											<span className='material-icons' onClick={(e) => this.likeChat(i)}>
												favorite
											</span>
										</span>
										{managing && i > 0 ? (
											<span
												className='material-icons delete icon'
												onClick={(e) => this.deleteChat(e, i)}>
												delete_forever
											</span>
										) : null}
									</div>
								</div>
								<div
									className='body'
									dangerouslySetInnerHTML={{ __html: md.render(message.body) }}></div>
								<div className='info-bottom'>
									{message.uid === this.props.uid ? (
										<div className='modify-btn' onClick={() => this.props.gotoModify(message, i)}>
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
						<TextField
							variant='outlined'
							id={`chat-response`}
							multiline
							rowsMax='10'
							inputRef={this.chatRef}
							onBlur={() => {
								this.props.isTypingRef.current = false;
							}}
							onFocus={() => {
								this.props.isTypingRef.current = true;
							}}
						/>
						<Button
							variant='contained'
							color='primary'
							onClick={this.sendNewChat}
							disabled={!this.props.connected}>
							Send
						</Button>
					</div>
					<div className='anonymity'>
						{this.props.connected
							? anonymityMessage(this.props.anonymity, this.props.username)
							: 'You are disconnected from the chat server.'}
					</div>
				</div>
			</>
		);
	}
}
