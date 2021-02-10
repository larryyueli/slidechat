import React from 'react';

export default function ChatAreaTitle(props) {
	return (
		<div className='chat-area-title'>
			{props.showBackBtn ? (
				<div className='back-button' onClick={props.back}>
					<span className='material-icons'>arrow_back_ios</span>
				</div>
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
