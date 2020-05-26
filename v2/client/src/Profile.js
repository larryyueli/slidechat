import React, { Component } from 'react';
import axios from 'axios';

import { fullURL} from './config';

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
        formData.append("cid", "5ecccb8f49066e5cb50ebd48");
        formData.append("anoymity", "anyone");
        formData.append("user", 'lulingxi');
        formData.append("file", document.getElementById("file").files[0]);
        axios.post(`${fullURL}/api/addSlide/`,
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