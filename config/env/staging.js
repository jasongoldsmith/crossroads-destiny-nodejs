module.exports = {
  hostName: 'https://travelerbackendproduction.herokuapp.com',
  tinyUrlHost:'http://crsrd.co/',
  enableNewRelic: true,
  portNum: -1,
  s3: {
    imageBucket: "feighty-images",
    contentsBucket: "feighty-videos",
    momentsBucket: "feighty-moments",
  },
  awsProfileImageUrl: "http://feighty-images.s3.amazonaws.com/",
  enableBungieIntegration: true,
  logLevel: 'info',
  devMode: true,
  enableNewRelic:true
}