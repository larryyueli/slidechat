import React from 'react';

import './App.scss';

/**
 * App bar: consisting the logo and some menu buttons
 */
class AppBar extends React.Component {

    render() {
        return (
            <div className='appbar'>
                <div className="appbar-logo">
                    SlideChat
                </div>
                <div>
                    <span className='appbar-item'>Notification</span>
                    <span className='appbar-item'>Profile</span>
                </div>
            </div>
        );
    }
}

export default AppBar;