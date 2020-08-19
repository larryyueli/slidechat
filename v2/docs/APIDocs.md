# API Documentation

## APIs for both students and instructors

### GET /api/course

Get the course information, the list of slides of the course and list of instructors

Request query:

-   id: object ID of a course

Response JSON:

-   name: course name
-   instructors
-   slides: array of slides
    -   id: id of a slide
    -   filename

### GET /api/slideInfo

Get information of a slide, e.g. total number of pages, filename, title, etc.

Request query:

-   slideID: object ID of a slide

Response JSON:

-   filename
-   pageTotal: number of pages
-   title: a short description
-   anonymity: anonymity level of a slide
-   loginUser: the user ID who requested this API, undefined if not logged in
-   username: if logged in, return a short name of the user given by the login system
-   isInstructor: if the user who requested this API is an instructor who teaches this course
-   drawable: if this slide allows drawing when asking an question

### GET /api/slideImg

Get the image of one page of a slide.
Login required if the anonymity level is not "anyone".

Request query:

-   slideID: object ID of a slide
-   pageNum: integer range from from 1 to pageTotal (inclusive)

Response: an image file

### GET /api/slideAudio

Get audio of one page of slide.
Login required if the anonymity level is not "anyone".

Request query:

-   slideID: object ID of a slide
-   pageNum: integer range from from 1 to pageTotal (inclusive)

Response: an audio file

### GET /api/hasAudio

Get if the page has an audio attached

Request query:

-   slideID: object ID of a slide
-   pageNum: integer range from from 1 to pageTotal (inclusive)

Response JSON:

-   audio: true if there is, otherwise false

### GET /api/downloadPdf

Download a PDF file.
Login required if the anonymity level is not "anyone".

Request query:

-   slideID: object ID of a slide

Response: a PDF file

### GET /api/questions

Get the question list of a page of a slide.
Login required if the anonymity level is not "anyone".

Request query:

-   slideID: object ID of a slide
-   pageNum: integer range from from 1 to pageTotal (inclusive)

Response JSON:

-   Array of question objects, sorted in creation order, for each question object:
    -   status: 'solved' or 'unsolved'
    -   time: time when the question is last update, in milliseconds since the epoch
    -   title: title of a question
    -   user: user who created this question
    -   id: id of the question
    -   create: time when the question is first created, in milliseconds since the epoch

### GET /api/chat

Get chats under a question.
Login required if the anonymity level is not "anyone".

Request query:

-   slideID: object ID of a slide
-   pageNum: integer range from from 1 to pageTotal (inclusive)
-   qid: question index, integer range from from 0 to questions.length (exclusive)

Response JSON:

-   title: the title of the question
-   drawing: the drawing attached to the question
-   chats: an array of chat object, sorted in time order, for each object:
    -   time: time when the chat is posted, in milliseconds since the epoch
    -   body: chat message
    -   user
    -   likes: an array of user who liked this message
    -   endorsement: if an instructor endorsed this message

### POST /api/addQuestion

Post a new question.
Login required if the anonymity level is not "anyone".

Request body:

-   sid: slide id
-   pageNum: page number
-   title: question title, cannot be an empty string
-   body(optional): question body
-   user: userID
-   drawing(optional): the drawing for the question

Response: status code only

### POST /api/addChat

Post a new response to a question.
Login required if the anonymity level is not "anyone".

Request body:

-   sid: slide id
-   qid: question index, integer range from from 0 to questions.length (exclusive)
-   pageNum: page number
-   body: message body
-   user: userID

Response: status code only

### POST /api/like

Like a response of a question.
Login required if the anonymity level is not "anyone".
If anonymity level is "anyone", users can like a chat an arbitrary number of times; otherwise, if an user already liked a chat, the next request will unlike it.

Request body:

-   sid: slide id
-   qid: question index
-   cid: chat index
-   pageNum: page number
-   user: userID

Response: status code only

### POST /api/modifyChat

Modify the content of a chat message
Only the owner of the message is allowed. Anonymous chat does not allow anyone to modify.
Login required.

Request body:

-   sid: slide id
-   qid: question index
-   cid: chat index
-   pageNum: page number
-   body: message body

Response: status code only

### POST /api/deleteOwnChat

Delete one's own chat message
Anonymous chat does not allow anyone to delete except instructors.
Index 0 (question body) is not allowed to delete because it contains question owner information.
Login required.

Request body:

-   sid: slide id
-   qid: question index
-   cid: chat index
-   pageNum: page number

Response: status code only

## APIs for instructors

### GET /api/myCourses

Get the course list the instructor joined.

Response JSON:

-   uid: instructor's user ID
-   user: instructor's user name
-   courses: array of courses
    -   role: role in the course
    -   id: course ID

### GET /api/unusedQuestions

Get the list of unused questions of a slide.

Request query:

-   id: Slide ID

Response JSON:

-   Array of unused pages contain questions
    -   questions: Array of question objects, for each question object:
        -   status: 'solved' or 'unsolved'
        -   time: time when the question is last update, in milliseconds since the epoch
        -   title: title of a question
        -   user: user who created this question
        -   id: id of the question
        -   create: time when the question is first created, in milliseconds since the epoch

### POST /api/createCourse

Create a new course.

Request body:

-   course: course name

Response JSON:

-   id: the created course ID

### POST /api/updateCourseName

Change the course name.

Request body:

-   name: course name
-   cid: course ID

Response: status code only

### DELETE /api/course

Delete a course.

Request query:

-   cid: course ID

Response: status code only

### POST /api/addInstructor

Add a new instructor to a course.

Request body:

-   newUser: user ID of new instructor
-   course: course ID

Response: status code only

### POST /api/addSlide

Add a new slide to the course.

Request body:

-   cid: Course ID
-   anonymity: anonymity level of the new slide, one of 'anyone', 'student', and 'nonymous'

Request files:

-   file: \*.pdf

Response JSON:

-   id: the created Slide ID

### POST /api/uploadNewSlide

Upload a new version of slide.

Request body:

-   sid: the old Slide ID

Request files:

-   file: \*.pdf

Response: status code only

### POST /api/audio

Post audio to page.

Request body:

-   sid: Slide ID
-   pageNum: integer range from from 1 to pageTotal (inclusive)

Request files:

-   file: \*.mp3

Response: status code only

### DELETE /api/audio

Delete audio on the page.

Request query:

-   sid: Slide ID
-   pageNum: integer range from from 1 to pageTotal (inclusive)

Response: status code only

### POST /api/reorderQuestions

Post the new order of the slide.

Request body:

-   questionOrder: the order of questions
-   sid: Slide ID

Response: status code only

### POST /api/setTitle

Set a new title of the slide.

Request body:

-   title: new title of the slide
-   sid: Slide ID

Response: status code only

### POST /api/setAnonymity

Set the anonymity level of the slide.

Request body:

-   anonymity: new anonymity level of the slide
-   sid: Slide ID

Response: status code only

### POST /api/setDrawable

Set drawable of the slide.

Request body:

-   drawable: new drawable of the slide
-   sid: Slide ID

Response: status code only

### DELETE /api/slide

Delete the slide.

Request query:

-   sid: Slide ID

Response: status code only

### DELETE /api/question

Delete the question.

Request query:

-   sid: Slide ID
-   pageNum: page number, integer range from from 1 to pageTotal (inclusive)
-   qid: question index, integer range from from 0 to questions.length (exclusive)

Response: status code only

### DELETE /api/chat

Delete the chat.
Deleting the 0th chat (question body) of a question is not allowed due to it contains the time the question is created.

Request query:

-   sid: Slide ID
-   pageNum: page number, integer range from from 1 to pageTotal (inclusive)
-   qid: question index, integer range from from 0 to questions.length (exclusive)
-   cid: chat index

Response: status code only

### POST /api/endorse

Endorse a chat (if already endorsed by the user, then revoke endorsement).

Request body:

-   sid: Slide ID
-   pageNum: page number, integer range from from 1 to pageTotal (inclusive)
-   qid: question index, integer range from from 0 to questions.length (exclusive)
-   cid: chat index

Response: status code only
