document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Initialization
    const SUPABASE_URL = 'https://mfqsfffquuscphhocaze.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcXNmZmZxdXVzY3BoaG9jYXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDI2NTcsImV4cCI6MjA4MjYxODY1N30.DbBmTYpM35pYzSfH8r6AYkcgGpXo5gPT5kolTGP5euQ';
    let supabaseClient = null;
    let currentMode = 'quiz'; // Default mode
    let marathonInterval = null;
    let marathonTimeLeft = 60;

    if (SUPABASE_URL !== 'https://your-project.supabase.co') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Initial Session Check
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            updateUIForUser(session.user);
        }
    }

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    function activateSection(targetId) {
        // Update Nav State
        navItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Section View
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            activateSection(target);
        });
    });

    // Sidebar Initialization
    activateSection('dashboard');
    animateXPBar();
    renderDashboardTasks();

    // Side Profile Click
    const profileTrigger = document.getElementById('user-profile-trigger');
    if (profileTrigger) {
        profileTrigger.addEventListener('click', () => {
            activateSection('profile');
        });
    }

    function animateXPBar() {
        const xpFill = document.querySelector('.xp-fill');
        if (xpFill) {
            const width = xpFill.style.width;
            xpFill.style.width = '0%';
            setTimeout(() => {
                xpFill.style.width = width;
            }, 500);
        }
    }

    function updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = localStorage.getItem('lastVisitDate');
        let streak = parseInt(localStorage.getItem('userStreak') || '0');

        if (lastVisit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastVisit === yesterdayStr) {
                streak++;
            } else {
                streak = 1; // Reset or start new
            }

            localStorage.setItem('userStreak', streak);
            localStorage.setItem('lastVisitDate', today);
        }

        // Update UI
        const streakEl = document.getElementById('stat-streak');
        if (streakEl) {
            streakEl.innerHTML = `${streak} дн. <span style="color: #ff8c42;">🔥</span>`;

            // Update badge text if it's a high streak
            const badge = streakEl.parentElement.querySelector('.streak-badge');
            if (badge) {
                if (streak >= 7) badge.textContent = 'WILD FIRE';
                else if (streak >= 3) badge.textContent = 'ON FIRE';
                else badge.textContent = 'NEW';
            }
        }
    }
    updateStreak();

    async function fetchLeaderboard() {
        const container = document.getElementById('leaderboard-preview-list');
        if (!container) return;

        // Initialize empty
        let users = [];

        // Try Supabase
        if (typeof supabase !== 'undefined' && supabase) {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, xp, avatar_url')
                .order('xp', { ascending: false })
                .limit(5);

            if (!error && data && data.length > 0) {
                users = data.map(u => ({
                    username: u.username || 'User',
                    xp: u.xp || 0,
                    avatar: (u.username || 'U')[0].toUpperCase(),
                    color: '#var(--accent-primary)'
                }));
            }
        }

        container.innerHTML = users.map((u, i) => `
             <div class="leader-row" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <span style="font-weight: bold; color: ${i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#888'}; width: 15px;">${i + 1}</span>
                <div style="width: 24px; height: 24px; background: ${u.color || '#666'}; border-radius: 50%; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">${u.avatar}</div>
                <span style="flex: 1; font-size: 0.9rem;">${u.username}</span>
                <span style="font-size: 0.8rem; color: var(--accent-primary);">${u.xp} XP</span>
            </div>
        `).join('');
    }
    // Call it
    setTimeout(fetchLeaderboard, 1000);

    // Vocabulary Section Management
    const filterBtns = document.querySelectorAll('.filter-chip');
    const vocabContainer = document.querySelector('.vocab-list-container');

    function renderVocabulary(filter = 'all') {
        if (!vocabContainer) return;

        vocabContainer.innerHTML = '';

        const units = {
            'Unit 8': typeof unit8 !== 'undefined' ? unit8 : [],
            'Unit 9': typeof unit9 !== 'undefined' ? unit9 : [],
            'Unit 10': typeof unit10 !== 'undefined' ? unit10 : [],
            'Unit 11': typeof unit11 !== 'undefined' ? unit11 : []
        };

        if (filter === 'de') {
            vocabContainer.innerHTML = `
                <div class="empty-state-message" style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🇩🇪</div>
                    <h3>слов пока не добавлено но Лео это обязательно скоро сделает :)</h3>
                </div>
            `;
            return;
        }

        for (const unitName in units) {
            const words = units[unitName];
            if (words.length === 0) continue;

            // Add Unit Header
            const header = document.createElement('div');
            header.className = 'vocab-section-title';
            header.setAttribute('data-lang', 'en');
            header.textContent = unitName;
            vocabContainer.appendChild(header);

            words.forEach(word => {
                // Filter logic
                if (filter !== 'all' && filter !== 'en') return;

                // Card Creation
                const card = document.createElement('div');
                card.className = 'vocab-card';
                card.setAttribute('data-lang', 'en');

                card.innerHTML = `
                    <div class="card-left">
                        <div class="lang-dot en"></div>
                        <div>
                            <h3 class="word-text">${word.term}</h3>
                            <span class="transcr">${word.transcr}</span>
                        </div>
                    </div>
                    <div class="card-right">
                        <div class="translation-text">${word.translation}</div>
                        <button class="speak-btn" title="Прослушать">
                            <ion-icon name="volume-medium-outline"></ion-icon>
                        </button>
                    </div>
                `;

                const btn = card.querySelector('.speak-btn');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    speakWord(word.term, 'en');
                });

                vocabContainer.appendChild(card);
            });
        }
    }

    // Event listeners for filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            renderVocabulary(filterValue);
        });
    });

    // Initial render
    renderVocabulary('all');

    // Quiz Logic
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const unitSelect = document.getElementById('unit-select');
    const quizModal = document.getElementById('quiz-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const quizQuestionContainer = document.getElementById('quiz-question-container');
    const quizProgressFill = document.getElementById('quiz-progress-fill');
    const quizResultsContainer = document.getElementById('quiz-modal-results');
    const quizBody = document.getElementById('quiz-modal-body');

    const allUnits = {
        unit8: typeof unit8 !== 'undefined' ? unit8 : [],
        unit9: typeof unit9 !== 'undefined' ? unit9 : [],
        unit10: typeof unit10 !== 'undefined' ? unit10 : [],
        unit11: typeof unit11 !== 'undefined' ? unit11 : []
    };

    let quizWords = [];
    let currentQuestionIndex = 0;
    let quizScore = 0;
    let quizAttempts = []; // Store {word, userAnswer, isCorrect}

    function openQuizModal() {
        quizModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeQuizModal() {
        quizModal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('quiz-live-stats').classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', closeQuizModal);
    const infoModal = document.getElementById('info-modal');
    const xpInfoBtn = document.getElementById('xp-info-btn');
    const closeInfoBtn = document.querySelector('.close-info-modal');

    function openInfoModal() {
        infoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeInfoModal() {
        infoModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    xpInfoBtn.addEventListener('click', openInfoModal);
    closeInfoBtn.addEventListener('click', closeInfoModal);

    // Profile & Auth Logic
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const regUsernameInput = document.getElementById('reg-username');

    // Auth Tab Switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });

    // Username Validation (English lowercase + numbers, max 9 chars)
    regUsernameInput.addEventListener('input', (e) => {
        let val = e.target.value.toLowerCase();
        val = val.replace(/[^a-z0-9]/g, '');
        if (val.length > 9) val = val.slice(0, 9);
        e.target.value = val;
    });

    // Auth Form Handlers
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            if (!supabaseClient) {
                alert('Пожалуйста, настройте Supabase URL и Anon Key в script.js');
                return;
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });

            if (error) {
                showToast(`Ошибка: ${error.message}`, 'error');
            } else {
                showToast('🚀 Почти готово! Письмо со ссылкой отправлено вам на почту. Подтвердите его, чтобы активировать профиль.');
                // We don't call updateUIForUser yet because email needs confirmation
                // But we can reset the form
                registerForm.reset();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!supabaseClient) {
                alert('Пожалуйста, настройте Supabase URL и Anon Key в script.js');
                return;
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert(`Ошибка: ${error.message}`);
            } else {
                updateUIForUser(data.user);
            }
        });
    }

    async function updateUIForUser(user) {
        if (!user) return;

        const username = user.user_metadata?.username || user.email.split('@')[0];

        // Fetch additional stats from profiles table
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Update Labels (Sidebar)
        document.getElementById('user-display-name').textContent = username;
        document.getElementById('user-status-label').textContent = 'В сети';
        document.getElementById('user-avatar-initial').textContent = username[0].toUpperCase();

        if (profile) {
            // Sidebar Stats
            const levelLabel = document.getElementById('user-level-label');
            const xpRatioLabel = document.getElementById('user-xp-ratio');
            const xpFill = document.querySelector('.xp-fill');

            if (levelLabel) levelLabel.textContent = `Уровень ${profile.level || 1}`;
            if (xpRatioLabel) xpRatioLabel.textContent = `${profile.xp || 0} / 100 XP`;
            if (xpFill) xpFill.style.width = `${(profile.xp || 0)}%`;

            // Dashboard Stats
            const dashLevel = document.getElementById('stat-unit');
            const dashStreak = document.getElementById('stat-streak');
            const dashMinutes = document.getElementById('stat-hours');

            if (dashLevel) dashLevel.textContent = profile.level || 1;
            if (dashStreak) {
                const streak = profile.streak || 0;
                dashStreak.textContent = streak > 0 ? `${streak} Дней` : 'Еще не начата';
            }
            if (dashMinutes) dashMinutes.textContent = profile.study_minutes || 0;

            // Profile Page stats
            document.getElementById('profile-xp').textContent = profile.xp || 0;
            document.getElementById('profile-level').textContent = profile.level || 1;
            document.getElementById('profile-units').textContent = profile.units_completed || 0;
            document.getElementById('profile-minutes').textContent = profile.study_minutes || 0;
        }

        // Switch to profile details view
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('profile-details').classList.remove('hidden');

        document.getElementById('profile-username').textContent = username;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-avatar').textContent = username[0].toUpperCase();
    }

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }
            location.reload(); // Simple way to reset UI
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === quizModal) closeQuizModal();
        if (e.target === infoModal) closeInfoModal();
    });

    // Custom Dropdowns Logic
    const dropdowns = document.querySelectorAll('.custom-dropdown');

    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        const items = dropdown.querySelectorAll('.dropdown-item');
        const selectedValueSpan = dropdown.querySelector('.selected-value');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            dropdowns.forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            dropdown.classList.toggle('active');
        });

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.classList.contains('disabled')) return;

                // Update selected value
                const value = item.dataset.value;
                const text = item.textContent;
                selectedValueSpan.textContent = text;
                selectedValueSpan.dataset.value = value;

                // Update active item
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Close dropdown
                dropdown.classList.remove('active');
            });
        });

        // Mobile Swipe Logic for Dropdown (Bottom Sheet)
        if (menu) {
            let startY = 0;
            let currentY = 0;
            let isDragging = false;
            let startTime = 0;

            menu.addEventListener('touchstart', (e) => {
                if (menu.scrollTop > 0) return; // Only drag if at top of list
                startY = e.touches[0].clientY;
                startTime = Date.now();
                isDragging = true;
                menu.style.transition = 'none'; // Disable transition for direct ref
            }, { passive: true });

            menu.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;

                if (deltaY > 0) { // Only drag downwards
                    e.preventDefault(); // Prevent accidental scroll
                    menu.style.transform = `translateY(${deltaY}px)`;
                }
            }, { passive: false });

            menu.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                const deltaY = currentY - startY;
                const timeDiff = Date.now() - startTime;
                const velocity = deltaY / timeDiff; // px per ms

                menu.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

                // Close if dragged far enough or fast enough
                if (deltaY > 150 || (deltaY > 50 && velocity > 0.5)) {
                    dropdown.classList.remove('active');
                    setTimeout(() => {
                        menu.style.transform = ''; // Reset after animation
                    }, 300);
                } else {
                    menu.style.transform = ''; // Snap back
                }
            });
        }
    });

    // Close dropdowns on outside click
    window.addEventListener('click', () => {
        dropdowns.forEach(d => {
            if (d.classList.contains('active')) {
                // Ensure nice closing animation even on outside click
                const menu = d.querySelector('.dropdown-menu');
                if (menu) {
                    menu.style.transition = 'transform 0.3s ease';
                    d.classList.remove('active');
                }
            }
        });
    });

    let currentUtterances = [];
    let selectedVoiceURI = localStorage.getItem('selectedVoiceURI');

    function populateVoices() {
        const voices = window.speechSynthesis.getVoices();
        // Priority: US > GB > others
        const englishVoices = voices.filter(v => v.lang.startsWith('en')).sort((a, b) => {
            const getScore = (v) => {
                if (v.lang === 'en-US') return 3;
                if (v.lang === 'en-GB') return 2;
                return 1;
            };
            return getScore(b) - getScore(a); // Descending score
        });
        const selector = document.getElementById('voice-selector');
        if (!selector) return;

        const menu = selector.querySelector('.dropdown-menu');
        const triggerSpan = selector.querySelector('.selected-value');

        if (!menu) return;
        menu.innerHTML = '';

        // Add "Auto" option
        const autoItem = document.createElement('div');
        autoItem.className = 'dropdown-item' + (!selectedVoiceURI ? ' active' : '');
        autoItem.textContent = 'Auto Voice';
        autoItem.dataset.value = '';
        menu.appendChild(autoItem);

        englishVoices.forEach(voice => {
            const item = document.createElement('div');
            item.className = 'dropdown-item' + (selectedVoiceURI === voice.voiceURI ? ' active' : '');
            item.textContent = voice.name;
            item.dataset.value = voice.voiceURI;
            menu.appendChild(item);

            if (selectedVoiceURI === voice.voiceURI) {
                triggerSpan.textContent = voice.name;
            }
        });

        // Re-attach listeners for the new items
        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedVoiceURI = item.dataset.value;
                if (selectedVoiceURI) {
                    localStorage.setItem('selectedVoiceURI', selectedVoiceURI);
                } else {
                    localStorage.removeItem('selectedVoiceURI');
                }
                triggerSpan.textContent = item.textContent;

                menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                selector.classList.remove('active');

                stopSpeaking();
            });
        });
    }

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();

    function stopSpeaking() {
        window.speechSynthesis.cancel();
        currentUtterances = [];
        document.getElementById('btn-speak-text')?.classList.remove('speaking');
        document.querySelectorAll('.text-pane p').forEach(p => p.classList.remove('reading-active'));
    }

    function getBestEnglishVoice() {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;

        if (selectedVoiceURI) {
            const userVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (userVoice) return userVoice;
        }

        // Priority list for voices
        const preferred = [
            v => v.name.includes('Google') && v.lang === 'en-US',
            v => v.name.includes('Google') && v.lang.startsWith('en'),
            v => v.name.includes('Natural') && v.lang.includes('English'),
            v => v.name.includes('Microsoft') && v.lang.includes('English') && !v.name.includes('Desktop'),
            v => v.lang === 'en-US',
            v => v.lang.startsWith('en')
        ];

        for (const predicate of preferred) {
            const voice = voices.find(predicate);
            if (voice) return voice;
        }
        return voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    function speakEnglishText() {
        if (window.speechSynthesis.speaking) {
            stopSpeaking();
            return;
        }

        const englishSection = document.getElementById('english');
        const originalPane = englishSection?.querySelector('.text-pane.original');
        if (!originalPane) return;

        const paragraphs = Array.from(originalPane.querySelectorAll('p'));
        if (!paragraphs.length) return;

        const voice = getBestEnglishVoice();
        let currentIndex = 0;

        document.getElementById('btn-speak-text')?.classList.add('speaking');

        function speakNext() {
            if (currentIndex >= paragraphs.length) {
                stopSpeaking();
                return;
            }

            const p = paragraphs[currentIndex];
            // Highlight current
            paragraphs.forEach(el => el.classList.remove('reading-active'));
            p.classList.add('reading-active');
            p.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const utterance = new SpeechSynthesisUtterance(p.innerText);
            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang;
            } else {
                utterance.lang = 'en-US';
            }

            utterance.rate = 0.94;
            utterance.pitch = 1.0;

            utterance.onend = () => {
                currentIndex++;
                speakNext();
            };

            utterance.onerror = (e) => {
                console.error('TTS Error:', e);
                stopSpeaking();
            };

            window.speechSynthesis.speak(utterance);
        }

        speakNext();
    }

    function toggleTextBookmark() {
        const englishSelector = document.getElementById('english-text-selector');
        const selectedSpan = englishSelector?.querySelector('.selected-value');
        const textId = selectedSpan?.dataset.value;

        if (!textId) return;

        let bookmarks = JSON.parse(localStorage.getItem('bookmarkedTexts') || '[]');
        const index = bookmarks.indexOf(textId);

        if (index > -1) {
            bookmarks.splice(index, 1);
            showToast('Удалено из закладок', 'info');
        } else {
            bookmarks.push(textId);
            showToast('Добавлено в закладки', 'success');
        }

        localStorage.setItem('bookmarkedTexts', JSON.stringify(bookmarks));
        updateBookmarkState(textId);
    }

    function updateBookmarkState(textId) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedTexts') || '[]');
        const isBookmarked = bookmarks.includes(textId);
        const btn = document.getElementById('btn-bookmark-text');
        const icon = btn?.querySelector('ion-icon');

        if (icon) {
            icon.setAttribute('name', isBookmarked ? 'bookmark' : 'bookmark-outline');
            if (isBookmarked) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }

    // Shorten Text Logic
    let isShortenedMode = false;
    const shortenBtn = document.getElementById('btn-shorten-text');

    if (shortenBtn) {
        shortenBtn.addEventListener('click', () => {
            const englishSelector = document.getElementById('english-text-selector');
            const selectedSpan = englishSelector?.querySelector('.selected-value');
            const textId = selectedSpan?.dataset.value;

            if (!textId) return;

            isShortenedMode = !isShortenedMode;
            updateShortenButtonState();
            renderEnglishText(textId);
        });
    }

    function updateShortenButtonState() {
        if (!shortenBtn) return;
        if (isShortenedMode) {
            shortenBtn.classList.add('active');
            shortenBtn.style.color = 'var(--accent-primary)';
        } else {
            shortenBtn.classList.remove('active');
            shortenBtn.style.color = '';
        }
    }

    // Text Rendering Logic
    function renderEnglishText(textData) {
        const englishSection = document.getElementById('english');
        if (!englishSection) {
            console.error('English section not found!');
            return;
        }

        const originalPane = englishSection.querySelector('.text-pane.original');
        const translationPane = englishSection.querySelector('.text-pane.translation');

        if (!originalPane || !translationPane) {
            console.error('Text panes not found in English section!');
            return;
        }

        // Handle Shortened Mode logic
        const shortenBtn = document.getElementById('btn-shorten-text');
        const hasShortVersion = typeof window[textData + '_short'] !== 'undefined';

        if (shortenBtn) {
            shortenBtn.style.display = hasShortVersion ? 'flex' : 'none';
        }

        if (isShortenedMode && !hasShortVersion) {
            isShortenedMode = false;
            updateShortenButtonState();
        }

        let targetData = (isShortenedMode && hasShortVersion) ? textData + '_short' : textData;

        // Try to get data from window object
        let data = window[targetData];

        if (!data) {
            console.error(`Data for ${textData} not found! Make sure the script is loaded.`);
            originalPane.innerHTML = '<p style="color: var(--danger); text-align: center;">⚠️ Текст не загружен. Проверьте подключение файла.</p>';
            translationPane.innerHTML = '<p style="color: var(--danger); text-align: center;">⚠️ Text not loaded. Check file connection.</p>';
            return;
        }

        if (!data.contentEn || !data.contentRu) {
            console.error(`Invalid data structure for ${textData}`);
            return;
        }

        originalPane.innerHTML = data.contentEn.map(p => `<p>${p}</p>`).join('');
        translationPane.innerHTML = data.contentRu.map(p => `<p>${p}</p>`).join('');
        console.log(`✓ Successfully loaded: ${data.titleEn || textData}`);
    }

    // Specific logic for English text selector
    // Specific logic for English text selector
    const englishSelector = document.getElementById('english-text-selector');
    if (englishSelector) {
        const selectedSpan = englishSelector.querySelector('.selected-value');
        const menu = englishSelector.querySelector('.dropdown-menu');

        // Define all available texts mapping
        // This ensures "All texts" are available as requested by user
        const availableTexts = [
            { id: 'text9A', title: '9A: Teenage Britain' },
            { id: 'text9B', title: '9B: Carol Ann Duffy' },
            { id: 'text10A', title: '10A: Transport in London' },
            { id: 'text10B', title: '10B: John McCrae' },
            { id: 'text11', title: 'Unit 11: Sir Arthur Conan Doyle' },
            { id: 'text12A', title: '12A: The American Revolution' },
            { id: 'text12B', title: '12B: Samuel Pepys' },
            { id: 'textExtraPerformance', title: 'EXTRA: Performance Capture' }
        ];

        // Clear existing static items to prevent duplicates/missing ones
        menu.innerHTML = '';

        availableTexts.forEach(text => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            if (selectedSpan && selectedSpan.dataset.value === text.id) {
                item.classList.add('active');
            }
            item.dataset.value = text.id;
            item.textContent = text.title;

            item.addEventListener('click', () => {
                const value = item.dataset.value;
                console.log('Dropdown selected:', value);

                // Update UI
                selectedSpan.textContent = text.title;
                selectedSpan.dataset.value = value;

                // Update active state
                menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                englishSelector.classList.remove('active');

                renderEnglishText(value);
                updateBookmarkState(value);
                stopSpeaking();
            });

            menu.appendChild(item);
        });

        // Initial load
        if (selectedSpan) {
            console.log('Initial text load:', selectedSpan.dataset.value);
            renderEnglishText(selectedSpan.dataset.value);
        }

        // Action Buttons Listeners
        const speakBtn = document.getElementById('btn-speak-text');
        const bookmarkBtn = document.getElementById('btn-bookmark-text');

        if (speakBtn) {
            speakBtn.addEventListener('click', speakEnglishText);
        }

        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', toggleTextBookmark);
        }

        // Initialize bookmark state
        if (selectedSpan) {
            updateBookmarkState(selectedSpan.dataset.value);
        }
    }

    startQuizBtn.addEventListener('click', () => {
        const langDropdown = document.getElementById('lang-dropdown');
        const unitDropdown = document.getElementById('unit-dropdown');

        const selectedLang = langDropdown.querySelector('.selected-value').dataset.value;
        const selectedUnit = unitDropdown.querySelector('.selected-value').dataset.value;

        let words = [];

        if (selectedUnit === 'all') {
            words = Object.values(allUnits).flat();
        } else {
            words = allUnits[selectedUnit];
        }

        if (words.length === 0) {
            alert('Нет слов для начала викторины.');
            return;
        }

        // Initialize Quiz
        quizWords = [...words].sort(() => 0.5 - Math.random());
        currentQuestionIndex = 0;
        quizScore = 0;
        quizAttempts = [];

        // Reset and show live stats
        document.getElementById('live-correct').textContent = '0';
        document.getElementById('live-incorrect').textContent = '0';
        document.getElementById('live-remaining').textContent = quizWords.length;
        document.getElementById('quiz-live-stats').classList.remove('hidden');

        // Marathon Specific Start
        if (currentMode === 'marathon') {
            marathonTimeLeft = 60;
            startMarathonTimer();
        }

        quizBody.classList.remove('hidden');
        quizResultsContainer.classList.add('hidden');

        openQuizModal();
        showQuestion();
    });

    function startMarathonTimer() {
        if (marathonInterval) clearInterval(marathonInterval);

        // Add timer UI to modal header
        const header = document.querySelector('.modal-title-group');
        let timerDisplay = document.getElementById('marathon-timer-display');

        if (!timerDisplay) {
            timerDisplay = document.createElement('div');
            timerDisplay.id = 'marathon-timer-display';
            timerDisplay.className = 'marathon-timer';
            header.appendChild(timerDisplay);
        }

        timerDisplay.textContent = marathonTimeLeft;
        timerDisplay.classList.remove('hidden');

        marathonInterval = setInterval(() => {
            marathonTimeLeft--;
            timerDisplay.textContent = marathonTimeLeft;

            if (marathonTimeLeft <= 10) {
                timerDisplay.classList.add('warning');
            }

            if (marathonTimeLeft <= 0) {
                clearInterval(marathonInterval);
                showResults();
            }
        }, 1000);
    }

    // Mode Cards Interaction
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            currentMode = card.dataset.mode || 'quiz';

            // If it's marathon, we might want to start differently, 
            // but for now, let's just show a toast or auto-start the unit selection
            const modeName = card.querySelector('h3').textContent;
            showToast(`Выбран режим: ${modeName}. Выберите юнит и нажмите "Начать"!`);

            // Highlight active mode card
            modeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    // Default Highlight for Quiz
    const defaultQuizCard = document.querySelector('.mode-card[data-mode="quiz"]');
    if (defaultQuizCard) defaultQuizCard.classList.add('active');

    function renderDashboardTasks() {
        const grid = document.getElementById('dashboard-reading-grid');
        if (!grid) return;

        const tasks = [{
            id: 'text9A',
            title: 'Teenage Britain',
            type: 'Reading & Listening',
            time: '5 min',
            xp: '+15 XP',
            desc: 'Learn about challenges faced by British youth.'
        },
        {
            id: 'text11',
            title: 'Conan Doyle',
            type: 'Vocabulary Focus',
            time: '8 min',
            xp: '+25 XP',
            desc: 'Master descriptive adjectives from Sherlock Holmes.'
        },
        {
            id: 'text12B',
            title: 'Samuel Pepys',
            type: 'Historical Context',
            time: '6 min',
            xp: '+20 XP',
            desc: 'Explore the Great Fire of London in English.'
        },
        {
            id: 'text10A',
            title: 'London Transport',
            type: 'Quick Practice',
            time: '4 min',
            xp: '+10 XP',
            desc: 'How to navigate the Tube like a pro.'
        }
        ];

        grid.innerHTML = tasks.map(task => `
            <div class="practice-card" onclick="openPracticeTask('${task.id}')">
                <div class="practice-card-header">
                    <span class="practice-tag">${task.type}</span>
                    <span class="practice-time">
                        <ion-icon name="time-outline"></ion-icon>
                        ${task.time}
                    </span>
                </div>
                <div class="practice-card-body">
                    <h4>${task.title}</h4>
                    <p>${task.desc}</p>
                </div>
                <div class="practice-card-footer">
                    <div class="practice-stats">
                        <div class="stat-item">
                            <ion-icon name="flash"></ion-icon>
                            ${task.xp}
                        </div>
                    </div>
                    <div class="practice-btn">
                        <ion-icon name="play"></ion-icon>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Reading Timer System
    let timerInterval = null;
    let timerSeconds = 0;
    let currentReadingTask = null;

    const timerConfig = {
        'text9A': { duration: 300, xp: 15 },  // 5 min
        'text9B': { duration: 480, xp: 20 },  // 8 min
        'text10A': { duration: 240, xp: 10 }, // 4 min
        'text10B': { duration: 360, xp: 15 }, // 6 min
        'text11': { duration: 480, xp: 25 },  // 8 min
        'text12A': { duration: 360, xp: 20 }, // 6 min
        'text12B': { duration: 360, xp: 20 },  // 6 min
        'textExtraPerformance': { duration: 420, xp: 25 } // 7 min
    };

    function startReadingTimer(textId) {
        const config = timerConfig[textId];
        if (!config) return;

        // Stop any existing timer
        stopReadingTimer(false);

        currentReadingTask = {
            textId: textId,
            startTime: Date.now(),
            targetDuration: config.duration,
            xpReward: config.xp
        };

        timerSeconds = 0;
        const timerElement = document.getElementById('reading-timer');
        const timerDisplay = document.getElementById('timer-display');

        if (timerElement) {
            timerElement.style.display = 'flex';
        }

        timerInterval = setInterval(() => {
            timerSeconds++;
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            if (timerDisplay) {
                timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }

            // Check if target duration reached
            if (timerSeconds >= currentReadingTask.targetDuration) {
                completeReadingTask();
            }
        }, 1000);

        console.log(`⏱️ Timer started for ${textId}: ${config.duration}s for ${config.xp} XP`);
    }

    function stopReadingTimer(showMessage = true) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const timerElement = document.getElementById('reading-timer');
        if (timerElement) {
            timerElement.style.display = 'none';
        }

        if (showMessage && currentReadingTask && timerSeconds > 30) {
            showToast('Таймер остановлен. Продолжайте чтение!', 'info');
        }

        timerSeconds = 0;
        currentReadingTask = null;
    }

    async function completeReadingTask() {
        if (!currentReadingTask) return;

        const xpEarned = currentReadingTask.xpReward;
        const textId = currentReadingTask.textId;

        // Stop timer
        stopReadingTimer(false);

        // Award XP
        try {
            const userId = localStorage.getItem('userId');
            if (userId && supabase) {
                // Update user XP
                const { data: userData, error: fetchError } = await supabase
                    .from('users')
                    .select('xp')
                    .eq('id', userId)
                    .single();

                if (!fetchError && userData) {
                    const newXP = (userData.xp || 0) + xpEarned;

                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ xp: newXP })
                        .eq('id', userId);

                    if (!updateError) {
                        // Update UI
                        const xpElement = document.getElementById('stat-xp');
                        if (xpElement) {
                            xpElement.textContent = newXP;
                        }

                        // Log reading session
                        await supabase.from('reading_sessions').insert({
                            user_id: userId,
                            text_id: textId,
                            duration_seconds: timerSeconds,
                            xp_earned: xpEarned,
                            completed_at: new Date().toISOString()
                        });

                        showToast(`🎉 Отлично! +${xpEarned} XP за прочтение!`, 'success');
                        console.log(`✅ Reading completed: ${textId}, earned ${xpEarned} XP`);
                    }
                }
            } else {
                showToast(`✅ Чтение завершено! (+${xpEarned} XP)`, 'success');
            }
        } catch (error) {
            console.error('Error awarding XP:', error);
            showToast(`✅ Чтение завершено! (+${xpEarned} XP)`, 'success');
        }
    }

    // Stop timer button
    const stopTimerBtn = document.getElementById('stop-timer-btn');
    if (stopTimerBtn) {
        stopTimerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stopReadingTimer(true);
        });
    }

    window.openPracticeTask = (textId) => {
        activateSection('english');
        const selector = document.getElementById('english-text-selector');
        if (selector) {
            const items = selector.querySelectorAll('.dropdown-item');
            const targetItem = Array.from(items).find(i => i.dataset.value === textId);
            if (targetItem) {
                targetItem.click(); // This will trigger renderEnglishText and update state
                // Start timer after a short delay to ensure text is loaded
                setTimeout(() => startReadingTimer(textId), 500);
            }
        }
    };

    const showAllTextsBtn = document.getElementById('btn-show-all-texts');
    if (showAllTextsBtn) {
        showAllTextsBtn.addEventListener('click', () => {
            activateSection('english');
            // Small delay to allow section transition
            setTimeout(() => {
                const selector = document.getElementById('english-text-selector');
                if (selector) {
                    const trigger = selector.querySelector('.dropdown-trigger');
                    if (trigger) trigger.click();
                }
            }, 100);
        });
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <ion-icon name="${type === 'success' ? 'checkmark-circle' : 'alert-circle'}"></ion-icon>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    function showQuestion() {
        if (currentQuestionIndex >= quizWords.length) {
            if (currentMode === 'marathon') {
                // Shuffle and repeat for marathon
                quizWords = [...quizWords].sort(() => 0.5 - Math.random());
                currentQuestionIndex = 0;
            } else {
                showResults();
                return;
            }
        }

        const word = quizWords[currentQuestionIndex];

        // Update Remaining Count
        const remainingEl = document.getElementById('live-remaining');
        if (remainingEl) remainingEl.textContent = quizWords.length - currentQuestionIndex;

        // Update Progress
        const progress = (currentQuestionIndex / quizWords.length) * 100;
        if (quizProgressFill) quizProgressFill.style.width = `${progress}%`;

        if (currentMode === 'spelling') {
            renderSpellingQuestion(word);
        } else if (currentMode === 'flashcards') {
            renderFlashcard(word);
        } else {
            renderQuizQuestion(word);
        }
    }

    function renderQuizQuestion(word) {
        // Generate options (1 correct + 3 random)
        let otherWords = Object.values(allUnits).flat().filter(w => w.translation !== word.translation);
        let options = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
        options.push(word);
        options.sort(() => 0.5 - Math.random());

        quizQuestionContainer.innerHTML = `
            <div class="quiz-question">
                <p>Что означает слово?</p>
                <div class="quiz-term">${word.term}</div>
            </div>
            <div class="quiz-options">
                ${options.map(o => `
                    <button class="quiz-option" data-translation="${o.translation}">
                        ${o.translation}
                    </button>
                `).join('')}
            </div>
        `;

        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedTranslation = e.target.dataset.translation;
                const isCorrect = selectedTranslation === word.translation;

                // Disable all options
                document.querySelectorAll('.quiz-option').forEach(opt => opt.style.pointerEvents = 'none');

                if (isCorrect) {
                    e.target.classList.add('correct');
                } else {
                    e.target.classList.add('incorrect');
                    document.querySelector(`.quiz-option[data-translation="${word.translation}"]`).classList.add('correct');
                }

                handleAnswer(isCorrect, {
                    term: word.term,
                    translation: word.translation,
                    userAnswer: selectedTranslation
                });
            });
        });
    }

    function renderSpellingQuestion(word) {
        quizQuestionContainer.innerHTML = `
            <div class="quiz-question">
                <p>Напишите перевод слова:</p>
                <div class="quiz-term">${word.term}</div>
                <div class="spelling-container">
                    <div class="spelling-input-wrapper">
                        <input type="text" class="spelling-input" id="spelling-answer" placeholder="Введите перевод..." autocomplete="off">
                    </div>
                    <button id="check-spelling-btn" class="glow-button wide">Проверить</button>
                </div>
            </div>
        `;

        const input = document.getElementById('spelling-answer');
        input.focus();

        const checkAnswer = () => {
            const answer = input.value.trim().toLowerCase();
            const correct = word.translation.toLowerCase();
            const isCorrect = answer === correct;

            input.disabled = true;
            if (isCorrect) {
                input.classList.add('correct');
            } else {
                input.classList.add('incorrect');
                input.value = word.translation; // Показать правильный ответ
            }

            handleAnswer(isCorrect, {
                term: word.term,
                translation: word.translation,
                userAnswer: input.value
            });
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });

        document.getElementById('check-spelling-btn').addEventListener('click', checkAnswer);
    }

    function renderFlashcard(word) {
        quizQuestionContainer.innerHTML = `
            <div class="flashcard-container">
                <div class="flashcard" id="main-flashcard">
                    <div class="card-face front">
                        <p class="card-hint">Слово</p>
                        <h2>${word.term}</h2>
                        <span class="card-hint">Нажми, чтобы перевернуть</span>
                    </div>
                    <div class="card-face back">
                        <p class="card-hint">Перевод</p>
                        <h2>${word.translation}</h2>
                        <p class="transcr">${word.transcription || ''}</p>
                    </div>
                </div>
            </div>
            <div class="flashcard-actions hidden" id="flash-actions">
                <button class="flash-btn again" data-correct="false">
                    <ion-icon name="refresh-outline"></ion-icon> Ещё раз
                </button>
                <button class="flash-btn know" data-correct="true">
                    <ion-icon name="checkmark-outline"></ion-icon> Знаю
                </button>
            </div>
        `;

        const card = document.getElementById('main-flashcard');
        const actions = document.getElementById('flash-actions');

        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
            if (card.classList.contains('flipped')) {
                actions.classList.remove('hidden');
            }
        });

        document.querySelectorAll('.flash-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const isCorrect = btn.dataset.correct === 'true';
                handleAnswer(isCorrect, {
                    term: word.term,
                    translation: word.translation,
                    userAnswer: isCorrect ? word.translation : 'Не знаю'
                });
            });
        });
    }

    async function handleAnswer(isCorrect, attemptData) {
        if (isCorrect) {
            quizScore++;
            document.getElementById('live-correct').textContent = quizScore;
        } else {
            const incorrectCount = quizAttempts.filter(a => !a.isCorrect).length + 1;
            document.getElementById('live-incorrect').textContent = incorrectCount;
        }

        quizAttempts.push({
            ...attemptData,
            isCorrect: isCorrect
        });

        // XP Reward Logic
        const xpGain = isCorrect ? (currentMode === 'spelling' ? 5 : 2) : 0;
        if (xpGain > 0) {
            const { data: { session } } = await supabaseClient?.auth.getSession() || { data: { session: null } };
            if (session) {
                // Update XP in DB
                const { data: profile } = await supabaseClient.from('profiles').select('xp').eq('id', session.user.id).single();
                if (profile) {
                    await supabaseClient.from('profiles').update({ xp: (profile.xp || 0) + xpGain }).eq('id', session.user.id);
                }
            }
        }

        // Marathon: Rapid transition, no delay
        const delay = currentMode === 'marathon' ? 100 : 800;

        // Small delay before next question
        setTimeout(() => {
            currentQuestionIndex++;
            showQuestion();
        }, delay);
    }

    function showResults() {
        if (marathonInterval) {
            clearInterval(marathonInterval);
            const timerEl = document.getElementById('marathon-timer-display');
            if (timerEl) timerEl.classList.add('hidden');
        }

        quizBody.classList.add('hidden');
        quizResultsContainer.classList.remove('hidden');
        quizProgressFill.style.width = '100%';
        document.getElementById('quiz-live-stats').classList.add('hidden');

        quizResultsContainer.innerHTML = `
            <div class="results-summary">
                <span class="results-score">${quizScore} / ${quizWords.length}</span>
                <p>Ваш результат</p>
            </div>
            <div class="results-list">
                ${quizAttempts.map((attempt, index) => `
                    <div class="result-item">
                        <div class="result-word-info">
                            <div class="result-term-row">
                                <span class="result-term">${attempt.term}</span>
                                <button class="speak-btn small" data-index="${index}">
                                    <ion-icon name="volume-medium-outline"></ion-icon>
                                </button>
                            </div>
                            <span class="result-translation">${attempt.translation}</span>
                        </div>
                        <div class="result-status ${attempt.isCorrect ? 'correct' : 'incorrect'}">
                            <ion-icon name="${attempt.isCorrect ? 'checkmark-circle' : 'close-circle'}"></ion-icon>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="restart-quiz-btn">Закрыть</button>
        `;

        quizResultsContainer.querySelectorAll('.speak-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                speakWord(quizAttempts[index].term, 'en');
            });
        });

        quizResultsContainer.querySelector('.restart-quiz-btn').addEventListener('click', closeQuizModal);
    }

    // TTS Helper
    function speakWord(text, lang = 'en') {
        if (!window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'en' ? 'en-US' : 'de-DE';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1;

        // Try to find a better voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const preferredVoice = voices.find(v => v.lang.includes(lang === 'en' ? 'en-US' : 'de-DE') && v.name.includes('Google'));
            if (preferredVoice) utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    }

    // Study Session Timer
    let studySeconds = 0;
    setInterval(async () => {
        const { data: { session } } = await supabaseClient?.auth.getSession() || { data: { session: null } };
        if (session) {
            studySeconds++;
            if (studySeconds >= 60) {
                studySeconds = 0;
                // Update study minutes in DB
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('study_minutes')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    await supabaseClient
                        .from('profiles')
                        .update({ study_minutes: (profile.study_minutes || 0) + 1 })
                        .eq('id', session.user.id);

                    // Update UI (Profile & Dashboard)
                    const minutesEl = document.getElementById('profile-minutes');
                    const dashMinutesEl = document.getElementById('stat-hours');
                    const totalMinutes = (profile.study_minutes || 0) + 1;

                    if (minutesEl) minutesEl.textContent = totalMinutes;
                    if (dashMinutesEl) dashMinutesEl.textContent = totalMinutes;
                }
            }
        }
    }, 1000);
});
