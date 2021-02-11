import React, { useRef } from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';

import ChatAreaTitle from './ChatAreaTitle';
import { serverURL } from '../../config';

export default function ModifyChat(props) {
	const textRef = useRef(null);

	const done = () => {
		if (!textRef.current.value) {
			return alert('Message body cannot be empty!');
		}
		if (props.old.body !== textRef.current.value) {
			axios
				.post(`${serverURL}/api/modifyChat/`, {
					sid: props.sid,
					pageNum: props.pageNum,
					qid: props.old.qid,
					cid: props.old.cid,
					body: textRef.current.value,
				})
				.then((res) => {
					props.back();
				})
				.catch((err) => {
					console.error(err);
				});
		} else {
			props.back();
		}
	};

	const deleteOwnChat = () => {
		if (!window.confirm('Are you sure to delete this message?')) return;
		axios
			.post(`${serverURL}/api/deleteOwnChat`, {
				sid: props.sid,
				pageNum: props.pageNum,
				qid: props.old.qid,
				cid: props.old.cid,
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
			<ChatAreaTitle title='Modify a Message' showManage={false} showBackBtn={true} back={props.back} />
			<div className='chat-area-main new-chat-form'>
				<div>
					<TextField variant='outlined' multiline rows='6' defaultValue={props.old.body} inputRef={textRef} />
				</div>
				<div>
					<Button onClick={done} variant='contained'>
						Done
					</Button>
				</div>
				<div>
					{props.old.cid !== 0 ? (
						<Button onClick={deleteOwnChat} variant='contained' className='delete-btn'>
							Delete message
						</Button>
					) : (
						'(You cannot delete the question body.)'
					)}
				</div>
			</div>
		</>
	);
}
