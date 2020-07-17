function errorHandler(res, err) {
    if (err && err.status) {
        console.log(err.error)
        return res.status(err.status).send({ error: err.error });
    } else {
        console.error(err);
        return res.status(500).send();
    }
}

function isNotValidPage(pageNum, pageTotal) {
    if (!Number.isInteger(+pageNum)
        || +pageNum < 1
        || +pageNum > pageTotal) {
        return true;
    }
    return false;
}

function notExistInList(index, list) {
    // if (isNaN(index)
    //     || +index < 0
    //     || +index >= list.length
    //     || !list[+index]) {
    //     return true;
    // }
    // return false;
    try {
        if (list[+index]) return false;
    } catch (err) {
        return true;
    }
    return true;
}

function questionCount(questions) {
    return questions.reduce((total, curr) => {
        return total + (curr ? 1 : 0);
    }, 0);
}

module.exports = {
    errorHandler,
    isNotValidPage,
    notExistInList,
    questionCount
}
