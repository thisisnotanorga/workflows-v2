function withCookie() {
    $('body').terminal({
      hello: nt,
      cat: nt,
      cmd: nt,
      discord: nt,
      help: nt,
      "apt/install": nt,
      date: nt,
      curl: nt,
      play: nt,
      shutdown: nt,
      uwu: nt,
      timer: nt,
      todo: nt,
      wiki: nt,
      whois: nt,
      ec: nt,
      qr: nt,
      slowroads: nt,
      whoami: nt,
      ipconfig: nt,
      'get/cert': nt,
      exit: nt,

    }, {
      completion: true,
      prompt: "Error > ",
      greetings: `Douxx terminal [version 1.8.2]
(c) Douxx.xyz Corporation. Tous droits réservés.
> cmd
------------------------
***** Douxx terminal 1.8.2 by Douxx.xyz *****

BIOS date: 2023-12-10
Initializing Settings: Success!

Error in './TERM/INDEX.HTML' line 1!
------------------------
Starting command shell:
Try C:\\term\\term.com

`, onInit: function (term) {

term.error('Error: C:\\term not found! Try git/clone <url> !\n');
biiiiiiiii();
CError();
}
});
    
}

function withoutCookie() {
    $('body').terminal({
      hello: helloCommand,
      cmd: cmdCommand,
      discord: discordCommand,
      help: help,
      "apt/install": apt,
      date: date,
      curl: curl,
      play: play,
      shutdown: shut,
      uwu: uwu,
      timer: timer,
      todo: todo,
      wiki: wiki,
      whois: whois,
      ec: eaglercraft,
      qr: qr,
      slowroads: sr,
      whoami: whoami,
      ipconfig: ipconfig,
      'get/cert': cert,
      exit: exit,
    }, {
      completion: true,
      prompt: "C:\\term > ",
      greetings: ` terminal [version 1.8.2]
(c) DPIP.lol Corporation. All rights reserved.
> cmd
***** NoSkid terminal 1.0.4 by DPIP.lol *****
    
BIOS date: 2023-12-10
Initializing Settings: Success!
    
Error in './TERM/INDEX.HTML' line 1!
------------------------
Starting command shell:
Try C:\\term\\term.com
    
NoSkid terminal EMS swapping initialized (500k)
`
    
    }) ;

  }
  function ustupid() {
    $('body').terminal({
        bootfile: bexec,
    }, {
      completion: true,
      prompt: " ",
      greetings: null, onInit: function (term) {

term.error('Error: No BootFile detected!\nType \'bootfile\' to set a new bootfile');

}
    }) ;

  }

        function boot() {
            var areUStupidCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('are_u_stupid?='));
            var isAreUStupid = areUStupidCookie && areUStupidCookie.split('=')[1].trim() === 'true';

            var termDeletedCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('term_deleted='));
            var isTermDeleted = termDeletedCookie && termDeletedCookie.split('=')[1].trim() === 'true';

            if (isAreUStupid) {
                ustupid();
            } else if (isTermDeleted) {
                withCookie();
            } else {
                withoutCookie();
            }
        };

