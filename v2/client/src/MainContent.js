import React from 'react';
import axios from 'axios';
import Grid from '@material-ui/core/Grid';

import CommentArea from './CommentArea.js';
import PDFViewer from './Slides.js';


class MainContent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			err: "",
			pageNum: 1,
			pageTotal: 3,
			pageImg: "example-16.png",
			questions: [
				[
					{
						author: 'author',
						content: 'a question',
						time: '1900/01/01',
						likes: [],
						endorsements: [],
					},
					{
						author: 'author',
						content: 'a answer',
						time: '1900/01/01',
						likes: [],
						endorsements: [],
					}
				],
				[
					{
						author: 'author',
						content: 'another question',
						time: '1900/01/01',
						likes: [],
						endorsements: [],
					},
					{
						author: 'author',
						content: 'another answer',
						time: '1900/01/01',
						likes: [],
						endorsements: [],
					}
				],
			]
		}

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
			<Grid container>
				<Grid item xs={12} md={8}>
					<PDFViewer
						pageNum={this.state.pageNum}
						pageTotal={this.state.pageTotal}
						pageImg={this.state.pageImg}
						nextPage={this.nextPage}
						prevPage={this.prevPage} />
				</Grid>
				<Grid item md={4}>
					<CommentArea questions={this.state.questions} />
				</Grid>
			</Grid>
		);
	}
}

export default MainContent;