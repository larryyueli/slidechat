-- phpMyAdmin SQL Dump
-- version 4.2.10
-- http://www.phpmyadmin.net
--
-- Host: localhost:3306
-- Generation Time: Oct 25, 2016 at 02:34 AM
-- Server version: 5.5.38
-- PHP Version: 5.6.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `slidechat`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
`id` int(11) NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `token` text NOT NULL,
  `accounttype` int(11) NOT NULL,
  `postingToken` text NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `email`, `password`, `token`, `accounttype`, `postingToken`) VALUES
(1, 'test@test.com', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'test@test.com | 580e2db6b34c9580e2db6b34e5580e2db6b350a', 1, 'p1');

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
`id` int(11) NOT NULL,
  `qid` int(11) NOT NULL,
  `answer` text NOT NULL,
  `date` text NOT NULL,
  `uid` text NOT NULL,
  `pagenumber` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`id`, `qid`, `answer`, `date`, `uid`, `pagenumber`) VALUES
(3, 7, 'adsa', 'October 25, 2016, 2:03 am', '580e93fdc98ee*^!580e93fdc9970', 0),
(4, 7, 'test comment', 'October 25, 2016, 2:10 am', '580e93fdc98ee*^!580e93fdc9970', 1),
(5, 7, 'yolo', 'October 25, 2016, 2:12 am', '580e93fdc98ee*^!580e93fdc9970', 1),
(6, 11, 'asdas', 'October 25, 2016, 2:13 am', '580e93fdc98ee*^!580e93fdc9970', 1),
(7, 10, 'adasda', 'October 25, 2016, 2:14 am', '580e93fdc98ee*^!580e93fdc9970', 1),
(8, 10, 'asdsa', 'October 25, 2016, 2:14 am', '580e93fdc98ee*^!580e93fdc9970', 1),
(9, 9, 'asdas', 'October 25, 2016, 2:14 am', '580e93fdc98ee*^!580e93fdc9970', 2),
(10, 8, 'asdas', 'October 25, 2016, 2:14 am', '580e93fdc98ee*^!580e93fdc9970', 2);

-- --------------------------------------------------------

--
-- Table structure for table `course`
--

CREATE TABLE `course` (
`id` int(11) NOT NULL,
  `name` text NOT NULL,
  `instructor_id` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `course`
--

INSERT INTO `course` (`id`, `name`, `instructor_id`) VALUES
(20, 'CSC', 1);

-- --------------------------------------------------------

--
-- Table structure for table `material`
--

CREATE TABLE `material` (
`id` int(11) NOT NULL,
  `cid` int(11) NOT NULL,
  `filepath` text NOT NULL,
  `filename` text NOT NULL,
  `cui` text NOT NULL,
  `numquestions` int(11) NOT NULL DEFAULT '0',
  `pagenumber` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `material`
--

INSERT INTO `material` (`id`, `cid`, `filepath`, `filename`, `cui`, `numquestions`, `pagenumber`) VALUES
(33, 20, 'slides/a4.pdf', 'a4.pdf', '580e938f29f01*^!580e938f29f4d', 0, 0),
(34, 20, 'slides/00Intro.pdf', '00Intro.pdf', '580e93fdc98ee*^!580e93fdc9970', 8, 0);

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
`id` int(11) NOT NULL,
  `uid` text,
  `question` text,
  `writer` text,
  `date` text NOT NULL,
  `numanswers` int(11) NOT NULL,
  `pagenumber` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `uid`, `question`, `writer`, `date`, `numanswers`, `pagenumber`) VALUES
(7, '580e93fdc98ee*^!580e93fdc9970', 'ba', 'ab', 'October 24, 2016, 7:37 pm', 3, 1),
(8, '580e93fdc98ee*^!580e93fdc9970', 'this works?', 'hi', 'October 24, 2016, 7:37 pm', 2, 2),
(9, '580e93fdc98ee*^!580e93fdc9970', 'asda', 'anonymous', 'October 24, 2016, 7:50 pm', 1, 2),
(10, '580e93fdc98ee*^!580e93fdc9970', 'adas', 'arjun', 'October 24, 2016, 7:51 pm', 2, 1),
(11, '580e93fdc98ee*^!580e93fdc9970', 'adasdas12312312', 'anonymous', 'October 24, 2016, 8:01 pm', 1, 1),
(12, '580e93fdc98ee*^!580e93fdc9970', 'a', 'anonymous', 'October 24, 2016, 8:28 pm', 0, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course`
--
ALTER TABLE `course`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `material`
--
ALTER TABLE `material`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
 ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT for table `course`
--
ALTER TABLE `course`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=22;
--
-- AUTO_INCREMENT for table `material`
--
ALTER TABLE `material`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=35;
--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13;