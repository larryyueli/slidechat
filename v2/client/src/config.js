let baseURL;
if (process.env.NODE_ENV === 'production') {
    baseURL = "/slidechat";
} else {
    baseURL = "http://mcsapps.utm.utoronto.ca:10004/slidechat";
}
// const baseURL = "/slidechat";
const fullURL = "http://mcsapps.utm.utoronto.ca:10003/slidechat";

export { baseURL, fullURL }