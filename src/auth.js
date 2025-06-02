import { newElement, showPopup, saveData, loadData } from './component.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.sessionTimeout = 30 * 60 * 1000;
    this.sessionTimer = null;
    this.createDefaultAccount();
  }

  createDefaultAccount() {
    const defaultExists = this.users.some(u => u.phone === '771279062');
    if (!defaultExists) {
      const defaultUser = {
        id: 'user_' + Date.now().toString(),
        firstName: 'Rama',
        lastName: 'Gueye',
        phone: '771279062',
        online: false,
        blocked: false,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      this.users.push(defaultUser);
      this.saveUsers();
      console.log('Compte par défaut créé : Rama Gueye - 771279062');
    }
  }

  loadUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }

  saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  isLoggedIn() {
    const session = localStorage.getItem('userSession');
    if (!session) return false;
    const { userId, timestamp } = JSON.parse(session);
    const now = Date.now();
    if (now - timestamp > this.sessionTimeout) {
      this.logout();
      return false;
    }
    this.currentUser = this.users.find(u => u.id === userId);
    return !!this.currentUser;
  }

  login(firstName, lastName, phone) {
    const user = this.users.find(u =>
      u.firstName.toLowerCase() === firstName.toLowerCase() &&
      u.lastName.toLowerCase() === lastName.toLowerCase() &&
      u.phone === phone
    );
    if (!user) {
      throw new Error("Utilisateur introuvable. Vérifiez vos informations.");
    }
    if (user.blocked) {
      throw new Error("Votre compte a été bloqué");
    }
    this.currentUser = user;
    const session = {
      userId: user.id,
      timestamp: Date.now()
    };
    localStorage.setItem('userSession', JSON.stringify(session));
    this.startSessionTimer();
    user.online = true;
    user.lastLogin = new Date().toISOString();
    this.saveUsers();
    return user;
  }

  register(firstName, lastName, phone) {
    if (!firstName || !lastName || !phone) {
      throw new Error("Tous les champs (nom, prénom, numéro) doivent être remplis");
    }
    if (this.users.some(u => u.phone === phone)) {
      throw new Error("Ce numéro de téléphone est déjà utilisé");
    }
    const user = {
      id: Date.now().toString(),
      firstName,
      lastName,
      phone,
      online: false,
      blocked: false,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    this.users.push(user);
    this.saveUsers();
    return user;
  }

  logout() {
    if (this.currentUser) {
      this.currentUser.online = false;
      this.saveUsers();
    }
    localStorage.removeItem('userSession');
    this.currentUser = null;
    this.stopSessionTimer();
  }

  startSessionTimer() {
    this.stopSessionTimer();
    this.sessionTimer = setTimeout(() => {
      showPopup("Votre session a expiré. Veuillez vous reconnecter.");
      this.logout();
      window.location.reload();
    }, this.sessionTimeout);
  }

  stopSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  extendSession() {
    if (this.isLoggedIn()) {
      const session = {
        userId: this.currentUser.id,
        timestamp: Date.now()
      };
      localStorage.setItem('userSession', JSON.stringify(session));
      this.startSessionTimer();
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  updateProfile(updates) {
    if (!this.currentUser) throw new Error("Utilisateur non connecté");
    Object.assign(this.currentUser, updates);
    this.saveUsers();
    return this.currentUser;
  }
}

export const authManager = new AuthManager();

export function showAuthScreen(layout, onAuthSuccess) {
  const authContainer = newElement("div", [], {
    class: [
      "w-full", "h-full", "bg-gradient-to-br", "from-yellow-400", "to-yellow-600",
      "flex", "items-center", "justify-center", "p-4"
    ]
  });

  const authBox = newElement("div", [], {
    class: [
      "bg-white", "rounded-2xl", "shadow-2xl", "p-8", "w-full", "max-w-md",
      "transform", "transition-all", "duration-300"
    ]
  });

  let isLoginMode = true;

  function renderAuthForm() {
    authBox.innerHTML = "";

    const title = newElement("div", [
      newElement("h1", "💬 ChatApp", {
        class: "text-3xl font-bold text-center text-gray-800 mb-2"
      }),
      newElement("p", isLoginMode ? "Connectez-vous à votre compte" : "Créez votre compte", {
        class: "text-center text-gray-600 mb-4"
      })
    ]);

    const form = newElement("form", [], {
      class: "space-y-4"
    });

    const firstNameInput = newElement("input", "", {
      type: "text",
      placeholder: "Prénom",
      value: isLoginMode ? "Rama" : "",
      class: "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
    });

    const lastNameInput = newElement("input", "", {
      type: "text",
      placeholder: "Nom",
      value: isLoginMode ? "Gueye" : "",
      class: "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
    });

    const phoneInput = newElement("input", "", {
      type: "text",
      placeholder: "Numéro de téléphone",
      value: isLoginMode ? "771279062" : "",
      class: "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
    });

    const submitButton = newElement("button", isLoginMode ? "Se connecter" : "S'inscrire", {
      type: "submit",
      class: [
        "w-full", "p-3", "bg-yellow-400", "text-white", "rounded-lg",
        "hover:bg-yellow-500", "transition-colors", "font-medium", "text-lg"
      ]
    });

    const toggleButton = newElement("button", [
      newElement("span", isLoginMode ? "Pas encore de compte ? " : "Déjà un compte ? "),
      newElement("span", isLoginMode ? "S'inscrire" : "Se connecter", {
        class: "text-yellow-600 font-medium"
      })
    ], {
      type: "button",
      class: "w-full text-center text-gray-600 mt-4 hover:text-gray-800 transition-colors"
    });

    form.appendChild(firstNameInput);
    form.appendChild(lastNameInput);
    form.appendChild(phoneInput);
    form.appendChild(submitButton);

    authBox.appendChild(title);
    authBox.appendChild(form);
    authBox.appendChild(toggleButton);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const phone = phoneInput.value.trim();
        if (isLoginMode) {
          const user = authManager.login(firstName, lastName, phone);
          const welcomeMessage = `Bienvenue ${user.firstName} ${user.lastName} !`;
          showPopup(welcomeMessage);
          onAuthSuccess(user);
        } else {
          const user = authManager.register(firstName, lastName, phone);
          showPopup(`Compte créé avec succès ! Bienvenue ${user.firstName} ${user.lastName} !`);
          authManager.login(firstName, lastName, phone);
          onAuthSuccess(user);
        }
      } catch (error) {
        showPopup(error.message);
      }
    });

    toggleButton.addEventListener("click", () => {
      isLoginMode = !isLoginMode;
      renderAuthForm();
    });

    setTimeout(() => {
      firstNameInput.focus();
    }, 100);
  }

  renderAuthForm();
  authContainer.appendChild(authBox);
  layout.innerHTML = "";
  layout.appendChild(authContainer);
}

export function requireAuth(callback) {
  return function(...args) {
    if (!authManager.isLoggedIn()) {
      showAuthScreen(args[args.length - 1], () => {
        callback(...args);
      });
      return;
    }
    authManager.extendSession();
    callback(...args);
  };
}

export function createUserProfileHeader() {
  const user = authManager.getCurrentUser();
  if (!user) return null;

  const profileHeader = newElement("div", [
    newElement("div", [
      newElement("div", user.firstName[0] + user.lastName[0], {
        class: [
          "w-10", "h-10", "rounded-full", "bg-yellow-400", "text-white",
          "flex", "items-center", "justify-center", "font-bold", "text-sm"
        ]
      }),
      newElement("div", [
        newElement("div", [
          newElement("span", `${user.firstName} ${user.lastName}`, {
            class: "font-medium text-sm"
          })
        ], { class: "flex items-center" }),
        newElement("div", user.phone, {
          class: "text-xs text-gray-500"
        })
      ], { class: "ml-3" })
    ], { class: "flex items-center" }),
    newElement("div", [
      newElement("button", [
        newElement("i", "", { class: "fas fa-user-cog" })
      ], {
        class: "p-2 rounded hover:bg-gray-100 transition",
        title: "Profil et paramètres",
        onclick: () => showProfileModal()
      }),
      newElement("button", [
        newElement("i", "", { class: "fas fa-sign-out-alt" })
      ], {
        class: "p-2 rounded hover:bg-gray-100 transition ml-2",
        title: "Se déconnecter",
        onclick: () => {
          authManager.logout();
          window.location.reload();
        }
      })
    ], { class: "flex items-center" })
  ], {
    class: [
      "flex", "items-center", "justify-between", "p-3", "bg-white",
      "border-b", "border-gray-200", "shadow-sm"
    ]
  });

  return profileHeader;
}

function showProfileModal() {
  const user = authManager.getCurrentUser();
  if (!user) return;

  const overlay = newElement("div", [], {
    class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
    onclick: (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    }
  });

  const modal = newElement("div", [], {
    class: "bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
  });

  const title = newElement("h2", "Mon Profil", {
    class: "text-xl font-bold mb-4"
  });

  const form = newElement("form", [], {
    class: "space-y-4"
  });

  const firstNameInput = newElement("input", "", {
    type: "text",
    value: user.firstName,
    placeholder: "Prénom",
    class: "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
  });

  const lastNameInput = newElement("input", "", {
    type: "text",
    value: user.lastName,
    placeholder: "Nom",
    class: "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
  });

  const phoneInput = newElement("input", "", {
    type: "text",
    value: user.phone || "",
    placeholder: "Numéro de téléphone",
    class: "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
  });

  const buttons = newElement("div", [
    newElement("button", "Annuler", {
      type: "button",
      class: "px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition mr-2",
      onclick: () => document.body.removeChild(overlay)
    }),
    newElement("button", "Enregistrer", {
      type: "submit",
      class: "px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
    })
  ], {
    class: "flex justify-end mt-6"

    
  });

  form.appendChild(firstNameInput);
  form.appendChild(lastNameInput);
  form.appendChild(phoneInput);

  modal.appendChild(title);
  modal.appendChild(form);
  modal.appendChild(buttons);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const newPhone = phoneInput.value.trim();
      if (newPhone !== user.phone && authManager.users.some(u => u.phone === newPhone && u.id !== user.id)) {
        throw new Error("Ce numéro de téléphone est déjà utilisé par un autre utilisateur");
      }
      const updates = {
        firstName: firstNameInput.value.trim() || user.firstName,
        lastName: lastNameInput.value.trim() || user.lastName,
        phone: newPhone
      };
      authManager.updateProfile(updates);
      document.body.removeChild(overlay);
      showPopup("Profil mis à jour avec succès !");
      window.location.reload();
    } catch (error) {
      showPopup(error.message);
    }
  });
}