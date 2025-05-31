//Again.js | Noskid.. in noskid ? maybe in noskid too.

function againAndAgain() {
    const iframe = `<iframe style="width: 100%; height: 100%; border: none;" src=${window.location.href}></iframe>`

    const win = ClassicWindow.createWindow({
        title: `${window.location.hostname}`,
        content: iframe,
        width: 500,
        height: 400,
        x: Math.round((window.innerWidth - 500) / 2),
        y: Math.round((window.innerHeight - 400) / 2),
        theme: 'dark',
        icon: "https://images.dpip.lol/logo.png",
        statusText: "Why?.."
    });

    log('Noskid window created, but why?', 'success');
}
 