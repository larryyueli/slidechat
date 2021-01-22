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

export default function NewCourse({ show, showOrHide, fetchCourses }) {
	const [settings, setSettings] = useState({ drawable: true, anonymity: 'B' });
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
		setSettings({ ...settings, anonymity: e.target.value });
	};

	const changeDrawable = (e) => {
		setSettings({ ...settings, drawable: e.target.value });
	};

	const createCourse = async () => {
		if (nameRef.current.value === '') {
			setResult(false, 'course name is required');
			return;
		}
		axios
			.post(`${serverURL}/api/createCourse`, {
				name: nameRef.current.value,
				anonymity: settings.anonymity,
				drawable: settings.drawable,
			})
			.then((_) => {
				setResult(true, 'course created!');
				setSettings({ drawable: true, anonymity: 'B' });
				fetchCourses();
				showOrHide();
			})
			.catch((err) => {
				console.log(err);
				setResult(false, 'create new course failed!');
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
		<Dialog className='dialog' open={show} onClose={showOrHide} maxWidth={false}>
			<TableContainer>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell className='title' align='left' colSpan={2}>
								Create a new course
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
								<TextField required className='input' inputRef={nameRef} />
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<span className='label'>Anonymity:</span>
							</TableCell>
							<TableCell>
								<Select className='input' value={settings.anonymity} onChange={changeAnonymity}>
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
								<span className='label'>Drawing:</span>
							</TableCell>
							<TableCell>
								<Select className='input' value={Boolean(settings.drawable)} onChange={changeDrawable}>
									<MenuItem value={true}>On</MenuItem>
									<MenuItem value={false}>Off</MenuItem>
								</Select>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell align='center' colSpan={2}>
								<Button className='create' variant='contained' onClick={createCourse}>
									Create
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
