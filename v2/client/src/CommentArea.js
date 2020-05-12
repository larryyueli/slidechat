import React from 'react';
// import axios from 'axios';
import { Button, TextField, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails } from '@material-ui/core';

import './App.scss';

class CommentArea extends React.Component {
	render() {
		let questions = [];
		for (let j = 0; j < this.props.questions.length; j++) {
			let post = this.props.questions[j];
			let comments = [];
			comments.push(
				<ExpansionPanelSummary className='comments'>
					<div>
						<span className="author">{post[0].author}</span>
						<span className="time">{post[0].time}</span>
						<div className="content">{post[0].content}</div>
					</div>
				</ExpansionPanelSummary>);
			for (let i = 1; i < post.length; i++) {
				comments.push(
					<ExpansionPanelDetails className='comments'>
						<div>
							<span className="author">{post[i].author}</span>
							<span className="time">{post[i].time}</span>
							<div className="content">{post[i].content}</div>
						</div>
					</ExpansionPanelDetails>
				)
			}
			comments.push(
				<ExpansionPanelDetails class='send-message-bar'>
					<TextField
						variant='outlined'
						id={`input-${j}`}
						multiline
						rowsMax="4" />
					<Button variant="contained" color="primary">Send</Button>
				</ExpansionPanelDetails>
			)

			questions.push(<ExpansionPanel>{comments}</ExpansionPanel>);
		}

		return (
			<div className='questions'>
				{questions}
			</div>
		);
	}
}

export default CommentArea;
