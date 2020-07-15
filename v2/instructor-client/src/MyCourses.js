import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';

import Course from './Course';
import { serverURL } from './config';


/**
 * The profile page for instructors (not for students for now)
 * This page lists all the courses of the instructor and all the slides
 */
export default function MyCourses(props) {
    let [courses, setCourses] = useState([]);
    let newCourseRef = useRef(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            let res = await axios.get(`${serverURL}/p/api/myCourses`);
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const createCourse = async () => {
        try {
            await axios.post(`${serverURL}/p/api/createCourse`, {
                course: newCourseRef.current.value,
            })
        } catch (err) {
            console.error(err);
        }
        fetchCourses();
    }

    return (
        <div className="profile">
            <div className="title">My Courses</div>
            {courses.map(course =>
                <Course cid={course.id}
                    role={course.role}
                    key={course.id} />
            )}
            <div className="createCourse-bar">
                <TextField
                    variant='outlined'
                    id={`new-course`}
                    placeholder="Course Name"
                    inputRef={newCourseRef} />
                <Button id="fileSubmit" onClick={createCourse} variant="contained" color="primary">Create Course</Button>
            </div>
        </div>
    );
}
