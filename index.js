// const fs = require('fs');

const mongo_config = require("./config/mongodb.js");
const { mongo_connect, mongo_url } = mongo_config;

mongo_connect();

const postModel = require("./src/models//posts/Post.js");

const get_snoowrap = require('./src/reddit/snoowrap.js');
const pushshift_post_search_after = require('./src/reddit/pushshift.js');

const r = get_snoowrap();

const sleep = require('./src/utils/sleep/sleep.js');


// async function log_res(res) {
//     fs.writeFileSync('logs/log.txt', res, {
//         flag: 'a+',
//         encoding: 'utf8',
//     });
// }

// async function writeToFile(file_name, res) {
//     fs.writeFileSync(file_name, res, {
//         flag: 'a+',
//         encoding: 'utf8',
//     });
// }

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




async function run() {

    let naughty_list = [
        'PEEing_bot',
    ]
    let num_batches = 0;

    // this is 2020/12/13 00:00:00 one day before the beginning of the subreddit
    let start_after = 1607835600
    let start_time = Date.now();

    let cur_start_after = start_after;

    let next_start_after = start_after;

    let num_posts = 0;
    let total_num_posts = 0;

    let last_pushshift_time = Date.now();

    while (cur_start_after < start_time) {

        let p_post = null;
        num_posts = 0;

        for (let i = 0; i < 5; i++) {

            console.log("Batch", num_batches, "Getting submissions after", cur_start_after);

            try {
                p_posts = await pushshift_post_search_after(cur_start_after, last_pushshift_time);
                last_pushshift_time = Date.now();

                console.log("Batch", num_batches, "Got", p_posts.data.length, "posts");
                break;
            } catch (err) {
                console.log(err);
                p_posts = null;
                last_pushshift_time = Date.now();
            }
        }

        if (p_posts || p_posts.data.length > 0) {

            // gets all the posts in the batch at once
            let p_post_objects = [];
            for (let i = 0; i < p_posts.data.length; i++) {
                let p_post = p_posts.data[i];
                p_post_objects.push(r.getSubmission(p_post.id));

                // writeToFile('posts.txt', p_post.id + '\n');
            }

            let r_posts_list = null;

            for (let j = 0; j < 5; j++) {
                console.log("Trying to Get all submissions for batch", num_batches, "at once", "Attempt", j, "number of posts", p_post_objects.length);
                try {
                    r_posts_list = await r.getContentByIds(p_post_objects);
                    console.log("Got submissions", r_posts_list.length);
                    post_in_batch = r_posts_list.length;
                    break;
                } catch (err) {
                    console.log("Error", err);

                    console.log("trying again after 310 seconds");
                    await sleep(310 * 1000);
                }
            }

            if (r_posts_list && r_posts_list.length > 0) {

                for (let i = 0; i < r_posts_list.length; i++) {
                    const r_post = r_posts_list[i];

                    if (r_post) {

                        let post_valid = check_if_post_is_valid(r_post, naughty_list);

                        switch (post_valid) {
                            case 0:
                                break;
                            case (-1):
                                console.log("Post is null for", post_id);
                                continue;
                            case 1:
                                console.log("Author is null for", r_post.id);
                                continue;
                            case 2:
                                console.log("Author is [deleted] for", r_post.id);
                                continue;
                            case 3:
                                console.log("Selftext is null or deleted for", r_post.id);
                                continue;
                            case 4:
                                console.log("Author is AutoModerator for", r_post.id);
                                continue;
                            case 5:
                                console.log("Author is in naughty list for", r_post.id);
                                continue;
                            case 6:
                                console.log("Post", r_post.id, "is removed for", r_post.removed_by_category);
                                continue;
                            case 7:
                                console.log("Post is removed for", r_post.id);
                                continue;
                            default:
                                break;
                        }

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

                                // log_res(r_post_mongo.post_id + "\n");
                                // console.log("Saved post", r_data);

                                num_posts++;
                                total_num_posts++;
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
                                                        // log_res(c_post_mongo.post_id + "\n");

                                                        num_posts++;
                                                        total_num_posts++;
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
                            } else {
                                console.log("No comments for", r_post.id);
                                continue;
                            }
                        } else {
                            console.log("No comments for", r_post.id);
                            continue;
                        }
                    } else {
                        console.log("Couldn't get submission", p_post.id);
                        continue;
                    }
                }


                // update the start after
                next_start_after = p_posts.data[p_posts.data.length - 1].created_utc;

                if (next_start_after == cur_start_after) {
                    next_start_after = cur_start_after + 1;
                    console.log("same start after, increasing start_after to", next_start_after);
                } else {
                    console.log("Updating start after to", next_start_after);
                }

            } else {
                next_start_after = cur_start_after + 1;
                console.log("No posts in batch", num_batches, "Failed to get posts, increasing start_after to", next_start_after);
            }

        } else {
            next_start_after = cur_start_after + 1;
            console.log("Batch", num_batches, "Failed to get posts, increasing start_after to", next_start_after);
        }


        let time_taken = new Date().getTime() - start_time;
        console.log("finished batch", num_batches, "in", time_taken / 1000, "s. Number of posts:", num_posts, " Average time per post:", time_taken / num_posts / 1000, "s. Next start after:", next_start_after);
        console.log("Total number of posts:", total_num_posts);

        // update the start after
        cur_start_after = next_start_after;
        start_time = Date.now();

        num_batches++;
    }
}

run();