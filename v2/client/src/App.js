import React from 'react';
import './App.css';

class BannerBar extends React.Component {

    render() {
    }
}

class PDFViewer extends React.Component {

    render() {
        return (
            <div className="PDFViewer">

            </div>

        );
    }

}

class CommentArea extends React.Component {

}

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {apiResponse: ""};
    }

    callAPI() {
        fetch("/testAPI")
            .then(res => res.text())
            .then(res => this.setState({ apiResponse: res}));
    }

    componentDidMount() {
        this.callAPI();
    }

    render() {
        return (
            <div className="App">
                <p>
                    API Response: {this.state.apiResponse}
                </p>
            </div>
        );
    }
}

export default App;
