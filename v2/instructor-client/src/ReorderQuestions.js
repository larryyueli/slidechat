import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, CircularProgress } from '@material-ui/core';

import AppBar from './AppBar';
import { serverURL, fullURL } from './config';

/**
 * Page used to reorder questions
 */
export default function ReorderQuestions(props) {
	const sid = props.match.params.slideId;
	const [loading, setLoading] = useState(true);
	const [slide, setSlide] = useState({});
	const [user, setUser] = useState('');

	useEffect(() => {
		let fetchSlide = async () => {
			try {
				let res = await axios.get(`${serverURL}/api/slideInfo?slideID=${sid}`);
				setUser(res.data.loginUser);
				let slide = { pageTotal: res.data.pageTotal, pages: [], unused: [] };
				let i = 1;
				for (; i <= slide.pageTotal; i++) { // fetch all questions
					let res = await axios.get(`${serverURL}/api/questions?slideID=${sid}&pageNum=${i}`);
					let questions = { pageNum: i, questions: res.data };
					questions.count = res.data.reduce((total, curr) => {
						return total + (curr ? 1 : 0);
					}, 0);
					if (questions.count === 0) {
						slide.pages.push([]);
					} else {
						slide.pages.push([questions]);
					}
				}

				res = await axios.get(`${serverURL}/api/unusedQuestions?id=${sid}`);
				slide.unused = res.data;
				for (; i <= slide.unused.length + slide.pageTotal; i++) {
					slide.unused[i - slide.pageTotal - 1].pageNum = i;
					slide.unused[i - slide.pageTotal - 1].count = slide.unused[
						i - slide.pageTotal - 1
					].questions.reduce((total, curr) => {
						return total + (curr ? 1 : 0);
					}, 0);
					console.log(slide.unused[i - slide.pageTotal - 1].questions);
				}

				setSlide(slide);
				setLoading(false);
			} catch (err) {
				console.error(err);
			}
		};
		fetchSlide();
	}, [sid]);

	/**
	 * move a set of questions to unused questions
	 * @param {*} index page index
	 */
	const removeQuestions = (index) => {
		const slideCopy = { ...slide };
		for (let i of slide.pages[index]) {
			slideCopy.unused.push(i);
		}
		slideCopy.pages[index] = [];
		setSlide(slideCopy);
	};

	/**
	 * move all questions below selected page to the prev page
	 * @param {*} index start page index
	 */
	const shiftUp = (index) => {
		const slideCopy = { ...slide };
		for (let i of slide.pages[index]) {
			if (i.count > 0) slideCopy.unused.push(i);
		}
		for (let i = index; i < slide.pageTotal - 1; i++) {
			slideCopy.pages[i] = slide.pages[i + 1];
		}
		slideCopy.pages[slide.pageTotal - 1] = [];
		console.log(slideCopy);
		setSlide(slideCopy);
	};

	/**
	 * move all questions below selected page to the next page
	 * @param {*} index start page index
	 */
	const shiftDown = (index) => {
		const slideCopy = { ...slide };
		for (let i of slide.pages[slide.pageTotal - 1]) {
			if (i.count > 0) slideCopy.unused.push(i);
		}
		for (let i = slide.pageTotal - 1; i > index; i--) {
			slideCopy.pages[i] = slide.pages[i - 1];
		}
		slideCopy.pages[index] = [];
		console.log(slideCopy);
		setSlide(slideCopy);
	};

	/**
	 * add unused questions at index to page given in `add-${index}`
	 * @param {*} index unused questions index
	 */
	const addToPage = (index) => {
		let to = +document.getElementById(`add-${index}`).value;
		if (!Number.isInteger(to) || to < 1 || to > slide.pageTotal) return;

		const slideCopy = { ...slide };

		slideCopy.pages[to - 1].push(slide.unused[index]);
		slideCopy.unused.splice(index, 1);
		console.log(slideCopy);
		setSlide(slideCopy);
	};

	/**
	 * return the preview of given page
	 * @param {*} page 
	 * @returns preview
	 */
	const previewPage = (page) => {
		let list = [];
		for (let i = 0; i < 5 && i < page.questions.length; i++) {
			if (page.questions[i])
				list.push(
					<li className='preview-item' key={i}>
						{page.questions[i].title}
					</li>
				);
		}
		return list;
	};

	/**
	 * upload the new order to server
	 */
	const submitChanges = async () => {
		try {
			let questionOrder = [];
			for (let page of slide.pages) {
				let orders = [];
				for (let questions of page) {
					orders.push(questions.pageNum);
				}
				questionOrder.push(orders);
			}
			console.log(questionOrder);
			await axios.post(`${serverURL}/api/reorderQuestions`, {
				questionOrder: questionOrder,
				sid: sid,
			});
			window.location.href = `${fullURL()}/prof`;
		} catch (err) {
			console.error(err.request);
		}
	};

	return (
		<>
			<AppBar user={user} />
			<div className='reorder-page'>
				<div className='title'>Reorder Questions</div>
				{loading ? (
					<div className='subtitle'>
						<CircularProgress />
					</div>
				) : (
					<>
						<div className='subtitle'>You can rearrange the questions to match pages here</div>
						<div className='container'>
							<div className='left-side'>
								<div className='pages-list'>
									{slide.pages.map((qPages, index) => (
										<div className='page-item' key={index}>
											<div className='page-item-left'>
												<span className='page-num'>{index + 1}.</span>
												<img
													className='thumbnail'
													src={`${serverURL}/api/slideImg?slideID=${sid}&pageNum=${
														index + 1
													}`}
													alt='slideImg'
												/>
												<span>Questions:</span>
												{qPages.map((page, i) => {
													if (page.count === 0) return null;
													return (
														<span className='tooltip' key={i}>
															<span className='question-icon'>
																page {page.pageNum}({page.count})
															</span>
															<ul className='tooltip-text'>{previewPage(page)}</ul>
														</span>
													);
												})}
											</div>
											<div className='page-item-right'>
												<span className='tooltip'>
													<span
														className='reorder-btn'
														onClick={(e) => removeQuestions(index)}>
														<span className='material-icons'>close</span>
													</span>
													<span className='tooltip-text'>Move questions to unused</span>
												</span>
												<span className='tooltip'>
													<span className='reorder-btn' onClick={(e) => shiftUp(index)}>
														<span className='material-icons'>arrow_upward</span>
													</span>
													<span className='tooltip-text'>
														Delete questions on this page and shift all questions below up
														by 1 page
													</span>
												</span>
												<span className='tooltip'>
													<span className='reorder-btn' onClick={(e) => shiftDown(index)}>
														<span className='material-icons'>arrow_downward</span>
													</span>
													<span className='tooltip-text'>
														Shift questions on this page and below down by 1 page
													</span>
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
							<div className='right-side'>
								<div className='toolbox'>
									<div className='title'>Unused questions</div>
									{slide.unused.map((page, index) => {
										return (
											<div className='unused-item' key={index}>
												<div className='tooltip' key={index}>
													<span className='question-icon'>
														unused {page.pageNum}({page.count})
													</span>
													<ul className='tooltip-text'>{previewPage(page)}</ul>
												</div>
												<div className='input-row'>
													<span>To page:</span>
													<input type='text' id={`add-${index}`} />
													<button onClick={(e) => addToPage(index)}>Add</button>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
						<div className='button-row'>
							<Button variant='contained' href={`${fullURL()}/prof`}>
								Abort
							</Button>
							<Button variant='contained' className='primary' onClick={(e) => submitChanges()}>
								Submit
							</Button>
						</div>
					</>
				)}
			</div>
		</>
	);
}
