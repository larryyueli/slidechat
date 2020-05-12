import React from 'react';
import axios from 'axios';

import CommentArea from './CommentArea.js';
import Slides from './Slides.js';


const dummyState = {
	err: "",
	pageNum: 1,
	pageTotal: 3,
	pageImg: "example-16.png",
	questions: [
		[
			{
				author: 'name1',
				content: 'question question question question question question question question question ',
				time: '2000/01/01 00:00 AM',
				likes: [],
				endorsements: [],
			},
			{
				author: 'name11111111111111111111111111111111111111111111111111',
				content: 'a answer',
				time: '2000/01/01 00:00 AM',
				likes: [],
				endorsements: [],
			}
		],
		[
			{
				author: 'name2',
				content: 'another question another question another question another question another question another question ',
				time: '2000/01/01 00:00 AM',
				likes: [],
				endorsements: [],
			},
			{
				author: ' <h1>name</h1>',
				content: '<script>alert(1)</script>',
				time: '2000/01/01 00:00 AM',
				likes: [],
				endorsements: [],
			}
		],
	]
};


class Main extends React.Component {
	constructor(props) {
		super(props);
		this.state = dummyState;

		this.nextPage = this.nextPage.bind(this);
		this.prevPage = this.prevPage.bind(this);
	}

	fetchPage() {
		axios.get(`/${this.state.slideID}/${this.state.pageNum}`)
			.then((data) => {
				this.setState(data);
			}).catch(err => {
				console.error(err);
			})
	}

	nextPage() {
		this.setState((prev) => { return { pageNum: prev.pageNum + 1 } });
	}

	prevPage() {
		this.setState((prev) => { return { pageNum: prev.pageNum - 1 } });
	}

	render() {
		return (
			<div className="main">
				<Slides
					pageNum={this.state.pageNum}
					pageTotal={this.state.pageTotal}
					pageImg={this.state.pageImg}
					nextPage={this.nextPage}
					prevPage={this.prevPage} />
				<CommentArea questions={this.state.questions} />
			</div>
		);
	}
}

export default Main;