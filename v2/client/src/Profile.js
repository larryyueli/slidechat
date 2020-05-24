import React, { Component } from 'react';
import axios from 'axios';

import ChatArea from './ChatArea.js';
import Slides from './Slides.js';

/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
class Profile extends Component {
    constructor(props) {
        super(props);
    }

    uploadPDF() {
        var formData = new FormData();
        formData.append("file", document.getElementById("file").files[0]);
        console.log(formData);
        axios.post("http://mcsapps.utm.utoronto.ca:10000/slidechat/api/testPDF/",
            formData
        ).then(function (response) {
            console.log(response);
        }).catch(function (error) {
            console.log(error);
        });
    }

    render() {
        return (
            <div className="profile">
                <input id="file" type="file" name="file" />
                <button id="fileSubmit" onClick={this.uploadPDF}>Upload</button>
            </div>
        );
    }
}

export default Profile;