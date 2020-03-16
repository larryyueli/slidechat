import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { Document, Page } from 'react-pdf';
import styled from 'styled-components';

// Use Webpack to load the PDF, doesn't work currently, need to change webpack
// configuration to work around it
// import {Document, Page} from 'react-pdf/dist/entry.webpack';

const StyleWrapper = styled.div`
    canvas {
        margin: 0 auto;
    }
`;

class PDFViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            file: '/example.pdf',
            pageNumber: 1,
            numPages: null,
        };
    }

    onDocumentLoadSuccess = ({ numPages }) => {
        this.setState({ numPages });
    }

    goToPrevPage = () => {
        this.setState({ pageNumber: Math.max(1, this.state.pageNumber - 1) });
    }

    goToNextPage = () => {
        this.setState({ pageNumber: Math.min(this.state.numPages, this.state.pageNumber + 1) });
    }

    render() {
        const { file, pageNumber, numPages } = this.state;

        return (
            <Box m={'1em'}>
                <StyleWrapper>
                    <Document
                        file={file}
                        onLoadSuccess={this.onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber} />
                    </Document>
                    <div style={{ textAlign: 'center' }}>
                        <Button variant="contained" style={{ margin: '1em' }} onClick={this.goToPrevPage}>PREV</Button>
                        <Button variant="contained" style={{ margin: '1em' }} onClick={this.goToNextPage}>NEXT</Button>
                        <Typography>Page {pageNumber} of {numPages}</Typography>
                    </div>
                </StyleWrapper>
            </Box>
        );
    }
}

export default PDFViewer;
