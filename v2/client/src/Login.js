import { baseURL } from './config';
import React from 'react';
import { Redirect } from 'react-router-dom';

/**
 * This is a dummy log in page, visiting this page will trigger the UTORID login,
 * and thus when it page is retrieved, the user already passed the UTORID login.
 * 
 * We then redirect the users to the page they were visiting.
 * @param {*} props 
 */
export default function Login(props) {
    document.cookie = "isLogin=yes; path=/";
    return <Redirect to={`${baseURL}/${props.match.params.slideId}#${window.location.hash}`} />
}
