const baseURL = '/slidechat';
const instructorURL = '/p/prof';
const fullURL = () => `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${baseURL}`;

let serverURL;
if (process.env.NODE_ENV === 'production') {
    serverURL = '/slidechat';
} else {
    serverURL = "http://mcsapps.utm.utoronto.ca:10001";
}

export { baseURL, instructorURL, fullURL, serverURL };