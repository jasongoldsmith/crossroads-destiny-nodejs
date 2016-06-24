
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
  bungieCookie:"__cfduid=d7fe261f69963d40917feac11cad26a761459446069; bungled=4410636698596642863; bungledid=B8wEl0Lj8t9MrnvjhpYjqbg3B+uli1nTCAAA; bungles=WebView=False&mt=2&mi=4611686018459049393&ci=2305843009374775013; bungleRedir=L2VuL1Byb2ZpbGUvMjU0LzU2MzYyMTI=; bunglesony=6UBMyrJ6l1TyX91PG2Nb94xWMO-iHIyv8olWMjRQZG2AAAAAJrBOhLZWSBQ13bxZdoUZApOe8Gfqu-U9gkUpTqkeAVKsiVNYgUTkEg0u3Lnw8C75-lBSB.8xikOeWczYCy9d8lAUr-.gsmMoYHU2tpDwScurWbQ8kCXCopaf6uTmshRLCVdD1CXNq9AK2zx.uzlXv0C2CVGpDTtHiVr3li103vM_; bungleloc=lc=en&lcin=true; sto-id-sg_www.bungie.net=JLAKHPAK; bungleatk=wa=8HaKPiJsPLLcqXCFvI.XKa4LdY4Lhnz2sMDAfFG5U5ngAAAAqsmr-.SHc4YOqxuCsnAXFOrjXLbnBbO60JyIsjeAswM-Q8G1q.SnAXelkX0dkjMZSw1VTz32Jc-JotblWwivbCrRmjptGFkzupP8ufP0szJ2eFU7GmqHN-f6WmoCljjMATb.R9GLeop01Mye2mEbqNs12pjjYAakpML8fJCQXiaGqsr.2pPijLyYAhSyCnlZaXfSzG447.SyF1wJRxNTnv1ppjRw7-LYmLmZ1KeOxKaAyQnflaBxu.I8Lys-NseHvq8wtUO6.4rntmEF4txNCXkyOp52HPmIfd8k9jczswo_&tk=YAAAAO9PeQMNF314uiGzZ5hbfvDj03g2bcsC7QGUbm-lXURM8t6s7jQ7o-qQxIqJLAshMeeH4WDL.1TuobtrDiOpiAZleR9fWkRQu3h0pIQklY1LqgRhscuJFkzsdQjh.lWA6iAAAADY02EbKKvYTQgEVFhZ6wN1HeU00k8PfKwndjVfYPbgxQ__; bungleme=13236427; _ga=GA1.2.883620681.1459446075; _gat=1; bunglefrogblastventcore=1465935442",
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
  userTimeoutInterval:-20,
  preUserTimeoutInterval:-5
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
