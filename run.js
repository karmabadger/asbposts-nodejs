const get_snoowrap = require('./src/reddit/snoowrap.js');
const pushshift_post_search_after = require('./src/reddit/pushshift.js');

const r = get_snoowrap();

console.log(r.config);


async function getSubmission(reddit, submission_id){
    let r_post = await reddit.getSubmission(submission_id).fetch();
    return r_post;
}

async function run(){
    // let r_post = await r.getSubmission("scx3j").fetch();
    // console.log(r_post.author);

    let r_post = await getSubmission(r, "scx3j");
    console.log(r_post.author);
}

run();