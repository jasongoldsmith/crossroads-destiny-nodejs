var lodash = require('./lodash')
var config =  require('config')
var baseUrl = "http://www.bungie.net/common/destiny_content/icons/"
var imageFiles = [
  "0f29ac59b0f0cbdbd837e2afc8666915.jpg",
  "0a52fede45bc37234c677dbf6107d8a6.jpg",
  "0ac3007bdc16de523de01b6ad0782cfe.jpg",
  "0b8b9041632f129acc5b89ec98a18905.jpg",
  "0b3555c30527ad45bc1e8af835a5baa6.jpg",
  "0bc68c808d1bf91561582ee211edc123.jpg",
  "00c6e733843219c5e1e421c06540d260.jpg",
  "0d59f419556a48c126e0aceeffd532c3.jpg",
  "0d2043d2173645ff0e49bce6a696bf0e.jpg",
  "0db6071aa2214a302a8828ba7b39863b.jpg",
  "0e5a66867487f366d72905af527a687b.jpg",
  "0e6f386c06e50b0cdb690b2682d64f2e.jpg",
  "1a21bd95ff667ae9265bc5dd44446854.jpg",
  "1a9966c253bd147cdda4103740bb224c.jpg",
  "1aee2cb010a0bebda7eb3387b0c5c948.jpg",
  "1b38c47d926aaa1039269e2e6667209d.jpg",
  "1cf6fecd129c0ab6b37699510de19d64.jpg",
  "1ef64d8f850dc8f91a26588e613e4959.jpg",
  "2a0828842023dcf38a391e55d924f6ef.jpg",
  "2b16fdc3e899d10df1677e85ef125b59.jpg",
  "2e596038c90c4f0c16828d12eb66ae49.jpg",
  "2ecac5489c145d467ca69786dde36b77.jpg",
  "2f313e6e2218bdf8a780beb8496b6aa8.jpg",
  "2fd7c44fd3adf3409ace88f364c00fc9.jpg",
  "016d8fb5fb06afc07ac4d7a1894d9b7d.jpg",
  "027e13b11a75380353acdf6bdf5583d0.jpg",
  "03d40a3da6ae2af2070a320eaa7de742.jpg",
  "0453bf86cd490639594631ca01f36ec9.jpg",
  "049e2216349f9cd6af6705c3bebf17aa.jpg",
  "04fd9d7f0054965df60ecbff71ca26cd.jpg",
  "0623ea98a3c13d8353036b14391d193a.jpg",
  "0712a9e6e4741bf3d56a495df2379131.jpg",
  "08d9594d80148bf6341257f17175b861.jpg",
  "08fd007e079a10e90a28156db2518259.jpg",
  "09b4e5240e6218544e9cbb11fc1de7ed.jpg",
  "105adf441219808bc2de94bc6b069b94.jpg",
  "10f2adaa23f48a20b8ac370c436e4e66.jpg",
  "110c7b1165762a9037d6f322ff3757b2.jpg",
  "119bd40a1d84083f48c344f49c9dde54.jpg",
  "130d91ff5df5a9d18461ab748c74fad5.jpg",
  "13fec120e5bcf59a636dcd02afadf712.jpg",
  "141aa715dee032404f3067a51357dba0.jpg",
  "145e859ac57f0ee03028987e15a05d73.jpg",
  "14eb43f74b8d245fe036f204d5b399b6.jpg",
  "15b56953b4c7351eaa0f34c0116acb2a.jpg",
  "16bdd3efc425c9e6cb33a35774727d7e.jpg",
  "179f9d181c820abb509f9ea1734c1b17.jpg",
  "185ef1ea9381d2c5b83ea2586a8440f8.jpg",
  "18c4e28f033ba615d1798086f822927e.jpg",
  "202b1d3cb149e8be25caed07c8c9937b.jpg",
  "204b5f70a457e0bbf719297d595ec945.jpg",
  "20bfa7bee9063f0f100c513558772cef.jpg",
  "215b897219d7badd3002f891f3182136.jpg",
  "25a7199ccc09231f02d9b7fde7ed806d.jpg",
  "28f9c7f957ca3ba314a808fbfb7da0da.jpg",
  "358a099059393752cf642f01ac005d50.jpg",
  "368cd3f815aa45d867bed14314a57d8a.jpg",
  "36beb04fc96335f84a8d3ef2c932b0b0.jpg",
  "36d14e77d2640e30de67e176f3560b86.jpg",
  "37e106dbefb06c83e5985715a9f7bf73.jpg",
  "38e1d5c110ca8d1f5dd607832b7465d3.jpg",
  "3c2583db9457909189276966ee0a6922.jpg",
  "3e0b919ea55d420156cdf384b66a7f8a.jpg",
  "3e4a19d59e581a5b2d034e6cb6c9ce0c.jpg",
  "3e9e03f2dc11f105d48b9ca9cd91cbed.jpg",
  "3eb66af2bfe9bac036264e7d41e7c4d7.jpg",
  "3f96a481562887024b5336cc7893d98a.jpg",
  "3fb207b9ea34cefbda3397ad5c218a3a.jpg",
  "40ea60ca800b4c43071def996235743a.jpg",
  "40efd9b13ce844c1bd32e3f3aefebaf7.jpg",
  "43fed2bb4d4abfa032241e90c8d9866b.jpg",
  "44ce66aa12cdf1558955376d3113c6ac.jpg",
  "44dab2773b264967bd5aa57bd140767f.jpg",
  "44ec9b9c3973cda82449a351c0459ebe.jpg",
  "46c12fba1344377dfcb1543d35adaf5b.jpg",
  "49f01f528b56f3760a55601bf2c13c91.jpg",
  "4b1966f35c022ae0dea9114a1aacd7fe.jpg",
  "4b320d997edede5b28434404d457af9b.jpg",
  "4d565b6ac97b81f98f64a062f20c61ce.jpg",
  "4eb6a4649896513b60c55145d284a4bc.jpg",
  "541bb98238764ea9772ebe37d9b5cedb.jpg",
  "558ac1229058a462ab40e374d82d8061.jpg",
  "565b80084ea38943f9bb3b0ab8e247ba.jpg",
  "56b0a1c4833b1241d552015a1d22b991.jpg",
  "56fa341239e1876787428710bbc554e7.jpg",
  "57c93cfed262ac1e1fc264198d5f00b8.jpg",
  "57e97bb59d44829f32f5d13191f5678a.jpg",
  "57fadc9907c30dedf6142240ecab6aaa.jpg",
  "580f0e75513671b7190cb98a3306fa08.jpg",
  "596a34479f1c17c4e49ae5509dc3660f.jpg",
  "59d20d929387c77f80f5205da684cf78.jpg",
  "5a66cd80dff47ada45beae4267021148.jpg",
  "5a81c66d83f655160ddb3f58a465b36e.jpg",
  "5b65aa0abb2cbd6f57f5bd63503198f2.jpg",
  "5cd80949a18cfb99b6078fc964823cc6.jpg",
  "5dcd0d1ad3648b16e3004005cc9df0d1.jpg",
  "5dfe7211b6301c337cb0e23d93fecf17.jpg",
  "5e801f8f8f933e2256946b176b6ccda7.jpg",
  "5eb89604f16874df4bd3abc626168766.jpg",
  "5efcde6450dafe9faf73624da9517e48.jpg",
  "5f02879329a3e8fb8a993ee9e1eda985.jpg",
  "5f5c78b473d2797bba6d88f5eb0b8bc5.jpg",
  "619f62f0a065f7f484cc6e05ded039a1.jpg",
  "62a533f71d53ddc101831d5b94174c09.jpg",
  "637d3ac7db97af24d71c2c5bd7dc4e15.jpg",
  "63d26efba5cc5f9646331ed80b2d2f9b.jpg",
  "665ac408396ad35eb61f854e8be79a52.jpg",
  "67d4050eaed4a3d9358090b9ea5a5274.jpg",
  "68b47458458583d0f736634ec61563a7.jpg",
  "68cbca9164e0be85f0c85d64f85cf82f.jpg",
  "69d44b397db9a3b48b082b3808f89554.jpg",
  "6b7913540889d5a61816d0f35b18b5f2.jpg",
  "6ba01ad449b923f754ae6fe97ccdd258.jpg",
  "6bcaf1c9a4974cbd6a1648c8db724b90.jpg",
  "6c55472367a7b0df61f3a5f353e7a7b2.jpg",
  "6d6663434b7634c15412810c1d439c5b.jpg",
  "6dfcaf4d63cb402d29f37c858b7f0591.jpg",
  "6f517267a3451a412ed65dda399b9137.jpg",
  "6f97ebc58bf32ff42e76208ff046fdef.jpg",
  "706e42b9370adca314a33c63e52e60a1.jpg",
  "70d90211fa2c28a32c691ac45a9b837b.jpg",
  "714b4b2b63d595669a790bd90959203e.jpg",
  "721e2f7ca75d181c1c11bd5ce07f5f37.jpg",
  "725ffcc4babaddf9b0654cede52ddb35.jpg",
  "72ac4cf35fb94ef39eca5f1c39e00953.jpg",
  "72dc15a3b75ea2563b9a3a751a6d23f2.jpg",
  "73f8efb37455491a1032edacba74bb35.jpg",
  "742f3170d5f32f2a4e02207ae316ae07.jpg",
  "757b4d878bba4b8a2d419d6ee6495345.jpg",
  "75bce0be130aa7619c221f3f6ce74fab.jpg",
  "75d4a2bc6b713ce6fd75750e6fcfcc53.jpg",
  "75d8d6abdb331b352e41773f612c0076.jpg",
  "78ac6928aa45cd6b9d534d313df03642.jpg",
  "7ad8d02abad70b35a51efa9e4125caf4.jpg",
  "7c48cfe92934b9915bda4f633881ef35.jpg",
  "7c999a761be46fcbced6fa808b19f03c.jpg",
  "7d63047ff201fd4d0b90ec1169a50b70.jpg",
  "7de40d3b99e66d37d2e50141cc7f627b.jpg",
  "7e94233a25ebfc482d48c9c19b7651d2.jpg",
  "81b922167916ace4406bf9de2635e744.jpg",
  "82ace06c21f05fa4aa372eb4475a256e.jpg",
  "85f9ea3c36e66e2dc9fad077d69396fb.jpg",
  "87cbfa003adc48df5fca65d413242873.jpg",
  "88ce39d2698d80a5f77a9696bdcff9d6.jpg",
  "88f629c54a494332c0f5cbfc72fb4e1a.jpg",
  "8a0f4c960127d27bd1fee6795c104847.jpg",
  "8a5e2d88a2d09b391df464f96f44915b.jpg",
  "8aeebeba1b74a14ec4aaaf84733e08d2.jpg",
  "8aff09b68644c5e0786883e338cbe1a6.jpg",
  "8b1c9e3f551e07f641d76c4a3812b10d.jpg",
  "8b8ca618c565a014bfbdb656364ab4db.jpg",
  "8be6e235921d10aa9d4d7f4070b2a23e.jpg",
  "8cef31e51b10670aa52c8be842a999fe.jpg",
  "8dda4bec552d11c9064f9d40026b3e46.jpg",
  "8dfcd9975308bebcacd65be0e96668b8.jpg",
  "8e2d37c3d73e98d3a7228b3de2b03a5d.jpg",
  "8ee7824543b5e37b9d606638d607a735.jpg",
  "8f46010f62c61993ab40092c32ab20ca.jpg",
  "90e49b78173f3488da1393379008a6d5.jpg",
  "92a45c066017d6a1667a4bd128e97aaf.jpg",
  "92b853d28f708786c9f6776278d9f569.jpg",
  "94a88bd5a41f6c4a0990ccd083d402f2.jpg",
  "96a1d50529b001fbfc66430fabec3ae4.jpg",
  "96ac6e54dcab6d3eaa3b990969315d1e.jpg",
  "96bbe2151c954f1346aca1cf2871bc45.jpg",
  "97cece35f975230cfb8a5b0cc2e8ef5a.jpg",
  "98b557d527f0a3bdafb1035ff07745a6.jpg",
  "9a8c3317df8427c65c315d79d7d4b8b6.jpg",
  "9b95b101547a89eb64e295ee452d70c2.jpg",
  "9bb2cf264fd0cd81457fd1f7eea9a546.jpg",
  "9bc51e1b0a2aa8ee8bc07eefd6c8c439.jpg",
  "9c86a33cb470de5e2f0260a1a9c7bdb7.jpg",
  "9cdbd7230b55d496b3ebe0d55c4249eb.jpg",
  "9cffb9f32be45a7b96e311dc7e999159.jpg",
  "9d495c8d357c2b72eb28acb743dd77b7.jpg",
  "9d82039cc73cc0e62192f2459c221f8b.jpg",
  "9e3c3c3cd9ddd6cdfeb84a9bad58013f.jpg",
  "9e503ea284c52377d90d4135cbf7781a.jpg",
  "9f325d93a202c1f917cf59a7b9ad9d4d.jpg"
]

var reportListStatus = {
  all:['new', 'resolved', 'defered', 'open'],
  unresolved:['new','open'],
  new:'new',
  open:'open',
  resolved:'resolved',
  defered:'defered'
}

var eventAction = {
  leave: 'leave',
  join: 'join'
}

var eventLaunchStatusList = {
    now:'now',
    upcoming:'upcoming'
}

var bungieMemberShipType = {
  PSN:2,
  XBOX:1
}

var bungieMessageTypes = {
  accountVerification:'accountVerification',
  passwordReset:'passwordReset'
}

var bungieMessages = {
  accountVerification:'Thanks for signing up for %APPNAME%, Destiny Fireteam Finder. Click the link below to verify your PSN ID." %URL%',
  passwordReset:'Greetings from %APPNAME%! We received a request to reset your password. To reset your password please follow the link: %URL% . If you did not make this request, please let us know and disregard this message..'
}
var bungieErrorMessage= function(messageId) {
  console.log('bungieErrorMessage::messageId',messageId)
  switch (messageId) {
    case "UserCannotResolveCentralAccount":
      return "The PSNID entered either doesnot exist or is not linked to your bungie profile. Please verify the details provided and try again later."
      break;
    default:
      return "We encountered an error while validating the PSNID provided. Please try again later."
      break;
  }
}
var eventNotificationTrigger = {
  launchUpcomingEvents:'launchUpcomingEvents',
  launchEventStart:'launchEventStart',
  eventStartReminder:'eventStartReminder',
  dailyOneTimeReminder:'dailyOneTimeReminder',
  launchUpComingReminders:'launchUpComingReminders'
}

var userNotificationTrigger = {
  userSignup:'userSignup'
}
var freelanceBungieGroup = {
  "groupId": "clan_id_not_set",
  "groupName": "Crossroad Freelance",
  "avatarPath": config.hostName+"/img/imgTravelerLogo.png",
  "clanEnabled": false
}

module.exports = {
  l: lodash,
  baseUrl: baseUrl,
  imageFiles: imageFiles,
  reportListStatus: reportListStatus,
  eventAction: eventAction,
  eventLaunchStatusList: eventLaunchStatusList,
  bungieMemberShipType:bungieMemberShipType,
  eventNotificationTrigger: eventNotificationTrigger,
  userNotificationTrigger: userNotificationTrigger,
  bungieMessageTypes: bungieMessageTypes,
  bungieMessages: bungieMessages,
  freelanceBungieGroup:freelanceBungieGroup,
  bungieErrorMessage:bungieErrorMessage
};