import React, { Component } from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';

import { fullURL, baseURL } from './config';
import './Profile.scss';


/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = { uploading: false, uid: "lulingxi" };

        this.fetchCourses = this.fetchCourses.bind(this);
        this.createCourse = this.createCourse.bind(this);

        this.fetchCourses();
    }

    // get course list from server
    fetchCourses() {
        axios.get(`${baseURL}/api/myCourses?id=${this.state.uid}`)
            .then(res => {
                this.setState({ courses: res.data });
            }).catch(err => {
                console.error(err);
            });
    }

    createCourse() {
        axios.post(`${baseURL}/api/createCourse`, {
            user: this.state.uid,
            course: this.newCourseRef.value,
        }).then(data => {
            this.fetchCourses();
        }).catch(err => {
            console.error(err);
        });
    }

    render() {
        let content = [];
        for (let i in this.state.courses) {
            content.push(
                <Course
                    course={this.state.courses[i]}
                    key={i}
                    fetchCourses={this.fetchCourses}
                    uid={this.state.uid} />
            );
        }

        return (
            <div className="profile">
                <div className="title">My Courses</div>
                {content}
                <div className="createCourse-bar">
                    <TextField
                        variant='outlined'
                        id={`new-course`}
                        placeholder="Course Name"
                        inputRef={ref => { this.newCourseRef = ref; }} />
                    <Button id="fileSubmit" onClick={this.createCourse} variant="contained" color="primary">Create Course</Button>
                </div>
            </div>
        );
    }
}

class Course extends Component {
    constructor(props) {
        super(props);
        this.state = {
            managing: false,
        }
        this.fileUpload = React.createRef();

        this.uploadPDF = this.uploadPDF.bind(this);
        this.changeManageStatus = this.changeManageStatus.bind(this);
    }

    uploadPDF() {
        this.setState({ uploading: true });
        var formData = new FormData();
        formData.append("cid", this.props.course.cid);
        formData.append("anonymity", "anyone");
        formData.append("user", this.props.uid);
        formData.append("file", this.fileUpload.current.files[0]);
        axios.post(`${baseURL}/api/addSlide/`,
            formData
        ).then(res => {
            this.setState({ uploading: false });
            this.props.fetchCourses();
        }).catch(error => {
            console.log(error);
            this.setState({ uploading: false });
            this.props.fetchCourses();
        });
    }

    deleteSlide(filename, sid) {
        if (!window.confirm(`Are you sure to delete "${filename}"?`)) return;

        axios.delete(`${baseURL}/api/slide?sid=${sid}`, {
            data: { user: this.props.uid }
        }).then(res => {
            this.props.fetchCourses();
        }).catch(err => {
            console.error(err);
        });
    }

    addInstructor() {
        axios.post(`${baseURL}/api/addInstructor`, {
            user: this.props.uid,
            course: this.props.course.cid,
            newUser: this.newUserRef.value,
        }).then(res => {
            this.setState({
                addInstructorRes: <div className="result-ok">Add instructor "{this.newUserRef.value}" successfully!</div>
            });
            this.newUserRef.value = "";
            console.log("add instructor success");
        }).catch(err => {
            this.setState({
                addInstructorRes: <div className="result-fail">Add instructor "{this.newUserRef.value}" failed!</div>
            });
            console.error(err);
        });
    }

    changeManageStatus() {
        this.setState(pre => {
            return {
                addInstructorRes: null,
                managing: !pre.managing
            }
        });
    }

    copyToClipboard(str) {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.visibility = false;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    };

    render() {
        let slides = [];
        for (let j in this.props.course.slides) {
            let slide = this.props.course.slides[j];
            let link = `${fullURL}/${slide.id}`;
            slides.push(
                <div key={j} className="slide-item">
                    <a className="slide-link" href={link}>{slide.filename}</a>
                    {this.state.managing
                        ? <Button
                            className="slide-delete-btn"
                            variant="outlined"
                            color="secondary"
                            onClick={e => this.deleteSlide(slide.filename, slide.id)}>Delete</Button>
                        : <Button
                            variant="outlined"
                            color="primary"
                            onClick={e => this.copyToClipboard(link)}
                        >Copy link</Button>}
                </div>
            );
        }

        return (
            <div className="course">
                <div className="title">
                    {this.props.course.name}
                    <span className={`manage ${this.state.managing ? "managing" : ""}`}
                        onClick={this.changeManageStatus}>
                        <span className='material-icons icon'>settings</span>
                    </span>
                </div>
                <div className="slides">{slides}</div>
                {this.state.managing ?
                    <div className="upload-bar">
                        <input type="file" name="file" ref={this.fileUpload} />
                        <Button
                            onClick={this.uploadPDF}
                            disabled={this.state.uploading}
                            variant="contained"
                            color="primary">Upload</Button>
                    </div> : null}
                <div className="instructors"><strong>Instructors: </strong>{this.props.course.instructors.join(', ')}</div>
                {this.state.managing ? <>
                    <div className="addInstructor-bar">
                        <TextField
                            variant='outlined'
                            id={`new-instructor`}
                            placeholder="utorid"
                            inputRef={ref => { this.newUserRef = ref; }} />
                        <Button id="fileSubmit"
                            variant="contained"
                            color="primary"
                            onClick={e => this.addInstructor(this.props.course.cid)}>Add Instructor</Button>
                    </div>
                    {this.state.addInstructorRes}
                </> : null
                }
            </div>
        );
    }
}
export default Profile;