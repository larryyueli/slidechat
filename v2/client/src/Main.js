import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import ChatArea from './ChatArea';
import Slides from './Slides';
import { serverURL, baseURL } from './config';
import { getCookie } from './util';

/**
 * The main body of the application
 * It consists two main components: slides on the left, and chat area on the right. Changing the page
 * number will need to change both sides.
 */
function Main(props) {
	const sid = props.match.params.slideId;
	const [pageTotal, setPageTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [title, setTitle] = useState('');
	const [filename, setFilename] = useState('');
	const [protectLevel, setProtectLevel] = useState('unknown');
	const [slideDrawing, setSlideDrawing] = useState(false);
	const canvasComponentRef = useRef(null); // this ref is used to read canvas data from chat area

	useEffect(() => {
		axios
			.get(`${serverURL}/api/slideInfo?slideID=${sid}`)
			.then((res) => {
				if (res.data.anonymity === 'anyone') {
					setProtectLevel('');
				} else {
					if (!getCookie('isLogin')) {
						window.location.href = `${baseURL}/p/login/${sid}/${window.location.hash.substring(1)}`;
					}
					setProtectLevel('/p');
				}
				let currentPage = 1;
				if (window.location.hash) {
					let n = +window.location.hash.substring(1);
					if (n > 0 && n <= res.data.pageTotal && Number.isInteger(n)) {
						currentPage = n;
					}
				}

				setPageTotal(res.data.pageTotal);
				setTitle(res.data.title);
				setFilename(res.data.filename);
				applyPage(currentPage);
			})
			.catch((err) => {
				console.error(err);
			});
	}, [sid]);

	/**
	 * apply the new page number
	 * @param {*} newPageNum
	 */
	const applyPage = (newPageNum) => {
		document.getElementById('pageNum').value = newPageNum;
		window.location.hash = newPageNum;
		setPage(newPageNum);
	};

	/**
	 * Go to the next page of slide, should fetch the url and the chat threads list of the new page
	 */
	const nextPage = () => {
		if (page >= pageTotal) return;
		let newPageNum = page + 1;
		applyPage(newPageNum);
	};

	/**
	 * Go to the previous page of slide, should fetch the url and the chat threads list of the new page
	 */
	const prevPage = () => {
		if (page < 2) return;
		let newPageNum = page - 1;
		applyPage(newPageNum);
	};

	const gotoPage = () => {
		let newPageNum = +document.getElementById('pageNum').value;
		if (!Number.isInteger(newPageNum)) {
			document.getElementById('pageNum').value = page;
			return;
		}
		if (newPageNum > pageTotal) {
			newPageNum = pageTotal;
		} else if (newPageNum < 1) {
			newPageNum = 1;
		}
		applyPage(newPageNum);
	};

	return (
		<div className='main'>
			<Slides
				title={title}
				filename={filename}
				sid={sid}
				pageNum={page}
				pageTotal={pageTotal}
				protectLevel={protectLevel}
				nextPage={nextPage}
				prevPage={prevPage}
				gotoPage={gotoPage}
				drawing={slideDrawing}
				canvasComponentRef={canvasComponentRef}
			/>
			<ChatArea
				sid={sid}
				pageNum={page}
				protectLevel={protectLevel}
				canvasComponentRef={canvasComponentRef}
				setSlideDrawing={setSlideDrawing}
			/>
		</div>
	);
}

export default Main;
