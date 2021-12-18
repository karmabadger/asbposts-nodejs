const fs = require('fs');

const mongo_config = require("./config/mongodb.js");
const { mongo_connect, mongo_url } = mongo_config;

mongo_connect();

const postModel = require("./src/models//posts/Post.js");

const get_snoowrap = require('./src/reddit/snoowrap.js');
const pushshift_post_search_after = require('./src/reddit/pushshift.js');

const r = get_snoowrap();

const sleep = require('./src/utils/sleep/sleep.js');


async function log_res(res) {
    fs.writeFileSync('logs/log_thread.txt', res, {
        flag: 'a+',
        encoding: 'utf8',
    });
}

async function writeToFile(file_name, res) {
    fs.writeFileSync(file_name, res, {
        flag: 'a+',
        encoding: 'utf8',
    });
}

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

async function getSubmission(reddit, submission_id) {
    let r_post = await reddit.getSubmission(submission_id).fetch();
    return r_post;
}

async function getSubmissions(reddit, submission_ids) {
    let r_posts = await reddit.getSubmissions(submission_ids);
    return r_posts;
}

async function getSubmission(reddit, submission_id) {
    let r_post = await reddit.getSubmission(submission_id).fetch();
    return r_post;
}


function check_if_post_is_valid(post_obj, naughty_list) {

    if (post_obj == null) {
        return -1;
    }

    if (post_obj.author == null || post_obj.author.name == null || post_obj.author.name == "") {
        return 1;
    }

    if (post_obj.author.name == "[deleted]") {
        return 2;
    }

    if (post_obj.selftext == null || post_obj.selftext == "[deleted]") {
        return 3;
    }

    if (post_obj.author.name == "AutoModerator") {
        return 4;
    }

    if (naughty_list.includes(post_obj.author.name)) {
        return 5;
    }

    if (post_obj.removed_by_category != null) {
        return 6;
    }

    if (post_obj.removed) {
        return 7;
    }

    return 0;
}


function check_if_comment_is_valid(comment_obj, naughty_list) {

    if (comment_obj == null) {
        return -1;
    }

    if (comment_obj.author == null || comment_obj.author.name == null || comment_obj.author.name == "") {
        return 1;
    }

    if (comment_obj.author.name == "[deleted]") {
        return 2;
    }

    if (comment_obj.body == null || comment_obj.body == "[deleted]") {
        return 3;
    }

    if (comment_obj.author.name == "AutoModerator") {
        return 4;
    }

    if (naughty_list.includes(comment_obj.author.name)) {
        return 5;
    }

    if (comment_obj.removed == true) {
        return 6;
    }

    return 0;
}

async function run(post_id) {

    let naughty_list = [
        'PEEing_bot',
    ]
    // this is 2020/12/13 00:00:00 one day before the beginning of the subreddit
    const r_post = await getSubmission(r, post_id);

    if (r_post) {

        let post_valid = check_if_post_is_valid(r_post, naughty_list);

        switch (post_valid) {
            case 0:
                break;
            case (-1):
                console.log("Post is null for", post_id);
                return;
            case 1:
                console.log("Author is null for", r_post.id);
                return;
            case 2:
                console.log("Author is [deleted] for", r_post.id);
                return;
            case 3:
                console.log("Selftext is null or deleted for", r_post.id);
                return;
            case 4:
                console.log("Author is AutoModerator for", r_post.id);
                return;
            case 5:
                console.log("Author is in naughty list for", r_post.id);
                return;
            case 6:
                console.log("Post is removed by category for", r_post.id);
                return;
            case 7:
                console.log("Post", r_post.id, "is removed for", r_post.removed_by_category);
                return;
            default:
                break;
        }

        // else 
        // console.log(r_post)
        let r_data = {
            "post_id": r_post.id,
            "author": r_post.author.name,
            "link": r_post.url,
            "upvotes": r_post.ups,
            "downvotes": r_post.downs,
            "created_utc": r_post.created_utc,
            "created_utc_date": new Date(r_post.created_utc * 1000),
            "submission_type": "submission"
        }

        // add to mongo db
        for (let j = 0; j < 5; j++) {
            try {
                console.log(j, "Trying to find_one_by_post_id_and_update_or_create", r_data.post_id);
                let r_post_mongo = await find_one_by_post_id_and_update_or_create(r_data);
                console.log("Saved post", r_post_mongo.post_id);

                log_res(r_post_mongo.post_id + "\n");
                // num_posts++;
                // total_num_posts++;
                break;
            } catch (err) {
                console.log("Error", r_post.id, err);
            }
        }

        let res;
        try {
            res = await r_post.expandReplies();
        } catch (err) {
            console.log("Error expanding replies", r_post.id, err);

            console.log("trying again after 310 seconds");
            await sleep(310 * 1000);
        }


        if (r_post.num_comments > 0) {

            if (res && res.comments.length > 0) {

                // stack based DFS
                let stack = res.comments;

                console.log("num_comments", r_post.num_comments);
                console.log("stack length", stack.length);

                let counter = 0;
                while (stack.length > 0) {

                    let comment = stack.pop();
                    counter++;

                    let comment_valid = check_if_comment_is_valid(comment, naughty_list);

                    switch (comment_valid) {
                        case 0:
                            {
                                let c_data = {
                                    "post_id": comment.id,
                                    "author": comment.author.name,
                                    "parent_id": comment.parent_id,
                                    "link": "https://www.reddit.com" + comment.permalink,
                                    "upvotes": comment.ups,
                                    "downvotes": comment.downs,
                                    "created_utc": comment.created_utc,
                                    "created_utc_date": new Date(comment.created_utc * 1000),
                                    "submission_type": "comment"
                                }

                                for (let j = 0; j < 5; j++) {
                                    try {
                                        console.log(j, "Trying to find_one_by_post_id_and_update_or_create", c_data.post_id);
                                        let c_post_mongo = await find_one_by_post_id_and_update_or_create(c_data);
                                        console.log("Saved comment", c_post_mongo.post_id);
                                        log_res(c_post_mongo.post_id + "\n");

                                        // num_posts++;
                                        // total_num_posts++;
                                        break;
                                    } catch (err) {
                                        console.log("Error", c_data.post_id, err);
                                    }
                                }
                            }
                            break;
                        case -1:
                            console.log("Comment is null for", comment.id);
                            break;
                        case 1:
                            console.log("Comment Author is null for", comment.id);
                            break;
                        case 2:
                            console.log("Author is [deleted] for", comment.id);
                            break;
                        case 3:
                            console.log("Selftext is null or deleted for", comment.id);
                            break;
                        case 4:
                            console.log("Author is AutoModerator for", comment.id);
                            break;
                        case 5:
                            console.log("Author is in naughty list for", comment.id);
                            break;
                        case 7:
                            console.log("Comment", comment.id, "is removed");
                            break;
                        default:
                            break;
                    }



                    if (comment.replies && comment.replies.length > 0) {
                        stack = stack.concat(comment.replies);
                    }
                }

                console.log("Finished processing comments for", r_post.id, "total", counter);
            }
            else {
                console.log("No comments for", r_post.id);
                return;
            }
        } else {
            console.log("No comments for", r_post.id);
            return;
        }


    } else {
        console.log("Couldn't get submission", p_post.id);
        return;
    }
}

run("rg9fdw");