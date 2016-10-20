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
  "9f325d93a202c1f917cf59a7b9ad9d4d.jpg",
  "ba260e4eb9eb354ae7370bc9891c5557.jpg",
  "3755171dee55592794f7cc494f5d1492.jpg",
  "3755171dee55592794f7cc494f5d1492.jpg",
  "6f517267a3451a412ed65dda399b9137.jpg",
  "ddddd93181f24ca56754bad210d10b94.jpg",
  "ba260e4eb9eb354ae7370bc9891c5557.jpg",
  "6f517267a3451a412ed65dda399b9137.jpg",
  "541bb98238764ea9772ebe37d9b5cedb.jpg",
  "6f517267a3451a412ed65dda399b9137.jpg",
  "8dfcd9975308bebcacd65be0e96668b8.jpg",
  "c790cf04bd91389b5ac18623ea5b38e0.jpg",
  "ba260e4eb9eb354ae7370bc9891c5557.jpg",
  "6f517267a3451a412ed65dda399b9137.jpg",
  "df8b703ffdf1ea905f64ab96d2795674.jpg",
  "e5beef7c6792ed5d1c34a5b2b3efc954.jpg",
  "6f517267a3451a412ed65dda399b9137.jpg",
  "57e97bb59d44829f32f5d13191f5678a.jpg",
  "202b1d3cb149e8be25caed07c8c9937b.jpg",
  "ed4a6735d477a5296fad9ec49fe9b144.jpg",
  "f1791a44f73582aa8b2afc1a3acfca4d.jpg",
  "d8331407ec798870b0ed9a833ff392e2.jpg",
  "f1791a44f73582aa8b2afc1a3acfca4d.jpg",
  "6f517267a3451a412ed65dda399b9137.jpg",
  "f1791a44f73582aa8b2afc1a3acfca4d.jpg",
  "076759177d037127b1a76ccf7a730dde.jpg",
  "202b1d3cb149e8be25caed07c8c9937b.jpg",
  "df8b703ffdf1ea905f64ab96d2795674.jpg",
  "cb4b3afc9a8aca33eecc9fc55ac8d972.jpg",
  "ffddc84b08db158c6ddfcffd34348b2c.jpg",
  "f1791a44f73582aa8b2afc1a3acfca4d.jpg",
  "f1791a44f73582aa8b2afc1a3acfca4d.jpg",
  "1b38c47d926aaa1039269e2e6667209d.jpg",
  "ee49c6b152dc45e09bcf65b991f7699e.jpg",
  "ec8fb9469980f1965ec5f2a86094811c.jpg",
  "92a45c066017d6a1667a4bd128e97aaf.jpg",
  "f1791a44f73582aa8b2afc1a3acfca4d.jpg",
  "dabf4b357029b4d091d713eac46722a3.jpg",
  "8dfcd9975308bebcacd65be0e96668b8.jpg",
  "ee49c6b152dc45e09bcf65b991f7699e.jpg",
  "dabf4b357029b4d091d713eac46722a3.jpg",
  "643280111e61a8f460f9a4761d996b86.jpg",
  "d3b7142e27173e175f3367c568d0ddd4.jpg",
  "a2399a3a7569868edb3749328090e48b.jpg",
  "110c7b1165762a9037d6f322ff3757b2.jpg",
  "d3b7142e27173e175f3367c568d0ddd4.jpg",
  "f3530ec0e06e45d8ece4bd1a66256f99.jpg",
  "98b557d527f0a3bdafb1035ff07745a6.jpg",
  "c01540df087772d4e2fa51d904dc2d88.jpg",
  "c68cc7f07a25575fd86712f9453eb5f1.jpg",
  "82ace06c21f05fa4aa372eb4475a256e.jpg",
  "3562f04a0d02461befffafb56a5f442e.jpg",
  "7de40d3b99e66d37d2e50141cc7f627b.jpg",
  "c01540df087772d4e2fa51d904dc2d88.jpg",
  "c01540df087772d4e2fa51d904dc2d88.jpg",
  "c01540df087772d4e2fa51d904dc2d88.jpg",
  "1b38c47d926aaa1039269e2e6667209d.jpg",
  "98b557d527f0a3bdafb1035ff07745a6.jpg",
  "1b38c47d926aaa1039269e2e6667209d.jpg",
  "3562f04a0d02461befffafb56a5f442e.jpg",
  "f7cddc2a734c30d86718a1c7ccd2285c.jpg",
  "c68cc7f07a25575fd86712f9453eb5f1.jpg",
  "40efd9b13ce844c1bd32e3f3aefebaf7.jpg",
  "bd2ff1c1bd5fbded594f38f310f76d45.jpg",
  "cc9b3e42f4b474812e7f2342cae82d13.jpg",
  "cc3e4409e88fd35e9a8419ea8fa6a0df.jpg",
  "dc869267f3a0dfc0034d58a758d74680.jpg",
  "dc869267f3a0dfc0034d58a758d74680.jpg",
  "5e801f8f8f933e2256946b176b6ccda7.jpg",
  "5e801f8f8f933e2256946b176b6ccda7.jpg",
  "af121ccb7b7eee409ac05931f65e58c4.jpg",
  "14eb43f74b8d245fe036f204d5b399b6.jpg",
  "be1fe9fd12c08f6838d9231e20f9daa4.jpg",
  "f133d9a206b7209affdfb15207cf0583.jpg",
  "cd4dc10364babc13cb48929621774bbe.jpg",
  "cd4dc10364babc13cb48929621774bbe.jpg",
  "b60cb37405e2c223141544c63854fbc9.jpg",
  "f133d9a206b7209affdfb15207cf0583.jpg",
  "ce2e896279be3fca5601153e8cc16f68.jpg",
  "8315ea905afbe9a3e23101846ed3486b.jpg",
  "75662b346aba1cb9959fd0f5f5d2560b.jpg",
  "be1fe9fd12c08f6838d9231e20f9daa4.jpg",
  "3e0b919ea55d420156cdf384b66a7f8a.jpg",
  "f2ddea89e683ab113f31a0da43959dc4.jpg",
  "d8331407ec798870b0ed9a833ff392e2.jpg",
  "88f629c54a494332c0f5cbfc72fb4e1a.jpg",
  "a728fafd4f79f30aa2412b0c1049a2ca.jpg",
  "fa8c9403b2b0544c0e66f20a7ddccb41.jpg",
  "c918b16be1f90a6de8a02a2a178a245c.jpg",
  "c8b92301da131fb7bd301c3cecce4615.jpg",
  "75662b346aba1cb9959fd0f5f5d2560b.jpg",
  "3e0b919ea55d420156cdf384b66a7f8a.jpg",
  "879bf454085559a2d82606fea82a38a1.jpg",
  "88f629c54a494332c0f5cbfc72fb4e1a.jpg",
  "2483d635e876115d8346160d60336566.jpg",
  "7ad8d02abad70b35a51efa9e4125caf4.jpg",
  "9d495c8d357c2b72eb28acb743dd77b7.jpg",
  "97cece35f975230cfb8a5b0cc2e8ef5a.jpg",
  "dc086fdf88fbfb16988bbef69903af38.jpg",
  "f2ddea89e683ab113f31a0da43959dc4.jpg",
  "d6a00c501cd228b6000cfa4b50951033.jpg",
  "5cd80949a18cfb99b6078fc964823cc6.jpg",
  "0e5a66867487f366d72905af527a687b.jpg",
  "3fb207b9ea34cefbda3397ad5c218a3a.jpg",
  "be851723afd6d727aa185c9b2520e837.jpg",
  "be851723afd6d727aa185c9b2520e837.jpg",
  "61642cffcbaf122c4c3a51d11fa3b0da.jpg",
  "adc7c7f88377b01532b0982e92a69ef8.jpg",
  "43fed2bb4d4abfa032241e90c8d9866b.jpg",
  "130d91ff5df5a9d18461ab748c74fad5.jpg",
  "c31d2e62675c800042197b0c6072ec86.jpg",
  "9a8c3317df8427c65c315d79d7d4b8b6.jpg",
  "9a8c3317df8427c65c315d79d7d4b8b6.jpg",
  "8b8ca618c565a014bfbdb656364ab4db.jpg",
  "179f9d181c820abb509f9ea1734c1b17.jpg",
  "2483d635e876115d8346160d60336566.jpg",
  "f2ddea89e683ab113f31a0da43959dc4.jpg",
  "3fb207b9ea34cefbda3397ad5c218a3a.jpg",
  "8b8ca618c565a014bfbdb656364ab4db.jpg",
  "141aa715dee032404f3067a51357dba0.jpg",
  "558ac1229058a462ab40e374d82d8061.jpg",
  "59d20d929387c77f80f5205da684cf78.jpg",
  "2a0828842023dcf38a391e55d924f6ef.jpg",
  "179f9d181c820abb509f9ea1734c1b17.jpg",
  "9bb2cf264fd0cd81457fd1f7eea9a546.jpg",
  "88f629c54a494332c0f5cbfc72fb4e1a.jpg",
  "43fed2bb4d4abfa032241e90c8d9866b.jpg",
  "dc8e2b1c1584f9902effc92ae97dc069.jpg",
  "14eb43f74b8d245fe036f204d5b399b6.jpg",
  "9cdbd7230b55d496b3ebe0d55c4249eb.jpg",
  "f42ba3f99bd0fa20179cae9090b23ec7.jpg",
  "d189ca58efd10d868cecb2dc032dea62.jpg",
  "7e94233a25ebfc482d48c9c19b7651d2.jpg",
  "9579882f8222b121677234f45e1f3e35.jpg",
  "8e2d37c3d73e98d3a7228b3de2b03a5d.jpg",
  "96a1d50529b001fbfc66430fabec3ae4.jpg",
  "9bb2cf264fd0cd81457fd1f7eea9a546.jpg",
  "179f9d181c820abb509f9ea1734c1b17.jpg",
  "0453bf86cd490639594631ca01f36ec9.jpg",
  "51019cde47738f13801725caed9fd43e.jpg",
  "59d20d929387c77f80f5205da684cf78.jpg",
  "ae0d23044688bf52971641f11129700d.jpg",
  "179f9d181c820abb509f9ea1734c1b17.jpg",
  "1a21bd95ff667ae9265bc5dd44446854.jpg",
  "179f9d181c820abb509f9ea1734c1b17.jpg",
  "179f9d181c820abb509f9ea1734c1b17.jpg",
  "4b1966f35c022ae0dea9114a1aacd7fe.jpg",
  "d599cf6261b9d0da45f6659d1d7e5305.jpg",
  "6291165df247ece8f282734c480458f7.jpg",
  "c0a4af415a8698400ab0378406ba75a4.jpg",
  "fe992c0908f968e1ca729f6247650241.jpg",
  "6291165df247ece8f282734c480458f7.jpg",
  "5353e1710138be7b8b59efde217eabf1.jpg",
  "6803b23d4c5984952ae54091ab4e06de.jpg",
  "6dfcaf4d63cb402d29f37c858b7f0591.jpg",
  "721e2f7ca75d181c1c11bd5ce07f5f37.jpg",
  "0bc68c808d1bf91561582ee211edc123.jpg",
  "7de40d3b99e66d37d2e50141cc7f627b.jpg",
  "44ec9b9c3973cda82449a351c0459ebe.jpg",
  "016d8fb5fb06afc07ac4d7a1894d9b7d.jpg",
  "105adf441219808bc2de94bc6b069b94.jpg",
  "f0472127c6230da81a0e3ab0546b51c9.jpg",
  "d189ca58efd10d868cecb2dc032dea62.jpg",
  "44ec9b9c3973cda82449a351c0459ebe.jpg",
  "40ea60ca800b4c43071def996235743a.jpg",
  "c55bb99246b26adadd891bc9f83399a9.jpg",
  "368cd3f815aa45d867bed14314a57d8a.jpg",
  "8a5e2d88a2d09b391df464f96f44915b.jpg",
  "8b1c9e3f551e07f641d76c4a3812b10d.jpg",
  "c0bd936ab74cc5472111bc450462d0ea.jpg",
  "6803b23d4c5984952ae54091ab4e06de.jpg",
  "27970e7528f82440bfff0523ef480f83.jpg",
  "ba51fdeabefab1b238191aec86ff3a5a.jpg",
  "73f8efb37455491a1032edacba74bb35.jpg",
  "0db6071aa2214a302a8828ba7b39863b.jpg",
  "89151a1d6389be32fcff90cb2e27d21c.jpg",
  "7ad8d02abad70b35a51efa9e4125caf4.jpg",
  "3c2583db9457909189276966ee0a6922.jpg",
  "fd3d3b0683618c61b69f1fbd107eb53d.jpg",
  "f2ddea89e683ab113f31a0da43959dc4.jpg",
  "8a5e2d88a2d09b391df464f96f44915b.jpg",
  "8be6e235921d10aa9d4d7f4070b2a23e.jpg",
  "55626a91b9b3d1b7e39fae63947e9180.jpg",
  "44ec9b9c3973cda82449a351c0459ebe.jpg",
  "6b7913540889d5a61816d0f35b18b5f2.jpg",
  "119bd40a1d84083f48c344f49c9dde54.jpg",
  "88f629c54a494332c0f5cbfc72fb4e1a.jpg",
  "215b897219d7badd3002f891f3182136.jpg",
  "5f5c78b473d2797bba6d88f5eb0b8bc5.jpg",
  "c55bb99246b26adadd891bc9f83399a9.jpg",
  "14eb43f74b8d245fe036f204d5b399b6.jpg",
  "5b65aa0abb2cbd6f57f5bd63503198f2.jpg",
  "08fd007e079a10e90a28156db2518259.jpg",
  "b026545c4b47ad3a86a0f0137e4cc611.jpg",
  "5353e1710138be7b8b59efde217eabf1.jpg",
  "7de40d3b99e66d37d2e50141cc7f627b.jpg",
  "c064b4d8a82708202ce7790e3574532c.jpg",
  "ce8fc694d313d68ad378bf1cd9326e49.jpg",
  "7737359e7bf4db2585aae2fd089c89ee.jpg",
  "7c48cfe92934b9915bda4f633881ef35.jpg",
  "c31d2e62675c800042197b0c6072ec86.jpg",
  "4136135fc7f5ddf89db9bacb6bec39b1.jpg",
  "5a66cd80dff47ada45beae4267021148.jpg",
  "f7cddc2a734c30d86718a1c7ccd2285c.jpg",
  "c55bb99246b26adadd891bc9f83399a9.jpg",
  "8b1c9e3f551e07f641d76c4a3812b10d.jpg",
  "d39a6d5d0a5dfecf7de09678db63d281.jpg",
  "e76b99fad8cf2d5b5e23c93c1be55185.jpg",
  "dd6e49a7615ee4cdcf317eac21268401.jpg",
  "4d565b6ac97b81f98f64a062f20c61ce.jpg",
  "de4d8f7ae3b32e3e0d368a02c31d2f33.jpg",
  "7737359e7bf4db2585aae2fd089c89ee.jpg",
  "f01edf4553686a01fe57e40e5914e3ac.jpg",
  "88f629c54a494332c0f5cbfc72fb4e1a.jpg",
  "38e1d5c110ca8d1f5dd607832b7465d3.jpg",
  "7756477ba1c324b071701aca1a0680c3.jpg",
  "bd2ff1c1bd5fbded594f38f310f76d45.jpg",
  "a3f314ad0fa1ee111a4115c0b841f5ab.jpg",
  "3772cd23977b07ea7d7e1c571e0627ae.jpg",
  "cc9b3e42f4b474812e7f2342cae82d13.jpg",
  "5162d555010c68d9c1ecbd1757627f8e.jpg",
  "a7cc31ed46068a17ebe3c81a105d88b1.jpg",
  "ec8fb9469980f1965ec5f2a86094811c.jpg",
  "a3f314ad0fa1ee111a4115c0b841f5ab.jpg",
  "c99296414f9eee2bbb28242a5bad33a0.jpg",
  "0712a9e6e4741bf3d56a495df2379131.jpg",
  "efe4c4abb1cbdb005b3595f8129251f2.jpg",
  "a4b3dd0b9d575aea97fbebfe72f5ffe0.jpg",
  "5a81c66d83f655160ddb3f58a465b36e.jpg",
  "7737359e7bf4db2585aae2fd089c89ee.jpg",
  "44ec9b9c3973cda82449a351c0459ebe.jpg",
  "133976fcf6d3b34d7ddea388def96e9f.jpg",
  "8dda4bec552d11c9064f9d40026b3e46.jpg",
  "62a533f71d53ddc101831d5b94174c09.jpg",
  "0b3555c30527ad45bc1e8af835a5baa6.jpg",
  "d885a8b830056bda28f7bfa5c53ef4bf.jpg",
  "5a66cd80dff47ada45beae4267021148.jpg",
  "b6f6d12a038da1ec72475ded90bc059a.jpg",
  "5efcde6450dafe9faf73624da9517e48.jpg",
  "8a5e2d88a2d09b391df464f96f44915b.jpg",
  "9d82039cc73cc0e62192f2459c221f8b.jpg",
  "c36d43da3af53ba7dc6f00995d44ddb2.jpg",
  "68b47458458583d0f736634ec61563a7.jpg",
  "d39a6d5d0a5dfecf7de09678db63d281.jpg",
  "9b95b101547a89eb64e295ee452d70c2.jpg",
  "b52fa553219bee07728220d310b3c300.jpg",
  "20bfa7bee9063f0f100c513558772cef.jpg",
  "1a21bd95ff667ae9265bc5dd44446854.jpg",
  "20bfa7bee9063f0f100c513558772cef.jpg",
  "b14f7d49958dd12a3498f2487a000631.jpg",
  "c98deaf91ea25a4363c0286ca8f86a03.jpg",
  "5a66cd80dff47ada45beae4267021148.jpg",
  "aaa66d6f55c0ed6aeaf1abf409bd23ad.jpg",
  "5a66cd80dff47ada45beae4267021148.jpg",
  "0712a9e6e4741bf3d56a495df2379131.jpg",
  "d39a6d5d0a5dfecf7de09678db63d281.jpg",
  "c98deaf91ea25a4363c0286ca8f86a03.jpg",
  "38e1d5c110ca8d1f5dd607832b7465d3.jpg",
  "0d2043d2173645ff0e49bce6a696bf0e.jpg",
  "b54651517d617c8a9ff52c571077af26.jpg",
  "68cbca9164e0be85f0c85d64f85cf82f.jpg",
  "7d63047ff201fd4d0b90ec1169a50b70.jpg",
  "5f5c78b473d2797bba6d88f5eb0b8bc5.jpg",
  "0d2043d2173645ff0e49bce6a696bf0e.jpg",
  "1a21bd95ff667ae9265bc5dd44446854.jpg",
  "3e4a19d59e581a5b2d034e6cb6c9ce0c.jpg",
  "f7cddc2a734c30d86718a1c7ccd2285c.jpg",
  "0b8b9041632f129acc5b89ec98a18905.jpg",
  "8095fadc1647031efa797a6a552bda61.jpg",
  "d8331407ec798870b0ed9a833ff392e2.jpg",
  "36d14e77d2640e30de67e176f3560b86.jpg",
  "4d565b6ac97b81f98f64a062f20c61ce.jpg",
  "fd3d3b0683618c61b69f1fbd107eb53d.jpg",
  "3e4a19d59e581a5b2d034e6cb6c9ce0c.jpg",
  "c7efbf0d88b9f290c41e382e13c4667d.jpg",
  "fd3d3b0683618c61b69f1fbd107eb53d.jpg",
  "36d14e77d2640e30de67e176f3560b86.jpg",
  "c7efbf0d88b9f290c41e382e13c4667d.jpg",
  "0b8b9041632f129acc5b89ec98a18905.jpg",
  "44ec9b9c3973cda82449a351c0459ebe.jpg",
  "6d6663434b7634c15412810c1d439c5b.jpg",
  "10f2adaa23f48a20b8ac370c436e4e66.jpg",
  "1ff29782f60e81a4a77757b0d9ee14f8.jpg",
  "8a5e2d88a2d09b391df464f96f44915b.jpg",
  "5f02879329a3e8fb8a993ee9e1eda985.jpg",
  "461378e2025b1d4e1e8326b773ff421f.jpg",
  "0db6071aa2214a302a8828ba7b39863b.jpg",
  "b14f7d49958dd12a3498f2487a000631.jpg",
  "0ac3007bdc16de523de01b6ad0782cfe.jpg",
  "016d8fb5fb06afc07ac4d7a1894d9b7d.jpg",
  "5a81c66d83f655160ddb3f58a465b36e.jpg",
  "24763255f1e411b9246464d78fef5dba.jpg"
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

var eventStatus = {
  new:'new',
  open:'open',
  full:'full',
  can_join:'can_join'
}

var bungieMemberShipType = {
  PSN:2,
  XBOX:1,
  PS3:2,
  PS4:2,
  XBOX360:1,
  XBOXONE:1
}

var newGenConsoleType = {
  2:"PS4",
  1:"XBOXONE"
}
var consoleGenericsId = {
  PSN:"PlayStation Gamertag",
  XBOX:"Xbox Gamertag",
  PS3:"PlayStation Gamertag",
  PS4:"PlayStation Gamertag",
  XBOX360:"Xbox Gamertag",
  XBOXONE:"Xbox Gamertag"
}
var bungieMessageTypes = {
  accountVerification:'accountVerification',
  passwordReset:'passwordReset',
  eventInvitation:'eventInvitation'
}

var bungieMessages = {
  accountVerification:'Open the link to verify your %CONSOLETYPE% on Crossroads %URL%. If you have any questions, please email us at support@crossroadsapp.co because this mailbox is unmonitored',
  passwordReset: 'Hi, Guardian! We received a request to reset your password. Please follow the link: %URL%. If you did not forget your password, please disregard this message.',
  addConsoleErrorMsg: "Oops! We could not find the #CONSOLE_TYPE# #CONSOLE_ID# publicly linked to your bungie account. Make sure your profile is public and try again.",
  bungieMembershipLookupError: "Looks like your #CONSOLE_TYPE# #CONSOLE_ID# isn't publicly linked to your Bungie account. Check Profile > Settings > Linked Accounts to make sure it's public and try again.",
  eventInvitationCurrent:"%CONSOLE_ID% reserved you a Fireteam spot for %ACTIVITY_NAME%. Respond on Crossroads %EVENT_DEEPLINK%.",
  eventInvitationUpcoming:"%CONSOLE_ID% reserved you a Fireteam spot for %ACTIVITY_NAME% on %EVENT_TIME%. Respond on Crossroads %EVENT_DEEPLINK%.",
  eventInvitationDefault:"%CONSOLE_ID% reserved you a Fireteam spot for %ACTIVITY_NAME%. Respond on Crossroads %EVENT_DEEPLINK%."
}

var bungieErrorMessage= function(messageId) {
  console.log('bungieErrorMessage::messageId',messageId)
  switch (messageId) {
    case "UserCannotResolveCentralAccount":
      return "We couldn’t find a Bungie.net profile linked to the %CONSOLETYPE% you entered."
      break
    case "NotParsableError":
      return "We couldn’t find a Bungie.net profile linked to the %CONSOLETYPE% you entered."
      break
    case "DestinyInvalidClaimException" || "DestinyUnexpectedError" || "DestinyShardRelayClientTimeout":
      return "We are unable to contact Bungie.net. Please try again in a few minutes."
      break;
    case "WebAuthRequired":
      return "We are unable to contact Bungie.net. Please try again in a few minutes."
      break;
    default:
      return "We are unable to contact Bungie.net. Please try again in a few minutes."
      break
  }
}
var eventNotificationTrigger = {
  launchUpcomingEvents:'launchUpcomingEvents',
  launchEventStart:'launchEventStart',
  eventStartReminder:'eventStartReminder',
  dailyOneTimeReminder:'dailyOneTimeReminder',
  launchUpComingReminders:'launchUpComingReminders',
  eventExpiry:'eventExpiry',
  userTimeout:'userTimeout',
  preUserTimeout:'preUserTimeout'
}

var userNotificationTrigger = {
  userSignup:'userSignup'
}
var freelanceBungieGroup = {
  "groupId": "clan_id_not_set",
  "groupName": "Freelance Lobby",
  "avatarPath": config.hostName+"/img/iconGroupCrossroadsFreelance.png",
  "clanEnabled": false
}

var existingUserInstallData = {
  ads:"mvpUser/mvpCampaign/mvpAd/mvpCreative"
}

var sysConfigKeys = {
  awsSNSAppArn:'app_%DEVICE_TYPE%_%ENV%_%GROUP%_%CONSOLETYPE%',
  awsSNSTopicArn:'topic_%ENV%_%GROUP%_%CONSOLETYPE%',
  eventExpiryTimeInMins:"eventExpiryTimeInMins",
  userTimeoutInMins:"userTimeoutInMins",
  preUserTimeoutInMins:"preUserTimeoutInMins",
  bungieCookie: "bungieCookie",
  bungieCsrfToken: "bungieCsrfToken",
  termsVersion: "termsVersion",
  privacyPolicyVersion: "privacyPolicyVersion",
  commentsReportMaxValue: "commentsReportMaxValue",
  commentsReportCoolingOffPeriod: "commentsReportCoolingOffPeriod",
  userActiveTimeOutInMins: "userActiveTimeOutInMins"
}

// These keys map to the method names in eventBasedPushNotification
var notificationQueueTypeEnum = {
  join: "sendPushNotificationForJoin",
  leave: "sendPushNotificationForLeave",
  newCreate: "sendPushNotificationForNewCreate",
  addComment: "sendPushNotificationForAddComment",
  creatorChange: "sendPushNotificationForCreatorChange",
  eventInvite: "sendPushNotificationForEventInvites"
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
  freelanceBungieGroup: freelanceBungieGroup,
  bungieErrorMessage: bungieErrorMessage,
  consoleGenericsId: consoleGenericsId,
  sysConfigKeys: sysConfigKeys,
  eventStatus: eventStatus,
  notificationQueueTypeEnum: notificationQueueTypeEnum,
  existingUserInstallData:existingUserInstallData,
  newGenConsoleType:newGenConsoleType
}