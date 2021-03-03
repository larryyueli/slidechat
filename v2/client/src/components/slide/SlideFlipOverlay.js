import React, { Component, createRef } from 'react';

/**
 * A layer on top of the slide to detect flip page clicks
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
	 * resize the layer to the same size of the slide
	 * @param {Event} e resize event
	 */
	resize(e) {
		this.overlay.style.width = `${this.slide.clientWidth}px`;
		this.overlay.style.height = `${this.slide.clientHeight}px`;
		this.overlay.style.top = `${this.slide.offsetTop}px`;
		this.overlay.style.left = `${this.slide.offsetLeft}px`;
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

	componentDidUpdate(prevProps) {
		if (this.props.fullscreen && this.props.fullscreenChatOpen !== prevProps.fullscreenChatOpen) this.resize();
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.resize);
	}

	render() {
		return (
			<>
				<div className='slide-overlay flip-page-overlay' ref={this.overlayRef}>
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
