import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@material-ui/core';

import AppBar from './AppBar';
import Course from './Course';
import NewCourse from './NewCourse';
import { serverURL } from './config';

/**
 * The profile page for instructors (not for students for now)
 * This page lists all the courses of the instructor and all the slides
 */
export default function MyCourses(props) {
	const [show, setShow] = useState(false);
	let [courses, setCourses] = useState([]);
	let [user, setUser] = useState('');

	useEffect(() => {
		fetchCourses();
	}, []);

	const fetchCourses = async () => {
		try {
			let res = await axios.get(`${serverURL}/api/myCourses`);
			setUser(res.data.user);
			setCourses(res.data.courses.sort((a, b) => b.time - a.time));
		} catch (err) {
			console.error(err);
		}
	};

	const showOrHide = () => {
		setShow(!show);
	};

	return (
		<>
			<AppBar user={user} />
			<div className='profile'>
				<div className='title'>My Courses</div>
				<div className='createCourse-bar'>
					<Button onClick={showOrHide} variant='contained' color='primary'>
						Create Course
					</Button>
					<NewCourse show={show} showOrHide={showOrHide} fetchCourses={fetchCourses} />
					{/* <TextField variant='outlined' id={`new-course`} placeholder='Course Name' inputRef={newCourseRef} /> */}
				</div>
				{courses.map((course) => (
					<Course
						cid={course.id}
						role={course.role}
						minimizeStatus={Boolean(course.minimized)}
						key={course.id}
						creationTime={course.time}
						fetchCourses={fetchCourses}
					/>
				))}
			</div>
		</>
	);
}
