const dotenv = require('dotenv');

env_vars = dotenv.config();


module.exports = env_vars.parsed;