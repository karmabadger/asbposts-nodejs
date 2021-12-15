'use strict';

const mongoose = require("mongoose");

const env_vars = require("./config/env.js");

const mongo_config = require("./config/mongodb.js");
const { mongo_connect, mongo_url } = mongo_config;

mongo_connect();

const postModel = require("./src/models//posts/Post.js");

const post1 = require("./mock_data/post1.js");


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

async function run() {
    console.log(env_vars);

    //   let post1_mongo = new postModel(post1);
    //   await post1_mongo.save();

    // try {
    //     let post1_mongo = await postModel.create(post1);
    //     console.log(post1_mongo);
    // } catch (err) {
    //     console.log(err);
    // }

    // const query = await postModel.findOne({ post_id: "t3_6" });
    post1.post_id = "t3_6";
    post1.link = "fdsafdsafdsafdsafsd";


    try {
        let post1_mongo = await find_one_by_post_id_and_update_or_create(post1);
        console.log(post1_mongo);
    } catch (err) {
        console.log(err);
    }

    // console.log(query)
}

run();
