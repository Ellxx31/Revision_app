import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Clock, Calendar, BookOpen, CheckSquare, Edit3, Plus, Trash2, 
  ChevronLeft, ChevronRight, LogOut, CheckCircle, AlertCircle, 
  FileText, Palette, Download, Eye, EyeOff, RotateCcw, Lock, Unlock, Play
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "demo", authDomain: "demo", projectId: "demo" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'revision-app-default';

// --- BANQUE DE DONNÉES PAR DÉFAUT (BIOCHIMIE STRUCTURALE) ---
const DEFAULT_BIOCHIMIE_QUESTIONS = [
  "[Protéines]\n1- Une protéine d'intérêt est réduite, dérivée puis elle est hydrolysée par la trypsine. Les peptides obtenus sont analysés par MALDI-TOF. Expliquez les différents traitements réalisés et pourquoi ils sont réalisés. Donner les critères importants pour l'identification de cette protéine dans les banques de données via les m/z obtenus en MALDI-TOF.",
  "[Protéines]\n2- Quelles méthodes permettent l'identification de l'acide aminé de l'extrémité N-terminale d'une protéine ? Idem pour l'extrémité C-terminale? Les décrire.",
  "[Protéines]\n3- Décrire le principe de l'HPLC-ESI-TSQ (triple quadripôle) en modes MS et MS/MS. Représentez sur un tripeptide de votre choix les différents ions attendus. Expliquez la formation des ions y et b. Décrire la structure et l'utilité des ions immonium.",
  "[Protéines]\n4- Expliquez pourquoi marquer les extrémités N- ou C-terminales de peptides (N-Acétylation ou O-Méthylation), avant de les séquencer par HPLC-ESI-TSQ, peut aider à l'interprétation manuelle des ions y et b sur les spectres.",
  "[Protéines]\n5- Séquençage de peptides par la méthode d'Edman, description des différentes étapes, limitations.",
  "[Protéines]\n6- Combinaisons d'hydrolyses enzymatiques ou hydrolyse complète en milieu acide d'une protéine pure : intérêts et limites des deux approches.",
  "[Protéines]\n7- Avant son identification, une protéine peut être séparée sur PAGE, SDS-PAGE, ou électrophorèse 2D : principes généraux et avantages/inconvénients de chacune de ces séparations.",
  "[Protéines]\n8- Définir ce qu'est un massif isotopique en spectrométrie de masse. Comment déterminer la charge des ions à partir d'un tel massif isotopique? Donner le calcul pour retrouver la masse d'un peptide à partir d'un ion de m/z chargé 2 fois.",
  "[Glucides]\n9- Décrire les différentes méthodes qui permettent la détermination de la composition osidique d'un polysaccharide.",
  "[Glucides]\n10- Clivage (hydrolyse totale et partielle) de la liaison osidique et cas particuliers: expliquez. Dérivation TMS ou réduction et acétylation pour analyse en GC-MS, expliquez les différences sur le chromatogramme en justifiant.",
  "[Glucides]\n11- Détermination du mode d'enchaînement d'un oligosaccharide à l'aide de dérivations chimiques.",
  "[Glucides]\n12- Méthodes de détermination de la série et de l'anomérie des oses dans un oligosaccharide.",
  "[Glucides / RMN]\n13- Donnez la définition du pouvoir réducteur d'un ose. Représentez un D-glucopyranose dans l'espace et dessiner le spectre 1H-RMN attendu dans la zone des protons anomériques.",
  "[Lipides]\n14- Proposez des protocoles permettant la séparation d'une fraction lipidique contenant des phospholipides, cholestérol, triglycérides. Justifiez les critères de séparation des différents lipides.",
  "[Lipides]\n15- Représentez les différentes classes de lipides contenant des acides gras. Quelles caractéristiques permettront leur séparation et analyse (fonctions chimiques présentes)?",
  "[Glycolipides]\n16- Proposez des stratégies d'analyse pour la détermination structurale complète de sphingolipides (ex : gangliosides).",
  "[Lipides]\n17- Proposez des stratégies d'analyse de la composition en acides gras par GC-MS à partir de différents lipides (à partir de phospholipides, sphingolipides...).",
  "[Lipides]\n18- Le spectre MALDI-TOF d'une fraction de phosphatidylcholines isolée de jaune d'œuf de poule montre des ions de m/z différents. Schématisez le spectre de masse attendu. En fonction de la partie variable des phosphatidylcholines, expliquez les différences de m/z observées pour les différents ions.",
  "[Lipides]\n19- Détaillez le protocole permettant de déterminer qualitativement et quantitativement la présence de cholestérol dans du jaune d'œuf, par exemple.",
  "[Acides Nucléiques]\n20- Ecrire la structure chimique développée du dinucléotide suivant: pdApdC. Nommer les fonctions chimiques présentes dans la molécule. Quelles liaisons faibles peuvent se former entre les bases azotées ? Les visualiser sur la structure et expliquer pourquoi elles se formaient.",
  "[Acides Nucléiques]\n21- Ecrire la structure chimique développée du dinucléotide suivant: pdTpdG. Nommer les fonctions chimiques présentes dans la molécule. Quelles liaisons faibles peuvent se former entre les bases azotées ? Les visualiser sur la structure et expliquer pourquoi elles se porteraient.",
  "[Acides Nucléiques]\n22- Séquençage chimique de l'ADN selon Maxam et Gilbert: décrire les 4 modifications chimiques spécifiques de l'ADN. Comment l'ADN modifié chimiquement est-il coupé ?",
  "[Acides Nucléiques]\n23- Expliquer comment fonctionne un foot-print à la DNAse I et quelles informations il peut apporter."
];

const DEFAULT_CORRECTIONS = {
  "1": "Réduction par le DTT pour rompre les ponts disulfures, puis alkylation (iodoacétamide) pour stabiliser et empêcher le réappariement. Hydrolyse trypsique ciblée en C-terminal des résidus Lysine et Arginine. En MALDI-TOF, l'ionisation douce génère des ions mono-charges m/z (masse/charge). L'identification repose sur l'empreinte massique des peptides (PMF) et la recherche en banques de données protéiques via la couverture de séquence.",
  "2": "Identification N-terminale : Utilisation du réactif de Sanger (F-DNP), de la dégradation d'Edman, ou de marqueurs fluorescents (DNS-Cl) couplés à une hydrolyse acide ménagée. Identification C-terminale : Utilisation enzymatique de carboxypeptidases spécifiques (A, B ou Y) qui libèrent les acides aminés un par un par l'extrémité libre, ou méthodes chimiques comme l'hydrazinolyse.",
  "3": "L'HPLC-ESI-TSQ utilise l'ionisation électrospray (ESI) pour transférer les peptides en phase gazeuse. Le premier quadripôle (Q1) sélectionne l'ion parent, Q2 sert de cellule de collision (fragmentation CID), et Q3 analyse les fragments obtenus. Les séries d'ions b possèdent la charge portée sur l'extrémité N-terminale, tandis que les ions y ont la charge sur l'extrémité C-terminale. Les ions immonium sont des fragments internes caractéristiques permettant d'identifier la présence de certains acides aminés spécifiques.",
  "4": "Le blocage chimique des extrémités (par N-acétylation ou O-méthylation) permet de fixer un décalage de masse univoque et connu sur l'extrémité modifiée. Cela évite toute ambiguïté lors de l'interprétation manuelle ou automatique des séries de fragments b et y sur les spectres de fragmentation MS/MS.",
  "5": "La dégradation d'Edman se déroule en 3 étapes cycliques : 1) Couplage du PITC (phénylisothiocyanate) sur l'amine N-terminale en milieu basique. 2) Clivage sélectif en milieu acide doux pour libérer une thiazolinone convertie en dérivé PTH-acide aminé stable. 3) Identification par chromatographie (HPLC). Limitations : le rendement n'est jamais de 100%, ce qui limite la lecture aux ~50 premiers résidus.",
  "6": "L'hydrolyse acide totale (HCl 6M à 110°C) permet de quantifier précisément la composition globale en acides aminés d'une protéine, mais elle détruit certains résidus (comme le tryptophane) et supprime l'ordre de la séquence. L'hydrolyse enzymatique partielle conserve des peptides chevauchants indispensables pour reconstituer l'ordre, mais peut présenter des sites résistants ou incomplets.",
  "7": "PAGE native : sépare selon la charge, la taille et la conformation tridimensionnelle tout en préservant l'activité biologique. SDS-PAGE : utilise un détergent anionique (SDS) pour conférer une charge globale proportionnelle à la masse et rompre les structures, séparant uniquement selon le poids moléculaire. Électrophorèse 2D : combine la focalisation isoélectrique (séparation par point isoélectrique pI en dimension 1) et la SDS-PAGE (dimension 2) pour une résolution maximale des mélanges complexes.",
  "8": "Un massif isotopique correspond à l'enveloppe de pics de masses observée en spectrométrie de masse en raison de l'existence naturelle d'isotopes (notamment le carbone 13). La charge z des ions se calcule directement à partir de l'inverse de l'écart m/z entre deux pics isotopiques adjacents (delta m/z = 1/z). La masse moléculaire s'obtient ensuite par la formule : M = (m/z * z) - (z * masse du proton).",
  "9": "La détermination de la composition osidique repose sur une hydrolyse acide totale (par exemple au TFA) pour libérer l'ensemble des monomères osidiques constitutifs du polysaccharide, suivie d'une analyse qualitative et quantitative par chromatographie (CLHP, chromatographie échange d'ions ou chromatographie en phase gaz après dérivation).",
  "10": "L'hydrolyse acide partielle cible préférentiellement les liaisons osidiques les plus labiles (notamment les liaisons furanosidiques). La réduction ultérieure par le borohydrure de sodium (NaBH4 ou NaBD4) convertit les oses réduits en alditols symétriques, ce qui supprime le dédoublement des signaux anomériques (formes alpha et beta) et simplifie nettement l'analyse chromatographique en GC-MS.",
  "11": "La stratégie repose sur la perméthylation exhaustive de tous les groupements hydroxyle libres du polysaccharide, suivie d'une hydrolyse, d'une réduction et d'une acétylation. On obtient ainsi des acétates d'alditols partiellement méthylés (PMAA) dont l'analyse fine en GC-MS permet d'identifier précisément quels carbones étaient engagés dans les liaisons glycosidiques.",
  "12": "La détermination de la série (D ou L) s'effectue par des méthodes enzymatiques stéréospécifiques ou par polarimétrie. La détermination de l'anomérie (alpha ou beta) s'appuie principalement sur la RMN du proton (analyse des constantes de couplage J1,2 de l'hydrogène anomérique) ou sur l'emploi d'exoglycosidases spécifiques.",
  "13": "Le pouvoir réducteur d'un ose est conféré par la présence d'un carbone anomérique libre sous forme de fonction hémiacétalique (ou semi-acétalique). Dans l'espace, le D-glucopyranose adopte une conformation chaise stable (principalement la conformation 4C1). En RMN 1H, la zone des protons anomériques (vers 4.5 à 5.5 ppm) présente deux signaux distincts correspondant aux diastéréoisomères alpha et beta.",
  "14": "La séparation de mélanges lipidiques complexes s'effectue par chromatographie sur colonne de gel de silice ou par chromatographie sur couche mince (CCM). Le critère fondamental de séparation est la polarité croissante des molécules : les esters de cholestérol et triglycérides (apolipides) migrent rapidement, suivis du cholestérol libre, tandis que les phospholipides, hautement polaires, restent fortement retenus.",
  "15": "Les principales classes incluent les triglycérides (lipides de réserve), les glycérophospholipides et les sphingolipides (lipides membranaires). Leur séparation et analyse exploitent la longueur de leurs chaînes acyle, le nombre et la géométrie de leurs insaturations (ex: chromatographie sur argenture) ainsi que la polarité de leurs têtes polaires respectives.",
  "16": "Les sphingolipides résistent aux conditions d'une hydrolyse alcaline douce (qui, en revanche, clive les liaisons ester des glycérolipides). Cette stabilité permet d'isoler la base céramide/sphingoïde d'une part et la partie osidique d'autre part, afin de mener des analyses structurales séparées par GC-MS et spectroscopie RMN.",
  "17": "L'analyse des acides gras nécessite une étape préalable de transestérification ou de saponification-méthylation afin de transformer les acides gras liés en esters méthyliques d'acides gras (FAME). Ceux-ci sont ensuite injectés sur une colonne capillaire en phase gazeuse couplée à la spectrométrie de masse (GC-MS) pour une identification précise de chaque acide gras.",
  "18": "Le spectre MALDI-TOF d'une fraction de phosphatidylcholines isolée de jaune d'œuf de poule montre des ions de m/z différents. Schématisez le spectre de masse attendu. En fonction de la partie variable des phosphatidylcholines, expliquez les différences de m/z observées pour les différents ions.",
  "19": "L'analyse qualitative et quantitative du cholestérol implique une extraction initiale par solvant organique (méthode de Folch ou Bligh & Dyer), une saponification pour saponifier les graisses interférentes, une dérivation par silylation (formation d'un éther triméthylsilylique - TMS pour volatilisations) et une quantification finale par chromatographie en phase gazeuse (GC) avec étalon interne.",
  "20": "Le dinucléotide pdApdC est formé par l'union d'un désoxyadénylate et d'un désoxycytidylate via une liaison phosphodiester orientée 3'-5'. Les fonctions chimiques présentes sont des groupes phosphate, des groupements hydroxyle, des fonctions amine exocycliques et des hétérocycles purique (adénine) et pyrimidique (cytosine). Les bases peuvent établir des liaisons faibles de type ponts hydrogène stabilisants selon le modèle de Watson-Crick avec un brin complémentaire.",
  "21": "Le dinucléotide pdTpdG associe une thymidine et une désoxyguanosine par une liaison phosphodiester 3'-5'. Les fonctions chimiques incluent des groupements phosphate, des fonctions alcool, ainsi que des groupements carbonyle et amine sur les bases. Des liaisons faibles par ponts hydrogène s'y établissent pour assurer l'appariement spécifique avec la cytosine et l'adénine.",
  "22": "Le séquençage chimique de l'ADN selon Maxam et Gilbert repose sur 4 réactions chimiques spécifiques modifiant ou détruisant sélectivement certaines bases azotées (G, A+G, C, C+T) à l'aide de réactifs comme le DMS (diméthylsulfate) ou l'hydrazine. L'ADN ainsi modifié subit ensuite un traitement à la pipéridine chaude qui provoque la coupure quantitative du squelette phosphodiester au niveau exact des nucléotides modifiés.",
  "23": "Le foot-printing à la DNase I est une technique d'empreinte permettant d'identifier le site de liaison d'une protéine (facteur de transcription) sur un fragment d'ADN. La fixation de la protéine protège stériquement la région ciblée contre l'action de coupure de l'enzyme DNase I. Après migration sur gel d'acrylamide, la zone protégée se manifeste par l'absence de bandes (un trou ou empreinte), révélant la position exacte de la séquence reconnue."
};

const DEFAULT_USER_DATA = {
  active_subject: "Biochimie Structurale",
  global_todo: [
    { task: "Réviser les questions de Biochimie (1 à 8)", done: false },
    { task: "Préparer l'examen de la semaine prochaine", done: true }
  ],
  global_notes: "Priorité cette semaine : bien réviser la méthode MALDI-TOF et le séquençage par dégradation d'Edman.",
  global_agenda: [
    {
      id: 'ev-1',
      date: new Date().toLocaleDateString('fr-FR'),
      day: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][new Date().getDay()],
      time: "08:00 - 10:00",
      title: "[Biochimie Structurale] Cours de Protéines",
      color: "#38BDF8",
      textcolor: "#0F172A"
    }
  ],
  subjects: {
    "Biochimie Structurale": {
      revision_pool: DEFAULT_BIOCHIMIE_QUESTIONS,
      redaction_pool: DEFAULT_BIOCHIMIE_QUESTIONS,
      corrections: DEFAULT_CORRECTIONS,
      custom_questions: [],
      custom_corrections: {},
      current_exercise: null,
      progress: {},
      course_files: [
        {
          id: 'c1',
          title: "Chapitre 1 - Structure des Protéines & Spectrométrie",
          content: "Résumé rapide : La spectrométrie MALDI-TOF permet de déterminer l'empreinte massique des peptides (PMF). Ne pas oublier la réduction préalable par DTT et l'alkylation à l'iodoacétamide."
        }
      ]
    }
  }
};

const COLOR_OPTIONS = [
  { name: "Bleu Clair", bg: "#38BDF8", text: "#0F172A" },
  { name: "Vert Menthe", bg: "#4ADE80", text: "#0F172A" },
  { name: "Jaune Solaire", bg: "#FACC15", text: "#0F172A" },
  { name: "Rouge Corail", bg: "#F87171", text: "#FFFFFF" },
  { name: "Violet Doux", bg: "#C084FC", text: "#FFFFFF" },
  { name: "Orange Chaud", bg: "#FB923C", text: "#FFFFFF" }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ username: '', password: '', isRegister: false });
  const [authError, setAuthError] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vues de l'application
  const [currentView, setCurrentView] = useState('main'); // main, exercise, corrections, postit, courses, course_reader, manage_q, add_q
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [postitMode, setPostitMode] = useState('reviser');
  const [currentPostitIndex, setCurrentPostitIndex] = useState(0);

  // États additionnels
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // Modales
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showImportICSModal, setShowImportICSModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', dateStart: new Date().toISOString().split('T')[0], dateEnd: new Date().toISOString().split('T')[0],
    startTime: '08:00', endTime: '09:00', color: '#38BDF8', textcolor: '#0F172A', subject: ''
  });
  const [newSubjectName, setNewSubjectName] = useState('');
  const [icsInput, setIcsInput] = useState('');

  // Formulaire d'ajout de question
  const [newQData, setNewQData] = useState({ title: '', correction: '' });
  const [editQData, setEditQData] = useState(null);

  // Horloge en temps réel
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('fr-FR'));
      setDateStr(now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auth Firebase Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Synchronisation Firestore
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      } else {
        // Premier accès : initialisation
        setDoc(userDocRef, DEFAULT_USER_DATA);
        setUserData(DEFAULT_USER_DATA);
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Sauvegarde globale vers Firestore
  const saveUserData = async (newData) => {
    setUserData(newData);
    if (!user) return;
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await setDoc(userDocRef, newData, { merge: true });
    } catch (err) {
      console.error("Erreur de sauvegarde:", err);
    }
  };

  // --- ACTIONS UTILS ---
  const activeSubject = userData?.active_subject || "Biochimie Structurale";
  const currentSubjData = userData?.subjects?.[activeSubject] || {
    revision_pool: [], redaction_pool: [], corrections: {}, custom_questions: [], custom_corrections: {}, course_files: []
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authForm.username || !authForm.password) {
      setAuthError("Veuillez remplir tous les champs.");
      return;
    }
    // Simulation d'authentification basée sur Firebase Anonymous avec profil stocké
    setAuthError("");
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const updated = {
      ...userData,
      global_todo: [...(userData.global_todo || []), { task: newTodoText.trim(), done: false }]
    };
    saveUserData(updated);
    setNewTodoText('');
  };

  const toggleTodo = (index) => {
    const newTodos = [...(userData.global_todo || [])];
    newTodos[index].done = !newTodos[index].done;
    saveUserData({ ...userData, global_todo: newTodos });
  };

  const deleteTodo = (index) => {
    const newTodos = (userData.global_todo || []).filter((_, i) => i !== index);
    saveUserData({ ...userData, global_todo: newTodos });
  };

  const handleSaveNotes = (text) => {
    saveUserData({ ...userData, global_notes: text });
  };

  const handleSelectSubject = (subjName) => {
    saveUserData({ ...userData, active_subject: subjName });
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const name = newSubjectName.trim();
    if (userData.subjects[name]) return;

    const newSubjects = {
      ...userData.subjects,
      [name]: {
        revision_pool: [],
        redaction_pool: [],
        corrections: {},
        custom_questions: [],
        custom_corrections: {},
        current_exercise: null,
        progress: {},
        course_files: []
      }
    };
    saveUserData({
      ...userData,
      subjects: newSubjects,
      active_subject: name
    });
    setNewSubjectName('');
    setShowAddSubjectModal(false);
  };

  const handleDeleteSubject = (subjName) => {
    const keys = Object.keys(userData.subjects);
    if (keys.length <= 1) {
      alert("Vous devez conserver au moins une matière.");
      return;
    }
    const newSubjs = { ...userData.subjects };
    delete newSubjs[subjName];
    const newActive = Object.keys(newSubjs)[0];
    saveUserData({ ...userData, subjects: newSubjs, active_subject: newActive });
  };

  const handleGenerateExercise = () => {
    const pool = activeSubject === "Biochimie Structurale" 
      ? currentSubjData.revision_pool 
      : currentSubjData.custom_questions;

    if (!pool || pool.length === 0) {
      alert("Aucune question disponible dans cette matière.");
      return;
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(5, pool.length));

    const updatedSubjs = {
      ...userData.subjects,
      [activeSubject]: {
        ...currentSubjData,
        current_exercise: selected
      }
    };
    saveUserData({ ...userData, subjects: updatedSubjs });
    setCurrentView('exercise');
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.dateStart) return;
    
    const dStart = new Date(newEvent.dateStart);
    const dEnd = new Date(newEvent.dateEnd || newEvent.dateStart);

    const newEvents = [...(userData.global_agenda || [])];

    let curr = new Date(dStart);
    while (curr <= dEnd) {
      const dateFormatted = curr.toLocaleDateString('fr-FR');
      const dayName = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][curr.getDay()];
      const isPartiel = /partiel/i.test(newEvent.title);

      newEvents.push({
        id: 'ev-' + Date.now() + Math.random(),
        date: dateFormatted,
        day: dayName,
        time: `${newEvent.startTime} - ${newEvent.endTime}`,
        title: newEvent.subject ? `[${newEvent.subject}] ${newEvent.title}` : newEvent.title,
        color: newEvent.color,
        textcolor: isPartiel ? '#FF0000' : newEvent.textcolor
      });
      curr.setDate(curr.getDate() + 1);
    }

    saveUserData({ ...userData, global_agenda: newEvents });
    setShowAddEventModal(false);
    setNewEvent({ title: '', dateStart: new Date().toISOString().split('T')[0], dateEnd: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '09:00', color: '#38BDF8', textcolor: '#0F172A', subject: '' });
  };

  const handleDeleteEvent = (id) => {
    const filtered = (userData.global_agenda || []).filter(e => e.id !== id);
    saveUserData({ ...userData, global_agenda: filtered });
  };

  const handleImportICS = () => {
    if (!icsInput.trim()) return;
    // Simulation simple de parsing iCal/ICS pour les événements Webcal/ENT
    const lines = icsInput.split('\n');
    let importedCount = 0;
    let tempEv = {};
    const newAgenda = [...(userData.global_agenda || [])];

    lines.forEach(line => {
      if (line.startsWith('SUMMARY:')) {
        tempEv.title = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DTSTART:')) {
        const val = line.replace('DTSTART:', '').trim();
        if (val.length >= 8) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          tempEv.date = `${d}/${m}/${y}`;
        }
      } else if (line.endsWith('END:VEVENT')) {
        if (tempEv.title && tempEv.date) {
          newAgenda.push({
            id: 'ics-' + Date.now() + Math.random(),
            date: tempEv.date,
            day: 'Lundi',
            time: '09:00 - 11:00',
            title: tempEv.title,
            color: '#38BDF8',
            textcolor: '#0F172A'
          });
          importedCount++;
        }
        tempEv = {};
      }
    });

    if (importedCount === 0) {
      // Si format texte simple collé
      newAgenda.push({
        id: 'ics-' + Date.now(),
        date: new Date().toLocaleDateString('fr-FR'),
        day: 'Aujourd\'hui',
        time: '08:00 - 10:00',
        title: "Agenda Importé : " + icsInput.substring(0, 30),
        color: '#0D9488',
        textcolor: '#FFFFFF'
      });
      importedCount = 1;
    }

    saveUserData({ ...userData, global_agenda: newAgenda });
    setShowImportICSModal(false);
    setIcsInput('');
    alert(`${importedCount} événement(s) importé(s) !`);
  };

  const handleAddQuestion = () => {
    if (!newQData.title.trim() || !newQData.correction.trim()) {
      alert("L'intitulé et le corrigé sont requis.");
      return;
    }

    const isBio = activeSubject === "Biochimie Structurale";
    const qList = isBio ? currentSubjData.revision_pool : currentSubjData.custom_questions;
    const qNum = String(qList.length + 1);

    const updatedSubj = { ...currentSubjData };
    if (isBio) {
      updatedSubj.revision_pool = [...updatedSubj.revision_pool, newQData.title];
      updatedSubj.redaction_pool = [...updatedSubj.redaction_pool, newQData.title];
      updatedSubj.corrections = { ...updatedSubj.corrections, [qNum]: newQData.correction };
    } else {
      updatedSubj.custom_questions = [...(updatedSubj.custom_questions || []), newQData.title];
      updatedSubj.custom_corrections = { ...(updatedSubj.custom_corrections || {}), [qNum]: newQData.correction };
    }

    saveUserData({
      ...userData,
      subjects: { ...userData.subjects, [activeSubject]: updatedSubj }
    });
    setNewQData({ title: '', correction: '' });
    setCurrentView('main');
  };

  const handleDeleteQuestion = (index) => {
    const isBio = activeSubject === "Biochimie Structurale";
    const updatedSubj = { ...currentSubjData };

    if (isBio) {
      updatedSubj.revision_pool = updatedSubj.revision_pool.filter((_, i) => i !== index);
    } else {
      updatedSubj.custom_questions = updatedSubj.custom_questions.filter((_, i) => i !== index);
    }

    saveUserData({
      ...userData,
      subjects: { ...userData.subjects, [activeSubject]: updatedSubj }
    });
  };

  // Dates pour la grille semaine
  const weekDays = useMemo(() => {
    const days = [];
    const curr = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [currentWeekStart]);

  const selectedDateStr = weekDays[selectedDayIdx]?.toLocaleDateString('fr-FR');

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-lg">Chargement de votre espace d'étude...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans flex flex-col">
      {/* BARRE SUPÉRIEURE - HORLOGE ET NAVIGATION */}
      <header className="bg-[#1E293B] border-b border-slate-700/60 px-4 py-3 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 p-2 rounded-lg text-slate-900 font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Plateforme de Révision & Agenda</h1>
            <p className="text-xs text-sky-400 font-medium">Espace : {auth.currentUser?.uid ? `Compte (${auth.currentUser.uid.substring(0, 6)})` : 'Invité'}</p>
          </div>
        </div>

        {/* Horloge & Date Temps Réel */}
        <div className="flex items-center gap-2 bg-[#0F172A] px-4 py-2 rounded-xl border border-slate-700/50 text-sm font-semibold text-sky-400">
          <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>{timeStr || '00:00:00'}</span>
          <span className="text-slate-500">|</span>
          <span className="capitalize text-slate-300">{dateStr}</span>
        </div>

        {/* Action Utilisateur */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (confirm("Voulez-vous remettre l'application comme au premier jour ?")) {
                saveUserData(DEFAULT_USER_DATA);
              }
            }}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-amber-300 text-xs px-3 py-2 rounded-lg transition"
            title="Réinitialiser l'application"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réinit.
          </button>
        </div>
      </header>

      {/* RENDER PRINCIPAL DES VUES */}
      {currentView === 'main' && (
        <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1800px] mx-auto w-full">
          
          {/* ================= COLONNE GAUCHE (TO-DO & NOTES) ================= */}
          <section className="lg:col-span-3 flex flex-col gap-5">
            {/* TO-DO LIST */}
            <div className="bg-[#FEF08A] text-slate-900 rounded-2xl p-4 shadow-lg border border-yellow-300 flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base flex items-center gap-2 text-amber-900">
                  <CheckSquare className="w-5 h-5 text-amber-800" /> To-Do List (Jour)
                </h2>
                <span className="text-xs bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                  {(userData.global_todo || []).filter(t => !t.done).length} restantes
                </span>
              </div>

              <div className="flex gap-2 mb-3">
                <input 
                  type="text"
                  placeholder="Nouvelle tâche..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                  className="flex-1 bg-yellow-50 text-slate-900 text-sm px-3 py-1.5 rounded-lg border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <button 
                  onClick={handleAddTodo}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {(userData.global_todo || []).map((todo, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-yellow-100/90 p-2 rounded-lg text-sm border border-yellow-200">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 pr-2">
                      <input 
                        type="checkbox" 
                        checked={todo.done} 
                        onChange={() => toggleTodo(idx)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className={todo.done ? "line-through text-slate-400" : "text-slate-800 font-medium"}>
                        {todo.task}
                      </span>
                    </label>
                    <button onClick={() => deleteTodo(idx)} className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PENSE-BÊTE / NOTES */}
            <div className="bg-[#FEF08A] text-slate-900 rounded-2xl p-4 shadow-lg border border-yellow-300 flex flex-col flex-1 min-h-[250px]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-base flex items-center gap-2 text-amber-900">
                  <Edit3 className="w-5 h-5 text-amber-800" /> Pense-bête / Notes
                </h2>
                <button 
                  onClick={() => handleSaveNotes('')}
                  className="text-xs text-red-700 hover:underline font-semibold"
                >
                  Vider
                </button>
              </div>
              <textarea 
                value={userData.global_notes || ''}
                onChange={(e) => handleSaveNotes(e.target.value)}
                placeholder="Écrivez vos notes ici (sauvegarde automatique)..."
                className="w-full flex-1 bg-yellow-50 text-slate-900 text-sm p-3 rounded-lg border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none font-sans"
              />
            </div>
          </section>

          {/* ================= COLONNE CENTRALE (MENU DE RÉVISION) ================= */}
          <section className="lg:col-span-5 bg-[#1E293B] rounded-2xl p-5 shadow-lg border border-slate-700/60 flex flex-col gap-4">
            
            {/* Sélection de la Matière */}
            <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Matière Active :
              </label>
              <div className="flex gap-2">
                <select 
                  value={activeSubject}
                  onChange={(e) => handleSelectSubject(e.target.value)}
                  className="flex-1 bg-[#1E293B] text-white font-semibold text-sm px-3 py-2.5 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {Object.keys(userData.subjects || {}).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowAddSubjectModal(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm px-3 py-2.5 rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Nouvelle
                </button>
              </div>
            </div>

            {/* Reprendre Exercice en cours */}
            {currentSubjData.current_exercise && (
              <button 
                onClick={() => setCurrentView('exercise')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 animate-bounce"
              >
                <Play className="w-5 h-5" /> Reprendre l'exercice en cours
              </button>
            )}

            {/* Boutons d'actions principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {activeSubject === "Biochimie Structurale" && (
                <>
                  <button 
                    onClick={() => { setPostitMode('reviser'); setCurrentPostitIndex(0); setCurrentView('postit'); }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl shadow transition flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <BookOpen className="w-6 h-6" /> Mode Révision (Flashcards)
                  </button>
                  <button 
                    onClick={() => { setPostitMode('rediger'); setCurrentPostitIndex(0); setCurrentView('postit'); }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold p-4 rounded-xl shadow transition flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <Edit3 className="w-6 h-6" /> Mode Rédaction (Test)
                  </button>
                </>
              )}

              <button 
                onClick={handleGenerateExercise}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold p-4 rounded-xl shadow transition flex flex-col items-center justify-center gap-2 text-center sm:col-span-2"
              >
                <FileText className="w-6 h-6" /> Générer un Exercice (5 Questions Aléatoires)
              </button>

              <button 
                onClick={() => setCurrentView('corrections')}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold p-4 rounded-xl shadow transition flex flex-col items-center justify-center gap-2 text-center"
              >
                <CheckCircle className="w-6 h-6" /> Corrigés Officiels
              </button>

              <button 
                onClick={() => setCurrentView('courses')}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold p-4 rounded-xl shadow transition flex flex-col items-center justify-center gap-2 text-center"
              >
                <BookOpen className="w-6 h-6" /> Dépôt & Lecteur de Cours
              </button>
            </div>

            {/* Boutons de Gestion des Questions */}
            <div className="border-t border-slate-700/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button 
                onClick={() => setCurrentView('add_q')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter Question / Corrigé
              </button>
              <button 
                onClick={() => setCurrentView('manage_q')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Gérer / Supprimer Questions
              </button>
              {activeSubject !== "Biochimie Structurale" && (
                <button 
                  onClick={() => handleDeleteSubject(activeSubject)}
                  className="bg-red-950/40 hover:bg-red-900/60 text-red-300 font-medium text-xs py-2 px-3 rounded-lg transition sm:col-span-2 flex items-center justify-center gap-1 mt-1 border border-red-800/40"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer la matière {activeSubject}
                </button>
              )}
            </div>
          </section>

          {/* ================= COLONNE DROITE (AGENDA SYNCHRONISÉ) ================= */}
          <section className="lg:col-span-4 bg-[#0F172A] rounded-2xl p-4 shadow-lg border border-slate-700/60 flex flex-col gap-4">
            
            {/* Header Agenda */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h2 className="font-bold text-base flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-sky-400" /> Agenda & Partiels
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddEventModal(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Événement
                </button>
                <button 
                  onClick={() => setShowImportICSModal(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Import ICS
                </button>
              </div>
            </div>

            {/* 1. VUE JOUR PAR HEURE */}
            <div className="bg-[#1E293B] rounded-xl p-3 border border-slate-700/50 flex flex-col h-[220px]">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => setSelectedDayIdx(prev => (prev === 0 ? 6 : prev - 1))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-sky-400">
                  {['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][selectedDayIdx]} ({selectedDateStr})
                </span>
                <button 
                  onClick={() => setSelectedDayIdx(prev => (prev === 6 ? 0 : prev + 1))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {(() => {
                  const evsForDay = (userData.global_agenda || []).filter(e => e.date === selectedDateStr);
                  if (evsForDay.length === 0) {
                    return <p className="text-xs text-slate-500 italic text-center py-6">Aucun événement ce jour-ci.</p>;
                  }
                  return evsForDay.map((ev) => (
                    <div 
                      key={ev.id} 
                      className="p-2 rounded-lg text-xs flex items-center justify-between font-semibold shadow-sm"
                      style={{ backgroundColor: ev.color || '#38BDF8', color: ev.textcolor || '#0F172A' }}
                    >
                      <div>
                        <div className="font-bold">{ev.title}</div>
                        <div className="text-[10px] opacity-80">{ev.time}</div>
                      </div>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="opacity-70 hover:opacity-100 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* 2. CALENDRIER DU MOIS INTERACTIF */}
            <div className="bg-[#1E293B] rounded-xl p-3 border border-slate-700/50 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-200 capitalize">
                  {calendarViewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grille du Mois */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['L','M','M','J','V','S','D'].map((d, i) => (
                  <div key={i} className="text-[10px] font-bold text-sky-400 py-1">{d}</div>
                ))}
                {(() => {
                  const year = calendarViewDate.getFullYear();
                  const month = calendarViewDate.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const offset = firstDay === 0 ? 6 : firstDay - 1;
                  const daysInMonth = new Date(year, month + 1, 0).getDate();

                  const cells = [];
                  for (let i = 0; i < offset; i++) {
                    cells.push(<div key={`empty-${i}`} className="h-7"></div>);
                  }
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateFmt = new Date(year, month, day).toLocaleDateString('fr-FR');
                    const evs = (userData.global_agenda || []).filter(e => e.date === dateFmt);
                    const hasEv = evs.length > 0;

                    cells.push(
                      <button
                        key={day}
                        onClick={() => {
                          const targetDate = new Date(year, month, day);
                          const dayNum = targetDate.getDay();
                          setSelectedDayIdx(dayNum === 0 ? 6 : dayNum - 1);
                        }}
                        className={`h-7 rounded text-xs font-bold flex flex-col items-center justify-center relative transition ${
                          hasEv ? 'bg-sky-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {day}
                        {hasEv && (
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 absolute bottom-0.5"></span>
                        )}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>

            {/* 3. GRILLE SEMAINE COMPACTE */}
            <div className="bg-[#1E293B] rounded-xl p-3 border border-slate-700/50 flex-1 overflow-x-auto">
              <div className="text-xs font-bold text-slate-400 mb-2">Grille Semaine Active</div>
              <div className="grid grid-cols-7 gap-1 min-w-[300px]">
                {weekDays.map((d, i) => {
                  const dateFmt = d.toLocaleDateString('fr-FR');
                  const count = (userData.global_agenda || []).filter(e => e.date === dateFmt).length;
                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedDayIdx(i)}
                      className={`p-2 rounded text-center cursor-pointer border ${
                        selectedDayIdx === i ? 'border-sky-400 bg-sky-950/60' : 'border-slate-700 bg-[#0F172A]'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-400">
                        {['L','M','M','J','V','S','D'][i]}
                      </div>
                      <div className="text-xs font-bold text-slate-200">{d.getDate()}</div>
                      {count > 0 && (
                        <div className="text-[9px] font-bold text-sky-400 mt-1">{count} év.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </section>
        </main>
      )}

      {/* ================= VUE EXERCICE ================= */}
      {currentView === 'exercise' && (
        <div className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#1E293B] p-4 rounded-xl border border-slate-700">
            <h2 className="text-lg font-bold text-white">Session d'Exercice - {activeSubject}</h2>
            <button 
              onClick={() => setCurrentView('main')}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg"
            >
              Retour Menu
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {(currentSubjData.current_exercise || []).map((qText, idx) => (
              <div key={idx} className="bg-[#1E293B] p-5 rounded-xl border border-slate-700 space-y-3">
                <h3 className="font-bold text-sky-400 text-sm">Question {idx + 1}</h3>
                <p className="text-slate-100 text-base leading-relaxed whitespace-pre-line">{qText}</p>
                <textarea 
                  placeholder="Écrivez votre brouillon de réponse ici..."
                  className="w-full h-24 bg-[#0F172A] text-slate-200 text-sm p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              const updatedSubj = { ...currentSubjData, current_exercise: null };
              saveUserData({ ...userData, subjects: { ...userData.subjects, [activeSubject]: updatedSubj } });
              setCurrentView('corrections');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition"
          >
            Terminer & Voir le Corrigé Officiel
          </button>
        </div>
      )}

      {/* ================= VUE FLASHCARDS / POST-IT (RÉVISION & RÉDACTION) ================= */}
      {currentView === 'postit' && (
        <div className="max-w-2xl mx-auto w-full p-4 flex-1 flex flex-col justify-center items-center">
          {(() => {
            const pool = postitMode === 'reviser' ? currentSubjData.revision_pool : currentSubjData.redaction_pool;
            if (!pool || pool.length === 0) {
              return (
                <div className="bg-[#1E293B] p-8 rounded-2xl text-center border border-slate-700 space-y-4">
                  <h2 className="text-xl font-bold text-white">Toutes les questions ont été traitées !</h2>
                  <button 
                    onClick={() => {
                      const updatedSubj = { ...currentSubjData, redaction_pool: [...currentSubjData.revision_pool] };
                      saveUserData({ ...userData, subjects: { ...userData.subjects, [activeSubject]: updatedSubj } });
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl"
                  >
                    Réinitialiser la Banque
                  </button>
                  <button onClick={() => setCurrentView('main')} className="block mx-auto text-slate-400 text-sm">
                    Retour Menu
                  </button>
                </div>
              );
            }

            const qText = pool[currentPostitIndex % pool.length];

            return (
              <div className="w-full bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-6">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-700 pb-3">
                  <span>{postitMode === 'reviser' ? 'MODE RÉVISION' : 'MODE RÉDACTION'}</span>
                  <span>Restantes : {pool.length}</span>
                </div>

                <div className="bg-[#0F172A] p-6 rounded-xl border border-slate-800 text-slate-100 text-base leading-relaxed whitespace-pre-line min-h-[160px] flex items-center">
                  {qText}
                </div>

                <div className="space-y-3">
                  <p className="text-center text-xs font-semibold text-slate-300">Connaissiez-vous la réponse ?</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        if (postitMode === 'rediger') {
                          const newPool = pool.filter((_, i) => i !== (currentPostitIndex % pool.length));
                          saveUserData({
                            ...userData,
                            subjects: { ...userData.subjects, [activeSubject]: { ...currentSubjData, redaction_pool: newPool } }
                          });
                        }
                        setCurrentPostitIndex(prev => prev + 1);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition"
                    >
                      OUI (Validé)
                    </button>
                    <button 
                      onClick={() => setCurrentPostitIndex(prev => prev + 1)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition"
                    >
                      NON (À revoir)
                    </button>
                  </div>
                </div>

                <button onClick={() => setCurrentView('main')} className="text-xs text-center text-slate-400 hover:underline">
                  Quitter la session
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ================= VUE CORRIGÉS ================= */}
      {currentView === 'corrections' && (
        <div className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#1E293B] p-4 rounded-xl border border-slate-700">
            <h2 className="text-lg font-bold text-white">Corrigés Officiels - {activeSubject}</h2>
            <button 
              onClick={() => setCurrentView('main')}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg"
            >
              Retour Menu
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {Object.entries(currentSubjData.corrections || {}).map(([qNum, corrText]) => (
              <div key={qNum} className="bg-[#1E293B] p-4 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-4 h-4" /> Corrigé Question #{qNum}
                </div>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-[#0F172A] p-3 rounded-lg border border-slate-800">
                  {corrText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VUE COURS ================= */}
      {currentView === 'courses' && (
        <div className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#1E293B] p-4 rounded-xl border border-slate-700">
            <h2 className="text-lg font-bold text-white">Dépôt & Notes de Cours - {activeSubject}</h2>
            <button onClick={() => setCurrentView('main')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg">
              Retour Menu
            </button>
          </div>

          <div className="space-y-3">
            {(currentSubjData.course_files || []).map((c) => (
              <div key={c.id} className="bg-[#1E293B] p-4 rounded-xl border border-slate-700 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sky-400 text-base">{c.title}</h3>
                  <p className="text-slate-300 text-sm mt-1 line-clamp-2">{c.content}</p>
                </div>
                <button 
                  onClick={() => { setSelectedCourse(c); setCurrentView('course_reader'); }}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Lire
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VUE LECTEUR DE COURS ================= */}
      {currentView === 'course_reader' && selectedCourse && (
        <div className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#1E293B] p-4 rounded-xl border border-slate-700">
            <h2 className="text-lg font-bold text-sky-400">{selectedCourse.title}</h2>
            <button onClick={() => setCurrentView('courses')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg">
              Retour Cours
            </button>
          </div>

          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 space-y-4 flex-1">
            <h3 className="font-bold text-amber-400 text-sm">Contenu & Notes :</h3>
            <div className="bg-[#0F172A] p-4 rounded-xl text-slate-100 text-base leading-relaxed whitespace-pre-line border border-slate-800">
              {selectedCourse.content}
            </div>
          </div>
        </div>
      )}

      {/* ================= VUE AJOUT QUESTION ================= */}
      {currentView === 'add_q' && (
        <div className="max-w-xl mx-auto w-full p-4 flex-1 flex flex-col justify-center">
          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-white">Ajouter une Question ({activeSubject})</h2>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Intitulé de la question :</label>
              <textarea 
                value={newQData.title}
                onChange={(e) => setNewQData({ ...newQData, title: e.target.value })}
                className="w-full h-24 bg-[#0F172A] text-slate-200 text-sm p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Entrez votre question..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Corrigé officiel :</label>
              <textarea 
                value={newQData.correction}
                onChange={(e) => setNewQData({ ...newQData, correction: e.target.value })}
                className="w-full h-24 bg-[#0F172A] text-slate-200 text-sm p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Entrez la solution détaillée..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddQuestion} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl">
                Enregistrer
              </button>
              <button onClick={() => setCurrentView('main')} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-xl">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VUE GESTION QUESTIONS ================= */}
      {currentView === 'manage_q' && (
        <div className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#1E293B] p-4 rounded-xl border border-slate-700">
            <h2 className="text-lg font-bold text-white">Gestion des Questions - {activeSubject}</h2>
            <button onClick={() => setCurrentView('main')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg">
              Retour Menu
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {((activeSubject === "Biochimie Structurale" ? currentSubjData.revision_pool : currentSubjData.custom_questions) || []).map((q, idx) => (
              <div key={idx} className="bg-[#1E293B] p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-200 font-medium truncate flex-1 pr-4">{q}</span>
                <button 
                  onClick={() => handleDeleteQuestion(idx)}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODALE AJOUT ÉVÉNEMENT ================= */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 max-w-md w-full space-y-4">
            <h2 className="font-bold text-lg text-white">Ajouter un Événement Agenda</h2>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Intitulé :</label>
              <input 
                type="text" 
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full bg-[#0F172A] text-white text-sm p-2.5 rounded-lg border border-slate-700"
                placeholder="Ex: Partiel de Chimie"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Date Début :</label>
                <input 
                  type="date" 
                  value={newEvent.dateStart}
                  onChange={(e) => setNewEvent({ ...newEvent, dateStart: e.target.value })}
                  className="w-full bg-[#0F172A] text-white text-sm p-2 rounded-lg border border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Date Fin :</label>
                <input 
                  type="date" 
                  value={newEvent.dateEnd}
                  onChange={(e) => setNewEvent({ ...newEvent, dateEnd: e.target.value })}
                  className="w-full bg-[#0F172A] text-white text-sm p-2 rounded-lg border border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Heure Début :</label>
                <input 
                  type="time" 
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full bg-[#0F172A] text-white text-sm p-2 rounded-lg border border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Heure Fin :</label>
                <input 
                  type="time" 
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="w-full bg-[#0F172A] text-white text-sm p-2 rounded-lg border border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Couleur :</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setNewEvent({ ...newEvent, color: c.bg, textcolor: c.text })}
                    className={`w-7 h-7 rounded-full border-2 ${newEvent.color === c.bg ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.bg }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleAddEvent} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-sm">
                Ajouter
              </button>
              <button onClick={() => setShowAddEventModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-xl text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALE IMPORT ICS ================= */}
      {showImportICSModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 max-w-md w-full space-y-4">
            <h2 className="font-bold text-lg text-white">Importer un Agenda (ICS / Webcal)</h2>
            <p className="text-xs text-slate-400">Collez le contenu iCal / ICS ou le lien de votre emploi du temps universitaire :</p>

            <textarea 
              value={icsInput}
              onChange={(e) => setIcsInput(e.target.value)}
              className="w-full h-32 bg-[#0F172A] text-slate-200 text-xs p-3 rounded-lg border border-slate-700"
              placeholder="SUMMARY:Examen Biochimie..."
            />

            <div className="flex gap-3">
              <button onClick={handleImportICS} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl text-sm">
                Lancer l'import
              </button>
              <button onClick={() => setShowImportICSModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-xl text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALE CREATION MATIERE ================= */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-lg text-white">Créer une nouvelle matière</h2>
            <input 
              type="text" 
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Ex: Anatomie, Génétique..."
              className="w-full bg-[#0F172A] text-white text-sm p-3 rounded-lg border border-slate-700"
            />
            <div className="flex gap-3">
              <button onClick={handleAddSubject} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-sm">
                Créer
              </button>
              <button onClick={() => setShowAddSubjectModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-xl text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}