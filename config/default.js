
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
  bungieAPIToken:"f091c8d36c3c4a17b559c21cd489bec0",
  bungieCSRFToken:"4410636698596642863",
  bungieCookie:"__cfduid=d7fe261f69963d40917feac11cad26a761459446069; bungled=4410636698596642863; bungledid=B8wEl0Lj8t9MrnvjhpYjqbg3B+uli1nTCAAA; sto-id-sg_www.bungie.net=OIAKHPAK; bungleRedir=Lw==; bungles=WebView=False; bunglesony=rJHEYOs.Mfs7L6LQlTgtf6fEmGkrZOQNB1PUJcHtBE.AAAAAMn4.TRnDWhCB0D64k.5V.RTrLXHfztRBd8GBhw7eVGfzHI.iD9gOTIcUzXD327XyWL8pq-QHmwPS1uLWYiPin143sMiB4-ele0niu9RoJnhjyQ8oYq7y7sJq4Myon2kd2AHXM1vxu6lOYt3Me3lG1GlYHb1pW0H16ThRFkNHfFo_; bungleatk=wa=qrN3GZ4S2lBJli3THd7-PQwRYLBXAHRnM-uzqXIuFrXgAAAAqmwrhDxn70o3KT3KTS61ChEGuju.L2cgr0CzEKKQ2v.inDKIKCaPN58BdKcHdt8r8EjhTWCrI6x2VCfG.YPRFZ7ej8hHGG5GuXN3Yhjvazp5HrASXRXvUZsHnsiBxoly6GJq-EB6Rzlb-ctUYivtWTxSZvLdl0Awi0PsK1qtTlTIOEWCiMmBAEIlkKkigsF021z5cLIJ4V.j95r9J1IUrfHPsDTNZRxyMPQKcErBlwQFE1YgT9njXntIlL9SklAhy742M-Zj2JVxOn6.o0jYKroNpXoHqO1Nv96a.tzb8gk_&tk=YAAAAEsYTcHXWLv6bec3ugZohzElNBHwqNa8SoGK0OloWMtRr3wxCcn3zVLlABoQMc5RZY6JpGNSv1ssQHXx7rAz9bko0.UmnK4uKVqtPUzIvww3FmCrV4x5NvKh1GiQMJm0iiAAAAAbX8e3jZFt.AVH.usPj0AFolPVexVnzQbaYmW3RUHqgA__; bungleme=13236427; bungleloc=lc=en&lcin=false; _ga=GA1.2.883620681.1459446075; _gat=1; bunglefrogblastventcore=1461881136",
  bungieDestinySearchURL:"https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/-1/",
  bungieDestinySearchByPSNURL:"https://www.bungie.net/Platform/Destiny/%MEMBERSHIPTYPE%/Stats/GetMembershipIdByDisplayName/%MEMBERSHIPID%?ignorecase=true",
  bungieUserAccountURL:"https://www.bungie.net/Platform/User/GetBungieAccount/",
  bungieConvURL:"https://www.bungie.net/Platform/Message/CreateConversation/?lc=en&fmt=true&lcin=true",
  firebaseURL: process.env.firebaseURL || "https://traveler-development.firebaseio.com/",
  triggerIntervalMinutes: 15
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
