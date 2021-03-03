import React, { useRef } from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';

import ChatAreaTitle from './ChatAreaTitle';
import { serverURL } from '../../config';
import { anonymityMessage, getDisplayName } from '../../util';

export default function NewQuestion(props) {
	const titleRef = useRef(null);
	const bodyRef = useRef(null);
	const sendNewQuestion = () => {
		if (!titleRef.current.value) {
			window.alert(`Question title can't be empty.`);
			return;
		}
		let canvasData = props.drawing ? props.canvasComponentRef.current.lines : undefined;
		axios
			.post(`${serverURL}/api/addQuestion/`, {
				sid: props.sid,
				pageNum: props.pageNum,
				title: titleRef.current.value,
				body: bodyRef.current.value,
				user: getDisplayName(),
				drawing: canvasData,
			})
			.then((res) => {
				props.back();
			})
			.catch((err) => {
				console.error(err);
			});
	};

	return (
		<>
			<ChatAreaTitle title='New Discussion' showManage={false} showBackBtn={true} back={props.back} />
			<div className='chat-area-main new-chat-form'>
				<div>
					<TextField
						variant='outlined'
						id={`new-title`}
						placeholder='Title: briefly summarize your question'
						inputRef={titleRef}
						onBlur={() => {
							props.isTypingRef.current = false;
						}}
						onFocus={() => {
							props.isTypingRef.current = true;
						}}
					/>
				</div>
				<div>
					<TextField
						variant='outlined'
						id={`new-body`}
						multiline
						rows='6'
						placeholder='Describe your question in more details'
						inputRef={bodyRef}
						onBlur={() => {
							props.isTypingRef.current = false;
						}}
						onFocus={() => {
							props.isTypingRef.current = true;
						}}
					/>
				</div>
				{props.drawable ? (
					<div>
						{props.drawing ? (
							<span onClick={props.cancelDrawing} className='add-drawing-btn'>
								Cancel drawing
							</span>
						) : (
							<span onClick={props.startDrawing} className='add-drawing-btn'>
								Add some drawing to slide&nbsp;<span className='material-icons'>brush</span>
							</span>
						)}
					</div>
				) : (
					<div></div>
				)}

				<div>
					<Button variant='contained' color='primary' onClick={sendNewQuestion}>
						Send
					</Button>
				</div>
				<div className='anonymity'>{anonymityMessage(props.anonymity, props.username)}</div>
			</div>
		</>
	);
}
