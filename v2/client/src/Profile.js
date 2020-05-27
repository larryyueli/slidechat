import React, { Component } from 'react';
import axios from 'axios';

import { Button } from '@material-ui/core';

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
        this.state = { ...dummyState, uploading: false };

        this.uploadPDF = this.uploadPDF.bind(this);
    }

    uploadPDF() {
        this.setState({ uploading: true });
        var formData = new FormData();
        formData.append("cid", "5ecccb8f49066e5cb50ebd48");
        formData.append("anonymity", "anyone");
        formData.append("user", 'lulingxi');
        formData.append("file", document.getElementById("file").files[0]);
        axios.post(`${baseURL}/api/addSlide/`,
            formData
        ).then(response => {
            console.log(response);
            this.setState({ uploading: false });
        }).catch(error => {
            console.log(error);
            this.setState({ uploading: false });
        });
    }

    render() {
        let content = [];
        console.log(this.state.courses);
        for (let i in this.state.courses) {
            let slides = [];
            for (let j in this.state.courses[i].slides) {
                let slide = this.state.courses[i].slides[j];
                slides.push(
                    <div key={j} className="slide-item">
                        <a className="slide-link" href={`${baseURL}/${slide._id}`}>{slide.filename}</a>
                        <Button className="slide-delete-btn" variant="outlined" color="secondary">Delete</Button>
                    </div>
                );
            }
            let course = <div className="course" key={i}>
                <div className="title">{this.state.courses[i].name}</div>
                <div className="slides">                    {slides}                </div>
                <div className="upload-bar">
                    <input id="file" type="file" name="file" />
                    <Button id="fileSubmit" onClick={this.uploadPDF} disabled={this.state.uploading} variant="contained" color="primary">Upload</Button>
                </div>
            </div>
            content.push(course);
        }


        return (
            <div className="profile">
                <div className="title">My Courses</div>
                {content}
            </div>
        );
    }
}

export default Profile;