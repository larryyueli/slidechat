import { Button, CircularProgress } from '@material-ui/core';
import { useState, useRef } from 'react';
import axios from 'axios';

import { serverURL } from '../../config';

export default function AudioUploadPanel({ record, setRecord, sid, pageNum, hasAudio, fetchAudioInfo }) {
	const [uploading, setUploading] = useState(false);
	const fileUpload = useRef(null);
	/**
	 * upload audio to server
	 */
	const uploadAudio = async () => {
		if (fileUpload.current.files.length !== 1) return;

		let formData = new FormData();
		formData.append('sid', sid);
		formData.append('pageNum', pageNum);
		formData.append('file', fileUpload.current.files[0]);
		try {
			setUploading(true);
			await axios.post(`${serverURL}/api/audio/`, formData);
		} catch (err) {
			console.log(err);
		} finally {
			setUploading(false);
			document.getElementById('file').value = '';
			fetchAudioInfo();
		}
	};

	const uploadRecording = async () => {
		setUploading(true);
		let formData = new FormData();
		formData.append('sid', sid);
		formData.append('pageNum', pageNum);
		formData.append('file', record.recordingFile);
		try {
			setUploading(true);
			await axios.post(`${serverURL}/api/audio/`, formData);
			await fetchAudioInfo();
			setRecord({ ...record, uploaded: true, recordingFile: null, recordingSrc: '' });
		} catch (err) {
			console.log(err);
		} finally {
			setUploading(false);
		}
	};

	/**
	 * delete the audio on this page
	 */
	const deleteAudio = async () => {
		if (!window.confirm(`Are you sure to delete this audio?`)) return;
		setUploading(true);
		axios
			.delete(`${serverURL}/api/audio?sid=${sid}&pageNum=${pageNum}`)
			.then((res) => {
				setUploading(false);
				fetchAudioInfo();
			})
			.catch((err) => {
				console.error(err);
				setUploading(false);
			});
	};

	const startRecording = async () => {
		if (!navigator.mediaDevices) {
			window.alert("Your browser doesn't support using microphone. Are you using HTTPS?");
			return;
		}
		if (record.recordingSrc !== '' && !record.uploaded) {
			if (!window.confirm("You haven't uploaded your recording. Do you want to discard it?")) return;
		}
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then(async () => {
				const MicRecorder = (await import('mic-recorder-to-mp3')).default;
				window.audioRecorder = new MicRecorder({ bitRate: 128 });
				window.audioRecorder
					.start()
					.then(() => {
						setRecord({ ...record, recording: true });
					})
					.catch((err) => console.error(err));
			})
			.catch(() => {
				window.alert('Audio permission denied.');
			});
	};

	const stopRecording = () => {
		window.audioRecorder
			.stop()
			.getMp3()
			.then(([buffer, blob]) => {
				setRecord({
					...record,
					recording: false,
					uploaded: false,
					recordingFile: new File(buffer, 'recording.mp3', { type: blob.type, lastModified: Date.now() }),
					recordingSrc: URL.createObjectURL(blob),
				});
			})
			.catch((err) => console.error(err));
		delete window.audioRecorder;
	};

	return (
		<>
			<div className='audio-instructor'>
				<input type='file' id='file' className='file' ref={fileUpload} accept='.mp3' />
				<Button variant='contained' onClick={uploadAudio} disabled={uploading} className='upload'>
					{hasAudio ? 'Replace' : 'Upload'} audio
				</Button>
				{uploading ? <CircularProgress /> : null}
				{hasAudio ? (
					<Button variant='contained' onClick={deleteAudio} disabled={uploading} className='delete'>
						Delete Audio
					</Button>
				) : null}
				{record.recording ? (
					<Button variant='contained' className='stop' onClick={stopRecording}>
						<span className='material-icons stop-icon'>stop</span>
						Stop recording
					</Button>
				) : (
					<Button variant='contained' className='start' onClick={startRecording}>
						<span className='material-icons start-icon'>radio_button_checked</span>
						Start recording
					</Button>
				)}
			</div>
			{record.recordingSrc ? (
				<div className='recording'>
					<audio className='recording-audio' controls src={record.recordingSrc}>
						Your browser does not support the audio element.
					</audio>
					<Button variant='contained' onClick={uploadRecording} disabled={uploading} className='upload'>
						{hasAudio ? 'Replace' : 'Upload'} audio
					</Button>
				</div>
			) : null}
		</>
	);
}
