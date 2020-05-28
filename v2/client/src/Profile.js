import React, { Component } from 'react';
import axios from 'axios';

import { Button, TextField } from '@material-ui/core';

import { fullURL, baseURL } from './config';


const dummyState = {
    courses: [
        {
            name: "csc999",
            slides: [
                {
                    filename: "pdf1.pdf",
                    _id: "1234567"
                },
                {
                    filename: "pdf2.pdf",
                    _id: "1234567"
                }
            ]
        },
        {
            name: "csc666",
            slides: [
                {
                    filename: "pdf1.pdf",
                    _id: "1234567"
                },
                {
                    filename: "pdf2.pdf",
                    _id: "1234567"
                }
            ]
        }
    ]
}

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
        axios.get(`${baseURL}/api/myCourses?id=${this.state.uid}`).then(data => {
            this.setState({
                courses: data.data,
            });
        }).catch(err => {
            console.error(err);
        });
    }

    createCourse() {
        axios.post(`${baseURL}/api/createCourse`,
            {
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
        console.log(this.state.courses);
        for (let i in this.state.courses) {
            content.push(<Course
                course={this.state.courses[i]}
                key={i}
                fetchCourses={this.fetchCourses}
                uid={this.state.uid}
            />);
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

        this.uploadPDF = this.uploadPDF.bind(this);
        this.changeManageStatus = this.changeManageStatus.bind(this);
    }
    uploadPDF() {
        this.setState({ uploading: true });
        var formData = new FormData();
        formData.append("cid", "5ecccb8f49066e5cb50ebd48");
        formData.append("anonymity", "anyone");
        formData.append("user", this.props.uid);
        formData.append("file", document.getElementById("file").files[0]);
        axios.post(`${baseURL}/api/addSlide/`,
            formData
        ).then(response => {
            console.log(response);
            this.setState({ uploading: false });
            this.props.fetchCourses();
        }).catch(error => {
            console.log(error);
            this.setState({ uploading: false });
            this.props.fetchCourses();
        });
    }

    deleteSlide(sid) {
        axios.delete(`${baseURL}/api/slide?sid=${sid}`, { data: { user: this.props.uid}}).then(data => {
            this.props.fetchCourses();
        }).catch(err => {
            console.error(err);
        });
    }

    addInstructor(cid) {
        axios.post(`${baseURL}/api/addInstructor`,
            {
                user: this.props.uid,
                course: cid,
                newUser: this.newUserRef.value,
            }).then(data => {
            }).catch(err => {
                console.error(err);
            });
    }


    changeManageStatus() {
        this.setState(pre => { return { managing: !pre.managing } });
    }

    render() {
        let slides = [];
        for (let j in this.props.course.slides) {
            let slide = this.props.course.slides[j];
            slides.push(
                <div key={j} className="slide-item">
                    <a className="slide-link" href={`${fullURL}/${slide.id}`}>{slide.filename}</a>
                    {this.state.managing ? <Button className="slide-delete-btn" variant="outlined" color="secondary" onClick={e => this.deleteSlide(slide.id)}>Delete</Button>:null}
                </div>
            );
        }
        let editBar;
        if (this.state.managing) {
            editBar = <>
                <div className="upload-bar">
                    <input id="file" type="file" name="file" />
                    <Button id="fileSubmit" onClick={this.uploadPDF} disabled={this.state.uploading} variant="contained" color="primary">Upload</Button>
                </div>
                <div className="addInstructor-bar">
                    <TextField
                        variant='outlined'
                        id={`new-instructor`}
                        placeholder="utorid"
                        inputRef={ref => { this.newUserRef = ref; }} />
                    <Button id="fileSubmit" variant="contained" color="primary" onClick={e => this.addInstructor(this.props.course.cid)}>Add Instructor</Button>
                </div>
            </>
        }
        return (
            <div className="course" key={this.props.key}>
                <div className="title">
                    {this.props.course.name}
                    <span className={`material-icons manage ${this.state.managing ? "managing" : ""}`} onClick={this.changeManageStatus}>settings</span>
                </div>
                <div className="slides">{slides}</div>
                {editBar}
            </div>
        );
    }
}
export default Profile;