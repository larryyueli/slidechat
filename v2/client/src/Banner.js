import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';

class Banner extends React.Component {

    render() {
        return (
            <AppBar position="static">
                    <Typography variant="h6" className="app-bar">
                        SlideChat
                    </Typography>
            </AppBar>
        );
    }
}

export default Banner;