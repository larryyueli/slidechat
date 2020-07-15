import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, TextField, CircularProgress } from '@material-ui/core';

import SlideSettings from './SlideSettings';
import { serverURL, fullURL } from './config';

export default function Course({ cid, role }) {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [managing, setManaging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [addInstructorRes, setAddInstructorRes] = useState(null);
    const [openModify, setOpenModify] = useState({ open: false });
    const fileUpload = useRef(null);
    const newUserRef = useRef(null);

    const fetchCourse = async () => {
        try {
            let res = await axios.get(`${serverURL}/api/course?id=${cid}`);
            setCourse(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        fetchCourse();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const uploadPDF = async () => {
        if (fileUpload.current.files.length !== 1) return;

        let formData = new FormData();
        formData.append("cid", cid);
        formData.append("anonymity", "anyone");
        formData.append("file", fileUpload.current.files[0]);
        try {
            setUploading(true);
            await axios.post(`${serverURL}/p/api/addSlide/`, formData);
        } catch (err) {
            console.log(err);
        } finally {
            setUploading(false);
            fetchCourse();
        }
    }

    const deleteSlide = async (filename, sid) => {
        if (!window.confirm(`Are you sure to delete "${filename}"?`)) return;
        try {
            await axios.delete(`${serverURL}/p/api/slide?sid=${sid}`);
        } catch (err) {
            console.log(err);
        } finally {
            fetchCourse();
        }
    }

    const addInstructor = async () => {
        try {
            await axios.post(`${serverURL}/p/api/addInstructor`, {
                course: cid,
                newUser: newUserRef.current.value,
            });
            setAddInstructorRes(<div className="result-ok">Add instructor "{newUserRef.current.value}" successfully!</div>);
        } catch (err) {
            console.error(err);
            setAddInstructorRes(<div className="result-fail">Add instructor failed!</div>);
        } finally {
            fetchCourse();
        }
    }

    const changeManageStatus = () => {
        setAddInstructorRes(null);
        setManaging(!managing);
    }

    const copyToClipboard = (str) => {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.visibility = false;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    const modifySlide = (filename, sid) => {
        setOpenModify({ open: true, filename: filename, sid: sid });
    }

    if (loading) return (<div className="course"><div className="loading"><CircularProgress /></div></div>);

    return (
        <div className="course">
            <div className="title">
                {course.name}
                {role === 'instructor'
                    ? <span className={`manage ${managing ? "managing" : ""}`}
                        onClick={changeManageStatus}>
                        <span className='material-icons icon'>settings</span>
                    </span>
                    : <span>&nbsp;</span>}
            </div>
            <div className="slides">{course.slides.map((slide) => {
                let link = `${fullURL()}/${slide.id}`;
                return (
                    <div key={slide.id} className="slide-item">
                        <a className="slide-link" href={link}>{slide.filename}</a>
                        {managing
                            ? <div className="btns">
                                <Button
                                    className="slide-delete-btn"
                                    variant="outlined"
                                    color="primary"
                                    onClick={e => modifySlide(slide.filename, slide.id)}>Modify</Button>
                                <Button
                                    className="slide-delete-btn"
                                    variant="outlined"
                                    color="secondary"
                                    onClick={e => deleteSlide(slide.filename, slide.id)}>Delete</Button>
                            </div>
                            : <Button
                                variant="outlined"
                                color="primary"
                                onClick={e => copyToClipboard(link)}
                            >Copy link</Button>}
                    </div>
                );
            })}</div>

            {managing
                ? <div className="upload-bar">
                    <input type="file" name="file" ref={fileUpload} />
                    <Button
                        onClick={uploadPDF}
                        disabled={uploading}
                        variant="contained"
                        color="primary">Upload</Button>
                    {uploading ? <CircularProgress /> : null}
                </div>
                : null}

            <div className="instructors"><strong>Instructors: </strong>{course.instructors.join(', ')}</div>
            {managing
                ? <>
                    <div className="addInstructor-bar">
                        <TextField
                            variant='outlined'
                            id={`new-instructor`}
                            placeholder="utorid"
                            inputRef={newUserRef} />
                        <Button id="fileSubmit"
                            variant="contained"
                            color="primary"
                            onClick={e => addInstructor(course.cid)}>Add Instructor</Button>
                    </div>
                    {addInstructorRes}
                </>
                : null}

            {openModify.open
                ? <SlideSettings open={openModify.open}
                    onClose={_ => setOpenModify({ open: false })}
                    sid={openModify.sid} />
                : null}
        </div>
    );
}
