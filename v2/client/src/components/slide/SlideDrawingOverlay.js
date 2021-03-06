import React, { createRef } from 'react';

// use coordinates from 0 to 9999 to represent the relative coordinate,
// where 0 is top or left, 9999 is bottom or right.
// Integers takes less space than floats when transmitted as a string of json
const resolution = 9999;

/**
 * The drawing layer of slide
 */
export default class SlideOverlay extends React.Component {
	constructor(props) {
		super(props);
		this.isDrawing = false;
		this.lines = [];
		this.state = { readOnly: false };
		this.canvasRef = createRef(null);
		this.canvas = null;
		this.ctx = null;
		this.slide = null;
	}

	/**
	 * resize the canvas to the same size as the slide
	 * @param {*} slide
	 */
	resize() {
		this.canvas.style.top = `${this.slide.offsetTop}px`;
		this.canvas.style.left = `${this.slide.offsetLeft}px`;
		this.canvas.width = this.slide.clientWidth;
		this.canvas.height = this.slide.clientHeight;
		this.setupCtx();
		this.redraw();
	}

	/**
	 * initialize context of canvas
	 */
	setupCtx() {
		this.ctx = this.canvas.getContext('2d');
		this.ctx.lineWidth = this.canvas.width / 200;
		this.ctx.strokeStyle = this.props.strokeColour;
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
	}

	componentDidMount() {
		this.canvas = this.canvasRef.current;
		this.setupCtx();

		this.canvas.addEventListener('mousedown', (e) => this.drawingOnMouseDown(e));
		this.canvas.addEventListener('mousemove', (e) => this.drawingOnMouseMove(e));
		this.canvas.addEventListener('mouseup', (e) => this.drawingOnMouseUp(e));

		this.canvas.addEventListener('touchend', (e) => this.touchend(e));
		this.canvas.addEventListener('touchmove', (e) => this.touchmove(e));
		this.canvas.addEventListener('touchstart', (e) => this.touchstart(e));

		this.slide = document.getElementById('slide-img');
		if (this.slide.complete) {
			this.resize();
		} else {
			this.slide.onload = () => this.resize();
		}
		window.addEventListener('resize', () => this.resize());
	}

	componentDidUpdate(prevProps) {
		if (this.props.fullscreen && this.props.fullscreenChatOpen !== prevProps.fullscreenChatOpen) this.resize();
	}

	componentWillUnmount() {
		window.removeEventListener('resize', () => this.resize());
	}

	redraw() {
		this.clearCanvas();
		for (let line of this.lines) {
			this.ctx.strokeStyle = Array.isArray(line) ? 'red' : line.colour;
			this.ctx.beginPath();
			this.ctx.moveTo(
				(((Array.isArray(line) ? line[0] : line.points[0]) * this.canvas.clientWidth) / resolution) >> 0,
				(((Array.isArray(line) ? line[1] : line.points[1]) * this.canvas.clientHeight) / resolution) >> 0
			);

			let points = Array.isArray(line) ? line : line.points;
			for (let i = 2; i < points.length - 1; i += 2) {
				this.ctx.lineTo(
					((points[i] * this.canvas.clientWidth) / resolution) >> 0,
					((points[i + 1] * this.canvas.clientHeight) / resolution) >> 0
				);
			}
			this.ctx.stroke();
			this.ctx.closePath();
		}
	}

	/**
	 * update the last line and draw it
	 * @param {*} lastLine the updated line
	 */
	applyLineChange(lastLine) {
		let len = lastLine.length;
		this.ctx.strokeStyle = this.props.strokeColour;
		this.ctx.beginPath();
		this.ctx.moveTo(
			((lastLine[len - 4] / resolution) * this.canvas.width) >> 0,
			((lastLine[len - 3] / resolution) * this.canvas.height) >> 0
		);
		this.ctx.lineTo(
			((lastLine[len - 2] / resolution) * this.canvas.width) >> 0,
			((lastLine[len - 1] / resolution) * this.canvas.height) >> 0
		);
		this.ctx.stroke();
		this.ctx.closePath();
	}

	/**
	 * apply mouseDown event
	 * @param {*} e mouseDown event
	 */
	drawingOnMouseDown(e) {
		if (this.state.readOnly) return;
		this.lines.push({
			colour: this.props.strokeColour,
			points: [
				((e.offsetX / this.canvas.clientWidth) * resolution) >> 0,
				((e.offsetY / this.canvas.clientHeight) * resolution) >> 0,
			],
		});
		this.isDrawing = true;
	}

	/**
	 * apply MouseMove event
	 * @param {*} e MouseMove event
	 */
	drawingOnMouseMove(e) {
		if (this.state.readOnly) return;
		if (!this.isDrawing) return;
		let lastLine = this.lines[this.lines.length - 1];
		lastLine.points.push(((e.offsetX / this.canvas.clientWidth) * resolution) >> 0);
		lastLine.points.push(((e.offsetY / this.canvas.clientHeight) * resolution) >> 0);
		this.applyLineChange(lastLine.points);
	}

	/**
	 * apply MouseUp event
	 * @param {*} e MouseUp event
	 */
	drawingOnMouseUp(e) {
		this.isDrawing = false;
	}

	/**
	 * apply touchend event
	 * @param {*} e touchend event
	 */
	touchend(e) {
		if (this.isDrawing && e.touches.length === 0) {
			this.isDrawing = false;
		}
	}

	/**
	 * apply touchmove event
	 * @param {*} e touchmove event
	 */
	touchmove(e) {
		if (this.state.readOnly) return;
		if (!this.isDrawing) return;
		const touch = e.touches[0];
		const rect = this.canvas.getBoundingClientRect();
		const offsetX = touch.clientX - rect.left;
		const offsetY = touch.clientY - rect.top;
		const lastLine = this.lines[this.lines.length - 1];
		lastLine.points.push(((offsetX / this.canvas.clientWidth) * resolution) >> 0);
		lastLine.points.push(((offsetY / this.canvas.clientHeight) * resolution) >> 0);
		this.applyLineChange(lastLine.points);
	}

	/**
	 * apply touchstart event
	 * @param {*} e touchstart event
	 */
	touchstart(e) {
		e.preventDefault();
		if (this.state.readOnly || this.isDrawing) return;
		this.isDrawing = true;
		const touch = e.touches[0];
		const rect = this.canvas.getBoundingClientRect();
		const offsetX = touch.clientX - rect.left;
		const offsetY = touch.clientY - rect.top;
		this.lines.push({
			colour: this.props.strokeColour,
			points: [
				((offsetX / this.canvas.clientWidth) * resolution) >> 0,
				((offsetY / this.canvas.clientHeight) * resolution) >> 0,
			],
		});
	}

	/**
	 * undo the lest line
	 */
	undo() {
		this.lines.pop();
		this.redraw();
	}

	/**
	 * clear the canvas
	 */
	clear() {
		this.lines = [];
		this.clearCanvas();
	}

	/**
	 * draw the cleared canvas
	 */
	clearCanvas() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	render() {
		return (
			<canvas
				className='slide-overlay'
				style={
					this.props.drawing
						? { cursor: `url(${process.env.PUBLIC_URL}/imgs/laser_pointer.png) 9 9, crosshair` }
						: {}
				}
				ref={this.canvasRef}></canvas>
		);
	}
}
