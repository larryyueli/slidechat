import React, { Component } from 'react';
import axios from 'axios';

import { Button } from '@material-ui/core';

import { fullURL, baseURL} from './config';

/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {uploading : false};

        this.uploadPDF = this.uploadPDF.bind(this);
    }

    uploadPDF() {
        this.setState({uploading : true});
        var formData = new FormData();
        formData.append("cid", "5ecccb8f49066e5cb50ebd48");
        formData.append("anonymity", "anyone");
        formData.append("user", 'lulingxi');
        formData.append("file", document.getElementById("file").files[0]);
        axios.post(`${baseURL}/api/addSlide/`,
            formData
        ).then(response=> {
            console.log(response);
            this.setState({ uploading: false });
        }).catch(function (error) {
            console.log(error);
        });
    }

    render() {
        return (
            <div className="profile">
                <input id="file" type="file" name="file" /> 
                <Button id="fileSubmit" onClick={this.uploadPDF} disabled={this.state.uploading} variant="contained" color="primary">Upload</Button>
            </div>
        );
    }
}

export default Profile;