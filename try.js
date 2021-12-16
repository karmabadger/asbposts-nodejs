const env_vars = require('./config/env.js');


const mongo_config = require("./config/mongodb.js");
const { mongo_connect, mongo_url } = mongo_config;

mongo_connect();

const get_snoowrap = require('./src/reddit/snoowrap.js');
const pushshift_post_search_after = require('./src/reddit/pushshift.js');

const r = get_snoowrap();

async function find_one_by_post_id_and_update_or_create(post) {
    const query = await postModel.findOne({ post_id: post.post_id });
    let post_mongo;

    if (query) {
        post_mongo = await postModel.findOneAndUpdate({ post_id: post.post_id }, post, { upsert: true, new: true });
    } else {
        post_mongo = await postModel.create(post);
    }

    return post_mongo;
}

async function getSubmission(reddit, submission_id){
    let r_post = await reddit.getSubmission(submission_id).fetch();
    return r_post;
}


async function run(){
    let res = await getSubmission(r, "khf8n4");
    let res2 = await getSubmission(r, "re0g86");
    let res3 = await getSubmission(r, "rgx27v");
    let res4 = await getSubmission(r, "kggb5r");
    let res5 = await getSubmission(r, "rgj2gd");

    let res5_1 = await res5.expandReplies();

    // let res5 = await getSubmission(r, "gges0d5");

    let results = await r.getContentByIds([r.getSubmission('khf8n4'), r.getSubmission('re0g86'), r.getSubmission('rgx27v')]);
    console.log(res);


    console.log(env_vars);



    

}


run();