import React from 'react';
import './App.css';
import CssBaseline from '@material-ui/core/CssBaseline';

import Banner from './Banner.js'
import MainContent from './MainContent.js'

class App extends React.Component {

    render() {
        return (
            <React.Fragment>
                <CssBaseline />
                <Banner />
                <MainContent />
            </React.Fragment>
        );
    }
}

export default App;
