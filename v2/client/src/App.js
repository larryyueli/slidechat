import React, { Component } from 'react';

import AppBar from './Appbar.js'

import Main from './Main.js';
import Profile from './Profile.js';



/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
class App extends Component {
    constructor(props) {
        super(props);
        this.state = { state: "main" };

        this.toProfile = this.toProfile.bind(this);
        this.toMain = this.toMain.bind(this);
    }

    toProfile(e) {
        this.setState((prevState, props) => {
            return { state: "profile" };
        });
    }

    toMain(e) {
        this.setState((prevState, props) => {
            return { state: "main" };
        });
    }

    render() {
        return (
            <>
                <AppBar toProfile={this.toProfile} toMain={this.toMain} state={this.state.state} />
                {this.state.state === "profile"
                    ? <Profile />
                    : <Main />}
            </>
        );
    }
}


export default App;
