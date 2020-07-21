const baseURL = '/slidechat';
const fullURL = () => `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${baseURL}`;

let serverURL;
if (process.env.NODE_ENV === 'production') {
    serverURL = '/slidechat';
} else {
    serverURL = "http://mcsapps.utm.utoronto.ca:10003";
}

export { baseURL, fullURL, serverURL };