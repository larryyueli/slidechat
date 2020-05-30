let baseURL;
if (process.env.NODE_ENV === 'production') {
    baseURL = "/slidechat";
} else {
    baseURL = "http://mcsapps.utm.utoronto.ca:10000/slidechat";
}

const fullURL = "http://mcsapps.utm.utoronto.ca:10001/slidechat";

export { baseURL, fullURL }