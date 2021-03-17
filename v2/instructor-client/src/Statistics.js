// eslint-disable-next-line
import React, { useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line
import { Dialog, Modal } from '@material-ui/core';
import { Line } from 'react-chartjs-2';

const defaultFill = true;
const defaultLineTension = 0.4;
const defaultBackgroundColor = 'rgba(75,192,192,1)';
const defaultBorderColor = 'rgba(0,148,196,0.4)';
const defaultBorderWidth = 2;
const defaultFontSize = 20;
const defaultDevicePixelRatio = 2;
const defaultWidth = window.innerWidth * 0.7;
const defaultHeight = window.innerHeight * 0.7;

export default function Statistics({ show, showOrHide, statsData }) {
	const viewCount = useRef([]);
	const timeViewed = useRef([]);

	if (statsData) {
		viewCount.current = statsData.map(function (x) {
			return x.viewCount;
		});
		timeViewed.current = statsData.map(function (x) {
			return x.timeViewed / 60000;
		});
	}

	const viewData = {
		labels: Array.from({ length: viewCount.current.length }, (_, index) => index + 1).map((i) => 'Page ' + i),
		datasets: [
			{
				label: 'View',
				data: viewCount.current,
				fill: defaultFill,
				lineTension: defaultLineTension,
				backgroundColor: defaultBackgroundColor,
				borderColor: defaultBorderColor,
				borderWidth: defaultBorderWidth,
			},
		],
	};

	const timeData = {
		labels: Array.from({ length: timeViewed.current.length }, (_, index) => index + 1).map((i) => 'Page ' + i),
		datasets: [
			{
				label: 'Minutes',
				data: timeViewed.current,
				fill: defaultFill,
				lineTension: defaultLineTension,
				backgroundColor: defaultBackgroundColor,
				borderColor: defaultBorderColor,
				borderWidth: defaultBorderWidth,
			},
		],
	};

	return (
		<Dialog className='statisticsDialog' open={show} onClose={showOrHide} fullWidth={true} maxWidth={'md'}>
			<Line
				data={viewData}
				options={{
					title: {
						display: true,
						text: 'Total views',
						fontSize: defaultFontSize,
					},
					legend: {
						display: true,
						position: 'top',
					},
					scales: {
						yAxes: [
							{
								display: true,
								ticks: {
									beginAtZero: true,
									stepSize: 1,
								},
							},
						],
					},
					responsive: false,
					maintainAspectRatio: false,
					devicePixelRatio: defaultDevicePixelRatio,
				}}
				width={defaultWidth}
				height={defaultHeight}
			/>
			<Line
				data={timeData}
				options={{
					title: {
						display: true,
						text: 'Total watch times',
						fontSize: defaultFontSize,
					},
					legend: {
						display: true,
						position: 'top',
					},
					scales: {
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
					devicePixelRatio: defaultDevicePixelRatio,
				}}
				width={defaultWidth}
				height={defaultHeight}
			/>
		</Dialog>
	);
}
