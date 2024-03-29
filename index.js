const express=require("express");
const body_parser=require("body-parser");
const axios=require("axios");

const CyclicDb = require("@cyclic.sh/dynamodb");
const db = CyclicDb("long-jade-grasshopper-capCyclicDB");
const user1 = db.collection("user");

require('dotenv').config();

var getter_item;

const app=express().use(body_parser.json());

const token=process.env.TOKEN;
const mytoken=process.env.MYTOKEN;//prasath_token

app.listen(process.env.PORT,()=>{
    console.log("webhook is listening tanmoy");
});

//to verify the callback url from dashboard side - cloud api side
app.get("/webhook",(req,res)=>{
    console.log("Hi this is swagoto and polley");
   let mode=req.query["hub.mode"];
   let challange=req.query["hub.challenge"];
   let token=req.query["hub.verify_token"];


    if(mode && token){

        if(mode==="subscribe" && token===mytoken){
            res.status(200).send(challange);
        }else{
            res.status(403);
        }

    }

});

async function dynamo_db_con(phone_no, user_name,message_body){
  let user = await user1.set("user_name", {
    phone_no: phone_no,
    message_body: message_body
});
}


async function dynamo_db_con_getter(ele){
  getter_item = await user1.get("user_name");
}


app.post("/webhook",(req,res)=>{ //i want some 
    console.log("Hi this is swagoto and polley");
    let body_param=req.body;

    console.log(JSON.stringify(body_param,null,2));




    if(body_param.object){
        console.log("inside body param");
        if(body_param.entry && 
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]  
            ){
               let phon_no_id=body_param.entry[0].changes[0].value.metadata.phone_number_id;
               let from = body_param.entry[0].changes[0].value.messages[0].from; 
               let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

               

               console.log("phone number "+phon_no_id);
               console.log("from "+from);
               console.log("boady param "+msg_body);

               let massagee;
               try{
                  dynamo_db_con(phon_no_id,from,msg_body);
               }catch(err){
                  console.log(err);
               }

               let get_item_swag = dynamo_db_con_getter(from);
               
               console.log(JSON.stringify(get_item_swag));
               if(msg_body == "hi")
               {
                    massagee = "welcome to dpinfonet, your number"+get_item_swag.phone_no+" you send"+get_item_swag.message_body;
               }

               
               
              
               axios({
                   method:"POST",
                   url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
                   data:{
                       messaging_product:"whatsapp",
                       to:from,
                       text:{
                           body: massagee
                       }
                   },
                   headers:{
                       "Content-Type":"application/json"
                   }

               });

               res.sendStatus(200);
            }else{
                res.sendStatus(404);
            }

    }

});

app.get("/",(req,res)=>{
    res.status(200).send("hello this is webhook setup dp"+JSON.stringify(user1));
});