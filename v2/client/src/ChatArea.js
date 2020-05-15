import React from 'react';
// import axios from 'axios';
import { Button, TextField, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails } from '@material-ui/core';

import './App.scss';

class ChatArea extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			newChat: false,
		};

		this.createNewChat = this.createNewChat.bind(this);
		this.sendNewChat = this.sendNewChat.bind(this);
		this.cancelNewChat = this.cancelNewChat.bind(this);
	}

	createNewChat() {
		this.setState({ newChat: true });
	}

	sendNewChat() {
		this.setState({ newChat: false });
	}

	cancelNewChat() {
		this.setState({ newChat: false });
	}

	render() {
		let chats = [];

		// If creating a new chat
		if (this.state.newChat) {
			chats.push(<div className="new-chat-form" key={-1}>
				<p className="title">New chat</p>
				<p><TextField
					variant='outlined'
					id={`new-title`}
					placeholder="Title" /></p>
				<p><TextField
					variant='outlined'
					id={`new-body`}
					multiline
					rowsMax="4"
					placeholder="Body" /></p>
				<p><Button variant="contained" color="primary" onClick={this.sendNewChat}>Send</Button>
					<Button variant="contained" onClick={this.cancelNewChat}>Cancel</Button></p>
			</div>);
		} else {
			chats.push(<div className="new-chat" key={-1}>
				<Button variant="contained" color="primary" onClick={this.createNewChat}>Create a new chat</Button>
			</div>);
		}

		for (let j = 0; j < this.props.questions.length; j++) {
			let post = this.props.questions[j];
			let comments = [];
			comments.push(
				<ExpansionPanelSummary className="chat" key={0}>
					<div className='title'>
						{post[0].title}
					</div>
				</ExpansionPanelSummary>);
			for (let i = 1; i < post.length; i++) {
				let likes = post[i].likes.length > 0 ? <div className="like">{`${post[i].likes.length} likes`}</div> : null;
				comments.push(
					<ExpansionPanelDetails className="chat" key={i}>
						<div>
							<span className="author">{post[i].author}</span>
							<span className="time">{post[i].time}</span>
							<div className="body">{post[i].content}</div>
							{likes}
						</div>
					</ExpansionPanelDetails>
				)
			}
			comments.push(
				<ExpansionPanelDetails className='send-message-bar' key={-1}>
					<TextField
						variant='outlined'
						id={`input-${j}`}
						multiline
						rowsMax="4" />
					<Button variant="contained" color="primary">Send</Button>
				</ExpansionPanelDetails>
			)

			chats.push(<ExpansionPanel key={j}>{comments}</ExpansionPanel>);
		}

		return (
			<div className='chat-area'>
				{chats}
				<div className="overflow-test">Another questionasdfasdfasdfasdfasdfasdasdfsadfasdf</div>
			</div>
		);
	}
}

export default ChatArea;
