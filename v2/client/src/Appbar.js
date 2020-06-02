import React from 'react';
import { Link } from 'react-router-dom';

import { baseURL } from './config';
import './Appbar.scss';

/**
 * App bar: consisting the logo and some menu buttons
 */
function AppBar() {
    return (
        <div className='appbar'>
            <div className="appbar-logo">
                SlideChat
            </div>
            <div>
                <span className='appbar-item'>Notification</span>
                <Link to={`${baseURL}/profile`} className='appbar-item'>
                    My Courses
                </Link>
            </div>
        </div>
    );
}

export default AppBar;