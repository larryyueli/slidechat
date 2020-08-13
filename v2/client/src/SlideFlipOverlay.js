import React, { Component, createRef } from 'react';

/**
 * layer used to detect flip page click on slide
 */
export default class SlideFlipOverlay extends Component {
	constructor(props) {
		super(props);
		this.overlayRef = createRef(null);
		this.overlay = null;
		this.slide = null;
		this.resize = this.resize.bind(this);
	}

	/**
	 * resize the layer
	 * @param {*} e resize event
	 */
	resize(e) {
		this.overlay.style.height = `${this.slide.clientHeight}px`;
	}

	componentDidMount() {
		this.overlay = this.overlayRef.current;
		this.slide = document.getElementById('slide-img');
		if (this.slide.complete) {
			this.resize();
		} else {
			this.slide.onload = this.resize;
		}
		window.addEventListener('resize', this.resize);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.resize);
	}

	render() {
		return (
			<>
				<div className='flip-page-overlay' ref={this.overlayRef}>
					<div
						className={this.props.prevBtnDisable ? 'disabled' : 'prev'}
						onClick={this.props.prevBtnDisable ? () => {} : this.props.prevPage}></div>
					<div></div>
					<div
						className={this.props.nextBtnDisable ? 'disabled' : 'next'}
						onClick={this.props.nextBtnDisable ? () => {} : this.props.nextPage}></div>
				</div>
			</>
		);
	}
}
