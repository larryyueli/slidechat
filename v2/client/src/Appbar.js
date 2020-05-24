import React from 'react';

import './App.scss';

/**
 * App bar: consisting the logo and some menu buttons
 */
class AppBar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let content;
        if (this.props.state === "main"){
            content = <span className='appbar-item' onClick={this.props.toProfile}>Profile</span>;
        }else{
            content = <span className='appbar-item' onClick={this.props.toMain}>Main</span>;
        }
        return (
            <div className='appbar'>
                <div className="appbar-logo">
                    SlideChat
                </div>
                <div>
                    <span className='appbar-item'>Notification</span>
                    {content}
                </div>
            </div>
        );
    }
}

export default AppBar;