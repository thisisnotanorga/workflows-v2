//Noskid.js | Upadates the main header

const { Typed } = window;

const typed2 = new Typed('#strike', {
    strings: [
        '"hacking u rn"',
        '"nice ip lol"',
        '"botnet flex 💀"',
        '"vpn useless"',
        '"router fried"',
        '"wifi mine now"',
        '"what if i boot u"',
        '"nmap go brrr"',
        '"mac logged 😈"',
        '"ratted fr"',
        '"ddos ez"',
        '"ssh open lol"',
        '"thx m8"',
        '"database leaks"',
        '"bruteforce go"',
        '"packet sniffed"',
        '"scanning ur ports"',
        '"malware sent"',
        '"logs r mine"',
        '"quezstresser.ru running"',
        '"ur pass is 1234"',
        '"phished ez"',
        '"rooted u"',
        '"rat inside"',
        '"darkweb buyer"',
        '"botnet time"',
        '"found u on shodan"',
        '"c2 on top"',
        '"pwned lmao"',
        '"nmap 192.168.1.108"',
        '"ddosing u 😈"',
        '"firewall down 💀"',
        '"nmap❤️ddos tools❤️"',
        '"imma find u on doxbin"',
        '"gave ur ip to hackers"',
        'by douxx.tech :)',
    ],
    
  typeSpeed: 80,
  backSpeed: 60,
  smartBackspace: false,
  loop: true,
  shuffle: false,
  backDelay: 2000,
  startDelay: 3000,
});

log("Typing cursor initiated!", 'success');

if (typed2.cursor != null) {
  typed2.cursor.classList.add('typed-cursor--blink');
}

