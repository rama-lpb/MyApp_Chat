// main.js - Fichier principal
import { newElement, loadData, saveData } from './component.js';
import { renderSidebar, openDiscussion, showDiscussionsMulti } from './discussions.js';
import { showGroupes, openGroupDiscussion } from './groups.js';
import { showAddContactForm, showArchives } from './contacts.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

// --- INITIALISATION DES DONNÉES ---
const { discussions, groupes } = loadData();

// Données par défaut si aucune sauvegarde
if (discussions.length === 0) {
  discussions.push(
    { name: "Toto", lastMsg: "Un exemple", time: "12:08", online: true, archived: false, blocked: false, messages: [
      { text: "Un exemple", time: "12:08", status: "✓" }
    ] },
    { name: "MM", lastMsg: "Mon dernier message", time: "12:09", online: true, archived: false, blocked: false, messages: [
      { text: "Mon dernier message", time: "12:09", status: "✓" }
    ] }
  );
}

// --- CSS GLOBAL ---
const style = document.createElement('style');
style.innerHTML = `
  ::-webkit-scrollbar { display: none !important; }
  * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
`;
document.head.appendChild(style);

// --- MENU GAUCHE ---
const menuItems = [
  { label: "Messages", icon: "fas fa-comments" },
  { label: "Groupes", icon: "fas fa-users" },
  { label: "Discussions", icon: "fas fa-comment-dots" },
  { label: "Archives", icon: "fas fa-archive" },
  { label: "Nouveau", icon: "fas fa-plus" }
];

const menuButtons = menuItems.map(({ label, icon }, index) => newElement("button", [
  newElement("i", "", { class: icon + " text-xl mb-1" }), 
  newElement("span", label, { class: "text-xs leading-tight" }) 
], {
  class: [
    "w-20", "h-20",
    "flex", "flex-col", "items-center", "justify-center",
    "rounded-lg", "hover:bg-yellow-400", "transition-all",
    index === 0 ? "bg-yellow-400" : "bg-white"
  ],
  title: label
}));

const menu = newElement("div", menuButtons, {
  class: [
    "w-[8%]",
    "h-full", "bg-gray-100", "p-2", "flex", "flex-col", "gap-4", "items-center", "justify-center"
  ]
});

// --- SIDEBAR ---
const sidebar = newElement("div", [], {
  class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-4"]
});

// --- CONTENU PRINCIPAL PAR DÉFAUT ---
const mainContent = newElement("div", [
  newElement("div", "Ouvrez un nouveau chat pour discuter", {
    class: "text-gray-500 text-center m-auto text-lg"
  })
], {
  class: [
    "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
    "flex", "flex-col", "items-center", "justify-center", "p-4"
  ]
});

// --- LAYOUT PRINCIPAL ---
const layout = newElement("div", [menu, sidebar, mainContent], {
  class: ["flex", "h-full", "w-full"]
});

const appWrapper = newElement("div", [layout], {
  class: [
    "shadow-none", "bg-white", "w-[95%]", "max-w-[1200px]", "h-[90vh]",
    "rounded-xl", "overflow-hidden"
  ],
  style: {
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)"
  }
});

// --- FONCTIONS DE NAVIGATION ---

function selectMenu(indexSelected) {
  menuButtons.forEach((btn, idx) => {
    btn.classList.remove("bg-yellow-400");
    btn.classList.add("bg-white");
    if (idx === indexSelected) {
      btn.classList.remove("bg-white");
      btn.classList.add("bg-yellow-400");
    }
  });
}

function showMessages() {
  renderSidebar(discussions, layout, sidebar, (discussion) => 
    openDiscussion(discussion, layout, mainContent, discussions, groupes)
  );
  layout.replaceChild(sidebar, layout.children[1]);
  layout.replaceChild(mainContent, layout.children[2]);
}

// --- ÉVÉNEMENTS DU MENU ---
menuButtons[0].addEventListener("click", () => {
  selectMenu(0);
  showMessages();
});

menuButtons[1].addEventListener("click", () => {
  selectMenu(1);
  showGroupes(groupes, discussions, layout, mainContent, (group) => 
    openGroupDiscussion(group, layout, discussions, groupes)
  );
});

menuButtons[2].addEventListener("click", () => {
  selectMenu(2);
  showDiscussionsMulti(discussions, groupes, layout);
});

menuButtons[3].addEventListener("click", () => {
  selectMenu(3);
  showArchives(discussions, layout, (discussion) => 
    openDiscussion(discussion, layout, mainContent, discussions, groupes)
  );
});

menuButtons[4].addEventListener("click", () => {
  selectMenu(4);
  showAddContactForm(discussions, groupes, layout, sidebar);
});

// --- INITIALISATION ---
const body = document.querySelector("body");
body.className = "flex items-center justify-center min-h-screen bg-white";
body.appendChild(appWrapper);

// Affichage initial
showMessages();

// Sauvegarde automatique périodique (optionnel)
setInterval(() => {
  saveData(discussions, groupes);
}, 30000); // Sauvegarde toutes les 30 secondes