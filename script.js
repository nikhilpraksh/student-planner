
class StudyPlanner {
  constructor() {
    this.subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    this.streak = parseInt(localStorage.getItem('streak')) || 0;
    this.lastStudyDate = localStorage.getItem('lastStudyDate');
    this.schedule = JSON.parse(localStorage.getItem('schedule')) || {};
    
    this.initializeEventListeners();
    this.updateUI();
    this.checkStreak();
  }

  initializeEventListeners() {
    document.getElementById('subjectForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addSubject();
    });

    document.getElementById('startTimer').addEventListener('click', () => {
      this.startStudySession();
    });

    document.querySelectorAll('.schedule-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const day = slot.parentElement.dataset.day;
        const time = slot.dataset.time;
        this.toggleScheduleSlot(day, time, slot);
      });
    });
  }

  addSubject() {
    const name = document.getElementById('subjectName').value;
    const priority = document.getElementById('priority').value;
    const deadline = document.getElementById('deadline').value;

    const subject = {
      id: Date.now(),
      name,
      priority,
      deadline,
      progress: 0
    };

    this.subjects.push(subject);
    this.saveToLocalStorage();
    this.updateUI();
    document.getElementById('subjectForm').reset();
  }

  updateUI() {
    const subjectList = document.getElementById('subjectList');
    const progressBars = document.getElementById('progressBars');
    subjectList.innerHTML = '';
    progressBars.innerHTML = '';

    // Update progress tracker
    const completedSubjects = this.subjects.filter(s => s.progress === 100);
    const totalSubjects = this.subjects.length;
    
    completedSubjects.forEach(subject => {
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.innerHTML = `
        <div class="progress-label">
          <span>${subject.name}</span>
          <span>Completed!</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: 100%"></div>
        </div>
      `;
      progressBars.appendChild(progressBar);
    });

    // Sort subjects by deadline
    const sortedSubjects = [...this.subjects].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    sortedSubjects.forEach(subject => {
      const card = document.createElement('div');
      card.className = `subject-card ${subject.priority}-priority`;
      const deadlineDate = new Date(subject.deadline).toLocaleDateString('en-US');
      const daysUntilDeadline = Math.ceil((new Date(subject.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      const deadlineStatus = daysUntilDeadline <= 3 ? 'urgent' : daysUntilDeadline <= 7 ? 'approaching' : 'normal';
      
      card.innerHTML = `
        <h3>${subject.name}</h3>
        <div class="deadline-info ${deadlineStatus}">
          <i class="fas fa-calendar-alt"></i>
          <span>Due: ${deadlineDate}</span>
          <span>(${daysUntilDeadline} days left)</span>
        </div>
        <div class="progress-info">
          <p>Progress: ${subject.progress}%</p>
          <input type="range" value="${subject.progress}" min="0" max="100"
            onchange="studyPlanner.updateProgress(${subject.id}, this.value)">
        </div>
        <button onclick="studyPlanner.deleteSubject(${subject.id})">Delete</button>
      `;
      subjectList.appendChild(card);
    });

    document.getElementById('streakCount').textContent = this.streak;
  }

  updateProgress(id, progress) {
    const subject = this.subjects.find(s => s.id === id);
    if (subject) {
      subject.progress = parseInt(progress);
      this.saveToLocalStorage();
      this.updateUI();
    }
  }

  deleteSubject(id) {
    this.subjects = this.subjects.filter(s => s.id !== id);
    this.saveToLocalStorage();
    this.updateUI();
  }

  startStudySession() {
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 25;
    let timeLeft = minutes * 60;
    const timerDisplay = document.querySelector('.timer-display');
    const timerButton = document.getElementById('startTimer');
    
    const timer = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        this.updateStreak();
        alert('Study session completed!');
        timerButton.disabled = false;
        timerDisplay.textContent = '25:00';
      }
    }, 1000);

    timerButton.disabled = true;
  }

  checkStreak() {
    const today = new Date().toLocaleDateString();
    if (this.lastStudyDate) {
      const lastDate = new Date(this.lastStudyDate);
      const daysDiff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 1) this.streak = 0;
    }
  }

  updateStreak() {
    const today = new Date().toLocaleDateString();
    if (this.lastStudyDate !== today) {
      this.streak++;
      this.lastStudyDate = today;
      this.saveToLocalStorage();
      this.updateUI();
      
      // Show motivational message based on streak
      let message = '';
      if (this.streak === 1) {
        message = "Great start! You've begun your study journey! 🌟";
      } else if (this.streak === 3) {
        message = "Three days in a row! You're building good habits! 🔥";
      } else if (this.streak === 7) {
        message = "A full week of studying! Outstanding commitment! 🏆";
      } else if (this.streak % 10 === 0) {
        message = `${this.streak} day streak! You're unstoppable! 🚀`;
      } else {
        message = `${this.streak} day streak! Keep going! 💪`;
      }
      
      const notification = document.createElement('div');
      notification.className = 'streak-notification';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }, 100);
    }
  }

  toggleScheduleSlot(day, time, slot) {
    const key = `${day}-${time}`;
    if (!slot.querySelector('.task-input')) {
      slot.classList.add('active');
      slot.innerHTML = `
        <div class="task-content">
          <input type="text" class="task-input" value="${this.schedule[key]?.task || ''}" 
            placeholder="Enter task..."
            onblur="studyPlanner.updateTask('${key}', this.value)">
          <input type="checkbox" ${this.schedule[key]?.completed ? 'checked' : ''} 
            onclick="event.stopPropagation(); studyPlanner.toggleTaskComplete('${key}')">
        </div>`;
      slot.querySelector('.task-input').focus();
    }
  }

  updateTask(key, value) {
    if (value.trim()) {
      const [day, time] = key.split('-');
      this.schedule[key] = {
        task: value.trim(),
        date: new Date().toISOString().split('T')[0],
        completed: this.schedule[key]?.completed || false
      };
    } else {
      delete this.schedule[key];
      const slot = document.querySelector(`[data-day="${key.split('-')[0]}"] [data-time="${key.split('-')[1]}"]`);
      if (slot) {
        slot.classList.remove('active');
        slot.innerHTML = '';
      }
    }
    this.saveToLocalStorage();
  }

  toggleTaskComplete(key) {
    if (this.schedule[key]) {
      this.schedule[key].completed = !this.schedule[key].completed;
      this.saveToLocalStorage();
      this.loadSchedule();
    }
  }

  loadSchedule() {
    const slots = document.querySelectorAll('.schedule-slot');
    slots.forEach(slot => {
      const day = slot.parentElement.dataset.day;
      const time = slot.dataset.time;
      const key = `${day}-${time}`;
      
      if (this.schedule[key]) {
        slot.classList.add('active');
        slot.innerHTML = `<div class="task-content">
          <span>${this.schedule[key].task}</span>
          <input type="checkbox" ${this.schedule[key].completed ? 'checked' : ''} 
            onclick="event.stopPropagation(); studyPlanner.toggleTaskComplete('${key}')">
        </div>`;
      } else {
        slot.classList.remove('active');
        slot.innerHTML = '';
      }
    });
  }

  saveToLocalStorage() {
    localStorage.setItem('subjects', JSON.stringify(this.subjects));
    localStorage.setItem('streak', this.streak.toString());
    localStorage.setItem('lastStudyDate', this.lastStudyDate);
    localStorage.setItem('schedule', JSON.stringify(this.schedule));
  }
}

const studyPlanner = new StudyPlanner();

