import { newElement, loadData, saveData } from './component.js';
import { showDrafts } from './ges_brouillons.js';
import { renderSidebar, openDiscussion, showDiscussionsMulti, loadUserData } from './discussions.js';
import { showGroupes, openGroupDiscussion } from './groups.js';
import { showAddContactForm, showArchives } from './contacts.js';
import { authManager, showAuthScreen } from './auth.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

let discussions = [];
let groupes = [];
let currentUser = null; 
let currentOpenChat = null; // Pour tracker le chat ouvert actuellement

const style = document.createElement('style');
style.innerHTML = `
  ::-webkit-scrollbar { display: none !important; }
  * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  
  /* Bouton de fermeture de chat */
  .close-chat-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .close-chat-btn:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .close-chat-btn i {
    color: #666;
    font-size: 14px;
  }
  
  /* Notification d'actions contextuelles */
  .action-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3b82f6;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 300px;
  }
  
  .action-notification.show {
    opacity: 1;
    transform: translateX(0);
  }
  
  .action-notification.success {
    background: #10b981;
  }
  
  .action-notification.error {
    background: #ef4444;
  }
  
  .action-notification.info {
    background: #3b82f6;
  }
`;
document.head.appendChild(style);

const menuItems = [
  { label: "Messages", icon: "fas fa-comments" },
  { label: "Groupes", icon: "fas fa-users" },
  { label: "Discussions", icon: "fas fa-comment-dots" },
  { label: "Archives", icon: "fas fa-archive" },
  { label: "Brouillons", icon: "fas fa-edit" },
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

const sidebar = newElement("div", [], {
  class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-4"]
});

const mainContent = newElement("div",  [
    newElement("div", [
      newElement("i", "", { class: "fas fa-comments text-gray-600 text-6xl mb-6" }),
      newElement("h3", "Bienvenue dans vos Chats", { class: "text-xl font-semibold text-gray-600 mb-2" }),
      newElement("p", "Sélectionnez un chat pour commencer à discuter", { class: "text-gray-500 text-center" }),
      newElement("p", "ou créez un nouveau contact pour démarrer une nouvelle discussion", { class: "text-gray-400 text-sm mt-2" })
    ], {
      class: "flex flex-col items-center justify-center text-center"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-center", "p-4", "relative"
    ]
  });

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

// Notification d'actions contextuelles
const actionNotification = newElement("div", "", {
  class: "action-notification"
});
document.body.appendChild(actionNotification);

function showActionNotification(message, type = 'info') {
  actionNotification.textContent = message;
  actionNotification.className = `action-notification ${type}`;
  actionNotification.classList.add('show');
  
  setTimeout(() => {
    actionNotification.classList.remove('show');
  }, 3000);
}

// Fonction pour fermer le chat et revenir à l'écran d'accueil
function closeCurrentChat() {
  currentOpenChat = null;
  
  // Réinitialiser le mainContent à l'état d'accueil
  const welcomeContent = newElement("div", [
    newElement("div", [
      newElement("i", "", { class: "fas fa-comments text-gray-600 text-6xl mb-6" }),
      newElement("h3", "Chat fermé", { class: "text-xl font-semibold text-gray-600 mb-2" }),
      newElement("p", "Sélectionnez un autre chat pour continuer", { class: "text-gray-500 text-center" }),
      newElement("p", "ou créez un nouveau contact pour démarrer une nouvelle discussion", { class: "text-gray-400 text-sm mt-2" })
    ], {
      class: "flex flex-col items-center justify-center text-center"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-center", "p-4", "relative"
    ]
  });
  
  layout.replaceChild(welcomeContent, layout.children[2]);
  showActionNotification("Chat fermé", "info");
}

// Fonction wrapper pour openDiscussion avec bouton de fermeture
function openDiscussionWithCloseButton(discussion, layout, mainContent, discussions, groupes) {
  currentOpenChat = discussion;
  
  // Appel de la fonction originale d'ouverture de discussion
  openDiscussion(discussion, layout, mainContent, discussions, groupes);
  
  // Ajouter le bouton de fermeture après un court délai pour s'assurer que le contenu est chargé
  setTimeout(() => {
    const currentMainContent = layout.children[2];
    
    // Vérifier si le bouton de fermeture n'existe pas déjà
    if (!currentMainContent.querySelector('.close-chat-btn')) {
      const closeButton = newElement("button", [
        newElement("i", "", { class: "fas fa-times" })
      ], {
        class: "close-chat-btn",
        title: "Fermer le chat"
      });
      
      closeButton.addEventListener('click', closeCurrentChat);
      currentMainContent.style.position = 'relative';
      currentMainContent.appendChild(closeButton);
    }
  }, 100);
  
  showActionNotification(`Chat ouvert avec ${discussion.name}`, "info");
}

// Fonction wrapper pour openGroupDiscussion avec bouton de fermeture
function openGroupDiscussionWithCloseButton(group, layout, discussions, groupes) {
  currentOpenChat = group;
  
  // Appel de la fonction originale d'ouverture de groupe
  openGroupDiscussion(group, layout, discussions, groupes);
  
  // Ajouter le bouton de fermeture après un court délai
  setTimeout(() => {
    const currentMainContent = layout.children[2];
    
    if (!currentMainContent.querySelector('.close-chat-btn')) {
      const closeButton = newElement("button", [
        newElement("i", "", { class: "fas fa-times" })
      ], {
        class: "close-chat-btn",
        title: "Fermer le groupe"
      });
      
      closeButton.addEventListener('click', closeCurrentChat);
      currentMainContent.style.position = 'relative';
      currentMainContent.appendChild(closeButton);
    }
  }, 100);
  
  showActionNotification(`Groupe ouvert: ${group.name}`, "info");
}

function initializeUserData(user) {
  currentUser = user;
  
  const userData = loadUserData(user.id);
  discussions = userData.discussions;
  groupes = userData.groupes;

  if (discussions.length === 0) {
    discussions.push(
      { 
        name: "Contact Exemple", 
        firstName: "Contact",
        lastMsg: "Bienvenue dans votre messagerie !", 
        time: "12:08", 
        online: true, 
        archived: false, 
        blocked: false, 
        messages: [
          { 
            text: "Bienvenue dans votre messagerie !", 
            time: "12:08", 
            status: "✓",
            senderId: "system",
            senderName: "Système"
          }
        ] 
      }
    );
    
    saveUserData(discussions, groupes, user.id);
  }
}

function saveUserData(discussions, groupes, userId) {
  const userData = {
    discussions,
    groupes,
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));
}

function getCurrentUserInfo() {
  if (currentUser) {
    return {
      fullName: `${currentUser.firstName} ${currentUser.lastName}`,
      phone: currentUser.phone || currentUser.numero || 'Non défini',
      firstName: currentUser.firstName,
      lastName: currentUser.lastName
    };
  }
  return {
    fullName: "Utilisateur",
    phone: "Non défini",
    firstName: "Utilisateur",
    lastName: ""
  };
}

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
    openDiscussionWithCloseButton(discussion, layout, mainContent, discussions, groupes)
  );
  layout.replaceChild(sidebar, layout.children[1]);
  layout.replaceChild(mainContent, layout.children[2]);
  showActionNotification("Section Messages affichée", "info");
}

function initializeApp() {
 if (authManager.isLoggedIn()) {
    const user = authManager.getCurrentUser();
    console.log(`Utilisateur connecté: ${user.firstName} ${user.lastName} - ${user.phone || user.numero}`);
    
    initializeUserData(user);
    showMainInterface();
    showActionNotification(`Connexion réussie - Bienvenue ${user.firstName}!`, "success");
  } else {
    showAuthScreen(layout, (user) => {
      console.log(`Connexion réussie: ${user.firstName} ${user.lastName} - ${user.phone || user.numero}`);
      
      initializeUserData(user);
      showMainInterface();
      showActionNotification(`Connexion réussie - Bienvenue ${user.firstName}!`, "success");
    });
  }
}

function showMainInterface() {
  layout.innerHTML = "";
  layout.appendChild(menu);
  layout.appendChild(sidebar);
  layout.appendChild(mainContent);
  
  selectMenu(0);
  showMessages();
  
  setupMenuEvents();
}

// Fonction améliorée pour l'ajout de contact
function showAddContactFormImproved() {
  selectMenu(5);
  
  try {
    showAddContactForm(discussions, groupes, layout, sidebar);
    showActionNotification("Formulaire d'ajout de contact ouvert", "info");
    
    // Sauvegarder après ajout réussi
    setTimeout(() => {
      if (authManager.isLoggedIn()) {
        const currentUser = authManager.getCurrentUser();
        saveUserData(discussions, groupes, currentUser.id);
      }
    }, 1000);
    
  } catch (error) {
    console.error("Erreur lors de l'ouverture du formulaire d'ajout:", error);
    showActionNotification("Erreur lors de l'ouverture du formulaire", "error");
  }
}

function setupMenuEvents() {
  menuButtons[0].addEventListener("click", () => {
    selectMenu(0);
    showMessages();
  });

  menuButtons[1].addEventListener("click", () => {
    selectMenu(1);
    showGroupes(groupes, discussions, layout, mainContent, (group) => 
      openGroupDiscussionWithCloseButton(group, layout, discussions, groupes)
    );
    showActionNotification("Section Groupes affichée", "info");
  });

  menuButtons[2].addEventListener("click", () => {
    selectMenu(2);
    showDiscussionsMulti(discussions, groupes, layout);
    showActionNotification("Vue Discussions multiples affichée", "info");
  });

  menuButtons[3].addEventListener("click", () => {
    selectMenu(3);
    showArchives(discussions, layout, (discussion) => 
      openDiscussionWithCloseButton(discussion, layout, mainContent, discussions, groupes),
      groupes,
      (group) => openGroupDiscussionWithCloseButton(group, layout, discussions, groupes)
    );
    showActionNotification("Section Archives affichée", "info");
  });

  menuButtons[4].addEventListener("click", () => {
    selectMenu(4);
    showDrafts(
      discussions, 
      groupes, 
      layout, 
      (discussion) => {
        openDiscussionWithCloseButton(discussion, layout, mainContent, discussions, groupes);
      },
      (group) => {
        openGroupDiscussionWithCloseButton(group, layout, discussions, groupes);
      }
    );
    showActionNotification("Section Brouillons affichée", "info");
  });

  menuButtons[5].addEventListener("click", showAddContactFormImproved);
}

window.getCurrentUserInfo = getCurrentUserInfo;

const body = document.querySelector("body");
body.className = "flex items-center justify-center min-h-screen bg-white";
body.appendChild(appWrapper);

initializeApp();

// Sauvegarde automatique moins fréquente pour éviter les conflits
setInterval(() => {
  if (authManager.isLoggedIn()) {
    const currentUser = authManager.getCurrentUser();
    saveUserData(discussions, groupes, currentUser.id);
  }
}, 60000); // Toutes les minutes au lieu de 30 secondes

window.addEventListener('beforeunload', () => {
  if (authManager.isLoggedIn()) {
    const currentUser = authManager.getCurrentUser();
    saveUserData(discussions, groupes, currentUser.id);
  }
});