import React, { useState, useEffect } from 'react';
import axios from 'axios';

import ChatArea from './ChatArea';
import Slides from './Slides';
import { serverURL } from './config';

/**
 * The main body of the application
 * It consists two main components: slides on the left, and chat area on the right. Changing the page
 * number will need to change both sides.
 */
function Main(props) {
    const sid = props.match.params.slideId;
    const [pageTotal, setPageTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [title, setTitle] = useState("");
    const [filename, setFilename] = useState("");

    useEffect(() => {
        axios.get(`${serverURL}/api/slideInfo?slideID=${sid}`).then(res => {
            let currentPage = 1;
            if (window.location.hash) {
                let n = +window.location.hash.substring(1);
                if (n > 0 && n <= res.data.pageTotal && Number.isInteger(n)) {
                    currentPage = n;
                }
            }

            setPage(currentPage);
            setPageTotal(res.data.pageTotal);
            setTitle(res.data.title);
            setFilename(res.data.filename);
            document.getElementById("pageNum").value = currentPage;
        }).catch(err => {
            console.error(err);
        });
    }, [sid]);

    /**
     * Go to the next page of slide, should fetch the url and the chat threads list of the new page 
     */
    const nextPage = () => {
        if (page >= pageTotal) return;
        let newPageNum = page + 1;
        document.getElementById("pageNum").value = newPageNum;
        window.location.hash = newPageNum;
        setPage(newPageNum);
    }

    /**
     * Go to the previous page of slide, should fetch the url and the chat threads list of the new page 
     */
    const prevPage = () => {
        if (page < 2) return;
        let newPageNum = page - 1;
        document.getElementById("pageNum").value = newPageNum;
        window.location.hash = newPageNum;
        setPage(newPageNum);
    }

    const gotoPage = () => {
        let newPageNum = +document.getElementById("pageNum").value;
        if (!Number.isInteger(newPageNum)) {
            document.getElementById("pageNum").value = page;
            return;
        }
        if (newPageNum > pageTotal) {
            newPageNum = pageTotal;
        } else if (newPageNum < 1) {
            newPageNum = 1;
        }
        document.getElementById("pageNum").value = newPageNum;
        window.location.hash = newPageNum;
        setPage(newPageNum);
    }

    return (
        <div className="main">
            <Slides
                title={title}
                filename={filename}
                sid={sid}
                pageNum={page}
                pageTotal={pageTotal}
                nextPage={nextPage}
                prevPage={prevPage}
                gotoPage={gotoPage} />
            <ChatArea
                sid={sid}
                pageNum={page} />
        </div>
    );
}


export default Main;