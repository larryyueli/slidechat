import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@material-ui/core';

import ChatAreaTitle from './ChatAreaTitle';
import { serverURL } from '../../config';
import { formatTime } from '../../util';

/**
 * Sort the given question list.
 * The array should already have qid remembered and null elements removed.
 * @param {*} unsorted question list
 * @param {String} sorting sorting method (update/create)
 * @returns the sorted question list
 */
function sortQuestions(questions, sorting) {
	if (sorting === 'update') {
		return questions.sort((a, b) => b.time - a.time);
	} else if (sorting === 'create') {
		return questions.sort((a, b) => b.create - a.create);
	}
}

/**
 * Questions don't store a unique id in the database, instead, they are stored in an array,
 * and the array index is the unique id. However, when we sort the array, the index
 * information is lost. We need to store it when API response arrives.
 * Null elements are deleted questions, they should be removed once the index is remembered.
 * @param {Array} questions
 */
function rememberQid(questions, pageNum) {
	questions.forEach((question, i) => {
		if (!question) return;
		question.id = i;
		question.pageNum = pageNum;
	});
	return questions.filter((a) => a != null);
}
/**
 * Similar to rememberQid, but also remember page number, and return a flattened array with all
 * questions of all pages in the same level
 * @param {Array} pages
 */
function rememberPageAndQid(pages) {
	let questions = [];
	pages.forEach((page, i) => {
		const pageNum = i + 1;
		page.questions.forEach((question, qid) => {
			if (!question) return;
			question.id = qid;
			question.pageNum = pageNum;
		});
		questions.push(...page.questions);
	});
	return questions.filter((a) => a != null);
}

export default function QuestionList(props) {
	const [managing, setManaging] = useState(false);
	const [questions, setQuestions] = useState([]);
	const [showAll, setShowAll] = useState(false);
	const [sorting, setSorting] = useState('update');

	// fetch questions when page is changed
	useEffect(() => {
		setShowAll(false);
		fetchQuestionList();
		// eslint-disable-next-line
	}, [props.sid, props.pageNum]);

	const fetchQuestionList = async () => {
		try {
			const res = await axios.get(`${serverURL}/api/questions?slideID=${props.sid}&pageNum=${props.pageNum}`);
			setQuestions(sortQuestions(rememberQid(res.data, props.pageNum), sorting));
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

	/**
	 * apply new sorting method
	 * @param {String} newSort new sorting method (update/create)
	 */
	const toggleShowAll = (newValue) => {
		if (newValue !== showAll) {
			setShowAll(newValue);
			if (newValue) {
				axios.get(`${serverURL}/api/questionsAll?slideID=${props.sid}`).then((res) => {
					setQuestions(sortQuestions(rememberPageAndQid(res.data, props.pageNum), sorting));
				});
			} else {
				fetchQuestionList();
			}
		}
	};

	const deleteQuestion = (e, question) => {
		e.stopPropagation();
		if (!window.confirm(`Are you sure to delete "${question.title}"?`)) return;

		axios
			.delete(`${serverURL}/api/question?sid=${props.sid}&qid=${question.id}&pageNum=${question.pageNum}`)
			.then((res) => setShowAll(false))
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
				<div className='align-right'>
					<div className='list-options' key={-3}>
						<div className='option-label'>questions from:</div>
						<div className={'option ' + (showAll ? '' : 'selected')} onClick={(e) => toggleShowAll(false)}>
							This page
						</div>
						<div className={'option ' + (showAll ? 'selected' : '')} onClick={(e) => toggleShowAll(true)}>
							All pages
						</div>
						<div className='option-label'>sort by:</div>
						<div
							className={'option ' + (sorting === 'update' ? 'selected' : '')}
							onClick={(e) => applySort('update')}>
							Last update
						</div>
						<div
							className={'option ' + (sorting === 'create' ? 'selected' : '')}
							onClick={(e) => applySort('create')}>
							Creation
						</div>
					</div>
				</div>
				{questions.map((question, i) => {
					if (!question) return null;
					return (
						<div
							className='chat'
							key={i}
							onClick={(e) => props.goToQuestion(question.pageNum, question.id)}>
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
								<div className='author'>{`${question.user} ${
									question.uid && props.isInstructorView ? `(${question.uid})` : ''
								}`}</div>
								<div className='time'>{formatTime(question.time)}</div>
							</div>
							{showAll ? <div className='extra-info'>From page {question.pageNum}</div> : null}
						</div>
					);
				})}
			</div>
		</>
	);
}
