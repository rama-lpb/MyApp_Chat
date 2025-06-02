import { newElement, confirmAction, saveData, createSearchInput } from './component.js';
import { authManager, requireAuth, createUserProfileHeader } from './auth.js';
import { draftManager, setupDraftForInput } from './ges_brouillons.js';



function createEnhancedDiscussionSearch(discussions, openDiscussion, discussionsListContainer) {
  const searchInput = newElement("input", "", {
    type: "text",
    placeholder: "Recherche",
    class: ["w-full", "p-2", "rounded", "border", "border-gray-300", "mb-2"]
  });

  let originalDiscussionItems = null;

  function performSearch(query) {
    const searchValue = query.toLowerCase().trim();
    
    if (!searchValue) {
      restoreOriginalList();
      return;
    }

    if (!originalDiscussionItems) {
      originalDiscussionItems = Array.from(discussionsListContainer.children);
    }

    if (searchValue === '*') {
      showAlphabeticalList();
      return;
    }

    const filteredContacts = discussions
      .filter(d => !d.archived) 
      .filter(d => {
        const fullName = `${d.firstName || ''} ${d.name || ''}`.toLowerCase();
        const firstName = (d.firstName || '').toLowerCase();
        const lastName = (d.name || '').toLowerCase();
        const phone = (d.phone || '').toLowerCase();
        
        return fullName.includes(searchValue) || 
               firstName.includes(searchValue) || 
               lastName.includes(searchValue) || 
               phone.includes(searchValue);
      });

    showSearchResults(filteredContacts);
  }

  function restoreOriginalList() {
    if (originalDiscussionItems) {
      discussionsListContainer.innerHTML = '';
      originalDiscussionItems.forEach(item => {
        discussionsListContainer.appendChild(item);
      });
    }
  }

  function showAlphabeticalList() {
    const sortedContacts = discussions
      .filter(d => !d.archived)
      .sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.name || ''}`.trim().toLowerCase();
        const nameB = `${b.firstName || ''} ${b.name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      });

    discussionsListContainer.innerHTML = '';
    
    const title = newElement("div", [
      newElement("i", "", { class: "fas fa-sort-alpha-down mr-2 text-yellow-500" }),
      newElement("span", "Contacts par ordre alphabétique", { class: "font-medium text-sm" })
    ], {
      class: "flex items-center mb-2 p-2 bg-yellow-50 rounded border-b"
    });
    discussionsListContainer.appendChild(title);

    if (sortedContacts.length === 0) {
      const noResults = newElement("div", "Aucun contact trouvé", {
        class: "text-gray-500 text-center p-4 italic"
      });
      discussionsListContainer.appendChild(noResults);
    } else {
      sortedContacts.forEach((contact, index) => {
        const contactItem = createContactItem(contact, index + 1, openDiscussion);
        discussionsListContainer.appendChild(contactItem);
      });
    }
  }

  function showSearchResults(contacts) {
    discussionsListContainer.innerHTML = '';

    if (contacts.length === 0) {
      const noResults = newElement("div", "Aucun contact trouvé pour cette recherche", {
        class: "text-gray-500 text-center p-4 italic"
      });
      discussionsListContainer.appendChild(noResults);
    } else {
      const title = newElement("div", [
        newElement("i", "", { class: "fas fa-search mr-2 text-blue-500" }),
        newElement("span", `${contacts.length} contact(s) trouvé(s)`, { class: "font-medium text-sm" })
      ], {
        class: "flex items-center mb-2 p-2 bg-blue-50 rounded border-b"
      });
      discussionsListContainer.appendChild(title);

      contacts.forEach((contact, index) => {
        const contactItem = createContactItem(contact, index + 1, openDiscussion);
        discussionsListContainer.appendChild(contactItem);
      });
    }
  }

  function createContactItem(contact, position, openDiscussion) {
    const fullName = `${contact.firstName || ''} ${contact.name || ''}`.trim();
    const initial = contact.firstName ? contact.firstName[0].toUpperCase() : (contact.name ? contact.name[0].toUpperCase() : "?");
    
    return newElement("div", [
      newElement("div", [
        newElement("div", initial, { 
          class: "w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center text-xs font-bold mr-3"
        }),
        newElement("div", [
          newElement("div", fullName || contact.name || "Contact sans nom", { 
            class: "font-medium text-sm" 
          }),
          newElement("div", contact.phone || "Pas de numéro", { 
            class: "text-xs text-gray-500" 
          }),
          contact.lastMsg ? newElement("div", `"${contact.lastMsg}"`, { 
            class: "text-xs text-gray-400 italic mt-1" 
          }) : null
        ].filter(Boolean), { class: "flex-1" }),
        newElement("div", [
          newElement("div", `#${position}`, { 
            class: "text-xs text-gray-400 font-mono" 
          }),
          contact.online ? newElement("div", "●", { 
            class: "text-green-500 text-xs text-center" 
          }) : newElement("div", "○", { 
            class: "text-gray-300 text-xs text-center" 
          })
        ], { class: "text-right" })
      ], {
        class: "flex items-center"
      })
    ], {
      class: "p-2 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100 last:border-b-0 bg-white mb-2",
      onclick: () => {
        searchInput.value = "";
        restoreOriginalList();
        openDiscussion(contact);
      }
    });
  }

  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      restoreOriginalList();
    }
  });

  return searchInput;
}

function createModernContactItem(discussion, openDiscussion, showIndex = false, index = 0) {
  const fullName = `${discussion.firstName || ''} ${discussion.name || ''}`.trim();
  const initial = discussion.firstName ? discussion.firstName[0].toUpperCase() : (discussion.name ? discussion.name[0].toUpperCase() : "?");
  
  const draft = draftManager.getDraft('contact', discussion.name || discussion.firstName);

  return newElement("div", [
    newElement("div", [
      newElement("div", initial, { 
        class: "w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center text-sm font-bold mr-3"
      }),
      newElement("div", [
        newElement("div", fullName || discussion.name || "Contact sans nom", { 
          class: "font-medium text-sm text-gray-800" 
        }),
        discussion.phone ? newElement("div", discussion.phone, { 
          class: "text-xs text-gray-500" 
        }) : null,
        discussion.lastMsg ? newElement("div", discussion.lastMsg, { 
          class: "text-xs text-gray-400 mt-1 truncate max-w-[150px]" 
        }) : null,
        draft ? newElement("div", [
          newElement("i", "", { class: "fas fa-edit text-blue-500 text-xs mr-1" }),
          newElement("span", "Brouillon enregistré", { class: "text-xs text-blue-600" })
        ], { class: "flex items-center mt-1" }) : null
      ].filter(Boolean), { class: "flex-1 min-w-0" }),
      newElement("div", [
        discussion.time ? newElement("div", discussion.time, { 
          class: "text-xs text-gray-400 mb-1" 
        }) : null,
        discussion.online ? newElement("div", "●", { 
          class: "text-green-500 text-sm text-center" 
        }) : newElement("div", "○", { 
          class: "text-gray-300 text-sm text-center" 
        }),
        discussion.blocked ? newElement("i", "", { 
          class: "fas fa-ban text-red-500 text-xs mt-1", 
          title: "Contact bloqué" 
        }) : null,
        showIndex ? newElement("div", `#${index}`, { 
          class: "text-xs text-gray-400 font-mono mt-1" 
        }) : null
      ].filter(Boolean), { class: "text-right flex flex-col items-end" })
    ], { class: "flex items-center" })
  ], {
    class: "p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100 bg-white mb-2 transition-colors duration-200 shadow-sm hover:shadow-md",
    onclick: () => openDiscussion(discussion)
  });
}


export const renderSidebar = requireAuth((discussions, layout, sidebar, openDiscussion) => {
 const userHeader = createUserProfileHeader();
  
  const discussionItems = discussions
    .filter(d => !d.archived)
    .map((d, index) => createModernContactItem(d, openDiscussion, false, index + 1));

  const discussionsListContainer = newElement("div", discussionItems, {
    class: "flex flex-col gap-2 flex-1 overflow-y-auto",
    style: { maxHeight: "70vh", overflowY: "auto" }
  });


  const enhancedSearchInput = createEnhancedDiscussionSearch(discussions, openDiscussion, discussionsListContainer);

  sidebar.innerHTML = "";
  
  if (userHeader) {
    sidebar.appendChild(userHeader);
  }
  
  sidebar.appendChild(newElement("h2", "Discussions", { class: ["text-lg", "font-semibold", "mb-2"] }));
  sidebar.appendChild(enhancedSearchInput);
  sidebar.appendChild(discussionsListContainer);
});

export const openDiscussion = requireAuth((discussion, layout, mainContent, discussions, groupes) => {
  const currentUser = authManager.getCurrentUser();
  const initial = discussion.firstName ? discussion.firstName[0].toUpperCase() : (discussion.name ? discussion.name[0].toUpperCase() : "?");
  
  const chatHeader = newElement("div", [
    newElement("div", [
      newElement("div", initial, {
        class: "w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center text-sm font-bold mr-3"
      }),
      newElement("span", discussion.firstName ? `${discussion.firstName} ${discussion.name || ""}`.trim() : discussion.name, { class: "font-bold text-base" })
    ], {
      class: "flex items-center"
    }),
    newElement("div", [
      newElement("span", newElement("i", "", { class: "fas fa-trash-alt text-sm" }), {
        class: "cursor-pointer",
        title: "Supprimer tous les messages",
        onclick: () => {
          confirmAction("Voulez-vous vraiment supprimer tous les messages de ce chat ?", () => {
            discussion.messages = [];
            discussion.lastMsg = "";
            discussion.time = "";
            saveUserData(discussions, groupes, currentUser.id);
            renderMessages();
          });
        }
      }),
      newElement("span", newElement("i", "", { class: "fas fa-archive text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Archiver le contact",
        onclick: () => {
          confirmAction("Archiver ce contact ?", () => {
            discussion.archived = true;
            saveUserData(discussions, groupes, currentUser.id);
            layout.replaceChild(mainContent, layout.children[2]);
          });
        }
      }),
      newElement("span", newElement("i", "", { class: "fas fa-ban text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Bloquer le contact",
        onclick: () => {
          confirmAction("Bloquer ce contact ?", () => {
            discussion.blocked = true;
            saveUserData(discussions, groupes, currentUser.id);
            openDiscussion(discussion, layout, mainContent, discussions, groupes);
          });
        }
      }),
      newElement("span", newElement("i", "", { class: "fas fa-user-times text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Supprimer le contact",
        onclick: () => {
          confirmAction("Supprimer ce contact ?", () => {
            const idx = discussions.indexOf(discussion);
            if (idx !== -1) {
              discussions.splice(idx, 1);
              saveUserData(discussions, groupes, currentUser.id);
              layout.replaceChild(mainContent, layout.children[2]);
            }
          });
        }
      })
    ], {
      class: "flex items-center"
    })
  ], {
    class: [
      "flex", "justify-between", "items-center",
      "p-4", "bg-white", "shadow",
      "w-full", "box-border"
    ]
  });

  const messagesContainer = newElement("div", [], {
    class: "flex flex-col gap-2 p-4 flex-1 w-full overflow-y-auto",
    style: { maxHeight: "60vh", overflowY: "auto" }
  });

  function renderMessages() {
    messagesContainer.innerHTML = "";
    discussion.messages.forEach(m => {
      const isFromCurrentUser = m.senderId === currentUser.id;
      messagesContainer.appendChild(
        newElement("div", [
          newElement("div", [
            newElement("span", m.text),
            newElement("span", `${m.time} ${m.status}`, { class: "text-xs ml-2" })
          ], {
            class: isFromCurrentUser 
              ? ["bg-yellow-400", "text-white", "rounded-lg", "px-3", "py-1", "my-1", "max-w-[60%]"]
              : ["bg-white", "text-gray-800", "rounded-lg", "px-3", "py-1", "my-1", "max-w-[60%]", "border", "border-gray-300"]
          })
        ], {
          class: isFromCurrentUser ? "flex justify-end" : "flex justify-start"
        })
      );
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  renderMessages();

  const inputField = newElement("input", "", {
    type: "text",
    placeholder: "Écrire un message...",
    class: "flex-1 p-2 rounded border border-gray-300 focus:outline-none"
  });

 const draftKey = discussion.name || discussion.firstName;
  const draft = draftManager.getDraft('contact', draftKey);
  
  if (draft) {
    inputField.value = draft.content;
    draftManager.showDraftIndicator(inputField, draft.timestamp);
  }

  const draftSetup = setupDraftForInput(
    inputField,
    'contact',
    draftKey,
    `${discussion.firstName || ''} ${discussion.name || ''}`.trim(),
    sendMessage
  );

  const sendButton = newElement("button", newElement("i", "", { class: "fas fa-paper-plane text-green-500" }), {
    class: "ml-2 px-4 py-2 bg-white rounded hover:bg-gray-100 transition",
    onclick: draftSetup.send

  });

  function sendMessage() {
    const text = inputField.value.trim();
    if (text) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      discussion.messages.push({ 
        text, 
        time, 
        status: "✓",
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`
      });
      discussion.lastMsg = text;
      discussion.time = time;
      inputField.value = "";
      renderMessages();
      saveUserData(discussions, groupes, currentUser.id);

      draftManager.deleteDraft('contact', discussion.name || discussion.firstName);

    }
  }

  const recipientName = discussion.firstName ? `${discussion.firstName} ${discussion.name || ''}`.trim() : discussion.name;
 

  sendButton.addEventListener("click", draftSetup.send);
  inputField.addEventListener("keydown", e => {
    if (e.key === "Enter") draftSetup.send();
  });

  const chatInputBar = newElement("div", [
    inputField,
    sendButton
  ], {
    class: "flex items-center w-full p-2 bg-white border-t border-gray-200 mt-auto"
  });

  let blockedBanner = null;
  if (discussion.blocked) {
    blockedBanner = newElement("div", "Impossible d'envoyer ou de recevoir un message de cette personne", {
      class: "w-full text-center text-gray-500 font-semibold mb-2 bg-gray-100 rounded p-2"
    });
    inputField.disabled = true;
    inputField.placeholder = "Contact bloqué";
    inputField.classList.add("bg-gray-200", "text-gray-500");
  }

  const chatContent = newElement("div", [
    chatHeader,
    messagesContainer,
    blockedBanner,
    chatInputBar
  ].filter(Boolean), {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-start", "p-4"
    ]
  });

  layout.replaceChild(chatContent, layout.children[2]);
});

export const showDiscussionsMulti = requireAuth((discussions, groupes, layout) => {
  const currentUser = authManager.getCurrentUser();
  
  const title = newElement("h2", "Discussions multiples", {
    class: "text-lg font-semibold mb-2"
  });

  const multiSearchInput = createSearchInput("Recherche");

  const contactCheckboxes = discussions
    .filter(d => !d.blocked)
    .map((d, idx) =>
      newElement("label", [
        newElement("input", "", { type: "checkbox", value: idx, class: "mr-2" }),
        (d.firstName ? `${d.firstName} ` : "") + (d.name || "") + (d.phone ? ` (${d.phone})` : "")
      ], { class: "flex items-center gap-2 mb-2" })
    );

  const selectAllBtn = newElement("button", "Tout sélectionner", {
    class: "w-full px-3 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition mb-2 text-sm"
  });

  const selectedCounter = newElement("div", "0 contact sélectionné", {
    class: "text-sm text-gray-600 mb-2 font-medium"
  });

  const sidebarMulti = newElement("div", [
    createUserProfileHeader(),
    title,
    multiSearchInput,
    selectAllBtn,
    newElement("div", contactCheckboxes, { class: "flex flex-col gap-2 flex-1 overflow-y-auto" }),
    selectedCounter
  ].filter(Boolean), {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-2"]
  });

  layout.replaceChild(sidebarMulti, layout.children[1]);

  function updateSelectedCount() {
    const checked = sidebarMulti.querySelectorAll('input[type="checkbox"]:checked');
    const count = checked.length;
    selectedCounter.textContent = count === 0 ? "Aucun contact sélectionné" : 
                                  count === 1 ? "1 contact sélectionné" : 
                                  `${count} contacts sélectionnés`;
  }

  selectAllBtn.addEventListener("click", () => {
    const checkboxes = sidebarMulti.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => cb.checked = !allChecked);
    selectAllBtn.textContent = allChecked ? "Tout sélectionner" : "Tout désélectionner";
    updateSelectedCount();
  });

  contactCheckboxes.forEach(checkbox => {
    checkbox.querySelector('input').addEventListener('change', updateSelectedCount);
  });

  updateSelectedCount();

  multiSearchInput.addEventListener("input", () => {
    const value = multiSearchInput.value.toLowerCase();
    contactCheckboxes.forEach(label => {
      const name = label.textContent.toLowerCase();
      label.style.display = name.includes(value) ? "" : "none";
    });
  });

  const inputField = newElement("input", "", {
    type: "text",
    placeholder: "Écrire un message à plusieurs...",
    class: "flex-1 p-2 rounded border border-gray-300 focus:outline-none"
  });

  const sendButton = newElement("button", newElement("i", "", { class: "fas fa-paper-plane text-yellow-500" }), {
    class: "ml-2 px-4 py-2 bg-white rounded hover:bg-gray-100 transition"
  });

  const messagesContainer = newElement("div", [], {
    class: "flex flex-col gap-2 p-4 flex-1 w-full overflow-y-auto"
  });

  function displaySentMessage(text, recipients, time) {
    const messageElement = newElement("div", [
      newElement("span", text),
      newElement("span", `${time} ✓ → ${recipients.join(", ")}`, { class: "text-xs ml-2" })
    ], {
      class: [
        "bg-yellow-400", "text-white", "self-end", "rounded-lg",
        "px-3", "py-1", "my-1", "max-w-[80%]"
      ]
    });
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  sendButton.addEventListener("click", () => {
    const text = inputField.value.trim();
    if (text) {
      const checked = Array.from(sidebarMulti.querySelectorAll('input[type="checkbox"]:checked'));
      const selectedContacts = checked
        .map(input => discussions[parseInt(input.value)])
        .filter(Boolean);
      
      if (selectedContacts.length === 0) return;

      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      selectedContacts.forEach(contact => {
        contact.messages.push({ 
          text, 
          time, 
          status: "✓",
          senderId: currentUser.id,
          senderName: `${currentUser.firstName} ${currentUser.lastName}`
        });
        contact.lastMsg = text;
        contact.time = time;
      });

      const recipientNames = selectedContacts.map(c => 
        c.firstName ? `${c.firstName} ${c.name || ""}`.trim() : c.name
      );
      displaySentMessage(text, recipientNames, time);

      inputField.value = "";
      saveUserData(discussions, groupes, currentUser.id);
    }
  });

  inputField.addEventListener("keydown", e => {
    if (e.key === "Enter") sendButton.click();
  });

  const chatContent = newElement("div", [
    newElement("div", "Envoyez un message à plusieurs contacts sélectionnés :", {
      class: "text-gray-700 text-center mb-4"
    }),
    messagesContainer,
    newElement("div", [inputField, sendButton], {
      class: "flex items-center w-full p-2 bg-white border-t border-gray-200"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-start", "p-4"
    ]
  });

  layout.replaceChild(chatContent, layout.children[2]);
});

function saveUserData(discussions, groupes, userId) {
  const userData = {
    discussions,
    groupes,
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));
}

export function loadUserData(userId) {
  const data = localStorage.getItem(`userData_${userId}`);
  if (data) {
    return JSON.parse(data);
  }
  return {
    discussions: [],
    groupes: [],
    lastUpdated: new Date().toISOString()
  };
}