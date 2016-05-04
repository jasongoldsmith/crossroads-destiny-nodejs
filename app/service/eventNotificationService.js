var models = require('../models')

function getNotificationDetails(event,notification,left,callback){
  {
    models.user.getByQuery({_id:{$in:["56fd89880c9ed8073b5a16df","5723da4013190316083f799c"]}},function(err, users){
      return callback(null,{name: notification.name,
        recipients: users, //[{_id:'56fd89880c9ed8073b5a16df',userName:'harsha'},{_id:'5723da4013190316083f799c',userName:'harshatest12'}],
        message: notification.message})
    })
  }
}

module.exports ={
  getNotificationDetails:getNotificationDetails}