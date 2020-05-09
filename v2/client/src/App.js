import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

import Appbar from './Appbar.js'
import MainContent from './MainContent.js'

function App() {
    return (
        <>
            <CssBaseline />
            <Appbar />
            <MainContent />
        </>
    );
}


export default App;
