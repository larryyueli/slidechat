import React, { createRef } from 'react';

// use coordinates from 0 to 9999 to represent the relative coordinate,
// where 0 is top or left, 9999 is bottom or right.
// Integers takes less space than floats when transmitted as a string of json 
const resolution = 9999;

export default class SlideOverlay extends React.Component {
    constructor(props) {
        super(props);
        this.isDrawing = false;
        this.lines = [[0, 0, 5000, 5000]];
        this.canvasRef = createRef(null);
        this.canvas = null;
        this.ctx = null;
    }

    resize(slide) {
        this.canvas.width = slide.clientWidth;
        this.canvas.height = slide.clientHeight;
        this.canvas.style.bottom = slide.clientHeight;
        this.setupCtx();
        this.clearCanvas();
        this.redraw();
    }

    setupCtx() {
        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineWidth = this.canvas.width / 100 >> 0;
        this.ctx.strokeStyle = 'red';
        this.ctx.lineCap = 'round';
    }

    componentDidMount() {
        this.canvas = this.canvasRef.current;
        this.setupCtx();

        this.canvas.addEventListener('mousedown', e => this.drawingOnMouseDown(e));
        this.canvas.addEventListener('mousemove', e => this.drawingOnMouseMove(e));
        this.canvas.addEventListener('mouseup', e => this.drawingOnMouseUp(e));

        const slide = document.getElementById("slide-img");
        if (slide.complete) {
            this.resize(slide);
        } else {
            slide.onload = e => this.resize(slide);
        }
    }

    redraw() {
        for (let line of this.lines) {
            this.ctx.beginPath();
            this.ctx.moveTo(line[0] * this.canvas.width / resolution >> 0,
                line[1] * this.canvas.height / resolution >> 0);
            for (let i = 2; i < line.length - 1; i += 2) {
                this.ctx.lineTo(line[i] * this.canvas.width / resolution >> 0,
                    line[i + 1] * this.canvas.height / resolution >> 0);
            }
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    drawingOnMouseDown(e) {
        this.lines.push([e.offsetX / this.canvas.width * resolution >> 0,
        e.offsetY / this.canvas.height * resolution >> 0]);
        this.isDrawing = true;
    }

    drawingOnMouseMove(e) {
        if (!this.isDrawing) return;
        let lastLine = this.lines[this.lines.length - 1];
        lastLine.push(e.offsetX / this.canvas.width * resolution >> 0);
        lastLine.push(e.offsetY / this.canvas.height * resolution >> 0);
        let len = lastLine.length;
        this.ctx.beginPath();
        this.ctx.moveTo(lastLine[len - 4] / resolution * this.canvas.width,
            lastLine[len - 3] / resolution * this.canvas.height);
        this.ctx.lineTo(lastLine[len - 2] / resolution * this.canvas.width,
            lastLine[len - 1] / resolution * this.canvas.height);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawingOnMouseUp(e) {
        this.isDrawing = false;
    }

    undo(e) {
        this.lines.pop();
        this.clearCanvas();
        this.redraw();
    }

    clear(e) {
        this.lines = [];
        this.clearCanvas();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
        return (
            <>
                <canvas
                    className="slide-overlay"
                    ref={this.canvasRef}></canvas>
                <div className="drawing-controls">
                    <span onClick={e => this.undo(e)}>Undo</span>
                    <span onClick={e => this.clear(e)}>Clear</span>
                </div>
            </>
        );
    }
}
