import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, TextField, CircularProgress, Dialog, Select, MenuItem } from '@material-ui/core';

import { baseURL, serverURL, instructorURL } from './config';

/**
 * A modal window for slide settings
 */
export default function SlideSettings({ sid, open, onClose }) {
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [settings, setSettings] = useState({});
	const resultRef = useRef(null);
	const titleRef = useRef(null);
	const fileReupload = useRef(null);

	useEffect(() => {
		axios
			.get(`${serverURL}/api/slideInfo?slideID=${sid}`)
			.then((res) => {
				setSettings(res.data);
				setLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	}, [sid]);

	/**
	 * Change anonymity level:
	 *   A: anonymous
	 *   B: login required anonymous
	 *   C: non-anonymous
	 *   D: anonymous chat to classmates but not instructors
	 */
	const changeAnonymity = (e) => {
		axios
			.post(`${serverURL}/api/setAnonymity`, {
				sid: sid,
				anonymity: e.target.value,
			})
			.then((res) => {
				setResult(true, 'changes saved');
				setSettings({ ...settings, anonymity: e.target.value });
			})
			.catch((err) => {
				console.log(err);
				setResult(false, 'update failed!');
			});
	};

	const changeDrawable = (e) => {
		axios
			.post(`${serverURL}/api/setDrawable`, {
				sid: sid,
				drawable: e.target.value,
			})
			.then((res) => {
				setResult(true, 'changes saved');
				setSettings({ ...settings, drawable: e.target.value });
			})
			.catch((err) => {
				console.log(err);
				setResult(false, 'update failed!');
			});
	};

	const changeDownloadable = (e) => {
		axios
			.post(`${serverURL}/api/setDownloadable`, {
				sid: sid,
				downloadable: e.target.value,
			})
			.then((res) => {
				setResult(true, 'changes saved');
				setSettings({ ...settings, downloadable: e.target.value });
			})
			.catch((err) => {
				console.log(err);
				setResult(false, 'update failed!');
			});
	};

	const changeTitle = (e) => {
		axios
			.post(`${serverURL}/api/setTitle`, {
				sid: sid,
				title: titleRef.current.value,
			})
			.then((res) => {
				setResult(true, 'changes saved');
			})
			.catch((err) => {
				console.log(err);
				setResult(false, 'update failed!');
			});
	};

	const reuploadFile = async (e) => {
		if (fileReupload.current.files.length !== 1) return;
		let formData = new FormData();
		formData.append('sid', sid);
		formData.append('file', fileReupload.current.files[0]);
		try {
			setUploading(true);
			await axios.post(`${serverURL}/api/uploadNewSlide/`, formData);
			setResult(true, 'changes saved');
			setSettings({ ...settings, filename: formData.get('file').name });
		} catch (err) {
			console.log(err);
			setResult(false, 'update failed!');
		} finally {
			setUploading(false);
		}
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
		}, 1000);
		setTimeout(() => {
			node.innerText = '';
			node.style = '';
		}, 1500);
	};

	return (
		<Dialog onClose={onClose} open={open} maxWidth={false}>
			<div className='setting'>
				{loading ? (
					<div style={{ textAlign: 'center' }}>
						<CircularProgress />
					</div>
				) : (
					<>
						<div className='title'>
							Setting: {settings.filename}
							<span ref={resultRef}></span>
						</div>
						<div className='row'>
							<span className='label'>Anonymity:</span>
							<Select value={settings.anonymity} onChange={changeAnonymity}>
								<MenuItem value='A'>A: No login required</MenuItem>
								<MenuItem value='B'>B: Login required, anonymous chat to everyone</MenuItem>
								<MenuItem value='C'>C: Login required, non-anonymous chat to everyone</MenuItem>
								<MenuItem value='D'>
									D: Login required, anonymous chat to classmates but not instructors
								</MenuItem>
							</Select>
						</div>
						<div className='row'>
							<span className='label'>Drawing:</span>
							<Select value={Boolean(settings.drawable)} onChange={changeDrawable}>
								<MenuItem value={true}>On</MenuItem>
								<MenuItem value={false}>Off</MenuItem>
							</Select>
						</div>
						<div className='row'>
							<span className='label'>Downloadable:</span>
							<Select value={Boolean(settings.downloadable)} onChange={changeDownloadable}>
								<MenuItem value={true}>On</MenuItem>
								<MenuItem value={false}>Off</MenuItem>
							</Select>
						</div>
						<div className='row'>
							<span className='label'>Add a title:</span>
							<TextField
								className='title-input'
								placeholder='(at most 30 character)'
								inputProps={{ maxLength: 25 }}
								defaultValue={settings.title}
								inputRef={titleRef}
							/>
							<Button onClick={changeTitle} disabled={false} variant='contained' color='primary'>
								Update
							</Button>
						</div>
						<div className='row'>
							<span className='label'>Re-upload PDF file:</span>
							<input type='file' name='file' ref={fileReupload} accept='.pdf' />
							<Button onClick={reuploadFile} disabled={uploading} variant='contained' color='primary'>
								Upload
							</Button>
							{uploading ? <CircularProgress size='2rem' /> : null}
						</div>
						<div className='row'>
							<span className='label'>Reorder questions to match pages:</span>
							<Button
								href={`${baseURL}${instructorURL}/reorderQuestions/${sid}`}
								variant='contained'
								className='reorder-btn'>
								Reorder
							</Button>
						</div>
					</>
				)}
			</div>
		</Dialog>
	);
}
