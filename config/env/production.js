
module.exports = {
  hostName: 'https://feighty.herokuapp.com',
  enableNewRelic: true,
  portNum: -1,
  s3: {
    imageBucket: "feighty-images",
    contentsBucket: "feighty-videos",
    momentsBucket: "feighty-moments",
  },
  awsProfileImageUrl: "http://feighty-images.s3.amazonaws.com/"
};