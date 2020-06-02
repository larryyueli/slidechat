import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';

import { serverURL, fullURL } from './config';
import './Profile.scss';


/**
 * The profile page for instructors (not for students for now)
 * This page lists all the courses of the instructor and all the slides
 */
function Profile(props) {
    let [courses, setCourses] = useState([]);
    let uid = "lulingxi";
    let newCourseRef;

    const fetchCourses = async () => {
        try {
            let res = await axios.get(`${serverURL}/api/myCourses?id=${uid}`);
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const createCourse = async () => {
        try {
            await axios.post(`${serverURL}/api/createCourse`, {
                user: uid,
                course: newCourseRef.value,
            })
        } catch (err) {
            console.error(err);
        }
        fetchCourses();
    }

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="profile">
            <div className="title">My Courses</div>
            {courses.map(course =>
                <Course
                    course={course}
                    key={course.cid}
                    fetchCourses={fetchCourses}
                    uid={uid} />
            )}
            <div className="createCourse-bar">
                <TextField
                    variant='outlined'
                    id={`new-course`}
                    placeholder="Course Name"
                    inputRef={ref => { newCourseRef = ref }} />
                <Button id="fileSubmit" onClick={createCourse} variant="contained" color="primary">Create Course</Button>
            </div>
        </div>
    );
}

function Course(props) {
    let [managing, setManaging] = useState(false);
    let [uploading, setUploading] = useState(false);
    let [addInstructorRes, setAddInstructorRes] = useState(null);
    let fileUpload = React.createRef();
    let newUserRef = React.createRef();

    const uploadPDF = async () => {
        let formData = new FormData();
        formData.append("cid", props.course.cid);
        formData.append("anonymity", "anyone");
        formData.append("user", props.uid);
        formData.append("file", fileUpload.current.files[0]);
        try {
            setUploading(true);
            await axios.post(`${serverURL}/api/addSlide/`, formData);
        } catch (err) {
            console.log(err);
        } finally {
            setUploading(false);
            props.fetchCourses();
        }
    }

    const deleteSlide = async (filename, sid) => {
        if (!window.confirm(`Are you sure to delete "${filename}"?`)) return;
        try {
            await axios.delete(`${serverURL}/api/slide?sid=${sid}`, { data: { user: props.uid } });
        } catch (err) {
            console.log(err);
        } finally {
            props.fetchCourses();
        }
    }

    const addInstructor = async () => {
        try {
            await axios.post(`${serverURL}/api/addInstructor`, {
                user: props.uid,
                course: props.course.cid,
                newUser: newUserRef.current.value,
            });
            setAddInstructorRes(<div className="result-ok">Add instructor "{newUserRef.current.value}" successfully!</div>);
        } catch (err) {
            console.error(err);
            setAddInstructorRes(<div className="result-fail">Add instructor "{newUserRef.current.value}" failed!</div>);
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

    return (
        <div className="course">
            <div className="title">
                {props.course.name}
                <span className={`manage ${managing ? "managing" : ""}`}
                    onClick={changeManageStatus}>
                    <span className='material-icons icon'>settings</span>
                </span>
            </div>
            <div className="slides">{props.course.slides.map((slide) => {
                let link = `${fullURL()}/${slide.id}`;
                return (
                    <div key={slide.id} className="slide-item">
                        <a className="slide-link" href={link}>{slide.filename}</a>
                        {managing
                            ? <Button
                                className="slide-delete-btn"
                                variant="outlined"
                                color="secondary"
                                onClick={e => deleteSlide(slide.filename, slide.id)}>Delete</Button>
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
                </div>
                : null}

            <div className="instructors"><strong>Instructors: </strong>{props.course.instructors.join(', ')}</div>
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
                            onClick={e => addInstructor(props.course.cid)}>Add Instructor</Button>
                    </div>
                    {addInstructorRes}
                </>
                : null}
        </div>
    );
}

export default Profile;