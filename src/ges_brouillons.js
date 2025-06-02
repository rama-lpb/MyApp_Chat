import { newElement, confirmAction, saveData, createSearchInput } from './component.js';

export const draftManager = {
  drafts: JSON.parse(localStorage.getItem("drafts") || "{}"),
  lastSavedHash: '',
  
  // Initialiser le gestionnaire de brouillons
  init() {
    this.updateHash();
    this.showDraftIndicator();
    this.cleanupOldDrafts();
  },
  
  // Mettre à jour le hash pour détecter les changements
  updateHash() {
    this.lastSavedHash = JSON.stringify(this.drafts);
  },
  
  // Vérifier s'il y a des changements non sauvegardés
  hasChanges() {
    return this.lastSavedHash !== JSON.stringify(this.drafts);
  },

  // Obtenir un brouillon
  getDraft(type, key) {
    if (!this.drafts[type]) this.drafts[type] = {};
    return this.drafts[type][key] || "";
  },

  // Définir un brouillon avec validation
  setDraft(type, key, value) {
    if (!type || !key) return;
    if (!this.drafts[type]) this.drafts[type] = {};
    if (value && value.trim().length > 0) {
      this.drafts[type][key] = {
        content: value.trim(),
        timestamp: new Date().toISOString(),
        lastModified: Date.now()
      };
    } else {
      delete this.drafts[type][key];
    }
    this.saveDrafts();
    this.showDraftIndicator();
  },

  // Supprimer un brouillon
  deleteDraft(type, key) {
    if (this.drafts[type] && this.drafts[type][key]) {
      delete this.drafts[type][key];
      if (Object.keys(this.drafts[type]).length === 0) {
        delete this.drafts[type];
      }
      this.saveDrafts();
      this.showDraftIndicator();
      return true;
    }
    return false;
  },
  
  clearDrafts(type) {
    if (this.drafts[type]) {
      delete this.drafts[type];
      this.saveDrafts();
      this.showDraftIndicator();
    }
  },
  
  // Obtenir tous les brouillons avec métadonnées
  getAllDrafts() {
    const result = {
      contact: {},
      group: {},
      total: 0
    };
    Object.entries(this.drafts).forEach(([type, drafts]) => {
      if (type === 'contact' || type === 'group') {
        result[type] = drafts;
        result.total += Object.keys(drafts).length;
      }
    });
    return result;
  },
  
  // Nettoyer les anciens brouillons (plus de 30 jours)
  cleanupOldDrafts() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let hasChanges = false;
    Object.entries(this.drafts).forEach(([type, drafts]) => {
      Object.entries(drafts).forEach(([key, draft]) => {
        if (typeof draft === 'string') {
          this.drafts[type][key] = {
            content: draft,
            timestamp: new Date().toISOString(),
            lastModified: Date.now()
          };
          hasChanges = true;
        } else if (draft.lastModified && draft.lastModified < thirtyDaysAgo) {
          delete this.drafts[type][key];
          hasChanges = true;
        }
      });
      if (Object.keys(this.drafts[type]).length === 0) {
        delete this.drafts[type];
        hasChanges = true;
      }
    });
    if (hasChanges) {
      this.saveDrafts();
    }
  },

  // Sauvegarder les brouillons
  saveDrafts() {
    try {
      localStorage.setItem("drafts", JSON.stringify(this.drafts));
      this.updateHash();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des brouillons:', error);
    }
  },

  // Afficher l'indicateur de brouillons
  showDraftIndicator() {
    const draftBtn = document.querySelector("#show-drafts-btn");
    if (!draftBtn) return;
    const allDrafts = this.getAllDrafts();
    const hasDrafts = allDrafts.total > 0;
    draftBtn.classList.toggle("has-draft", hasDrafts);
    const title = hasDrafts 
      ? `${allDrafts.total} brouillon${allDrafts.total > 1 ? 's' : ''} enregistré${allDrafts.total > 1 ? 's' : ''}` 
      : "Aucun brouillon enregistré";
    draftBtn.setAttribute("title", title);
    let badge = draftBtn.querySelector('.draft-badge');
    if (hasDrafts) {
      if (!badge) {
        badge = newElement('span', allDrafts.total.toString(), {
          class: 'draft-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center',
          style: { fontSize: '10px' }
        });
        draftBtn.style.position = 'relative';
        draftBtn.appendChild(badge);
      } else {
        badge.textContent = allDrafts.total.toString();
      }
    } else if (badge) {
      badge.remove();
    }
  },
  
  // Rechercher des brouillons
  searchDrafts(searchTerm) {
    const results = [];
    const term = searchTerm.toLowerCase();
    Object.entries(this.drafts).forEach(([type, drafts]) => {
      Object.entries(drafts).forEach(([key, draft]) => {
        const content = typeof draft === 'string' ? draft : draft.content;
        if (key.toLowerCase().includes(term) || content.toLowerCase().includes(term)) {
          results.push({
            type,
            key,
            content,
            timestamp: typeof draft === 'object' ? draft.timestamp : null
          });
        }
      });
    });
    return results;
  }
};

// Configuration améliorée des brouillons pour les inputs
export function setupDraftForInput(input, type, key, name, sendCallback) {
  if (!input || !type || !key) return;
  // Charger le brouillon existant
  const existingDraft = draftManager.getDraft(type, key);
  if (existingDraft) {
    const content = typeof existingDraft === 'string' ? existingDraft : existingDraft.content;
    input.value = content;
  }

  // Debounce pour éviter trop de sauvegardes
  let saveTimeout;
  
  const debouncedSave = (value) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      draftManager.setDraft(type, key, value);
    }, 500); // Sauvegarder après 500ms d'inactivité
  };

  // Écouter les modifications
  input.addEventListener("input", (e) => {
    debouncedSave(e.target.value);
  });
  
  // Sauvegarder immédiatement sur blur
  input.addEventListener("blur", () => {
    clearTimeout(saveTimeout);
    draftManager.setDraft(type, key, input.value);
  });

  // Fonction d'envoi améliorée
  const enhancedSendCallback = () => {
    try {
      sendCallback();
      // Supprimer le brouillon après envoi réussi
      draftManager.deleteDraft(type, key);
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
    }
  };

  return {
    send: enhancedSendCallback,
    clearDraft: () => draftManager.deleteDraft(type, key),
    getDraft: () => draftManager.getDraft(type, key)
  };
}

// Fonction principale pour afficher les brouillons
export function showDrafts(discussions, groupes, layout, openDiscussion, openGroupDiscussion) {
  const allDrafts = draftManager.getAllDrafts();
  const contactDrafts = allDrafts.contact || {};
  const groupDrafts = allDrafts.group || {};

  // Titre avec compteur
  const title = newElement("div", [
    newElement("h2", "Brouillons enregistrés", {
      class: "text-lg font-semibold"
    }),
    newElement("span", `${allDrafts.total} brouillon${allDrafts.total > 1 ? 's' : ''}`, {
      class: "text-sm text-gray-500 ml-2"
    })
  ], {
    class: "flex items-center mb-4"
  });

  // Bouton pour nettoyer tous les brouillons
  const clearAllBtn = newElement("button", [
    newElement("i", "", { class: "fas fa-trash mr-2" }),
    newElement("span", "Tout supprimer")
  ], {
    class: "bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors mb-4",
    onclick: () => {
      confirmAction("Êtes-vous sûr de vouloir supprimer tous les brouillons ?", () => {
        draftManager.drafts = {};
        draftManager.saveDrafts();
        draftManager.showDraftIndicator();
        // Rafraîchir la vue
        showDrafts(discussions, groupes, layout, openDiscussion, openGroupDiscussion);
      });
    }
  });

  // Créer les éléments de brouillons de contacts
  const contactItems = Object.entries(contactDrafts).map(([key, draft]) => {
    const content = typeof draft === 'string' ? draft : draft.content;
    const timestamp = typeof draft === 'object' ? draft.timestamp : null;
    
    const d = discussions.find(
      dis => `${dis.firstName || ""} ${dis.name || ""}`.trim().toLowerCase() === key.toLowerCase() ||
             `${dis.name || ""}`.trim().toLowerCase() === key.toLowerCase() ||
             `${dis.firstName || ""}`.trim().toLowerCase() === key.toLowerCase()
    );
    
    if (!d) return null;

    const initial = d.firstName ? d.firstName[0].toUpperCase() : (d.name ? d.name[0].toUpperCase() : "?");
    const displayName = d.firstName ? `${d.firstName} ${d.name || ""}`.trim() : d.name;
    const timeDisplay = timestamp ? new Date(timestamp).toLocaleString() : "Récent";
    
    return newElement("div", [
      newElement("div", [
        newElement("div", initial, {
          class: "w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center text-sm font-bold mr-3"
        }),
        newElement("div", [
          newElement("strong", displayName),
          newElement("p", content.length > 50 ? content.substring(0, 50) + "..." : content, { 
            class: "text-sm text-gray-500 mt-1" 
          }),
          newElement("div", timeDisplay, { 
            class: "text-xs text-gray-400 mt-1" 
          })
        ], { class: "flex-1" }),
        newElement("div", [
          newElement("button", [
            newElement("i", "", { class: "fas fa-edit text-blue-500 hover:text-blue-700" })
          ], {
            class: "p-1 hover:bg-gray-100 rounded mr-2",
            title: "Continuer l'écriture",
            onclick: (e) => {
              e.stopPropagation();
              openDiscussion(d, layout, layout.children[2], discussions, groupes);
            }
          }),
          newElement("button", [
            newElement("i", "", { class: "fas fa-trash text-red-500 hover:text-red-700" })
          ], {
            class: "p-1 hover:bg-gray-100 rounded",
            title: "Supprimer le brouillon",
            onclick: (e) => {
              e.stopPropagation();
              confirmAction("Supprimer ce brouillon ?", () => {
                draftManager.deleteDraft('contact', key);
                showDrafts(discussions, groupes, layout, openDiscussion, openGroupDiscussion);
              });
            }
          })
        ], {
          class: "flex items-center"
        })
      ], { class: "flex items-center gap-2 w-full" })
    ], {
      class: "bg-white p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 transition-colors",
      onclick: () => openDiscussion(d, layout, layout.children[2], discussions, groupes)
    });
  }).filter(Boolean);

  // Créer les éléments de brouillons de groupes
  const groupItems = Object.entries(groupDrafts).map(([key, draft]) => {
    const content = typeof draft === 'string' ? draft : draft.content;
    const timestamp = typeof draft === 'object' ? draft.timestamp : null;
    
    const g = groupes.find(gr => gr.name.toLowerCase() === key.toLowerCase());
    if (!g) return null;

    const initial = g.name ? g.name[0].toUpperCase() : "G";
    const timeDisplay = timestamp ? new Date(timestamp).toLocaleString() : "Récent";
    
    return newElement("div", [
      newElement("div", [
        newElement("div", initial, {
          class: "w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center text-sm font-bold mr-3"
        }),
        newElement("div", [
          newElement("strong", g.name),
          newElement("p", content.length > 50 ? content.substring(0, 50) + "..." : content, { 
            class: "text-sm text-gray-500 mt-1" 
          }),
          newElement("div", timeDisplay, { 
            class: "text-xs text-gray-400 mt-1" 
          })
        ], { class: "flex-1" }),
        newElement("div", [
          newElement("button", [
            newElement("i", "", { class: "fas fa-edit text-blue-500 hover:text-blue-700" })
          ], {
            class: "p-1 hover:bg-gray-100 rounded mr-2",
            title: "Continuer l'écriture",
            onclick: (e) => {
              e.stopPropagation();
              openGroupDiscussion(g, layout, discussions, groupes);
            }
          }),
          newElement("button", [
            newElement("i", "", { class: "fas fa-trash text-red-500 hover:text-red-700" })
          ], {
            class: "p-1 hover:bg-gray-100 rounded",
            title: "Supprimer le brouillon",
            onclick: (e) => {
              e.stopPropagation();
              confirmAction("Supprimer ce brouillon ?", () => {
                draftManager.deleteDraft('group', key);
                showDrafts(discussions, groupes, layout, openDiscussion, openGroupDiscussion);
              });
            }
          })
        ], {
          class: "flex items-center"
        })
      ], { class: "flex items-center gap-2 w-full" })
    ], {
      class: "bg-white p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 transition-colors",
      onclick: () => openGroupDiscussion(g, layout, discussions, groupes)
    });
  }).filter(Boolean);

  // Section de recherche si il y a beaucoup de brouillons
  let searchInput = null;
  if (allDrafts.total > 5) {
    searchInput = newElement("input", "", {
      type: "text",
      placeholder: "Rechercher dans les brouillons...",
      class: "w-full p-2 border border-gray-300 rounded-lg mb-4 text-sm",
      onkeyup: (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const allItems = [...contactItems, ...groupItems];
        
        allItems.forEach(item => {
          if (item) {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
          }
        });
      }
    });
  }

  // Créer la liste des brouillons
  const draftsList = [...contactItems, ...groupItems];
  
  // Message si aucun brouillon
  const emptyMessage = draftsList.length === 0 ? 
    newElement("div", [
      newElement("i", "", { class: "fas fa-edit text-gray-400 text-4xl mb-4" }),
      newElement("p", "Aucun brouillon enregistré", { class: "text-gray-500 text-center" }),
      newElement("p", "Commencez à écrire un message pour créer un brouillon automatiquement", { 
        class: "text-gray-400 text-sm text-center mt-2" 
      })
    ], {
      class: "flex flex-col items-center justify-center text-center py-8"
    }) : null;

  const list = newElement("div", 
    emptyMessage ? [emptyMessage] : draftsList, 
    {
      class: "flex flex-col gap-3 overflow-y-auto flex-1",
      style: { maxHeight: "calc(100vh - 200px)" }
    }
  );

  // Assembler la sidebar
  const sidebarContent = [title];
  
  if (allDrafts.total > 0) {
    sidebarContent.push(clearAllBtn);
  }
  
  if (searchInput) {
    sidebarContent.push(searchInput);
  }
  
  sidebarContent.push(list);

  const sidebar = newElement("div", sidebarContent, {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col"]
  });

  // Contenu principal
  const content = newElement("div", [
    newElement("div", [
      newElement("i", "", { class: "fas fa-edit text-gray-600 text-6xl mb-6" }),
      newElement("h3", "Vos brouillons", { class: "text-xl font-semibold text-gray-600 mb-2" }),
      newElement("p", allDrafts.total > 0 
        ? "Sélectionnez un brouillon pour continuer à écrire ou l'envoyer" 
        : "Aucun brouillon disponible pour le moment", 
        { class: "text-gray-500 text-center" }
      ),
      newElement("p", allDrafts.total > 0 
        ? "Les brouillons sont sauvegardés automatiquement pendant que vous écrivez" 
        : "Les brouillons seront créés automatiquement lorsque vous commencerez à écrire", 
        { class: "text-gray-400 text-sm mt-2 text-center" }
      )
    ], {
      class: "flex flex-col items-center justify-center text-center"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-center", "p-4"
    ]
  });

  layout.replaceChild(sidebar, layout.children[1]);
  layout.replaceChild(content, layout.children[2]);
}

draftManager.init();