import React from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';

import './App.scss';
import { baseURL } from './config';


let dummyDetails = [
	{
		author: 'name1',
		content: 'question question question question question question question question question ',
		time: '2000/01/01 00:00 AM',
		likes: ['Ling'],
		endorsements: [],
	},
	{
		author: 'name11111111111111111111111111111111111111111111111111',
		content: 'a answer',
		time: '2000/01/01 00:00 AM',
		likes: [],
		endorsements: [],
	}
];


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
			chatID: -1,			// the expanded chat's ID
		};

		this.createNewChat = this.createNewChat.bind(this);
		this.sendNewQuestion = this.sendNewQuestion.bind(this);
		this.sendNewChat = this.sendNewChat.bind(this);
	}

	// TO-DO
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
				qid: this.state.questionID,
				body: this.chatRef.value,
				user: "yaochen8"
			}
		).then(response => {
			this.chatRef.value = "";
			this.fetchChatDetails(this.state.questionID);
		}).catch(function (error) {
			console.error(error);
		});
	}

	// TO-DO
	// probably need a loading state here
	fetchChatDetails(questionID) {
		axios.get(`${baseURL}/api/chats?slideID=${this.props.slideID}&pageNum=${this.props.pageNum}&qid=${questionID}`).then(data => {
			this.setState({
				state: "chat-details",
				questionID: questionID,
				chatDetails: data.data
			});
		}).catch(err => {
			console.error(err);
		});
	}

	// onClick handler for back button to go back to the chat list
	backToList() {
		this.setState({ state: "list" });
	}

	render() {
		let content, title, backButton;
		switch (this.state.state) {
			// list of all chat threads
			case "list":
				title = "Chat";

				let chats = [
					<div className="new-chat-btn-row" key={-1}>
						<Button variant="contained" color="primary" onClick={this.createNewChat}>
							Create a new chat
						</Button>
					</div>
				];

				for (let i = 0; i < this.props.chats.length; i++) {
					chats.push(
						<div className="chat" key={i} onClick={e => this.fetchChatDetails(i)}>
							<div className="title">{this.props.chats[i].title}</div>
							<div className="info">
								<div className="author">{this.props.chats[i].user}</div>
								<div className="time">{this.props.chats[i].time}</div>
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
				title = "Create a new chat";
				content = (
					<div className="new-chat-form" key={-1}>
						<div><TextField
							variant='outlined'
							id={`new-title`}
							placeholder="Title"
							inputRef={ref => { this.titleRef = ref; }} /></div>
						<div><TextField
							variant='outlined'
							id={`new-body`}
							multiline
							rows="6"
							placeholder="Body"
							inputRef={ref => { this.bodyRef = ref; }} /></div>
						<div><Button variant="contained" color="primary" onClick={this.sendNewQuestion}>Send</Button></div>
					</div>
				);
				break;

			// the content of the chat thread
			case "chat-details":
				title = this.props.chats[this.state.questionID].title;
				let chatDetails = [
					<div className="title" key={-2}>{title}</div>
				];
				for (let i = 0; i < this.state.chatDetails.length; i++) {
					let message = this.state.chatDetails[i];
					let likes = message.likes && message.likes.length > 0
						? <div className="like">{`${message.likes.length} likes`}</div>
						: null;
					chatDetails.push(
						<div className="chat" key={i}>
							<span className="author">{message.user}</span>
							<span className="time">{message.time}</span>
							<div className="body">{message.body}</div>
							{likes}
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

		// if not on the home (list) page, show the back button
		if (this.state.state !== "list") {
			backButton = (
				<div className="back-button" onClick={e => this.backToList()}>
					&lt;
				</div>
			);
		} else backButton = <div>&nbsp;</div>;


		return (
			<div className='chat-area'>
				<div className="chat-area-title">
					{backButton}
					<div className="title">{title}</div>
					<div>&nbsp;</div>
				</div>
				{content}
			</div>
		);
	}
}

export default ChatArea;
