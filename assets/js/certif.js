//Certif.js | The certification manager

const qa = [
    {
      "question": "Which protocol is used to resolve domain names into IP addresses?",
      "options": ["DHCP", "DNS", "ARP", "ICMP"],
      "answer": "DNS"
    },
    {
      "question": "I ran 'nmap -T4 192.168.1.1'... what did I just do?",
      "options": [
        "Hacked into a government server",
        "Scanned my own router",
        "Became an elite hacker",
        "Shut down the entire internet"
      ],
      "answer": "Scanned my own router"
    },
    {
      "question": "What does NAT (Network Address Translation) do?",
      "options": [
        "Hides private IPs behind a public IP",
        "Encrypts all network traffic",
        "Provides a direct connection between two devices",
        "Assigns MAC addresses dynamically"
      ],
      "answer": "Hides private IPs behind a public IP"
    },
    {
      "question": "Someone on TikTok told me 'YOU LEAKED YOUR IP!!!', what should I do?",
      "options": [
        "Sell my house and move to another country",
        "Turn off my router forever",
        "Laugh and ignore it",
        "Call the police immediately"
      ],
      "answer": "Laugh and ignore it"
    },
    {
      "question": "What is the role of a firewall?",
      "options": [
        "To block unauthorized access to a network",
        "To translate domain names into IP addresses",
        "To assign IP addresses dynamically",
        "To increase internet speed"
      ],
      "answer": "To block unauthorized access to a network"
    },
    {
      "question": "If I use a VPN, am I 100% anonymous?",
      "options": [
        "Yes, even the FBI can't find me 😎",
        "No, VPNs can still be tracked",
        "Yes, but only if I use Incognito mode",
        "Only if I use 10 VPNs at once"
      ],
      "answer": "No, VPNs can still be tracked"
    },
    {
      "question": "Which IP address range is reserved for private networks?",
      "options": [
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "All of the above"
      ],
      "answer": "All of the above"
    },
    {
      "question": "A 12-year-old on Discord says 'I'm gonna DDoS you 😈'... should I be scared?",
      "options": [
        "Yes, I should unplug my router immediately",
        "No, because most of them don’t even know what DDoS is",
        "Yes, because he has my IP and can hack me",
        "I should move to another country just to be safe"
      ],
      "answer": "No, because most of them don’t even know what DDoS is"
    },
    {
      "question": "What does the ping command do?",
      "options": [
        "Tests network connectivity between two devices",
        "Scans open ports on a system",
        "Encrypts data before transmission",
        "Redirects traffic to a different network"
      ],
      "answer": "Tests network connectivity between two devices"
    },
    {
      "question": "I found someone’s IP, what can I do with it? 😈",
      "options": [
        "Hack into their computer instantly",
        "Find their exact home address",
        "Take down their WiFi with a DDoS attack",
        "Nothing useful on its own"
      ],
      "answer": "Nothing useful on its own"
    },
    {
      "question": "What is the primary purpose of a subnet mask?",
      "options": [
        "To encrypt network traffic",
        "To define the network and host portions of an IP address",
        "To increase internet speed",
        "To connect to a VPN"
      ],
      "answer": "To define the network and host portions of an IP address"
    },
    {
      "question": "Which of the following is NOT a valid IPv4 address?",
      "options": [
        "192.168.1.1",
        "256.100.50.25",
        "10.0.0.254",
        "172.16.254.1"
      ],
      "answer": "256.100.50.25"
    },
    {
      "question": "What does the 'tracert' or 'traceroute' command do?",
      "options": [
        "Shows the path packets take to reach a destination",
        "Scans a network for open ports",
        "Intercepts and modifies network traffic",
        "Measures internet speed"
      ],
      "answer": "Shows the path packets take to reach a destination"
    },
    {
      "question": "What is the default gateway?",
      "options": [
        "The main router that connects a local network to the internet",
        "A server that assigns IP addresses",
        "A firewall that blocks traffic",
        "A backup network connection"
      ],
      "answer": "The main router that connects a local network to the internet"
    },
    {
      "question": "Which protocol is used to transfer files over the internet securely?",
      "options": ["FTP", "HTTP", "SFTP", "SNMP"],
      "answer": "SFTP"
    }
];
const quizForm = document.getElementById('quiz-form');
const submitButton = quizForm.querySelector('.submit-button');
const quizSection = document.querySelector(".quiz-section");

  
function createQuestions() {
  submitButton.style.display = 'flex';
  const existingMessage = quizForm.querySelector('.quiz-message');
  if (existingMessage) {
    existingMessage.style.display = 'none';
  }

  const existingQuestions = document.querySelectorAll('.question-group');

  if (existingQuestions.length > 0) {
    existingQuestions.forEach((q) => q.remove());
  }

  qa.forEach((question, index) => {
    const questionGroup = document.createElement('div');
    questionGroup.className = 'question-group';

    const questionText = document.createElement('p');
    questionText.className = 'question-text';
    questionText.textContent = `${index + 1}. ${question.question}`;

    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    question.options.forEach((option) => {
      const label = document.createElement('label');
      label.className = 'radio-label';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${index}`;
      input.value = option;
      input.className = 'radio-input';

      const span = document.createElement('span');
      span.className = 'radio-text';
      span.textContent = option;

      label.appendChild(input);
      label.appendChild(span);
      radioGroup.appendChild(label);
    });

    questionGroup.appendChild(questionText);
    questionGroup.appendChild(radioGroup);

    submitButton.parentNode.insertBefore(questionGroup, submitButton);

    log(`Question ${index + 1} added!`, 'success');
  });
}


function checkQuizResponses() {
  let score = 0;

  quizForm.querySelectorAll('.radio-label').forEach(label => {
      label.classList.remove('correct', 'incorrect', 'show-correct');
  });

  qa.forEach((question, index) => {
      const selectedInput = quizForm.querySelector(`input[name="q${index}"]:checked`);
      if (!selectedInput) return;

      const selectedLabel = selectedInput.closest('.radio-label');
      const correctLabel = Array.from(quizForm.querySelectorAll(`input[name="q${index}"]`))
          .find(input => input.value === question.answer)
          .closest('.radio-label');

      if (selectedInput.value === question.answer) {
          selectedLabel.classList.add('correct');
          score++;
          log(`Question ${index + 1}: Correct! Total points: ${score}`, 'success');
      } else {
          selectedLabel.classList.add('incorrect');
          correctLabel.classList.add('show-correct');
          log(`Question ${index + 1}: Incorrect! Total points: ${score}`, 'warning');
      }
  });

  quizForm.querySelectorAll('input[type="radio"]').forEach(input => {
      input.disabled = true;
  });

  submitButton.disabled = true;
  submitButton.textContent = `Score: ${score}/${qa.length}`;

  localStorage.setItem('quizTaken', 'true');
  log('quizTaken set to true', 'warning');

  if (score >= 12) offerCertificate(score);
}

function offerCertificate(score) {
  const existingCertificate = document.querySelector('.certificate-section');
  if (existingCertificate) {
    log('Certificate section already here: Not doing anything!', 'warning')  
    return;
  }

  const percentage = (score / qa.length) * 100;

  const certificateSection = document.createElement('div');
  certificateSection.className = 'certificate-section';

  const message = document.createElement('p');
  message.textContent = `Congrats ! You got ${percentage.toFixed(2)}%. Give us your name to download the certificate :`;
  
  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = 'Your name';
  usernameInput.className = 'input-text';

  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download';
  downloadButton.className = 'submit-button';

  downloadButton.addEventListener('click', () => {
      const username = usernameInput.value;
      if (username) {
          window.location.href = `api/downcert?percentage=${percentage.toFixed(2)}&name=${encodeURIComponent(username)}`;
          log('Certificate downloaded!', 'success');
          quizForm.innerHTML = `<p>✅ Certificate downloaded! Check if a certificate is valid with \'Shift + C\'</p>
          <br>
          If you like this website consider adding a star to [the github](https://github.com/douxxtech/noskid.today) <3`;
          certificateSection.style.display = 'none';
      } else {
          alert('Please enter a valid name.');
      }
  });

  certificateSection.appendChild(message);
  certificateSection.appendChild(usernameInput);
  certificateSection.appendChild(downloadButton);
  quizForm.appendChild(certificateSection);
  log('Certificate section showed!', 'success');
}



function handleQuizDisplay(){
  if (window.innerWidth <= 768) {
    quizSection.style.display = "none";
  } else {
    if (localStorage.getItem('quizTaken') === 'true') {
      const message = document.createElement('p');
      message.textContent = '❌ You have already taken this test.';
      message.className = 'quiz-message';
      quizForm.appendChild(message);
      submitButton.style.display = 'none';
      log('Quiz has already been taken.', 'warning')
    } else {
    
      createQuestions();
    
      quizForm.addEventListener('submit', (e) => {
          e.preventDefault();
          checkQuizResponses();
      });
    }
  }
}

handleQuizDisplay();

