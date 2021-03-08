import React, { useState, useRef } from 'react';
import {
	MenuItem,
	Select,
	TextField,
	Button,
	Dialog,
	Table,
	TableBody,
	TableContainer,
	TableHead,
	TableRow,
	TableCell,
} from '@material-ui/core';
import axios from 'axios';
import { serverURL } from './config';

export default function EditCourse({ show, showOrHide, cid, course, fetchCourse }) {
	const [anonymity, setAnonymity] = useState(course.anonymity);
	const [drawable, setDrawable] = useState(course.drawable);
	const [downloadable, setDownloadable] = useState(course.downloadable);
	const resultRef = useRef(null);
	const nameRef = useRef(null);

	/**
	 * Change anonymity level:
	 *   A: anonymous
	 *   B: login required anonymous
	 *   C: non-anonymous
	 *   D: anonymous chat to classmates but not instructors
	 */
	const changeAnonymity = (e) => {
		setAnonymity(e.target.value);
	};

	const changeDrawable = (e) => {
		setDrawable(e.target.value);
	};

	const changeDownloadable = (e) => {
		setDownloadable(e.target.value);
	};

	const saveChange = async () => {
		if (nameRef.current.value === '') {
			setResult(false, 'course name is required');
			return;
		}
		axios
			.post(`${serverURL}/api/modifyCourseDefault?id=${cid}`, {
				name: nameRef.current.value,
				anonymity: anonymity,
				drawable: drawable,
				downloadable: downloadable,
			})
			.then((_) => {
				setResult(true, 'change saved!');
				fetchCourse();
				showOrHide();
			})
			.catch((err) => {
				console.log(err);
				setResult(false, 'saving failed!');
			});
	};

	/**
	 * set the display result
	 * @param {Boolean} success
	 * @param {String} message
	 */
	const setResult = (success, message) => {
		let node = resultRef.current;
		node.innerText = message;
		node.className = `result ${success ? 'ok' : 'fail'}`;
		setTimeout(() => {
			node.style = 'opacity: 0;';
		}, 2500);
		setTimeout(() => {
			node.innerText = '';
			node.style = '';
		}, 5000);
	};

	return (
		<Dialog className='editor' open={show} onClose={showOrHide} maxWidth={false}>
			<TableContainer>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell className='title' align='left' colSpan={2}>
								Edit course settings
								<span ref={resultRef}></span>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>
								<span className='label'>Course Name:</span>
							</TableCell>
							<TableCell>
								<TextField required className='input' inputRef={nameRef} defaultValue={course.name} />
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<span className='label'>Default Anonymity:</span>
							</TableCell>
							<TableCell>
								<Select className='input' value={anonymity} onChange={changeAnonymity}>
									<MenuItem value='A'>A: No login required</MenuItem>
									<MenuItem value='B'>B: Login required, anonymous chat to everyone</MenuItem>
									<MenuItem value='C'>C: Login required, non-anonymous chat to everyone</MenuItem>
									<MenuItem value='D'>
										D: Login required, anonymous chat to classmates but not instructors
									</MenuItem>
								</Select>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<span className='label'>Default Drawable:</span>
							</TableCell>
							<TableCell>
								<Select className='input' value={Boolean(drawable)} onChange={changeDrawable}>
									<MenuItem value={true}>On</MenuItem>
									<MenuItem value={false}>Off</MenuItem>
								</Select>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<span className='label'>Default Downloadable:</span>
							</TableCell>
							<TableCell>
								<Select className='input' value={Boolean(downloadable)} onChange={changeDownloadable}>
									<MenuItem value={true}>On</MenuItem>
									<MenuItem value={false}>Off</MenuItem>
								</Select>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell align='center' colSpan={2}>
								<Button className='create' variant='contained' onClick={saveChange}>
									Save
								</Button>
								<Button className='cancel' variant='contained' onClick={showOrHide}>
									Cancel
								</Button>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>
		</Dialog>
	);
}
