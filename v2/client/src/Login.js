import { baseURL } from './config';

function Login(props) {
    // let date = new Date();
    // date.setTime(date.getTime() + (60 * 1000));
    // document.cookie = "isLogin=yes; expires=" + date.toUTCString() + "; path=/";
    document.cookie = "isLogin=yes; path=/";
    window.location.href = `${baseURL}/${props.match.params.slideId}#${window.location.hash}`;
}

export default Login;