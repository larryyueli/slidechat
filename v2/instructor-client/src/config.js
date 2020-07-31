const baseURL = '/slidechat';
const instructorURL = '/prof';
const fullURL = () =>
	`${window.location.protocol}//${window.location.hostname}${
		window.location.port ? ':' + window.location.port : ''
	}${baseURL}`;

let serverURL;
if (process.env.NODE_ENV === 'production') {
	serverURL = baseURL;
} else {
	// create a .env.development.local file in instructor-client/ when working in a team to avoid conflicting settings with your teammates: https://create-react-app.dev/docs/adding-custom-environment-variables/
	// example:
	// PORT=10003
	// REACT_APP_SERVER_URL=http://mcsapps.utm.utoronto.ca:10001
	serverURL = process.env.REACT_APP_SERVER_URL || 'http://mcsapps.utm.utoronto.ca:10001';
}

export { baseURL, instructorURL, fullURL, serverURL };
