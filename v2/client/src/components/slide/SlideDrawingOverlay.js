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
	}

	/**
	 * resize the canvas to the same size as the slide
	 * @param {*} slide
	 */
	resize(slide) {
		this.canvas.width = slide.clientWidth;
		this.canvas.height = slide.clientHeight;
		this.setupCtx();
		this.redraw();
	}

	/**
	 * initialize context of canvas
	 */
	setupCtx() {
		this.ctx = this.canvas.getContext('2d');
		this.ctx.lineWidth = this.canvas.width / 200;
		this.ctx.strokeStyle = 'red';
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

		const slide = document.getElementById('slide-img');
		if (slide.complete) {
			this.resize(slide);
		} else {
			slide.onload = (e) => this.resize(slide);
		}
	}

	redraw() {
		this.clearCanvas();
		for (let line of this.lines) {
			this.ctx.beginPath();
			this.ctx.moveTo(
				((line[0] * this.canvas.width) / resolution) >> 0,
				((line[1] * this.canvas.height) / resolution) >> 0
			);
			for (let i = 2; i < line.length - 1; i += 2) {
				this.ctx.lineTo(
					((line[i] * this.canvas.width) / resolution) >> 0,
					((line[i + 1] * this.canvas.height) / resolution) >> 0
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
		this.lines.push([
			((e.offsetX / this.canvas.width) * resolution) >> 0,
			((e.offsetY / this.canvas.height) * resolution) >> 0,
		]);
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
		lastLine.push(((e.offsetX / this.canvas.width) * resolution) >> 0);
		lastLine.push(((e.offsetY / this.canvas.height) * resolution) >> 0);
		this.applyLineChange(lastLine);
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
		let touch = e.touches[0];
		let rect = this.canvas.getBoundingClientRect();
		let offsetX = touch.clientX - rect.left;
		let offsetY = touch.clientY - rect.top;

		let lastLine = this.lines[this.lines.length - 1];
		lastLine.push(((offsetX / this.canvas.width) * resolution) >> 0);
		lastLine.push(((offsetY / this.canvas.height) * resolution) >> 0);
		this.applyLineChange(lastLine);
	}

	/**
	 * apply touchstart event
	 * @param {*} e touchstart event
	 */
	touchstart(e) {
		e.preventDefault();
		if (this.state.readOnly || this.isDrawing) return;
		this.isDrawing = true;
		let touch = e.touches[0];
		let rect = this.canvas.getBoundingClientRect();
		let offsetX = touch.clientX - rect.left;
		let offsetY = touch.clientY - rect.top;
		this.lines.push([
			((offsetX / this.canvas.width) * resolution) >> 0,
			((offsetY / this.canvas.height) * resolution) >> 0,
		]);
	}

	/**
	 * undo the lest line
	 * @param {*} e onClick event
	 */
	undo(e) {
		this.lines.pop();
		this.redraw();
	}

	/**
	 * clear the canvas
	 * @param {*} e onClick event
	 */
	clear(e) {
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
			<>
				<canvas
					className='slide-overlay'
					style={
						this.props.drawing
							? { cursor: `url(${process.env.PUBLIC_URL}/imgs/pen_cursor.png),crosshair` }
							: {}
					}
					ref={this.canvasRef}></canvas>
				{this.state.readOnly ? null : (
					<div className='drawing-controls'>
						<span onClick={(e) => this.undo(e)}>Undo</span>
						<span onClick={(e) => this.clear(e)}>Clear</span>
					</div>
				)}
			</>
		);
	}
}
