import React from 'react';

export default function ChatAreaTitle(props) {
	return (
		<div className='chat-area-title'>
			{props.showBackBtn ? (
				<span className='material-icons back-button' onClick={props.back}>
					arrow_back_ios
				</span>
			) : (
				<div className='placeholder'>&nbsp;</div>
			)}
			<div className='title'>{props.title}</div>
			{props.showManage ? (
				<span className={`manage ${props.managing ? 'managing' : ''}`} onClick={props.toggleManaging}>
					<span className='material-icons'>settings</span>
				</span>
			) : (
				<div className='placeholder'>&nbsp;</div>
			)}
		</div>
	);
}
