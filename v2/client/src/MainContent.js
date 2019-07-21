import React from 'react';
import Grid from '@material-ui/core/Grid';

import CommentArea from './CommentArea.js';
import PDFViewer from './PDFViewer.js';


class MainContent extends React.Component {

    render() {
        return (
            <Grid container spacing={3}>
                <Grid item xs={8}>
                    <PDFViewer />
                </Grid>
                <Grid item xs={4}>
                    <CommentArea />
                </Grid>
            </Grid>
        );
    }
}

export default MainContent;