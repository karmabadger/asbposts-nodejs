const dotenv = require('dotenv');

env_vars = dotenv.config();


// module.exports = env_vars.parsed;
module.exports = {
    REDDIT_USER: process.env.REDDIT_USER,
    REDDIT_PWD: process.env.REDDIT_PWD,
    REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT,
    REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
    REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
    MONGO_PROTOCOL: process.env.MONGO_PROTOCOL,
    MONGO_URI: process.env.MONGO_URI,
    MONGO_USER: process.env.MONGO_USER,
    MONGO_PWD: process.env.MONGO_PWD,
    MONGO_DB: process.env.MONGO_DB,
    MONGO_COLLECTION: process.env.MONGO_COLLECTION
}