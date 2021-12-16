// const fs = require('fs');


const mongo_config = require("./config/mongodb.js");
const { mongo_connect, mongo_url } = mongo_config;

mongo_connect();

const postModel = require("./src/models//posts/Post.js");

const get_snoowrap = require('./src/reddit/snoowrap.js');
const pushshift_post_search_after = require('./src/reddit/pushshift.js');

const r = get_snoowrap();



// async function log_res(res) {
//     fs.writeFileSync('log.txt', res, {
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

    while (cur_start_after < start_time) {

        let p_post = null;
        num_posts = 0;

        for (let i = 0; i < 5; i++) {

            console.log("Batch", num_batches, "Getting submissions after", cur_start_after);

            try {
                p_posts = await pushshift_post_search_after(cur_start_after);
                console.log("Batch", num_batches, "Got", p_posts.data.length, "posts");
                break;
            } catch (err) {
                console.log(err);
                p_posts = null;
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
                }
            }

            if (r_posts_list && r_posts_list.length > 0) {

                for (let i = 0; i < r_posts_list.length; i++) {
                    const r_post = r_posts_list[i];

                    if (r_post) {

                        if (r_post.author == null || r_post.author.name == null || r_post.author.name == "") {
                            console.log("Author is null for", r_post.id);
                            continue;
                        }

                        if (r_post.author.name == "[deleted]") {
                            console.log("Author is [deleted] for", r_post.id);
                            continue;
                        }

                        if (r_post.selftext == null || r_post.selftext == "" || r_post.selftext == "[deleted]") {
                            console.log("Selftext is null or deleted for", r_post.id);
                            continue;
                        }

                        if (r_post.author.name == "AutoModerator") {
                            console.log("Author is AutoModerator for", r_post.id);
                            continue;
                        }

                        if (naughty_list.includes(r_post.author.name)) {
                            console.log("Author is naughty for", r_post.id);
                            continue;
                        }



                        if (r_post.removed == false) {

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

                                    // log_res(r_post_mongo.post_id + "\n");
                                    // console.log("Saved post", r_data);

                                    num_posts++;
                                    total_num_posts++;
                                    break;
                                } catch (err) {
                                    console.log("Error", r_post.id, err);
                                }
                            }


                            let res = await r_post.expandReplies();


                            if (r_post.num_comments > 0) {
                                let comments = res.comments;
                                for (let j = 0; j < comments.length; j++) {
                                    const comment = comments[j];

                                    if (comment.author == null || comment.author.name == null || comment.author.name == "") {
                                        console.log("Comment Author is null for", comment.id);
                                        continue;
                                    }

                                    if (comment.author.name == "[deleted]") {
                                        console.log("Author is [deleted] for", comment.id);
                                        continue;
                                    }

                                    if (comment.body == null || comment.body == "" || comment.body == "[deleted]") {
                                        console.log("Selftext is null or deleted for", comment.id);
                                        continue;
                                    }

                                    if (comment.author.name == "AutoModerator") {
                                        console.log("Comment Author is AutoModerator for", comment.id);
                                        continue;
                                    }

                                    if (naughty_list.includes(comment.author.name)) {
                                        console.log("Comment Author is naughty for", comment.id);
                                        continue;
                                    }

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
                                            // console.log("Saved comment", c_data);

                                            // log_res(c_post_mongo.post_id + "\n");
                                            
                                            num_posts++;
                                            total_num_posts++;
                                            break;
                                        } catch (err) {
                                            console.log("Error", c_data.post_id, err);
                                        }
                                    }
                                }
                            } else {
                                console.log("No comments for", r_post.id);
                                continue;
                            }

                        } else {
                            console.log("Post", r_post.id, "is removed for", r_post.removed_by_category);
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