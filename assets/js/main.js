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
const heroVisual = document.querySelector('.hero__visual');
const scrollOrbs = document.querySelectorAll('.scroll-visual__orb');
const bookingForm = document.querySelector('.booking__form');
const bookingStatusMessage = bookingForm ? bookingForm.querySelector('.form-status') : null;
const bookingSavedSection = document.querySelector('.booking__saved');
const bookingSavedList = bookingSavedSection
  ? bookingSavedSection.querySelector('.booking__saved-list')
  : null;
const bookingSavedEmpty = bookingSavedSection
  ? bookingSavedSection.querySelector('.booking__saved-empty')
  : null;
const bookingSavedNote = bookingSavedSection
  ? bookingSavedSection.querySelector('.booking__saved-note')
  : null;
const bookingSubmitButton = bookingForm
  ? bookingForm.querySelector('button[type="submit"]')
  : null;
const prefersReducedMotion =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

const badgeClassMap = {
  math: 'schedule__badge schedule__badge--math',
  stats: 'schedule__badge schedule__badge--stats',
  python: 'schedule__badge schedule__badge--python',
};

const bookingTrackLabelMap = {
  math: 'Matematika Boost',
  stats: 'Statisztika Lab',
  python: 'Python Start',
  custom: 'egyéni egyeztetés',
};

const BOOKING_STORAGE_KEY = 'statiBookingEntries';
const BOOKING_API_ENDPOINT = '/api/bookings';

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

function getAvailableStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageTypes = ['localStorage', 'sessionStorage'];

  for (const type of storageTypes) {
    try {
      const storage = window[type];
      if (!storage) {
        continue;
      }

      const testKey = '__stati_booking_test__';
      storage.setItem(testKey, 'ok');
      storage.removeItem(testKey);

      return { storage, type };
    } catch (error) {
      // Ignore and try the next storage type
    }
  }

  return null;
}

const bookingStorage = getAvailableStorage();

const getTrackLabel = (track) => bookingTrackLabelMap[track] || 'választott csoport';

const formatDateTime = (isoString) => {
  if (!isoString) {
    return 'Beküldés ideje nem elérhető';
  }

  const parsedDate = new Date(isoString);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Beküldés ideje nem elérhető';
  }

  return parsedDate.toLocaleString('hu-HU', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

function readStoredBookings() {
  if (!bookingStorage) {
    return [];
  }

  try {
    const raw = bookingStorage.storage.getItem(BOOKING_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    bookingStorage.storage.removeItem(BOOKING_STORAGE_KEY);
    return [];
  }
}

function persistBooking(entry) {
  if (!bookingStorage) {
    return false;
  }

  const bookings = readStoredBookings();
  bookings.push(entry);
  const latestBookings = bookings.slice(-20);

  try {
    bookingStorage.storage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(latestBookings));
    return true;
  } catch (error) {
    return false;
  }
}

function showFormStatus(message, type = 'success') {
  if (!bookingStatusMessage) {
    return;
  }

  bookingStatusMessage.textContent = message;
  bookingStatusMessage.classList.remove('is-success', 'is-error', 'is-info');

  if (type === 'success') {
    bookingStatusMessage.classList.add('is-success');
  }

  if (type === 'error') {
    bookingStatusMessage.classList.add('is-error');
  }

  if (type === 'info') {
    bookingStatusMessage.classList.add('is-info');
  }

  bookingStatusMessage.hidden = false;
}

function renderSavedBookings(entries, source = 'server') {
  if (!bookingSavedSection) {
    return;
  }

  bookingSavedSection.hidden = false;

  if (bookingSavedNote) {
    const sourceMessages = {
      server: 'A jelentkezéseket biztonságosan tároljuk, az alábbi lista a legutóbbi beküldéseket mutatja.',
      local:
        'Nem sikerült elérni a szervert, ezért ideiglenesen ezen az eszközön tároljuk a beküldött jelentkezéseket.',
      unavailable:
        'Nem tudtuk betölteni a korábbi jelentkezéseket. Kérjük, ellenőrizd az internetkapcsolatod és próbáld újra!',
    };

    bookingSavedNote.textContent = sourceMessages[source] || '';
    bookingSavedNote.hidden = false;
  }

  if (!bookingSavedList || !bookingSavedEmpty) {
    return;
  }

  if (!entries.length) {
    const emptyMessages = {
      server: 'Még nem érkezett jelentkezés.',
      local: 'Még nincs helyben tárolt jelentkezés ezen az eszközön.',
      unavailable: 'Jelenleg nem elérhető egyetlen korábbi jelentkezés sem.',
    };

    bookingSavedEmpty.textContent = emptyMessages[source] || emptyMessages.unavailable;
    bookingSavedEmpty.hidden = false;
    bookingSavedList.innerHTML = '';
    return;
  }

  bookingSavedEmpty.hidden = true;
  bookingSavedList.innerHTML = '';

  const orderedEntries = entries
    .slice()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  orderedEntries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'booking__saved-item';

    const nameEl = document.createElement('strong');
    nameEl.textContent = entry.name || 'Névtelen érdeklődő';
    item.appendChild(nameEl);

    const trackEl = document.createElement('span');
    trackEl.className = 'booking__saved-track';
    trackEl.textContent = getTrackLabel(entry.track);
    item.appendChild(trackEl);

    if (entry.email) {
      const emailEl = document.createElement('span');
      emailEl.className = 'booking__saved-email';
      emailEl.textContent = entry.email;
      item.appendChild(emailEl);
    }

    if (entry.message) {
      const messageEl = document.createElement('p');
      messageEl.className = 'booking__saved-message';
      messageEl.textContent = entry.message;
      item.appendChild(messageEl);
    }

    const timeEl = document.createElement('time');

    if (entry.submittedAt) {
      timeEl.dateTime = entry.submittedAt;
    }

    timeEl.textContent = `Beküldve: ${formatDateTime(entry.submittedAt)}`;
    item.appendChild(timeEl);

    bookingSavedList.appendChild(item);
  });
}

async function fetchServerBookings(limit = 5) {
  if (typeof fetch !== 'function') {
    return null;
  }

  try {
    const response = await fetch(`${BOOKING_API_ENDPOINT}?limit=${encodeURIComponent(limit)}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Szerver hiba: ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || !Array.isArray(payload.bookings)) {
      return [];
    }

    return payload.bookings;
  } catch (error) {
    console.error('Nem sikerült lekérni a jelentkezéseket a szerverről:', error);
    return null;
  }
}

async function updateSavedBookings({ preferLocal = false } = {}) {
  if (!bookingSavedSection) {
    return;
  }

  if (!preferLocal) {
    const serverBookings = await fetchServerBookings(5);

    if (serverBookings !== null) {
      renderSavedBookings(serverBookings, 'server');
      return;
    }
  }

  if (bookingStorage) {
    const localBookings = readStoredBookings();
    renderSavedBookings(localBookings, 'local');
    return;
  }

  renderSavedBookings([], 'unavailable');
}

async function sendBookingToServer(submission) {
  const response = await fetch(BOOKING_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    let errorMessage = 'Nem sikerült elmenteni a jelentkezést.';

    try {
      const errorPayload = await response.json();

      if (errorPayload && typeof errorPayload.error === 'string') {
        errorMessage = errorPayload.error;
      }
    } catch (error) {
      // Ignore parse errors and fall back to the default message
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return payload && payload.booking ? payload.booking : null;
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const track = button.dataset.track || 'all';
    renderSchedule(track);
    updateActiveFilter(button);
  });
});

if (bookingForm) {
  updateSavedBookings().catch(() => {
    renderSavedBookings([], 'unavailable');
  });

  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const getFieldValue = (name) => {
      const value = formData.get(name);
      return typeof value === 'string' ? value.trim() : '';
    };

    const submission = {
      name: getFieldValue('name'),
      email: getFieldValue('email'),
      track: getFieldValue('track'),
      message: getFieldValue('message'),
    };

    const localEntry = {
      ...submission,
      submittedAt: new Date().toISOString(),
    };

    if (bookingSubmitButton) {
      bookingSubmitButton.disabled = true;
      bookingSubmitButton.setAttribute('aria-busy', 'true');
    }

    showFormStatus('Jelentkezésed küldése folyamatban...', 'info');

    try {
      const savedEntry = await sendBookingToServer(submission);
      const entryToPersist = savedEntry || localEntry;
      const displayName = entryToPersist.name || submission.name || 'kedves érdeklődő';
      const trackLabel = getTrackLabel(entryToPersist.track);

      if (bookingStorage) {
        persistBooking({ ...localEntry, ...entryToPersist });
      }

      showFormStatus(
        `Köszönjük, ${displayName}! A ${trackLabel} iránti jelentkezésed megérkezett hozzánk. Hamarosan felvesszük veled a kapcsolatot.`,
        'success'
      );

      await updateSavedBookings();
      bookingForm.reset();
    } catch (error) {
      console.error('Nem sikerült elküldeni a jelentkezést:', error);

      const isClientError = error && typeof error.status === 'number' && error.status >= 400 && error.status < 500;

      if (isClientError) {
        showFormStatus(error.message || 'Nem tudtuk feldolgozni a jelentkezést. Kérjük, ellenőrizd a megadott adatokat!', 'error');
        return;
      }

      const hasLocalFallback = persistBooking(localEntry);

      if (hasLocalFallback) {
        const trackLabel = getTrackLabel(localEntry.track);
        showFormStatus(
          `Nem sikerült elérni a szervert, ezért ideiglenesen elmentettük a ${trackLabel} jelentkezésed ezen az eszközön. Ha sürgős, jelezz a hello@stati.hu címen is!`,
          'error'
        );

        await updateSavedBookings({ preferLocal: true });
      } else {
        showFormStatus(
          'Nem sikerült eljuttatni a jelentkezést. Kérjük, írj nekünk a hello@stati.hu címen!',
          'error'
        );
        renderSavedBookings([], 'unavailable');
      }
    } finally {
      if (bookingSubmitButton) {
        bookingSubmitButton.disabled = false;
        bookingSubmitButton.removeAttribute('aria-busy');
      }
    }
  });
} else if (bookingSavedSection) {
  updateSavedBookings().catch(() => {
    renderSavedBookings([], 'unavailable');
  });
}

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

if (scrollOrbs.length && !(prefersReducedMotion && prefersReducedMotion.matches)) {
  let latestKnownScrollY = window.scrollY || window.pageYOffset || 0;
  let ticking = false;
  const heroSection = document.querySelector('.hero');

  const updateScrollVisuals = () => {
    const scrollY = latestKnownScrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
    const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
    const heroProgress = Math.min(scrollY / heroHeight, 1);

    scrollOrbs.forEach((orb, index) => {
      const wave = Math.sin(progress * Math.PI * (index + 1));
      const offsetX = wave * (80 + index * 28);
      const offsetY = scrollY * (0.05 + index * 0.02);
      const scale = 1 + heroProgress * (0.18 + index * 0.07);
      const blur = 45 + progress * (25 + index * 10);

      orb.style.setProperty('--offset-x', `${offsetX.toFixed(2)}px`);
      orb.style.setProperty('--offset-y', `${offsetY.toFixed(2)}px`);
      orb.style.setProperty('--scale', scale.toFixed(3));
      orb.style.setProperty('--glow', `${blur.toFixed(2)}px`);
    });

    if (heroVisual) {
      const heroOffset = Math.min(scrollY * -0.06, 0);
      heroVisual.style.transform = `translateY(${heroOffset}px)`;
    }

    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollVisuals);
      ticking = true;
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      latestKnownScrollY = window.scrollY || window.pageYOffset || 0;
      requestTick();
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    latestKnownScrollY = window.scrollY || window.pageYOffset || 0;
    requestTick();
  });

  updateScrollVisuals();
} else if (heroVisual) {
  heroVisual.style.transform = '';
}
