const mongoose = require("mongoose");

const env_vars = require("./env.js");

const mongo_url = env_vars.MONGO_PROTOCOL + env_vars.MONGO_USER + ":" + env_vars.MONGO_PWD + env_vars.MONGO_URI + env_vars.MONGO_DB;


function mongo_connect() {
    console.log("Connecting to MongoDB at",  mongo_url, "...");
    mongoose.connect(mongo_url, {
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
        retryReads: true,
        w: "majority",
    }).catch(err => {
        console.log(err.reason);
    });
}


module.exports = {
    mongo_connect,
    mongo_url
};