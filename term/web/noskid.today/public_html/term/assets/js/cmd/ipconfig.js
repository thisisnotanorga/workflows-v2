// File: ./static/js/ipconfig.js

function ipconfig() {
    var term = this;

    $.getJSON('https://api64.ipify.org?format=json', function (data) {
        term.echo('[+] IPv4 Address: ' + data.ip);
    });

    term.echo('[+] Online: ' + navigator.onLine);
    term.echo('[+] Connection Type: ' + navigator.connection.effectiveType);
}
