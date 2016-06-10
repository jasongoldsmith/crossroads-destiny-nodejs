
var path = require('path');
var lodash = require('lodash');

var development = require('./env/development');
var production = require('./env/production');
var staging = require('./env/staging');
var prodURL = require('./env/prodURL');
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL || process.env.MONGO_URL ||
  'mongodb://localhost/travelerbackend';



var defaults = {
  root: path.normalize(__dirname + '/../app'),
  mongoUri: mongoUri,
  enableNewRelic: false,
  enforceSSL: true,
  devMode: false,
  logLevel: 'debug',
  appName:'Crossroads',
  tinyUrlHost:'http://dev.crsrd.co/',
  hostUrl: function() {
    var url = this.hostName;
    if (this.portNum !== -1) {
      url = url + ':' + this.portNum;
    }
    return url;
  },
  confirmNavigation: false,
  mixpanelKey: process.env.mixpanelKey || "0b333fdc50a0d9a3640051d3582d0937",
  s3: {
    imageBucket: "feighty-images-dev",
    contentsBucket: "feighty-videos",
    momentsBucket: "feighty-moments"
  },
  ENV_STAGING : "staging",
  ENV_DEVELOPMENT: "development",
  ENV_PRODUCTION: "production",
  ENV_URL_PROD: "prodURL",
  environment: process.env.NODE_ENV || 'development',
  show: function() {
    console.log('environment: ' + this.environment);
    console.log('hostUrl: ' + this.hostUrl());
    console.log('devMode: ' + this.devMode);
    console.log('enforceSSL: ' + this.enforceSSL);
    console.log('logLevel: ' + this.logLevel);
  },
  awsKey: {accessKeyId: process.env.awsAccessKeyId, secretAccessKey: process.env.awsSecretAccessKey, region: "us-east-1"},
  onCueClipUrlHostName: "https://oncue.blob.core.windows.net",
  onCueClipCutterUrl: "http://oncuetest.prototyper.co/api/Videos",
  awsClipUrlHostName: "http://feighty-moments.s3.amazonaws.com",
  awsProfileImageUrl: "http://feighty-images-dev.s3.amazonaws.com/",
  awsContentUrl: "http://d9cq30q0gqp5u.cloudfront.net/", // use CDN url "https://feighty-videos.s3.amazonaws.com/",
  awsCloudFrontMomentUrl: "http://drfnffl4u55gr.cloudfront.net",
  placeholder_awsClipUrlHostName:  "http://S3_MOMENT_DOMAIN",
  placeholder_awsContentUrlHostName: "https://S3_PROFILE_VIDEO_DOMAIN/",
  placeholder_awsProfileUrlHostName: "https://S3_PROFILE_DOMAIN/",
  download_URLPattern: "http://feighty-images-dev.s3.amazonaws.com/download/index.html?mode=%MODE%",
  download_staging_URLPattern: "http://feighty-images-dev.s3.amazonaws.com/download/index_staging.html?mode=%MODE%",
  defaultMessagePattern: "%CREATOR% sent you '%CHAT%'. WATCH and CHAT with %CREATOR%. Download app %DOWNLOADURL% & follow instructions",
  watChatImageUrl: "http://feighty-images-dev.s3.amazonaws.com/intro_phone_login.png",
  bitlyAccessToken: process.env.bitly_access_token,
  f80SecretKey: process.env.f80SecretKey,
  iosAppVersion: process.env.iosAppVersion,
  androidAppVersion: process.env.androidAppVersion,
  forcedUpgradeMessage: process.env.forcedUpgradeMessage,
  optionalUpgradeMessage: process.env.optionalUpgradeMessage,
  currIosAppVersion : process.env.currIosAppVersion,
  currAndroidAppVersion: process.env.currAndroidAppVersion,
  placeholder_versionString: "VERSIONSTRING",
  upgradeTitle: process.env.upgradeTitle,
  googleAPIKey: process.env.googleAPIKey,
  enableBungieIntegration: true,
  bungieAPIToken:"f091c8d36c3c4a17b559c21cd489bec0",
  bungieCSRFToken:"4410636698596642863",
  bungieCookie:"__cfduid=d7fe261f69963d40917feac11cad26a761459446069; bungled=4410636698596642863; bungledid=B8wEl0Lj8t9MrnvjhpYjqbg3B+uli1nTCAAA; bungles=WebView=False&mt=2&mi=4611686018459049393&ci=2305843009374775013; bungleRedir=L2VuL0FjdGl2aXRpZXMvMi80NjExNjg2MDE4NDU5MDQ5MzkzLzIzMDU4NDMwMDkzNzQ3NzUwMTM=; bungleloc=lc=en&lcin=true; sto-id-sg_www.bungie.net=OLAKHPAK; bungleatk=wa=TaBUeKuyhOb5h-.yoVUN4PdDY8RjKoP7diUEHFgz3jrgAAAAJzOBsQ91lS70uItFMiMXZADFLFzv1SMX7Pm.ytGr3sgoAvnr9kQZ4ituzod5yoGf8vosWJfSQTON1.tuE5NDteCwrbIDW7TH6lwI9QkAyS50FF6qcTcbiKS2kTBxhmBoAbPNbxNf02Yz.aiKmr27W7gLxZXSyivhXT2KLwQxMKy0rMeXMbwTt3LiLVOoXU9MpBR6nePePlvLrzvpBuWHIiDQ8TCho5UwuMSlD2-Ky1DUJpAy8l.i0Xfmd1CmURIgAdnVHOKXRxaFH9ZJb8Hr27XPb8l3LGFtYHRAgImoZkQ_&tk=YAAAAA3arM3sTSOvz5OdwHQg1J78-5YUXR5UNAKrRrVzTLVw4xUvB.9EAzIZU0pZEGc.5mVZ6SupyyASiyCJb5mEJQUCH9jyGAPiWQ14WdGnRc8hYRrg3h2vP4SwB0ERAaoUeiAAAAAMyZaioFTQ8nEMmH8hqO4O2UFS48MXcOcHDfKr6KNqBw__; bungleme=13236427; _ga=GA1.2.883620681.1459446075; _gat=1; bunglefrogblastventcore=1465506602",
  bungieBaseURL:"https://www.bungie.net",
  bungieDestinySearchURL:"https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/-1/",
  bungieDestinySearchByPSNURL:"https://www.bungie.net/Platform/Destiny/%MEMBERSHIPTYPE%/Stats/GetMembershipIdByDisplayName/%MEMBERSHIPID%?ignorecase=true",
  bungieUserAccountURL:"https://www.bungie.net/Platform/User/GetBungieAccount/",
  bungieConvURL:"https://www.bungie.net/Platform/Message/CreateConversation/?lc=en&fmt=true&lcin=true",
  destinyGruopsJoinedURL:"https://www.bungie.net/Platform/Group/User/%MEMBERSHIPID%/",
  accountVerificationSuccess:"Great! Welcome to Traveler! If you have any issues or suggestions you may contact us at gaming@forcecatalyst.com",
  accountVerification:"Thanks for signing up for Traveler, the Destiny Fireteam Finder mobile app! Click the link below to verify your PSN id. %HOST%/api/v1/auth/verify/%TOKEN%",
  firebaseURL: process.env.firebaseURL || "https://crossroadsapp-dev.firebaseio.com/",
  triggerIntervalMinutes: 15,
  triggerReminderInterval: 120,
  triggerUpcomingReminderInterval: -5
};

/**
 * Expose
 */

var currentEnvironment = process.env.NODE_ENV || 'development';
console.log("Current environment: " + currentEnvironment);


function myConfig(myConfig) {
  var mergedConfig = lodash.extend(lodash.clone(defaults), myConfig);
  return mergedConfig;
}

module.exports = {
  development: myConfig(development),
  production: myConfig(production),
  staging: myConfig(staging),
  prodURL: myConfig(prodURL)
}[currentEnvironment];
