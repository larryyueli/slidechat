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
        this.state = { pageNum: 1, chats: {}, pageTotal: 1, pageImg: "default.png", };
        this.state.id = "5ecae7fdb7d01649ea0a7097";
        axios.get(`/slidechat/api/${this.state.id}/pageTotal`).then(data => {
            this.setState({ pageTotal: data.data.pageTotal });
            if (window.location.hash) {
                let n = +window.location.hash.substring(1);
                if (n > 0 && n <= this.state.pageTotal) {
                    this.setState({ pageNum: n });
                }
            }
            return axios.get(`/slidechat/api/${this.state.id}/${this.state.pageNum - 1}/img`);
        }).then(data=>{
            this.setState({ pageImg: data.data.pageImg });
            this.fetchChatList();
        }).catch(err => {
            console.error(err);
        });

        this.nextPage = this.nextPage.bind(this);
        this.prevPage = this.prevPage.bind(this);
    }

    // TODO
    fetchPage() {
        axios.get(`/${this.state.slideID}/${this.state.pageNum - 1}`)
            .then((data) => {
                this.setState(data);
            }).catch(err => {
                console.error(err);
            })
    }

    // TO-DO
    fetchChatList() {
        let main = this;
        axios.get(`/slidechat/api/${this.state.id}/${this.state.pageNum - 1}/questions`).then(data => {
            main.setState({ chats: data.data.questions });
        }).catch(err => {
            console.error(err);
        });
    }

    /**
     * TODO
     * Go to the next page of slide, should fetch the url and the chat threads list of the new page 
     */
    nextPage() {
        if (this.state.pageNum >= this.state.pageTotal) {
            return;
        }
        axios.get(`/slidechat/api/${this.state.id}/${this.state.pageNum}/img`).then(data=>{
            this.setState((prev) => {
                window.location.hash = prev.pageNum + 1;
                return { pageNum: prev.pageNum + 1, pageImg: data.data.pageImg }
            });
        });
        this.fetchChatList();
    }

    /**
     * TODO
     * Go to the previous page of slide, should fetch the url and the chat threads list of the new page 
     */
    prevPage() {
        if (this.state.pageNum<1){
            return;
        }
        axios.get(`/slidechat/api/${this.state.id}/${this.state.pageNum - 2}/img`).then(data => {
            this.setState((prev) => {
                window.location.hash = prev.pageNum - 1;
                return { pageNum: prev.pageNum - 1, pageImg: data.data.pageImg }
            });
        });
        this.fetchChatList();
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
                    <ChatArea chats={this.state.chats} slideID={this.state.id} pageNum={this.state.pageNum}/>
                </div>
            </>
        );
    }
}

export default Main;