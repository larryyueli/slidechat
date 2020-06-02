import React from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';
import markdownIt from 'markdown-it';
import markdownItMathJax from 'markdown-it-mathjax';
import highlight from 'highlight.js';

import { baseURL } from './config';
import { formatTime, formatNames } from './util';
import './ChatArea.scss';


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
class ChatArea extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			state: "list", 		// possible values: list, new-chat, chat-details
			loading: false,		// to-do: add loading state whenever loading
			chatDetails: [],	// content of the chat
			qid: -1,			// the expanded question's ID
			managing: false,
			uid: "yaochen8"
		};

		this.createNewChat = this.createNewChat.bind(this);
		this.sendNewQuestion = this.sendNewQuestion.bind(this);
		this.sendNewChat = this.sendNewChat.bind(this);
		this.likeChat = this.likeChat.bind(this);
		this.changeManageStatus = this.changeManageStatus.bind(this);
	}

	changeManageStatus() {
		this.setState(pre => {
			return {
				addInstructorRes: null,
				managing: !pre.managing
			}
		});
	}

	componentDidUpdate() {
		window.MathJax.typeset();
	}

	createNewChat() {
		this.setState({ state: "new-chat" });
	}

	sendNewQuestion() {
		axios.post(`${baseURL}/api/addQuestion/`,
			{
				sid: this.props.slideID,
				pageNum: this.props.pageNum,
				title: this.titleRef.value,
				body: this.bodyRef.value,
				user: "yaochen8"
			}
		).then(response => {
			this.props.fetchChatList(this.props.slideID, this.props.pageNum);
		}).catch(function (error) {
			console.error(error);
		});
	}

	// TO-DO
	sendNewChat() {
		axios.post(`${baseURL}/api/addChat/`,
			{
				sid: this.props.slideID,
				pageNum: this.props.pageNum,
				qid: this.state.qid,
				body: this.chatRef.value,
				user: "yaochen8"
			}
		).then(response => {
			this.chatRef.value = "";
			this.fetchChatDetails(this.state.qid);
		}).catch(function (error) {
			console.error(error);
		});
	}

	// TO-DO
	// probably need a loading state here
	fetchChatDetails(qid) {
		axios.get(`${baseURL}/api/chats?slideID=${this.props.slideID}&pageNum=${this.props.pageNum}&qid=${qid}`).then(data => {
			this.setState({
				state: "chat-details",
				qid: qid,
				chatDetails: data.data
			});
		}).catch(err => {
			console.error(err);
		});
	}

	// like, if the user is an instructor, endorse
	likeChat(cid) {
		axios.post(`${baseURL}/api/like/`, {
			sid: this.props.slideID,
			pageNum: this.props.pageNum,
			qid: this.state.qid,
			cid: cid,
			user: "yaochen8",
		}).then(res => {
			this.fetchChatDetails(this.state.qid);
		}).catch(err => {
			console.error(err);
		});
	}

	// onClick handler for back button to go back to the chat list
	backToList() {
		this.props.fetchChatList(this.props.slideID, this.props.pageNum);
		this.setState({ state: "list" });
	}

	deleteQuestion(e, qid) {
		let title = this.props.chats[qid].title;
		let sid = this.props.slideID;
		let pageNum = this.props.pageNum;
		if (!window.confirm(`Are you sure to delete "${title}"?`)) return e.stopPropagation();

		axios.delete(`${baseURL}/api/question?sid=${sid}&qid=${qid}&pageNum=${pageNum}`, {
			data: { user: this.state.uid }
		}).then(res => {
			this.props.fetchChatList(this.props.slideID, this.props.pageNum);
		}).catch(err => {
			console.error(err);
		});
	}

	deleteChat(e, cid) {
		let qid = this.state.qid;
		let sid = this.props.slideID;
		let pageNum = this.props.pageNum;
		if (!window.confirm(`Are you sure to delete this chat?`)) return e.stopPropagation();

		axios.delete(`${baseURL}/api/chat?sid=${sid}&qid=${qid}&pageNum=${pageNum}&cid=${cid}`, {
			data: { user: this.state.uid }
		}).then(res => {
			this.fetchChatDetails(this.state.qid);
		}).catch(err => {
			console.error(err);
		});
	}

	render() {
		let content, title;
		switch (this.state.state) {
			// list of all chat threads
			case "list":
				title = "Discussion";

				let chats = [
					<div className="new-chat-btn-row" key={-1}>
						<Button variant="contained" color="primary" onClick={this.createNewChat}>
							Ask a new question
						</Button>
					</div>
				];

				for (let i = 0; i < this.props.chats.length; i++) {
					if (!this.props.chats[i]) {
						continue;
					}
					chats.push(
						<div className="chat" key={i} onClick={e => this.fetchChatDetails(i)}>
							<div className="title-row">
								<div className="title">{this.props.chats[i].title}</div>
								{this.state.managing
									? <span className="material-icons icon" onClick={e => this.deleteQuestion(e, i)}>
										delete_forever
									</span>
									: null}
							</div>
							<div className="info">
								<div className="author">{this.props.chats[i].user}</div>
								<div className="time">{formatTime(this.props.chats[i].time)}</div>
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
							inputRef={ref => { this.titleRef = ref; }} /></div>
						<div><TextField
							variant='outlined'
							id={`new-body`}
							multiline
							rows="6"
							placeholder="Describe your question in more details"
							inputRef={ref => { this.bodyRef = ref; }} /></div>
						<div><Button variant="contained" color="primary" onClick={this.sendNewQuestion}>Send</Button></div>
					</div>
				);
				break;

			// the content of the chat thread
			case "chat-details":
				title = this.props.chats[this.state.qid].title;
				let chatDetails = [
					<div className="title" key={-2}>{title}</div>
				];
				for (let i = 0; i < this.state.chatDetails.length; i++) {
					let message = this.state.chatDetails[i];
					if (!message) {
						continue;
					}

					let endorsements = message.endorsement && message.endorsement.length > 0
						? <div className="endorsement">{`endorsed by ${formatNames(message.endorsement)}`}</div>
						: null;

					chatDetails.push(
						<div className="chat" key={i}>
							<div className="info">
								<div>
									<span className="author">{message.user}</span>
									<span className="time">{formatTime(message.time)}</span>
								</div>
								<div className="icons">
									{message.endorsement.length
										? <span class="material-icons endorsement icon">
											verified
										</span>
										: null}
									<span className={`icon ${message.likes.length ? 'liked' : 'nobody-liked'}`}>
										<span>{message.likes.length ? message.likes.length : ''}</span>
										<span className="material-icons" onClick={e => this.likeChat(i)}>favorite</span>
									</span>
									{this.state.managing
										? <span className="material-icons delete icon" onClick={e => this.deleteChat(e, i)}>
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
				chatDetails.push(
					<div className='send-message-bar' key={-1}>
						<TextField
							variant='outlined'
							id={`chat-response`}
							multiline
							rowsMax="4"
							inputRef={ref => { this.chatRef = ref; }} />
						<Button variant="contained" color="primary" onClick={this.sendNewChat}>Send</Button>
					</div>
				);
				content = (
					<div className="chat-details">{chatDetails}</div>
				);
				break;

			default:
				content = <div>something went wrong</div>
		}


		return (
			<div className='chat-area'>
				<div className="chat-area-title">
					{this.state.state !== "list"
						? <div className="back-button" onClick={e => this.backToList()}>
							<span className="material-icons">arrow_back_ios</span>
						</div>
						: <div className="placeholder">&nbsp;</div>}
					<div className="title">{title}</div>
					<span className={`manage ${this.state.managing ? "managing" : ""}`}
						onClick={this.changeManageStatus}>
						<span className='material-icons icon'>settings</span>
					</span>
				</div>
				{content}
			</div>
		);
	}
}

export default ChatArea;
