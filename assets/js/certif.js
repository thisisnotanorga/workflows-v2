//Certif.js | The certification manager with Turnstile protection - Updated for new API

const quizForm = document.getElementById('quiz-form');
const submitButton = quizForm.querySelector('.submit-button');
const quizSection = document.querySelector(".quiz-section");
const TURNSTILE_SITE_KEY = '0x4AAAAAABeZwqhQ3FcnOkEe';

let quizQuestions = [];

async function loadQuestions() {
  try {
    const response = await fetch('/api/certificate');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to load questions');
    }

    quizQuestions = data.questions.map(q => ({
      question: q.question,
      options: q.answers.map(a => a.content),
      answer: q.answers.find((a, index) => index === (q.correct_answer_id - 1))?.content || q.answers[0].content,
      correct_answer_id: q.correct_answer_id
    }));

    log('Questions loaded successfully!', 'success');
    return true;
  } catch (error) {
    log('Error loading questions: ' + error.message, 'error');
    return false;
  }
}

async function createQuestions() {
  if (quizQuestions.length === 0) {
    const loaded = await loadQuestions();
    if (!loaded) {
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Error loading quiz questions. Please try again later.';
      errorMessage.className = 'quiz-message';
      quizForm.appendChild(errorMessage);
      return;
    }
  }

  submitButton.style.display = 'flex';
  const existingMessage = quizForm.querySelector('.quiz-message');
  if (existingMessage) {
    existingMessage.style.display = 'none';
  }

  const existingQuestions = document.querySelectorAll('.question-group');
  if (existingQuestions.length > 0) {
    existingQuestions.forEach((q) => q.remove());
  }

  quizQuestions.forEach((question, index) => {
    const questionGroup = document.createElement('div');
    questionGroup.className = 'question-group';

    const questionText = document.createElement('p');
    questionText.className = 'question-text';
    questionText.textContent = `${index + 1}. ${question.question}`;

    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    question.options.forEach((option, optionIndex) => {
      const label = document.createElement('label');
      label.className = 'radio-label';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${index + 1}`;
      input.value = optionIndex + 1;
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

async function checkQuizResponses() {

  const userAnswers = {};
  let allAnswered = true;

  quizQuestions.forEach((question, index) => {
    const questionId = index + 1;
    const selectedInput = quizForm.querySelector(`input[name="q${questionId}"]:checked`);

    if (selectedInput) {
      userAnswers[questionId] = parseInt(selectedInput.value);
    } else {
      allAnswered = false;
    }
  });

  if (!allAnswered) {
    alert('Please answer all questions before submitting.');
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('action', 'check');

    Object.keys(userAnswers).forEach(questionId => {
      params.append(questionId, userAnswers[questionId]);
    });

    const response = await fetch(`/api/certificate?${params}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to check answers');
    }

    displayQuizResults(data);

    localStorage.setItem('quizTaken', 'true');
    log('quizTaken set to true', 'warning');

    if (data.passed) {
      offerCertificate(data.percentage, userAnswers);
    }

  } catch (error) {
    log('Error checking answers: ' + error.message, 'error');
    alert('Error checking your answers. Please try again.');
  }
}

function displayQuizResults(results) {
  quizForm.querySelectorAll('.radio-label').forEach(label => {
    label.classList.remove('correct', 'incorrect', 'show-correct');
  });

  results.details.forEach(detail => {
    const questionId = detail.question_id;
    const userAnswerId = detail.user_answer;
    const correctAnswerId = detail.correct_answer;

    const selectedInput = quizForm.querySelector(`input[name="q${questionId}"][value="${userAnswerId}"]`);
    if (selectedInput) {
      const selectedLabel = selectedInput.closest('.radio-label');

      if (detail.is_correct) {
        selectedLabel.classList.add('correct');
        log(`Question ${questionId}: Correct!`, 'success');
      } else {
        selectedLabel.classList.add('incorrect');
        log(`Question ${questionId}: Incorrect!`, 'warning');

        const correctInput = quizForm.querySelector(`input[name="q${questionId}"][value="${correctAnswerId}"]`);
        if (correctInput) {
          const correctLabel = correctInput.closest('.radio-label');
          correctLabel.classList.add('show-correct');
        }
      }
    }
  });

  quizForm.querySelectorAll('input[type="radio"]').forEach(input => {
    input.disabled = true;
  });

  submitButton.disabled = true;
  submitButton.textContent = `Score: ${results.correct_answers}/${results.total_questions} (${results.percentage}%)`;
}

function offerCertificate(percentage, userAnswers) {
  const existingCertificate = document.querySelector('.certificate-section');
  if (existingCertificate) {
    log('Certificate section already here: Not doing anything!', 'warning')
    return;
  }

  const certificateSection = document.createElement('div');
  certificateSection.className = 'certificate-section';

  const message = document.createElement('p');
  message.textContent = `Congrats! You got ${percentage}%. Give us your name to download the certificate:`;

  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = 'Your name';
  usernameInput.className = 'input-text';

  const turnstileContainer = document.createElement('div');
  turnstileContainer.className = 'turnstile-container';
  turnstileContainer.style.marginTop = '15px';
  turnstileContainer.style.marginBottom = '15px';

  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download';
  downloadButton.className = 'submit-button';
  downloadButton.disabled = true; // disabled till Turnstile is validated

  let turnstileWidgetId = null;
  let turnstileToken = null;

  function onTurnstileSuccess(token) {
    turnstileToken = token;
    downloadButton.disabled = false;
    downloadButton.style.opacity = '1';
    downloadButton.style.cursor = 'pointer';
    log('Turnstile validated successfully!', 'success');
  }

  function onTurnstileError() {
    turnstileToken = null;
    downloadButton.disabled = true;
    downloadButton.style.opacity = '0.5';
    downloadButton.style.cursor = 'not-allowed';
    log('Turnstile validation failed!', 'error');
  }

  function onTurnstileExpired() {
    turnstileToken = null;
    downloadButton.disabled = true;
    downloadButton.style.opacity = '0.5';
    downloadButton.style.cursor = 'not-allowed';
    log('Turnstile token expired!', 'warning');
  }

  downloadButton.style.opacity = '0.5';
  downloadButton.style.cursor = 'not-allowed';

  if (typeof turnstile !== 'undefined') {
    turnstileWidgetId = turnstile.render(turnstileContainer, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onTurnstileSuccess,
      'error-callback': onTurnstileError,
      'expired-callback': onTurnstileExpired,
      theme: 'dark',
      size: 'normal'
    });
  } else {
    log('Turnstile not loaded, fallback mode', 'warning');
    downloadButton.disabled = false;
    downloadButton.style.opacity = '1';
    downloadButton.style.cursor = 'pointer';
  }

  downloadButton.addEventListener('click', async () => {
    quizForm.removeEventListener('submit');
    const username = usernameInput.value.trim();

    if (!username) {
      alert('Please enter a valid name.');
      return;
    }

    if (typeof turnstile !== 'undefined' && !turnstileToken) {
      alert('Please complete the security verification.');
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('action', 'download');
      params.append('name', username);

      Object.keys(userAnswers).forEach(questionId => {
        params.append(questionId, userAnswers[questionId]);
      });

      if (turnstileToken) {
        params.append('turnstile_token', turnstileToken);
      }

      const downloadUrl = `/api/certificate?${params}`;

      downloadButton.disabled = true;
      downloadButton.textContent = 'Downloading...';

      window.location.href = downloadUrl;

      log('Certificate download initiated!', 'success');

      setTimeout(() => {
        quizForm.innerHTML = `
  <p>✅ Certificate downloaded! Check if a certificate is valid with 'Shift + C'</p>
  <br>
  <p>Check out what you can do with it: <a href="https://github.com/douxxtech/noskid.today/blob/main/noskid-services.md" target="_blank">noskid services</a></p>
  <hr>
  <p>If you like this website consider adding a star to 
    <a href="https://github.com/douxxtech/noskid.today" target="_blank">the GitHub</a> <3
  </p>
`;


        certificateSection.style.display = 'none';
      }, 2000);

    } catch (error) {
      log('Error downloading certificate: ' + error.message, 'error');
      alert('Error downloading certificate. Please try again.');

      downloadButton.disabled = false;
      downloadButton.textContent = 'Download';
    }
  });

  certificateSection.appendChild(message);
  certificateSection.appendChild(usernameInput);
  certificateSection.appendChild(turnstileContainer);
  certificateSection.appendChild(downloadButton);
  quizForm.appendChild(certificateSection);
  log('Certificate section with Turnstile showed!', 'success');
}

async function handleQuizDisplay() {
  if (window.innerWidth <= 768) {
    quizSection.style.display = "none";
  } else {
    if (localStorage.getItem('quizTaken') === 'true') {
      const message = document.createElement('p');
      message.innerHTML = `❌ You have already taken this test.
      <br>
      You can still add some <a href="https://github.com/douxxtech/noskid.today/blob/main/badges.md" target="_blank">noskid badges</a> to your projects or do the quiz again by typing 'bypass' !`;
      message.className = 'quiz-message';
      quizForm.appendChild(message);
      submitButton.style.display = 'none';
      log('Quiz has already been taken.', 'warning')
    } else {
      await createQuestions();

      quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        checkQuizResponses();
      });
    }
  }
}

handleQuizDisplay();

async function redoQuiz(event) {
  event.preventDefault();

  const quizContainer = document.querySelector('.quiz-container');
  if (quizContainer) {
    quizContainer.open = true;
    log('Quiz opened!', 'success');
  } else {
    log('Quiz container not found!', 'error');
    return;
  }

  await createQuestions();
  log('Recreated questions!', 'success')

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    checkQuizResponses();
  });
}

function spawnNoSkidInfoWindow() {
  ClassicWindow.createWindow({
    title: 'What Can You Do with a NoSkid Certificate?',
    width: 450,
    height: 320,
    content: `
      <div style="font-family: system-ui, sans-serif; color: #f1f1f1; background-color: #1e1e1e; padding: 16px; line-height: 1.6; font-size: 14px;">
        <p style="margin-bottom: 1em;">Nice! You've got your <strong>NoSkid certificate</strong>. Here's what you can do next:</p>
        
        <ul style="list-style: none; padding-left: 0;">
          <li style="margin-bottom: 0.8em;">
            ✅ <strong>Customize it with skins</strong> → 
            <a href="https://skins.noskid.today" target="_blank" style="color: #58a6ff;">skins.noskid.today</a>
          </li>
          <li style="margin-bottom: 0.8em;">
            📬 <strong>Get a cool email</strong> → 
            <a href="https://im.notaskid.ong" target="_blank" style="color: #58a6ff;">@is.notaskid.ong</a>
          </li>
          <li style="margin-bottom: 0.8em;">
            🏅 <strong>Show off with badges</strong> → 
            <a href="https://github.com/phlixy/noskid.today/blob/main/badges.md" target="_blank" style="color: #58a6ff;">see badge options</a>
          </li>
        </ul>

        <hr style="border: 0; border-top: 1px solid #333; margin: 1.5em 0;">
        
        <p style="font-style: italic;">You're officially <strong>not a skid</strong>. Go flex it. 😎</p>
      </div>
    `,
    theme: 'dark',
    icon: 'assets/img/noskid-icon.png',
  });
}