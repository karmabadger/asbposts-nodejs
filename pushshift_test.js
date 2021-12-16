const fetch = require('node-fetch-commonjs');

const sleep = require('./src/utils/sleep/sleep.js');

async function pushshift_post_search_after(after, start_time){
    let pushshift_url = `https://api.pushshift.io/reddit/submission/search/?after=${after}&subreddit=Altstreetbets&size=100&fields=id,author,num_comments,full_link,score,title,created_utc&sort=asc&sort_type=created_utc`;

    let current_time = Date.now();
    if ((current_time - start_time) < 1100) {
        console.log(`sleeping for ${1100 - (current_time - start_time)}`);
        await sleep(1100 - (current_time - start_time));
    }

    let response = null;
    for (let i = 0; i < 5; i++) {
        try {
            response = await fetch(pushshift_url);
        } catch (error) {
            console.log("Error", error, response.status, response.statusText);
            console.log("Sleep for 2 seconds");
            await sleep((i+1) * 2000);
            continue;
        }

        if (response) {
            if (response.status === 200) {
                for (let j = 0; j < 5; j++) {
                    try {
                        let json = await response.json();
                        return json;
                    } catch (error) {
                        console.log("Error", error, response.status, response.statusText);
                        console.log("Sleep for 2 seconds");
                        await sleep((i+1) * 2000);
                        continue;
                    }
                }
            } else {
                console.log("Error", response.status, response.statusText);
                console.log("Sleep for 2 seconds");
                await sleep(2000);
            }
        } else {
            console.log("No response");
            console.log("Sleep for 2 seconds");
            await sleep(2000);
        }

    }
    
    return null;
}


async function run(){

    let cur_start_after = 1607835600;
   
    let res;
    let start_time = Date.now();
    for (let i = 0; i < 50000000; i++) {
        try {
            res = await pushshift_post_search_after(cur_start_after, start_time);
            start_time = Date.now();

            console.log(i);
            if (res) {
                console.log("Got res");
            } else {    
                console.log("No res");
            }
        } catch (error) {
            console.log(error);

            let pushshift_url = `https://api.pushshift.io/reddit/submission/search/?after=${after}&subreddit=Altstreetbets&size=100&fields=id,author,num_comments,full_link,score,title,created_utc&sort=asc&sort_type=created_utc`;

            
            // let response = await fetch(pushshift_url);
            // console.log(response);

            // fetch(pushshift_url).then(function(response) {
            //     console.log(response);
            // }).catch(function(error) {
            //     console.log(error);
            // });

            

        }
    }
}


run();