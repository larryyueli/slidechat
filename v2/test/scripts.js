// this file contains some scripts while developing. Copy the script to somewhere
// like api routers to run.
const f = (async () => {
	let c = await slides.find({}, { projection: { pages: 1 } });
	let s = await c.toArray();
	for (let i of s) {
		console.log(i._id);
		i.pages.forEach((page, pageNum) => {
			page.questions.forEach((q, qid) => {
				// console.log(`${pageNum}, ${qid}, ${q ? q.title : "null"}`);
				let query = {};
				query[`pages.${pageNum}.questions.${qid}.id`] = qid;
				slides.updateOne({ _id: i._id }, { $set: query }).then((res) => console.log(res.result));
			});
		});
	}
})();
