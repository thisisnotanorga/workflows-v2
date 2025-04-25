//Localinfo | Get local informations to dynamicly update the website

const countryUpdate = document.getElementById("country");
const cityUpdate = document.getElementById("city");
const ispUpdate = document.getElementById("isp");
const ispfUpdate = document.getElementById("ispf");
const ipUpdate = document.getElementById("ipadr");
const dateUpdate = document.getElementById("date");

//Update the year date
dateUpdate.innerHTML = ` in the big ${new Date().getFullYear()}`;
log(`dateUpdate set to ${dateUpdate.innerHTML}`, 'success');

//Get informations abt the ip
async function getIpInfo() {
    try {
        const response = await fetch('/api/ip/');
        const data = await response.json();
    
        if (data.status === 'success') {
            country = data.country;
            city = data.city;
            isp = data.isp;
            ip = data.query;

            if (country) {
                countryUpdate.innerHTML = country;
                log(`countryUpdate set to ${country}`, 'success');
            }
            if (city) {
                cityUpdate.innerHTML = city;
                log(`cityUpdate set to ${city}`, 'success');
            }
            if (isp) {
                ispUpdate.innerHTML = isp;
                ispfUpdate.innerHTML = isp.toUpperCase();
                log(`isp(f)Update set to ${isp}`, 'success');
                
            }
            if (ip) {
                ipUpdate.innerHTML = ip;
                log(`ipUpdate set to ${ip}`, 'success');
            }
            
        }
    } catch (error) {
        log(`Failed to fetch ip infos: ${e}`, 'error')
    }
}

getIpInfo();
