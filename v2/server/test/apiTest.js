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
    // form.append("anoymity", "anyone");
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

    // add a chat
    console.log('add chat')
    await axios.post(URL + '/api/addChat', {
        user: "lulingxi",
        sid: slideID,
        pageNum: 1,
        qid: 0,
        body: 'answer'
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


