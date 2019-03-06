/*
                         _                                                         _     _    
 /\ /\  ___  ___    __ _| |_   _   _  ___  _   _ _ __    _____      ___ __    _ __(_)___| | __
/ / \ \/ __|/ _ \  / _` | __| | | | |/ _ \| | | | '__|  / _ \ \ /\ / / '_ \  | '__| / __| |/ /
\ \_/ /\__ \  __/ | (_| | |_  | |_| | (_) | |_| | |    | (_) \ V  V /| | | | | |  | \__ \   < 
 \___/ |___/\___|  \__,_|\__|  \__, |\___/ \__,_|_|     \___/ \_/\_/ |_| |_| |_|  |_|___/_|\_\
                               |___/                                                          

To start:

node autostake.js
                               
To run persistently use the PM2 module:

npm install pm2 -g
pm2 start autostake.json
pm2 save

To run pm2 on system startup:

pm2 startup 

> then follow instructions

*/

const EosApi = require('eosjs-api')
const Eos = require('eosjs')
const moment = require('moment')
var schedule = require('node-schedule');

// https://www.cypherglass.com/bp.json
var bpurl = 'https://api.cypherglass.com'; // A BP Node
var chainID = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';  // EOS Main Net Chain ID



var privateKey = 'YOUR-PRIVATE-KEY-HERE' // Your Private Key

var myeosaccount = 'myeosaccount'; // Your eos account
var myeospermission = 'active'; // The permission you're using, suggest active

var eosrpcoptions = {
                     httpEndpoint: bpurl, 
                     verbose: false
                    };

const eosrpc = EosApi(eosrpcoptions)
                    
eos = Eos({httpEndpoint: bpurl ,
           chainId: chainID, 
           keyProvider: privateKey,
           expireInSeconds: 60,
           broadcast: true,
           verbose: false, // API activity
           sign: true           
         });

// Here you can build up the rules you want.  Checkout the node-schedule package at https://www.npmjs.com/package/node-schedule

// Rule 1 - 6am everyday
var rule = new schedule.RecurrenceRule();
rule.hour = [6]; // 6am
rule.minute = [0]; // 0mins

var job = schedule.scheduleJob(rule, function(){
    stakePixEOS();
});         

//Rule 2 - 6am every wednesday
var rule2 = new schedule.RecurrenceRule();
rule2.dayOfWeek = 3; // 0 = Sunday
rule2.hour = 6;
rule2.minute = 0;

var job2 = schedule.scheduleJob(rule2, function(){
    claimDice();
});

// Run on startup         
stakePixEOS();         
         
function stakePixEOS () {

    eosrpc.getCurrencyBalance('pixeos1token', myeosaccount, 'PIXEOS', function (err, result) { 
      console.log("Account Balance:", result[0]);
      var totalpixeos = result[0].split(" ");

      eosrpc.getTableRows({table:"stakes", scope: 'pixeos1stake', code: 'pixeos1stake' , lower_bound: myeosaccount, upper_bound: myeosaccount, limit:1,json:true}, function (err, tableresult) { 
        
        //console.log(tableresult.rows[0].staked_pixeos, tableresult.rows[0].unstaking_pixeos);
        var staked = tableresult.rows[0].staked_pixeos.split(" ")
        var unstaking = tableresult.rows[0].unstaking_pixeos.split(" ")
        var totalstaked = parseFloat(staked[0]) + parseFloat(unstaking[0]);
        console.log("Total PIXEOS Staked:", totalstaked + " PIXEOS");
        var totaltostake = roundDown(parseFloat(totalpixeos[0]) - totalstaked, 4);

        if (totaltostake > 0) {
        
            totaltostake = totaltostake.toFixed(4) + " PIXEOS";
            console.log("Staking:", totaltostake);
            
            eos.transaction(
              {
                actions: [{
                    authorization: [{
                        actor: myeosaccount,
                        permission: myeospermission,
                    }],
                    account:"pixeos1stake",
                    data: {owner: myeosaccount, amount: totaltostake},
                    name:"stake"

                }]
              },
              {
                broadcast: true,
                sign: true
              }
            ).then(r=> {
              var now = Date.now()
              console.log(moment(now).format('MMMM Do YYYY, HH:mm:ss'), "Staking Successful:", r.transaction_id);

            }).catch(err => {
              console.error('Error:', err)
            })        
        
        }
        else {
          console.log("No PIXEOS to stake :(");
        }
        
      });
      
      
    });

}    
         

function claimDice () {

  console.log("Claiming weekly betDice dividends");
  
  eos.transaction(
    {
      actions: [{
          authorization: [{
              actor: myeosaccount,
              permission: myeospermission,
          }],
          account:"betdicegroup",
          data: {username: myeosaccount},
          name:"claimbalance"

      }]
    },
    {
      broadcast: true,
      sign: true
    }
  ).then(r=> {
    var now = Date.now()
    console.log(moment(now).format('MMMM Do YYYY, HH:mm:ss'), "Dividend Claim Successful:", r.transaction_id);

  }).catch(err => {
    console.error('Error:', err)
  })        

}         


function roundDown(value, decimals) { 
    return Number(Math.floor(value+'e'+decimals)+'e-'+decimals); 
}
