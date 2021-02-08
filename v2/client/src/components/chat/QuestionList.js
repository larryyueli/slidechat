import React from 'react';
import axios from 'axios';
import { Button } from '@material-ui/core';

import ChatAreaTitle from './ChatAreaTitle';
import { serverURL } from '../../config';
import { formatTime } from '../../util';

export default class QuestionList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			managing: false,
			questions: [],
			showAll: false,
			sorting: 'update',
		};
	}

	componentDidMount() {
		this.fetchQuestionList();
	}

	// fetch questions when page is changed
	componentDidUpdate(prevProps) {
		if (this.props.sid !== prevProps.sid || this.props.pageNum !== prevProps.pageNum) {
			if (!this.state.showAll) this.fetchQuestionList();
		}
	}

	/**
	 * Sort the given question list.
	 * The array should already have qid remembered and null elements removed.
	 * @param {*} unsorted question list
	 * @param {String} sorting sorting method (update/create)
	 * @returns the sorted question list
	 */
	sortQuestions(questions, sorting) {
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
	rememberQid(questions, pageNum) {
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
	rememberPageAndQid(pages) {
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

	async fetchQuestionList() {
		try {
			const res = await axios.get(
				`${serverURL}/api/questions?slideID=${this.props.sid}&pageNum=${this.props.pageNum}`
			);
			this.setState({
				questions: this.sortQuestions(this.rememberQid(res.data, this.props.pageNum), this.state.sorting),
			});
		} catch (err) {
			console.error(err);
		}
	}

	/**
	 * apply new sorting method
	 * @param {String} newSort new sorting method (update/create)
	 */
	applySort(newSort) {
		if (newSort !== this.state.sorting) {
			this.setState({
				questions: this.sortQuestions(this.state.questions, newSort),
				sorting: newSort,
			});
		}
	}

	/**
	 * apply new sorting method
	 * @param {String} newSort new sorting method (update/create)
	 */
	toggleShowAll(newValue) {
		if (newValue !== this.state.showAll) {
			this.setState({ showAll: newValue });
			if (newValue) {
				axios.get(`${serverURL}/api/questionsAll?slideID=${this.props.sid}`).then((res) => {
					this.setState({
						questions: this.sortQuestions(
							this.rememberPageAndQid(res.data, this.props.pageNum),
							this.state.sorting
						),
					});
				});
			} else {
				this.fetchQuestionList();
			}
		}
	}

	deleteQuestion(e, question) {
		e.stopPropagation();
		if (!window.confirm(`Are you sure to delete "${question.title}"?`)) return;

		axios
			.delete(`${serverURL}/api/question?sid=${this.props.sid}&qid=${question.id}&pageNum=${question.pageNum}`)
			.then((res) => this.setState({ showAll: false }))
			.then(() => this.fetchQuestionList())
			.catch((err) => {
				console.error(err);
			});
	}

	onNewQuestionEvent(data) {
		this.setState({ questions: this.sortQuestions([...this.state.questions, data], this.state.sorting) });
	}

	onNewReplyEvent(data) {
		this.state.questions.forEach((question) => {
			if (question.pageNum === data.pageNum && question.id === data.qid) {
				question.time = data.time;
				return;
			}
		});
		this.setState({ questions: this.sortQuestions(this.state.questions, this.state.sorting) });
	}

	render() {
		const { managing, questions, showAll, sorting } = this.state;
		return (
			<>
				<ChatAreaTitle
					title='Discussion'
					showManage={this.props.isInstructor && this.props.isInstructorView}
					managing={managing}
					toggleManaging={() => this.setState({ managing: !this.state.managing })}
					showBackBtn={false}
				/>
				<div className='chat-list'>
					<div className='new-chat-btn-row' key={-1}>
						<Button variant='contained' onClick={this.props.askNewQuestion}>
							Ask a new question
						</Button>
					</div>
					<div className='align-right'>
						<div className='list-options' key={-3}>
							<div className='option-label'>questions from:</div>
							<div
								className={'option ' + (showAll ? '' : 'selected')}
								onClick={() => this.toggleShowAll(false)}>
								This page
							</div>
							<div
								className={'option ' + (showAll ? 'selected' : '')}
								onClick={() => this.toggleShowAll(true)}>
								All pages
							</div>
							<div className='option-label'>sort by:</div>
							<div
								className={'option ' + (sorting === 'update' ? 'selected' : '')}
								onClick={(e) => this.applySort('update')}>
								Last update
							</div>
							<div
								className={'option ' + (sorting === 'create' ? 'selected' : '')}
								onClick={(e) => this.applySort('create')}>
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
								onClick={(e) => this.props.goToQuestion(question.pageNum, question.id)}>
								<div className='title-row'>
									<div className='title'>{question.title}</div>
									<div className='icons'>
										{question.status === 'solved' ? (
											<span className='material-icons endorsed icon'>verified</span>
										) : null}
										{managing ? (
											<span
												className='material-icons delete icon'
												onClick={(e) => this.deleteQuestion(e, question)}>
												delete_forever
											</span>
										) : null}
									</div>
								</div>
								<div className='info'>
									<div className='author'>{`${question.user} ${
										question.uid && this.props.isInstructorView ? `(${question.uid})` : ''
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
}
