//Track.js | Shows the visit count when the "A" is clicked

let unique_views = -1;
let total_requests = -1;

async function showStats() {
    if (unique_views == -1) {
        if (localStorage.getItem('dpipTrack') === 'false') {
            log('dpipTrack set to false, not tracking.', 'warning');
        } else {
            await getReqCount();
        }
        
        logStats();
    } else {
        logStats();
    }
}

async function getReqCount() {
    try {
        const response = await fetch('https://track.dpip.lol/?id=noskid.today');
        const data = await response.json();
        if (data.unique_views) unique_views = formatNumber(data.unique_views);
        if (data.total_requests) total_requests = formatNumber(data.total_requests);
        log(`Requests count fetched!`, 'success');
    } catch (error) {
        log(`Failed to fetch requests count: ${error}`, 'error');
    }
}

function formatNumber(num) {
    return num >= 1000 ? (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : num;
}

function logStats() {
    log('', 'warning');
    log("=-=-==-=-= Stats =-=-==-=-=", 'warning');
    log(`Unique visitors: ${unique_views}`, 'warning');
    log(`Total requests: ${total_requests}`, 'warning');
    log("=-=-=-=-=-=-=-=-==-=-==-=-=", 'warning');
    log('', 'warning');

}

showStats();