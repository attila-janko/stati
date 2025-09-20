const scheduleData = [
  {
    track: 'math',
    day: 'Hétfő',
    time: '17:00 - 18:30',
    group: 'Matematika Boost',
    level: 'Haladó érettségi',
    format: 'Online',
  },
  {
    track: 'math',
    day: 'Szerda',
    time: '18:00 - 19:30',
    group: 'Matematika Boost',
    level: 'Középszint érettségi',
    format: 'Személyes (Budapest)',
  },
  {
    track: 'math',
    day: 'Szombat',
    time: '10:00 - 12:00',
    group: 'Matematika Boost',
    level: 'Projekt hétvége',
    format: 'Hibrid',
  },
  {
    track: 'stats',
    day: 'Kedd',
    time: '18:00 - 20:00',
    group: 'Statisztika Lab',
    level: 'Data science alap',
    format: 'Online',
  },
  {
    track: 'stats',
    day: 'Csütörtök',
    time: '19:00 - 20:30',
    group: 'Statisztika Lab',
    level: 'Vizsga sprint',
    format: 'Online',
  },
  {
    track: 'python',
    day: 'Kedd',
    time: '16:00 - 18:00',
    group: 'Python Start',
    level: 'Teljesen kezdő',
    format: 'Online',
  },
  {
    track: 'python',
    day: 'Csütörtök',
    time: '17:30 - 19:30',
    group: 'Python Start',
    level: 'Automatizálás fókusz',
    format: 'Személyes (Budapest)',
  },
  {
    track: 'python',
    day: 'Vasárnap',
    time: '17:00 - 19:00',
    group: 'Python Start',
    level: 'Projekt klub',
    format: 'Online',
  },
];

const scheduleBody = document.querySelector('#schedule-body');
const filterButtons = document.querySelectorAll('.filter-button');
const yearEl = document.querySelector('#year');
const menuToggle = document.querySelector('.menu-toggle');
const menuList = document.querySelector('#primary-menu');

const badgeClassMap = {
  math: 'schedule__badge schedule__badge--math',
  stats: 'schedule__badge schedule__badge--stats',
  python: 'schedule__badge schedule__badge--python',
};

function renderSchedule(filter = 'all') {
  scheduleBody.innerHTML = '';

  const filtered =
    filter === 'all' ? scheduleData : scheduleData.filter((item) => item.track === filter);

  if (!filtered.length) {
    scheduleBody.innerHTML = `<tr><td colspan="5">Jelenleg nincs meghirdetett alkalom ehhez a szűréshez. Írj nekünk, és egyeztetünk egyéni időpontot!</td></tr>`;
    return;
  }

  filtered.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.day}</td>
      <td>${item.time}</td>
      <td><span class="${badgeClassMap[item.track]}">${item.group}</span></td>
      <td>${item.level}</td>
      <td>${item.format}</td>
    `;
    scheduleBody.appendChild(row);
  });
}

function updateActiveFilter(activeButton) {
  filterButtons.forEach((btn) => {
    const isActive = btn === activeButton;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-checked', String(isActive));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const track = button.dataset.track || 'all';
    renderSchedule(track);
    updateActiveFilter(button);
  });
});

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (menuToggle && menuList) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    menuList.classList.toggle('is-open');
  });

  menuList.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuList.classList.remove('is-open');
    });
  });
}

renderSchedule('all');
