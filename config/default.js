
var path = require('path');
var lodash = require('lodash');

var development = require('./env/development');
var production = require('./env/production');
var staging = require('./env/staging');

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
  hostUrl: function() {
    var url = this.hostName;
    if (this.portNum !== -1) {
      url = url + ':' + this.portNum;
    }
    return url;
  },
  confirmNavigation: false,
  mixpanelKey: process.env.mixpanelKey,
  s3: {
    imageBucket: "feighty-images-dev",
    contentsBucket: "feighty-videos",
    momentsBucket: "feighty-moments"
  },
  ENV_STAGING : "staging",
  ENV_DEVELOPMENT: "development",
  ENV_PRODUCTION: "production",
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
  bungieCookie:"__cfduid=d7fe261f69963d40917feac11cad26a761459446069; bungled=4410636698596642863; bungledid=B8wEl0Lj8t9MrnvjhpYjqbg3B+uli1nTCAAA; bungles=WebView=False&mt=2&mi=4611686018459049393&ci=2305843009374775013; bungleab=gm=1; sto-id-sg_www.bungie.net=OLAKHPAK; _gat=1; bungleRedir=L2VuL0xlZ2VuZC9BZHZpc29ycy8yLzQ2MTE2ODYwMTg0NTkwNDkzOTMvMjMwNTg0MzAwOTM3NDc3NTAxMw==; bungleatk=wa=.mKrssVSL5cDBhnVA-pND0kNlhrmDCHVQ.0I0XmyGqrgAAAAJa2lsGorE5g2fmQkBMXCAGDdFX-W9br7wUKWEVAxePG8tpvFTKdFie9lqE6fgJbfiC0XHRQUCJOHwm9WN3O5xPooYGF9.fST2yCZd2vi63rnQSiLQa.jiMvfwjEg0AP8gQ.1nv4C4HJH8IzVBkXuyr5BKc9HGfjD.D.ZTpntIJ4GLQsRFQrRAgF249F.xaUlzlcnneOXloGJ.TznuxPlSDP2Rc8i5--WbSbzxzsKE9nvKfRQ7F2abUY.n-dlBqgGB815VNXyt6y4eGsAzcA1g3YV4VqgQPCvBLgVDD0ZzpU_&tk=YAAAAEJWeM.ZS5Ll8SrMWCwVYVpCALj371Lz4nZkJF3X1DNoFIW-xGP0oxFJevHrH6.jqd0uQbxMexdabGJT2PcopUOzVqt16JiSzH.TtZpyGhL0mdrsEB-m83fi61KIYXtlVCAAAAAZQ-cHMNhUwqdZkEh5GmJurKzN.cQyXIlM7jb5FFFm-A__; bungleme=13236427; bungleloc=lc=en&lcin=false; bunglefrogblastventcore=1463091914; _ga=GA1.2.883620681.1459446075",
  bungieDestinySearchURL:"https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/-1/",
  bungieDestinySearchByPSNURL:"https://www.bungie.net/Platform/Destiny/%MEMBERSHIPTYPE%/Stats/GetMembershipIdByDisplayName/%MEMBERSHIPID%?ignorecase=true",
  bungieUserAccountURL:"https://www.bungie.net/Platform/User/GetBungieAccount/",
  bungieConvURL:"https://www.bungie.net/Platform/Message/CreateConversation/?lc=en&fmt=true&lcin=true",
  accountVerificationSuccess:"Great! Welcome to Traveler! If you have any issues or suggestions you may contact us at gaming@forcecatalyst.com",
  accountVerification:"Thanks for signing up for Traveler, the Destiny Fireteam Finder mobile app! Click the link below to verify your PSN id. %HOST%/api/v1/auth/verify/%TOKEN%",
  firebaseURL: process.env.firebaseURL || "https://traveler-development.firebaseio.com/",
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
  staging: myConfig(staging)
}[currentEnvironment];
