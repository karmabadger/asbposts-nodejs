

r.getSubreddit('all').getNew().then(console.log);



async function run(){
    let r_post = await r.getSubmission("scx3j").fetch();
    console.log(r_post.author);
}

run();