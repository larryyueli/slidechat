import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@material-ui/core';

import ChatAreaTitle from './ChatAreaTitle';
import { serverURL } from '../../config';
import { formatTime } from '../../util';

/**
 * Sort the given question list
 * @param {*} unsorted question list
 * @param {String} sorting sorting method (update/create)
 * @returns the sorted question list
 */
function sortQuestions(unsorted, sorting) {
	let questions = unsorted.filter((a) => a != null);
	if (sorting === 'update') {
		return questions.sort((a, b) => b.time - a.time);
	} else if (sorting === 'create') {
		return questions.sort((a, b) => b.create - a.create);
	}
}

export default function QuestionList(props) {
	const [managing, setManaging] = useState(false);
	const [questions, setQuestions] = useState([]);
	const [sorting, setSorting] = useState('update');

	// fetch questions when page is changed
	useEffect(() => {
		fetchQuestionList();
		// eslint-disable-next-line
	}, [props.sid, props.pageNum]);

	const fetchQuestionList = async () => {
		try {
			const res = await axios.get(`${serverURL}/api/questions?slideID=${props.sid}&pageNum=${props.pageNum}`);
			setQuestions(sortQuestions(res.data, sorting));
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * apply new sorting method
	 * @param {String} newSort new sorting method (update/create)
	 */
	const applySort = (newSort) => {
		if (newSort !== sorting) {
			setQuestions(sortQuestions(questions, newSort));
			setSorting(newSort);
		}
	};

	const deleteQuestion = (e, question) => {
		e.stopPropagation();
		if (!window.confirm(`Are you sure to delete "${question.title}"?`)) return;

		axios
			.delete(`${serverURL}/api/question?sid=${props.sid}&qid=${question.id}&pageNum=${props.pageNum}`)
			.then(fetchQuestionList)
			.catch((err) => {
				console.error(err);
			});
	};

	const toggleManaging = () => {
		setManaging(!managing);
	};

	return (
		<>
			<ChatAreaTitle
				title='Discussion'
				showManage={props.isInstructor}
				managing={managing}
				toggleManaging={toggleManaging}
				showBackBtn={false}
			/>
			<div className='chat-list'>
				<div className='new-chat-btn-row' key={-1}>
					<Button variant='contained' onClick={props.askNewQuestion}>
						Ask a new question
					</Button>
				</div>
				<div className='sort-select-row' key={-2}>
					sort by:
					<span className={sorting === 'update' ? 'selected' : ''} onClick={(e) => applySort('update')}>
						Last update
					</span>
					<span className={sorting === 'create' ? 'selected' : ''} onClick={(e) => applySort('create')}>
						Creation
					</span>
				</div>
				{questions.map((question, i) => {
					if (!question) return null;
					return (
						<div className='chat' key={i} onClick={(e) => props.goToQuestionDetails(question.id)}>
							<div className='title-row'>
								<div className='title'>{question.title}</div>
								<div className='icons'>
									{question.status === 'solved' ? (
										<span className='material-icons endorsed icon'>verified</span>
									) : null}
									{managing ? (
										<span
											className='material-icons delete icon'
											onClick={(e) => deleteQuestion(e, question)}>
											delete_forever
										</span>
									) : null}
								</div>
							</div>
							<div className='info'>
								<div className='author'>{question.user}</div>
								<div className='time'>{formatTime(question.time)}</div>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
