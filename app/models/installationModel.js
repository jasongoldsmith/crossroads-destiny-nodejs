var mongoose = require('mongoose');
var utils = require('../utils');

var InstallationSchema = require('./schema/installationSchema');
var Installation = mongoose.model('Installation', InstallationSchema.schema);
function getByQuery(query, callback) {
  Installation
    .find(query)
    .exec(callback);
}

function getById(id, callback) {
  if (!id) return callback("Invalid id:" + id);
  getByQuery({_id: id}, utils.firstInArrayCallback(callback));
}

function getInstallationByUser(user, callback) {
  if (!user) return callback("Invalid user:" + user);
  getByQuery({user: user._id}, utils.firstInArrayCallback(callback));
}

function getInstallationByUserList(userList, callback){
  if(userList && userList.length<=0){
    return callback(null,null)
  }
  var userIds = utils._.map(userList, function(user) { return user._id})
  console.log("userList::"+userList)
  getByQuery({user:userIds},callback)
  /* utils.async.waterfall([
      function (callback) {
        utils.l.d("got userids from userlist::"+userIds)

       // utils.async.map(userIdList, function(userId) {
        //  getByQuery({user:userId},utils.firstInArrayCallback(callback))
       // },function(err,userList){
        //  callback(null, userList)
       /// })

        getByQuery({user:{$in:userIds}},callback)
      }
    ],
    callback
  )*/
}

function getOrCreateInstallation(user, callback) {
  getInstallationByUser(user, function(err, installation) {
    if(err || utils._.isInvalidOrBlank(installation)) {
      var newInstall = new Installation({user: user, unReadNotificationCount: 0});
      return callback(null, newInstall);
    }
    callback(null, installation);
  });
}

function updateInstallation(user, deviceType, deviceToken, callback) {
  utils.async.waterfall([
    function(callback) {
      getOrCreateInstallation(user, callback);
    },
    function(installation, callback) {
      if(utils._.isInvalid(installation)) {
        return callback(null, null);
      }
      utils._.extend(installation, {deviceType: deviceType, deviceToken: deviceToken});
      save(installation, callback);
    }
  ], callback);
}

function save(installation, callback) {
  utils.async.waterfall([
      function(callback) {
        installation.save(function(err, c, numAffected) {
          if (err) {
            utils.l.s("Got error on saving installation", {err: err, installation: installation})
          } else if (!c) {
            utils.l.s("Got null content on installation", {installation: installation})
          }
          return callback(err, c);
        });
      },
      function(c, callback) {
        getById(c._id, callback)
      }
    ],
    callback
  );
}

function findByIdAndUpdate(id,data,callback){
  Installation.findByIdAndUpdate(id,{ "$set": data},callback)
}

module.exports = {
  model: Installation,
  getById: getById,
  save: save,
  updateInstallation: updateInstallation,
  getInstallationByUser: getInstallationByUser,
  getInstallationByUserList: getInstallationByUserList,
  findByIdAndUpdate:findByIdAndUpdate
};



