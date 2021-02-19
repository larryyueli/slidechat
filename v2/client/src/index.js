import React from 'react';
import ReactDOM from 'react-dom';
import './App.scss';
import App from './App';

let preferDark = localStorage.getItem('SlideChat_DarkTheme') === '1';
if (preferDark === null) preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (preferDark) document.documentElement.setAttribute('data-theme', 'dark');

ReactDOM.render(<App />, document.getElementById('root'));

if (window.navigator.serviceWorker) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register(`${process.env.PUBLIC_URL}/serviceWorker.js`)
			.then((reg) => console.log(`service worker registered with scope "${reg.scope}"`))
			.catch((err) => console.error(err));
	});
} else {
	console.log('service worker not supported');
}
