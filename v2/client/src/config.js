let baseURL, fullURL;
if (process.env.NODE_ENV === 'production') {
    baseURL = "/slidechat";
    fullURL = "/slidechat";
} else {
    baseURL = "http://mcsapps.utm.utoronto.ca:10000/slidechat";
    fullURL = "http://mcsapps.utm.utoronto.ca:10001/slidechat";
}

export { baseURL, fullURL }