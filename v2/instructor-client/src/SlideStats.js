import React, { useEffect } from 'react';
import { Dialog } from '@material-ui/core';
import Chart from 'chart.js';
import axios from 'axios';

import { serverURL } from './config';
import { range } from './util';

const datasetStyle = {
	fill: true,
	lineTension: 0.4,
	backgroundColor: 'rgba(75,192,192,0.5)',
	borderColor: 'rgb(75,192,192)',
	borderWidth: 2,
};
const options = (title) => {
	return {
		title: {
			display: true,
			text: title,
			fontSize: 20,
		},
		legend: {
			display: true,
			position: 'top',
		},
		scales: {
			xAxes: [
				{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Page',
						fontSize: 15,
					},
				},
			],
			yAxes: [
				{
					display: true,
					ticks: {
						beginAtZero: true,
					},
				},
			],
		},
		responsive: false,
		maintainAspectRatio: false,
		devicePixelRatio: devicePixelRatio,
	};
};

export default function SlideStats({ open, onClose, sid }) {
	useEffect(() => {
		if (!open) return;
		axios
			.get(`${serverURL}/api/slideStats?slideID=${sid}`)
			.then((res) => {
				const { viewCount, timeViewed } = res.data;
				const averageTime = [];
				for (const i in viewCount) {
					if (viewCount[i] === 0) averageTime.push(0);
					else averageTime.push(timeViewed[i] / viewCount[i]);
				}

				const labels = range(1, viewCount.length + 1);
				new Chart('view-count-chart', {
					type: 'line',
					data: {
						labels,
						datasets: [
							{
								...datasetStyle,
								label: '# of Views',
								data: viewCount,
							},
						],
					},
					options: options('Page Views'),
				});
				new Chart('time-viewed-chart', {
					type: 'line',
					data: {
						labels,
						datasets: [
							{
								...datasetStyle,
								label: 'Minutes',
								data: timeViewed,
							},
						],
					},
					options: options('Total Time Spent on Each Page'),
				});
				new Chart('avg-time-viewed-chart', {
					type: 'line',
					data: {
						labels,
						datasets: [
							{
								...datasetStyle,
								label: 'Minutes',
								data: averageTime,
							},
						],
					},
					options: options('Average Time Spent on Each Page'),
				});
			})
			.catch(console.error);
	}, [open, sid]);

	const width = window.innerWidth * 0.7;
	const height = width * 0.7;
	return (
		<Dialog className='slide-stats' open={open} onClose={onClose} maxWidth={false}>
			<canvas id='view-count-chart' width={width} height={height}></canvas>
			<canvas id='time-viewed-chart' width={width} height={height}></canvas>
			<canvas id='avg-time-viewed-chart' width={width} height={height}></canvas>
		</Dialog>
	);
}
