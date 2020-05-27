import React, { Component } from 'react';
import axios from 'axios';

import ChatArea from './ChatArea';
import Slides from './Slides';
import { baseURL } from './config';

/**
 * The main entrance of the application
 * It consists three main components: App bar, slides on the left, and chat area on the right
 */
class Main extends Component {
    constructor(props) {
        super(props);
        this.fetchChatList = this.fetchChatList.bind(this);
        this.state = { pageNum: 1, questions: [], pageTotal: 1, pageImg: "default.png", };
        let path = window.location.pathname.split("/");
        this.state.id = path.pop();
        axios.get(`${baseURL}/api/pageTotal?slideID=${this.state.id}`).then(data => {
            this.setState({ pageTotal: data.data.pageTotal });
            let defaultPage = 1;
            if (window.location.hash) {
                let n = +window.location.hash.substring(1);
                if (n > 0 && n <= data.data.pageTotal) {
                    defaultPage = n;
                }
            }
            this.fetchChatList(this.state.id, defaultPage);
            this.setState({ pageNum: defaultPage });
            this.setState({ pageImg: `${baseURL}/api/slideImg?slideID=${this.state.id}&pageNum=${defaultPage}` });
            
        }).catch(err => {
            console.error(err);
        });

        this.nextPage = this.nextPage.bind(this);
        this.prevPage = this.prevPage.bind(this);
    }

    // get chats under a question
    fetchChatList(slideID, pageNum) {
        this.refs.chatArea.setState({ state: "list" });
        axios.get(`${baseURL}/api/questions?slideID=${slideID}&pageNum=${pageNum}`).then(data => {
            this.setState({ questions: data.data });
        }).catch(err => {
            console.error(err);
        });
    }

    /**
     * Go to the next page of slide, should fetch the url and the chat threads list of the new page 
     */
    nextPage() {
        if (this.state.pageNum >= this.state.pageTotal) {
            return;
        }
        let newPageNum = this.state.pageNum + 1;
        window.location.hash = newPageNum;
        this.fetchChatList(this.state.id, newPageNum);
        this.setState({ pageImg: `${baseURL}/api/slideImg?slideID=${this.state.id}&pageNum=${newPageNum}`, pageNum: newPageNum });
    }

    /**
     * Go to the previous page of slide, should fetch the url and the chat threads list of the new page 
     */
    prevPage() {
        if (this.state.pageNum < 1) {
            return;
        }
        let newPageNum = this.state.pageNum - 1;
        window.location.hash = newPageNum;
        this.fetchChatList(this.state.id, newPageNum);
        this.setState({ pageImg: `${baseURL}/api/slideImg?slideID=${this.state.id}&pageNum=${newPageNum}`, pageNum: newPageNum});
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
                    <ChatArea chats={this.state.questions} slideID={this.state.id} pageNum={this.state.pageNum} fetchChatList={this.fetchChatList} ref="chatArea"/>
                </div>
            </>
        );
    }
}

export default Main;