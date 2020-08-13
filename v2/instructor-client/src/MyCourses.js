import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';

import AppBar from './AppBar';
import Course from './Course';
import { serverURL } from './config';

/**
 * The profile page for instructors (not for students for now)
 * This page lists all the courses of the instructor and all the slides
 */
export default function MyCourses(props) {
	let [courses, setCourses] = useState([]);
	let [user, setUser] = useState('');
	let newCourseRef = useRef(null);

	useEffect(() => {
		fetchCourses();
	}, []);

	/**
	 * fetch course list from server
	 */
	const fetchCourses = async () => {
		try {
			let res = await axios.get(`${serverURL}/api/myCourses`);
			setUser(res.data.user);
			setCourses(res.data.courses);
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * create a new course
	 */
	const createCourse = async () => {
		try {
			if (!newCourseRef.current.value){
				return;
			}
			await axios.post(`${serverURL}/api/createCourse`, {
				course: newCourseRef.current.value,
			});
		} catch (err) {
			console.error(err);
		}
		fetchCourses();
	};

	return (
		<>
			<AppBar user={user} />
			<div className='profile'>
				<div className='title'>My Courses</div>
				{courses.map((course) => (
					<Course cid={course.id} role={course.role} key={course.id} fetchCourses={fetchCourses}/>
				))}
				<div className='createCourse-bar'>
					<TextField variant='outlined' id={`new-course`} placeholder='Course Name' inputRef={newCourseRef} />
					<Button id='fileSubmit' onClick={createCourse} variant='contained' color='primary'>
						Create Course
					</Button>
				</div>
			</div>
		</>
	);
}
