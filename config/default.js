
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
  bungieCookie:"__cfduid=d7fe261f69963d40917feac11cad26a761459446069; bungled=4410636698596642863; bungledid=B8wEl0Lj8t9MrnvjhpYjqbg3B+uli1nTCAAA; bungles=WebView=False&mt=2&mi=4611686018459049393&ci=2305843009374775013; sto-id-sg_www.bungie.net=OJAKHPAK; _gat=1; bungleRedir=L2VuL05ld3MvQXJ0aWNsZS80NDc4OS83X1RoaXMtV2Vlay1BdC1CdW5naWUtLS0wNjAyMjAxNg==; bunglesony=E.GnXzsz4mTECQqQwWWDRMh1I8ubsefciIHBACG6InmAAAAAt8Jbh2kuvl6.zxOH9AdcO4-41.BqYtRQ.Ain9PA7zqsA6eAp62Kmv5o.FND7rt-l-bftqwV-IL4211lvgNogfPzqcfwBDqPfhmO8u1bkYzykQ1cpOE5Qg3Pp57z8aIfHhnrzjWfFB-2hOGBIs4cSuDWEVlWM5Hkri5CjwfaGkwU_; bungleatk=wa=uGaA0yx80pIjqRNeWDfmOppdQioVne0aaUdRGXsf7SXgAAAAQ9m1zf-Xd52Xo2c23Vo5yEhjDczwG2MBSXBvevel19TSxz5MexSfuSzUpvrhCEYjTkKCpcW3slGmG5EW7yG.WByiIUQGQGmagETVNivAHFNsbErSIeekHtLDdIoZ7qN4SLQX1ZtH2hPzU-GSklTOwqgjn3Ok6ItKiLF3ycUbUWXOOmQdSSfn6vmcWSKvwQ1wmzbl3P41xBlNVfQJLO9EpSFsLJ598ux0kFFvAlwDo35B8TmouGoqHTBl039wxqRFsOL8jE7DuqPtkY0Wwk9Fuw7BW5esXjaGXFVhoEOWliE_&tk=YAAAAHbz2dps0PHwJJndfck8tWKU38GP89gkSeOFElN4-oZwFublDTGwZ29WjpTnuFtmWOt45FjnUty-IsCkvEvK1h6jWthRcEAt7LE2fWr4d99-RtSlXn6xNPKVNpkLg.QAgCAAAAAjWLLLMuBI15lOfBvMPAZ5C4Pseo4-vrKzAGWDF5k3LA__; bungleme=13236427; bungleloc=lc=en&lcin=true; _ga=GA1.2.883620681.1459446075; bunglefrogblastventcore=1467145763",
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
  triggerUpcomingReminderInterval: -5,
  eventExpiryInterval:-40,
  userTimeoutInterval:-20
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
