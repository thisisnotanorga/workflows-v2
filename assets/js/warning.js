//Warning.js | Shows 20 Warnings in the client console

for (let i = 0; i < 20; i++) {
    console.log('%cHold up!', 'color: #5865f2; font-size: 100px; font-weight: bold; text-shadow: 2px 2px black;');
    console.log('%cInvaders must die. Go away!', 'color: red; font-style: italic; font-size: 20px;');
    console.log('%cIf you need any help, send a mail to douxx@is.notaskid.ong.', 'color: white; font-size: 18px;');
    console.log('%cIf you know exactly what you\'re doing, you should consider contributing to noskid. https://github.com/douxxtech/noskid.today.', 'color: white; font-size: 18px;');
}
log('Warnings sent!', 'success');