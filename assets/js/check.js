//Check.js | The certification validity checker

function verifyCertificate() {
    log('=-=-==- Certificate -==-=-=', 'warning');
    log('Opening certificate verification tool...', 'warning');

    ensureConsoleOpen().then(() => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        log('Please select a certificate file (.png)', 'warning');

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                log('No file selected', 'error');
                return;
            }

            log(`Processing certificate file: ${file.name}`, 'warning');
            processCertificateFile(file);
        });

        fileInput.click();
    });
}

function ensureConsoleOpen() {
    return new Promise((resolve) => {
        const consoleContainer = document.getElementById("console-container");
        if (consoleContainer.style.display === "none" || consoleContainer.style.display === "") {
            const consoleButton = document.getElementById('console-btn');
            if (consoleButton) {
                consoleButton.click();
                setTimeout(() => resolve(), 300);
            } else {
                log('Console button not found', 'error');
                resolve();
            }
        } else {
            resolve();
        }
    });
}

function processCertificateFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            extractTextFromPng(e.target.result).then(extractedText => {
                if (!extractedText) {
                    log('Could not extract verification data from file', 'error');
                    return;
                }

                const verificationKey = extractVerificationKey(extractedText);
                if (!verificationKey) {
                    log('No valid verification key found in certificate', 'error');
                    return;
                }

                log('Successfully extracted verification key', 'success');

                const localData = extractLocalData(extractedText);
                if (localData) {
                    log('Local certificate data:', 'warning');
                    log(`Username: ${localData.username}`, 'warning');
                    log(`Creation Date: ${localData.creationDate}`, 'warning');
                }

                log('Verifying certificate with server...', 'warning');
                verifyCertificateWithAPI(verificationKey).then(apiData => {
                    if (!apiData.success) {
                        log(`Certificate verification failed: ${apiData.message}`, 'error');
                        return;
                    }

                    const validationResult = compareData(localData, apiData.data);

                    if (validationResult.valid) {
                        log('Certificate is VALID!', 'success');
                        displayCertificateDetails(apiData.data);
                    } else {
                        log('Certificate data mismatch!', 'error');
                        log(`Mismatch reason: ${validationResult.reason}`, 'error');
                        log(`We do not validate this certificate.`, 'error');
                    }
                }).catch(error => {
                    log(`API verification failed: ${error.message}`, 'error');
                });
            });
        } catch (error) {
            log(`Error processing certificate: ${error.message}`, 'error');
        }
    };

    reader.onerror = function () {
        log('Error reading file', 'error');
    };

    reader.readAsArrayBuffer(file);
}

function extractTextFromPng(arrayBuffer) {
    return new Promise((resolve) => {
        try {
            const bytes = new Uint8Array(arrayBuffer);

            //png header check
            if (!(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47)) {
                log("Not a PNG file", 'error');
                resolve(null);
                return;
            }

            let pos = 8; //skip png header
            let extractedText = null;

            while (pos < bytes.length) {
                const length = (
                    (bytes[pos] << 24) |
                    (bytes[pos + 1] << 16) |
                    (bytes[pos + 2] << 8) |
                    (bytes[pos + 3])
                );

                const type = String.fromCharCode(
                    bytes[pos + 4],
                    bytes[pos + 5],
                    bytes[pos + 6],
                    bytes[pos + 7]
                );

                if (type === 'tEXt') {
                    const chunkData = bytes.slice(pos + 8, pos + 8 + length);
                    const text = new TextDecoder('utf-8').decode(chunkData);

                    const separatorIndex = text.indexOf('\0');
                    const keyword = text.substring(0, separatorIndex);
                    const value = text.substring(separatorIndex + 1);

                    if (keyword === 'noskid-key') {
                        extractedText = value;
                        break;
                    }
                }

                pos += 8 + length + 4;
            }

            if (extractedText) {
                log("Text chunk extracted successfully", 'success');
                resolve(extractedText);
            } else {
                log("No 'noskid-key' text chunk found", 'error');
                resolve(null);
            }
        } catch (error) {
            log(`Error extracting tEXt chunk: ${error.message}`, 'error');
            resolve(null);
        }
    });
}


function extractVerificationKey(text) {
    console.log(text);
    try {
        const keyPattern = /-*BEGIN NOSKID KEY-*\s*([a-f0-9]{64})/i;
        const match = text.match(keyPattern);

        if (match) {
            return match[1];
        }

        return null;
    } catch (error) {
        log(`Error extracting verification key: ${error.message}`, 'error');
        return null;
    }
}

function extractLocalData(text) {
    try {
        const keyPattern = /-----BEGIN NOSKID KEY-----\s*([a-f0-9]+)\s*([A-Za-z0-9+/=]+)\s*([A-Za-z0-9+/=]+)\s*-----END NOSKID KEY-----/;
        const match = text.match(keyPattern);

        if (!match) return null;

        const certInfoEncoded = match[2];
        let certInfoDecoded = atob(certInfoEncoded.replace(/=/g, ''));

        const usernameMatch = certInfoDecoded.match(/CERT-\d+-(.+)/);
        const username = usernameMatch ? usernameMatch[1] : null;

        const dateInfoEncoded = match[3];
        let dateInfoDecoded = atob(dateInfoEncoded.replace(/=/g, ''));

        const dateMatch = dateInfoDecoded.match(/CREATED-(.+)/);
        const creationDate = dateMatch ? dateMatch[1] : null;

        return {
            username,
            creationDate
        };
    } catch (error) {
        log(`Error extracting local data: ${error.message}`, 'error');
        return null;
    }
}

async function verifyCertificateWithAPI(verificationKey) {
    try {
        const response = await fetch(`/api/checkcert/?key=${encodeURIComponent(verificationKey)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`API request failed: ${error.message}`);
    }
}

function compareData(localData, apiData) {
    if (!localData || !apiData) {
        return { valid: false, reason: 'Missing data for comparison' };
    }

    if (localData.username !== apiData.username) {
        return {
            valid: false,
            reason: `Username mismatch: Local=${localData.username}, API=${apiData.username}`
        };
    }

    const localDateMinutes = localData.creationDate.substring(0, 16);
    const apiDateMinutes = apiData.creationDate.substring(0, 16);

    if (localDateMinutes !== apiDateMinutes) {
        return {
            valid: false,
            reason: `Creation date mismatch: Local=${localDateMinutes}, API=${apiDateMinutes}`
        };
    }

    return { valid: true };
}

function displayCertificateDetails(data) {
    log('=-=-==- Certificate -==-=-=', 'warning');
    log(`Certificate #: ${data.certificate_number}`, 'success');
    log(`Username: ${data.username}`, 'success');
    log(`Percentage: ${data.percentage}%`, 'success');
    log(`Creation Date: ${data.creationDate}`, 'success');
    log(`Country: ${data.country} (${data.countryCode})`, 'success');
    log('=-=-=-=-=-=-=-=-==-=-==-=-=', 'warning')
}

function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString();
}
