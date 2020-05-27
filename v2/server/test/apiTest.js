const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const URL = 'http://mcsapps.utm.utoronto.ca:10000/slidechat';

async function test() {
    let courseID;

    // console.log('create course')
    // await axios.post(URL + '/api/createCourse', {
    //     user: "lulingxi",
    //     course: "test101"
    // }).then(res => {
    //     console.log(res.status);
    //     console.log(res.data);
    //     courseID = res.data.id;
    // }).catch(err => {
    //     console.error(err.response.status);
    //     console.error(err.response.data);
    // })


    // // this doesn't work right now
    // console.log('upload pdf')
    // let form = new FormData();
    // form.append("cid", courseID);
    // form.append("anonymity", "anyone");
    // form.append("user", "lulingxi");
    // form.append('file', fs.createReadStream('./example.pdf'));
    // await axios.post(URL + '/api/addSlide',
    //     form
    // ).then(res => {
    //     console.log(res.status);
    //     console.log(res.data);
    //     slideID = res.data.id;
    // }).catch(err => {
    //     console.error(err.response.status);
    //     console.error(err.response.data);
    // })

    let slideID = '5ecccbe315df085cf03fa61f';

    // // add question
    // console.log('create question')
    // await axios.post(URL + '/api/addQuestion', {
    //     user: "lulingxi",
    //     sid: slideID,
    //     pageNum: 1,
    //     title: 'test question title',
    //     body: 'question body'
    // }).then(res => {
    //     console.log(res.status);
    //     console.log(res.data);
    //     courseID = res.data.id;
    // }).catch(err => {
    //     console.error(err.response.status);
    //     console.error(err.response.data);
    // })

    // // add a chat
    // console.log('add chat')
    // await axios.post(URL + '/api/addChat', {
    //     user: "lulingxi",
    //     sid: slideID,
    //     pageNum: 1,
    //     qid: 0,
    //     body: 'answer'
    // }).then(res => {
    //     console.log(res.status);
    //     console.log(res.data);
    //     courseID = res.data.id;
    // }).catch(err => {
    //     console.error(err.response.status);
    //     console.error(err.response.data);
    // })

    // // delete a question
    // console.log('delete question')
    // await axios.delete(`${URL}/api/question?sid=${slideID}&pageNum=1&qid=1`, {
    //     data: { user: "lulingxi" }
    // }).then(res => {
    //     console.log(res.status);
    //     console.log(res.data);
    //     courseID = res.data.id;
    // }).catch(err => {
    //     console.error(err.response.status);
    //     console.error(err.response.data);
    // })

    // // delete a chat
    // console.log('delete chat')
    // await axios.delete(`${URL}/api/chat?sid=${slideID}&pageNum=1&qid=0&cid=1`, {
    //     data: { user: "lulingxi" }
    // }).then(res => {
    //     console.log(res.status);
    //     console.log(res.data);
    //     courseID = res.data.id;
    // }).catch(err => {
    //     console.error(err.response.status);
    //     console.error(err.response.data);
    // })

    // // like
    // console.log('like')
    // await axios.post(URL + '/api/like', {
    //     user: "someone",
    //     sid: slideID,
    //     pageNum: 1,
    //     qid: 0,
    //     cid: 0
    // }).then(res => {
    //     console.log(res.status);
    //     console.log(res.data);
    //     courseID = res.data.id;
    // }).catch(err => {
    //     console.error(err.response.status);
    //     console.error(err.response.data);
    // })

    // endorse
    console.log('endorse')
    await axios.post(URL + '/api/like', {
        user: "lulingxi",
        sid: slideID,
        pageNum: 1,
        qid: 0,
        cid: 0
    }).then(res => {
        console.log(res.status);
        console.log(res.data);
        courseID = res.data.id;
    }).catch(err => {
        console.error(err.response.status);
        console.error(err.response.data);
    })
}

test();


