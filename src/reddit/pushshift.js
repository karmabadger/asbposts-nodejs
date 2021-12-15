const fetch = require('node-fetch-commonjs');

async function pushshift_post_search_after(after){
    let pushshift_url = `https://api.pushshift.io/reddit/submission/search/?after=${after}&subreddit=Altstreetbets&size=100&fields=id,author,num_comments,full_link,score,title,created_utc&sort=asc&sort_type=created_utc`;

    let response = await fetch(pushshift_url);
    let json = await response.json();
    return json;
}

module.exports = pushshift_post_search_after;