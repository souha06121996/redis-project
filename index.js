const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const port =process.env.PORT || 5000;
const redis_port =process.env.REDIS_PORT || 6379



const client=redis.createClient(redis_port);
const app=express();
//set resposne function 
function setResponse(username,repos) {
   return  `<h2>${username} has ${repos} Github repos </h2>`
}
//Make request to Github for data
function getRepos(req,res,next) {

    try {
        const {username }=req.params;

        function getJson() {
             fetch(`https://api.github.com/users/${username}`)
            .then(function(response) {
                return response.json();
                
            })
            .then(function(data){
                const repos=data.public_repos;
                //Set data to Redis 

                client.setex(username,3600,repos);
                res.send(setResponse(username,repos));
                
            })
            .catch(function(err) {
                console.log(err);
                
            });

        }
        getJson();

        // async   response=> await fetch(`https://api.github.com/users/${username}`);

        // async  data=>  await response.json();

        // res.send(data);
    } catch (err) {

        console.log(err);
        res.status(500);
        
    }
    
}

//Cache middleware
function cache(req,res,next) {

    const {username}=req.params;
    client.get(username,(err,data)=>{

        if(err) throw err;
        if(data !== null){
            res.send(setResponse(username,data));
        }else{
            next();
        }
    })
    
}
app.get('/repos/:username',cache,getRepos);

app.listen(port,()=>{
    console.log(`App listening on port ${port}`);
});