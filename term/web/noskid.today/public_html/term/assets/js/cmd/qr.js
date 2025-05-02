// qr.js

function qr(text) {
    var term = this;
  
    var qrContainer = $('<div style="display: flex; justify-content: flex-start; align-items: center; height: 100%;">');
    term.echo(qrContainer);
  

    new QRCode(qrContainer[0], {
      text: text,
      width: 300,
      height: 300
    });
  
    term.set_prompt('C:\\term > ');
  }
  