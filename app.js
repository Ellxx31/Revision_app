// --- DONNÉES PAR DÉFAUT (Traduction exacte de votre script Python) ---
const DEFAULT_SUBJECTS = {
    "Biochimie Structurale": {
        questions: [
            "[Protéines]\n1- Une protéine d'intérêt est réduite, dérivée puis hydrolysée par la trypsine...",
            "[Protéines]\n2- Quelles méthodes permettent l'identification de l'acide aminé N-terminal et C-terminal ?",
            "[Protéines]\n3- Décrire le principe de l'HPLC-ESI-TSQ (triple quadripôle) en modes MS et MS/MS.",
            "[Glucides]\n9- Décrire les différentes méthodes permettant la détermination de la composition osidique.",
            "[Lipides]\n14- Proposez des protocoles permettant la séparation d'une fraction lipidique..."
        ],
        corrections: {
            "1": "Réduction par le DTT pour rompre les ponts disulfures, puis alkylation (iodoacétamide)...",
            "2": "Identification N-terminale : Réactif de Sanger (F-DNP), dégradation d'Edman...",
            "3": "L'HPLC-ESI-TSQ utilise l'ionisation électrospray (ESI) pour transférer les peptides...",
            "9": "Hydrolyse acide totale (TFA) suivie d'une analyse chromatographique.",
            "14": "Séparation par chromatographie sur gel de silice ou CCM selon la polarité."
        }
    }
};

let appState = {
    currentUser: null,
    users: JSON.parse(localStorage.getItem('revision_users') || '{}'),
    activeSubject: "Biochimie Structurale",
    currentView: 'login', // 'login', 'main', 'revision', 'redaction', 'corrections', 'agenda'
    selectedDayIndex: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
};

// --- GESTION DU TEMPS / HORLOGE ---
function initClock() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR');
        const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const clockEl = document.getElementById('clock-container');
        if (clockEl) {
            clockEl.innerHTML = `🕒 ${timeStr}  -  📅 ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`;
        }
    }, 1000);
}

// --- PERSISTENCE LOCALE / CLOUD ---
function saveState() {
    localStorage.setItem('revision_users', JSON.stringify(appState.users));
}

// --- RENDU DES ÉCRANS ---
function render() {
    const container = document.getElementById('app-container');
    container.innerHTML = '';

    if (!appState.currentUser) {
        renderLoginScreen(container);
    } else {
        renderMainDashboard(container);
    }
}

// 1. ÉCRAN DE CONNEXION / INSCRIPTION
function renderLoginScreen(container) {
    container.innerHTML = `
        <div class="flex-1 flex items-center justify-center">
            <div class="bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-xl w-full max-w-md">
                <h2 class="text-xl font-bold text-center mb-6 text-slate-100">Connexion à votre espace</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Nom d'utilisateur :</label>
                        <input type="text" id="username" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Mot de passe :</label>
                        <input type="password" id="password" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500">
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button onclick="handleLogin()" class="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 rounded-lg transition">Se connecter</button>
                        <button onclick="handleRegister()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-lg transition">S'inscrire</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function handleRegister() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) {
        alert("Veuillez remplir tous les champs.");
        return;
    }
    if (appState.users[user]) {
        alert("Ce nom d'utilisateur existe déjà.");
        return;
    }

    // Initialisation des données utilisateur
    appState.users[user] = {
        password: pass,
        subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
        todo: [],
        notes: "",
        agenda: []
    };
    saveState();
    appState.currentUser = user;
    render();
}

function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (appState.users[user] && appState.users[user].password === pass) {
        appState.currentUser = user;
        render();
    } else {
        alert("Nom d'utilisateur ou mot de passe incorrect.");
    }
}

// 2. TABLEAU DE BORD PRINCIPAL (RESPONSIVE 3 COLONNES -> 1 COLONNE SUR MOBILE)
function renderMainDashboard(container) {
    const userData = appState.users[appState.currentUser];
    const subjects = Object.keys(userData.subjects);

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            
            <!-- COLONNE GAUCHE : TO-DO & NOTES -->
            <div class="lg:col-span-3 flex flex-col space-y-6">
                <!-- To-Do List -->
                <div class="bg-yellow-100 text-yellow-950 p-4 rounded-xl shadow-md">
                    <h3 class="font-bold text-sm mb-3">📝 To-Do List (Jour)</h3>
                    <div class="flex mb-3">
                        <input type="text" id="todo-input" placeholder="Nouvelle tâche..." class="flex-1 bg-yellow-50 border border-yellow-300 rounded-l px-3 py-1 text-sm text-yellow-950 focus:outline-none">
                        <button onclick="addTodoTask()" class="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded-r font-bold">+</button>
                    </div>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${userData.todo.map((item, idx) => `
                            <div class="flex items-center justify-between bg-yellow-50 p-2 rounded text-sm">
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleTodoTask(${idx})">
                                    <span class="${item.done ? 'line-through text-slate-400' : ''}">${item.task}</span>
                                </label>
                                <button onclick="deleteTodoTask(${idx})" class="text-red-500 hover:text-red-700 font-bold text-xs">✕</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Notes / Pense-bête -->
                <div class="bg-yellow-100 text-yellow-950 p-4 rounded-xl shadow-md flex-1 flex flex-col">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-sm">📌 Pense-bête / Notes</h3>
                        <button onclick="clearNotes()" class="text-red-600 text-xs font-bold hover:underline">Vider</button>
                    </div>
                    <textarea id="user-notes" oninput="saveNotes(this.value)" class="w-full flex-1 bg-yellow-50 border border-yellow-300 rounded p-2 text-sm text-yellow-950 resize-none focus:outline-none">${userData.notes}</textarea>
                </div>
            </div>

            <!-- COLONNE CENTRALE : ACTIONS & MATIÈRES -->
            <div class="lg:col-span-4 bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center shadow-lg">
                <div class="w-full flex justify-between items-center mb-4">
                    <span class="text-xs text-slate-400">Connecté en tant que : <strong class="text-sky-400">${appState.currentUser}</strong></span>
                    <button onclick="handleLogout()" class="text-xs text-red-400 hover:underline">Se déconnecter</button>
                </div>

                <h2 class="text-lg font-bold text-slate-100 mb-2">Espace d'étude</h2>
                <label class="text-xs text-slate-400 mb-2">Matière active :</label>
                <select id="subject-select" onchange="changeSubject(this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mb-6 focus:outline-none">
                    ${subjects.map(s => `<option value="${s}" ${s === appState.activeSubject ? 'selected' : ''}>${s}</option>`).join('')}
                </select>

                <div class="w-full space-y-3">
                    <button onclick="startRevisionMode('reviser')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition shadow">Mode Révision</button>
                    <button onclick="startRevisionMode('rediger')" class="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl transition shadow">Mode Rédaction</button>
                    <button onclick="alert('Module de génération d’exercice actif !')" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition shadow">Générer un exercice</button>
                    <button onclick="addNewSubject()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl transition text-sm">+ Créer une nouvelle matière</button>
                </div>
            </div>

            <!-- COLONNE DROITE : AGENDA -->
            <div class="lg:col-span-5 bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col shadow-lg">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-100">📅 Agenda & Partiels</h3>
                    <button onclick="addAgendaEventModal()" class="bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">+ Événement</button>
                </div>
                
                <div class="space-y-3 flex-1 overflow-y-auto max-h-96">
                    ${userData.agenda.length === 0 ? '<p class="text-xs text-slate-500 italic text-center py-8">Aucun événement dans l’agenda.</p>' : ''}
                    ${userData.agenda.map((ev, idx) => `
                        <div class="p-3 rounded-lg border border-slate-800 flex justify-between items-center" style="background-color: ${ev.color || '#1e293b'}">
                            <div>
                                <h4 class="font-bold text-sm" style="color: ${ev.textcolor || '#fff'}">${ev.title}</h4>
                                <p class="text-xs opacity-80" style="color: ${ev.textcolor || '#fff'}">📅 ${ev.date} | 🕒 ${ev.time}</p>
                            </div>
                            <button onclick="deleteAgendaEvent(${idx})" class="text-xs font-bold px-2 py-1 bg-black/20 rounded hover:bg-black/40">✕</button>
                        </div>
                    `).join('')}
                </div>
            </div>

        </div>
    `;
}

// --- ACTIONS INTERACTIVES ---
function handleLogout() {
    appState.currentUser = null;
    render();
}

function changeSubject(subj) {
    appState.activeSubject = subj;
}

function addTodoTask() {
    const input = document.getElementById('todo-input');
    const task = input.value.trim();
    if (task) {
        appState.users[appState.currentUser].todo.push({ task, done: false });
        saveState();
        render();
    }
}

function toggleTodoTask(idx) {
    const userTodo = appState.users[appState.currentUser].todo;
    userTodo[idx].done = !userTodo[idx].done;
    saveState();
}

function deleteTodoTask(idx) {
    appState.users[appState.currentUser].todo.splice(idx, 1);
    saveState();
    render();
}

function saveNotes(val) {
    appState.users[appState.currentUser].notes = val;
    saveState();
}

function clearNotes() {
    appState.users[appState.currentUser].notes = "";
    saveState();
    render();
}

function addNewSubject() {
    const subjName = prompt("Nom de la nouvelle matière :");
    if (subjName && subjName.trim()) {
        const name = subjName.trim();
        appState.users[appState.currentUser].subjects[name] = {
            questions: ["[Général]\n1- Première question de test."],
            corrections: { "1": "Corrigé de test." }
        };
        appState.activeSubject = name;
        saveState();
        render();
    }
}

function addAgendaEventModal() {
    const title = prompt("Intitulé de l'événement (ex: Cours de Biochimie, Partiel...) :");
    const date = prompt("Date (JJ/MM/AAAA) :");
    const time = prompt("Horaire (ex: 08:00 - 10:00) :");
    if (title && date) {
        appState.users[appState.currentUser].agenda.push({
            title,
            date,
            time: time || "Toute la journée",
            color: title.toLowerCase().includes('partiel') ? '#7f1d1d' : '#0284c7',
            textcolor: '#ffffff'
        });
        saveState();
        render();
    }
}

function deleteAgendaEvent(idx) {
    appState.users[appState.currentUser].agenda.splice(idx, 1);
    saveState();
    render();
}

// --- INITIALISATION AU CHARGEMENT ---
window.onload = () => {
    initClock();
    render();
};