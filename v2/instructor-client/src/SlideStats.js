import React, { useEffect } from 'react';
import { Dialog } from '@material-ui/core';
import {
	Chart,
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Title,
	Filler,
	Legend,
	Tooltip,
} from 'chart.js';
import axios from 'axios';

import { serverURL } from './config';
import { range } from './util';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Filler, Legend, Tooltip);

const datasetStyle = {
	fill: true,
	lineTension: 0.4,
	backgroundColor: 'rgba(75,192,192,0.5)',
	borderColor: 'rgb(75,192,192)',
	borderWidth: 2,
};

/** @returns {import("chart.js").ChartOptions} */
const options = (title) => {
	return {
		scales: {
			x: {
				display: true,
				title: {
					display: true,
					text: 'Page',
					font: { size: 15 },
				},
			},
			y: {
				display: true,
				ticks: {
					beginAtZero: true,
				},
			},
		},
		plugins: {
			title: {
				display: true,
				text: title,
				font: { size: 20 },
			},
			legend: {
				position: 'top',
			},
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
					timeViewed[i] /= 1000; // convert to seconds
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
								label: 'Seconds',
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
								label: 'Seconds',
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
			<div className='download-csv'>
				<a href={`${serverURL}/api/slideStatsCSV?slideID=${sid}`}>Download CSV</a>
			</div>
			<canvas id='view-count-chart' width={width} height={height}></canvas>
			<canvas id='time-viewed-chart' width={width} height={height}></canvas>
			<canvas id='avg-time-viewed-chart' width={width} height={height}></canvas>
		</Dialog>
	);
}
