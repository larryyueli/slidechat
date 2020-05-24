import React, { Component } from 'react';
import axios from 'axios';

import ChatArea from './ChatArea.js';
import Slides from './Slides.js';

const dummyState = {
    err: "",
    pageNum: 1,
    pageTotal: 3,
    pageImg: "example-16.png",
    chats: [
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'Another questionasdfasdfasdfasdfasdfasdasdfsadfasdf',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        },
        {
            title: 'A question',
            time: '2000/01/01 00:00 AM',
            author: 'name1'
        }
    ]
};

/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
class Main extends Component {
    constructor(props) {
        super(props);
        this.state = dummyState;

        this.nextPage = this.nextPage.bind(this);
        this.prevPage = this.prevPage.bind(this);
        if (window.location.hash) {
            let n = +window.location.hash.substring(1);
            if (n > 0 && n <= this.state.pageTotal) {
                this.state.pageNum = n;
            }
        }
    }

    // TODO
    fetchPage() {
        axios.get(`/${this.state.slideID}/${this.state.pageNum}`)
            .then((data) => {
                this.setState(data);
            }).catch(err => {
                console.error(err);
            })
    }

    // TO-DO
    fetchChatList() {
        axios.get(`/${this.state.slideID}/${this.state.pageNum}/chats`).then(data => {
            this.setState({ chats: data });
        }).catch(err => {
            console.error(err);
        });
    }

    /**
     * TODO
     * Go to the next page of slide, should fetch the url and the chat threads list of the new page 
     */
    nextPage() {
        this.setState((prev) => {
            window.location.hash = prev.pageNum + 1;
            return { pageNum: prev.pageNum + 1 }
        });
    }

    /**
     * TODO
     * Go to the previous page of slide, should fetch the url and the chat threads list of the new page 
     */
    prevPage() {
        this.setState((prev) => {
            window.location.hash = prev.pageNum - 1;
            return { pageNum: prev.pageNum - 1 }
        });
    }

    render() {
        return (
            <>
                <div className="main">
                    <Slides
                        pageNum={this.state.pageNum}
                        pageTotal={this.state.pageTotal}
                        pageImg={this.state.pageImg}
                        nextPage={this.nextPage}
                        prevPage={this.prevPage} />
                    <ChatArea chats={this.state.chats} />
                </div>
            </>
        );
    }
}

export default Main;