-- phpMyAdmin SQL Dump
-- version 4.2.10
-- http://www.phpmyadmin.net
--
-- Host: localhost:3306
-- Generation Time: Oct 17, 2016 at 05:12 PM
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
(1, 'test@test.com', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'test@test.com | 5804e9ba2b9465804e9ba2b94f5804e9ba2b954', 1, 'p1');

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

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
(20, 'CSC', 1),
(21, 'asdas', 1);

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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `material`
--

INSERT INTO `material` (`id`, `cid`, `filepath`, `filename`, `cui`, `numquestions`, `pagenumber`) VALUES
(29, 20, 'slides/Lecture3Sept21th2016CSC324.pdf', 'Lecture3Sept21th2016CSC324.pdf', '57eaa4c75f536*^!57eaa4c75f56e', 6, 1),
(30, 21, 'slides/a1.pdf', 'a1.pdf', '57ec73133e60c*^!57ec73133e651', 1, 0),
(31, 20, 'slides/00Intro.pdf', '00Intro.pdf', '57f276e28b9af*^!57f276e28bac6', 0, 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `uid`, `question`, `writer`, `date`, `numanswers`, `pagenumber`) VALUES
(1, '57eaa4c75f536*^!57eaa4c75f56e', 'yo', 'anonymous', 'September 28, 2016, 9:47 pm', 4, 1),
(2, '57eaa4c75f536*^!57eaa4c75f56e', 'page 2 test question', 'anonymous', 'September 28, 2016, 9:47 pm', 0, 2);

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
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `course`
--
ALTER TABLE `course`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=22;
--
-- AUTO_INCREMENT for table `material`
--
ALTER TABLE `material`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=32;
--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3;