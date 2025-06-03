import { newElement, showPopup, saveData, createSearchInput } from './component.js';


export function showAddContactForm(discussions, groupes, layout, sidebar) {
  const contactFirstNameInput = newElement("input", "", {
    type: "text",
    placeholder: "Prénom (obligatoire)",
    class: "w-full p-2 rounded border border-gray-300 mb-4"
  });
  
  const contactNameInput = newElement("input", "", {
    type: "text",
    placeholder: "Nom (facultatif)",
    class: "w-full p-2 rounded border border-gray-300 mb-4"
  });
  
  const contactPhoneInput = newElement("input", "", {
    type: "text",
    placeholder: "Numéro de téléphone",
    class: "w-full p-2 rounded border border-gray-300 mb-4"
  });

  const submitBtn = newElement("button", "Créer", {
    class: "w-full px-3 py-2 bg-yellow-400 rounded text-white hover:bg-yellow-500 transition mt-2"
  });

  const form = newElement("form", [
    newElement("h2", "Nouveau contact", { class: "text-lg font-semibold mb-4" }),
    contactFirstNameInput,
    contactNameInput,
    contactPhoneInput,
    submitBtn
  ], {
    class: "bg-white p-4 rounded shadow flex flex-col gap-2"
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const firstName = contactFirstNameInput.value.trim();
    let name = contactNameInput.value.trim();
    const phone = contactPhoneInput.value.trim();

    if (!firstName) {
      showPopup("Le prénom est obligatoire.");
      return;
    }
    if (!/^[a-zA-ZÀ-ÿ\-'\s]+$/.test(firstName)) {
      showPopup("Le prénom ne peut contenir que des lettres.");
      return;
    }
    if (name && !/^[a-zA-ZÀ-ÿ\-'\s]+$/.test(name)) {
      showPopup("Le nom ne doit contenir que des lettres.");
      return;
    }
    if (!phone){
        showPopup("Aucun numéro inscrit !");
        return ;
    }
    const phonePattern = /^(\+?\d)[0-9]{8,}$/;
    if (phone && !phonePattern.test(phone)) {
      showPopup("Numéro invalide : il doit commencer par un chiffre ou '+', contenir uniquement des chiffres ensuite, et avoir au moins 9 caractères.");
      return;
    }

    let baseName = name;
    let finalName = name;
    let maxIndex = 0;

    discussions.forEach(d => {
      if (d.firstName?.toLowerCase() === firstName.toLowerCase()) {
        if (d.name?.toLowerCase() === baseName.toLowerCase()) {
          maxIndex = Math.max(maxIndex, 1);
        }
        const match = d.name?.match(/^\((\d+)\)\s+(.*)$/);
        if (match && match[2].toLowerCase() === baseName.toLowerCase()) {
          maxIndex = Math.max(maxIndex, parseInt(match[1], 10) + 1);
        }
      }
    });

    if (maxIndex > 0) {
      finalName = ` ${baseName} (${maxIndex})`;
    }

    while (discussions.some(d =>
      d.firstName?.toLowerCase() === firstName.toLowerCase() &&
      d.name?.toLowerCase() === finalName.toLowerCase()
    )) {
      maxIndex++;
      finalName = ` ${baseName} (${maxIndex})`;
    }

    discussions.unshift({
      firstName,
      name: finalName,
      phone,
      lastMsg: "",
      time: "",
      online: false,
      messages: [],
      archived: false,
      blocked: false
    });

    saveData(discussions, groupes);

    // Réinitialiser les champs
    contactFirstNameInput.value = "";
    contactNameInput.value = "";
    contactPhoneInput.value = "";

    // Afficher le popup de succès
    showPopup("Contact ajouté avec succès !");
    setTimeout(() => {
      import('./main.js').then(m => m.showMainInterface());
    }, 500);

    
  });

  const enhancedSearchInput = createEnhancedSearchInput("Recherche", discussions);

  const formSidebar = newElement("div", [
    newElement("div", [
      newElement("h2", "Contacts", { class: "text-lg font-semibold" })
    ], { class: "mb-4" }),
    enhancedSearchInput,
    form
  ], {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-4"]
  });

  layout.replaceChild(formSidebar, layout.children[1]);
}



function createEnhancedSearchInput(placeholder, discussions) {
  const searchInput = newElement("input", "", {
    type: "text",
    placeholder: placeholder,
    class: ["w-full", "p-2", "rounded", "border", "border-gray-300", "mb-2"]
  });

  const resultsContainer = newElement("div", [], {
    class: "flex flex-col gap-2 max-h-64 overflow-y-auto bg-white rounded border p-2",
    style: { display: "none" }
  });

  let isShowingAlphabetical = false;

  function performSearch(query) {
    const searchValue = query.toLowerCase().trim();
    
    if (searchValue === '*') {
      showAlphabeticalList();
      return;
    }
    
    if (!searchValue) {
      hideResults();
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

  function showAlphabeticalList() {
    isShowingAlphabetical = true;
    
    const sortedContacts = discussions
      .filter(d => !d.archived)
      .sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.name || ''}`.trim().toLowerCase();
        const nameB = `${b.firstName || ''} ${b.name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      });

    resultsContainer.innerHTML = '';
    
    const title = newElement("div", [
      newElement("i", "", { class: "fas fa-sort-alpha-down mr-2 text-yellow-500" }),
      newElement("span", "Contacts par ordre alphabétique", { class: "font-medium text-sm" })
    ], {
      class: "flex items-center mb-2 p-2 bg-yellow-50 rounded border-b"
    });
    resultsContainer.appendChild(title);

    if (sortedContacts.length === 0) {
      const noResults = newElement("div", "Aucun contact trouvé", {
        class: "text-gray-500 text-center p-4 italic"
      });
      resultsContainer.appendChild(noResults);
    } else {
      sortedContacts.forEach((contact, index) => {
        const contactItem = createContactItem(contact, index + 1);
        resultsContainer.appendChild(contactItem);
      });
    }

    resultsContainer.style.display = "block";
  }

  function showSearchResults(contacts) {
    isShowingAlphabetical = false;
    resultsContainer.innerHTML = '';

    if (contacts.length === 0) {
      const noResults = newElement("div", "Aucun contact trouvé", {
        class: "text-gray-500 text-center p-4 italic"
      });
      resultsContainer.appendChild(noResults);
    } else {
      const title = newElement("div", [
        newElement("i", "", { class: "fas fa-search mr-2 text-blue-500" }),
        newElement("span", `${contacts.length} contact(s) trouvé(s)`, { class: "font-medium text-sm" })
      ], {
        class: "flex items-center mb-2 p-2 bg-blue-50 rounded border-b"
      });
      resultsContainer.appendChild(title);

      contacts.forEach((contact, index) => {
        const contactItem = createContactItem(contact, index + 1);
        resultsContainer.appendChild(contactItem);
      });
    }

    resultsContainer.style.display = "block";
  }

  function createContactItem(contact, position) {
    const fullName = `${contact.firstName || ''} ${contact.name || ''}`.trim();
    const initial = contact.firstName ? contact.firstName[0].toUpperCase() : "?";
    
    return newElement("div", [
      newElement("div", [
        newElement("div", initial, { 
          class: "w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center text-xs font-bold mr-3"
        }),
        newElement("div", [
          newElement("div", fullName || "Contact sans nom", { 
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
      class: "p-2 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100 last:border-b-0",
      onclick: () => {
        console.log("Contact sélectionné:", contact);
        hideResults();
        searchInput.value = fullName;
      }
    });
  }

  function hideResults() {
    resultsContainer.style.display = "none";
    isShowingAlphabetical = false;
  }

  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value);
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(hideResults, 150);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      performSearch(searchInput.value);
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideResults();
      searchInput.value = "";
    }
  });

  const searchContainer = newElement("div", [
    searchInput,
    resultsContainer
  ], {
    class: "relative"
  });

  return searchContainer;
}

function createContactAvatar(contact) {
  const initial = contact.firstName ? contact.firstName[0].toUpperCase() : (contact.name ? contact.name[0].toUpperCase() : "?");
  return newElement("div", initial, { 
    class: "w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center text-sm font-bold mr-3"
  });
}

function createGroupAvatar(group) {
  const initial = group.name ? group.name[0].toUpperCase() : "G";
  return newElement("div", initial, { 
    class: "w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center text-sm font-bold mr-3"
  });
}

export function showArchives(discussions, layout, openDiscussion, groupes = [], openGroupDiscussion) {
  const title = newElement("h2", "Archives", {
    class: "text-lg font-semibold mb-2"
  });

  const archivedDiscussions = discussions.filter(d => d.archived).reverse();

  const archivedGroupes = groupes.filter(g => g.archived).reverse();

  const archiveList = archivedDiscussions.map(d =>
    newElement("div", [
      createContactAvatar(d),
      newElement("div", [
        newElement("strong", d.firstName ? `${d.firstName} ${d.name || ""}`.trim() : d.name),
        newElement("p", d.lastMsg, { class: "text-sm text-gray-500" })
      ]),
      newElement("button", newElement("i", "", { class: "fas fa-box-open" }), {
        class: "ml-auto text-black hover:text-yellow-500 transition bg-transparent border-none shadow-none p-1",
        title: "Désarchiver",
        style: { background: "none", border: "none" },
        onclick: (e) => {
          e.stopPropagation();
          d.archived = false;
          saveData(discussions, groupes);
          showArchives(discussions, layout, openDiscussion, groupes, openGroupDiscussion);
        }
      })
    ], {
      class: "flex items-center gap-2 bg-white p-2 rounded hover:bg-gray-100 mb-2 cursor-pointer",
      onclick: () => openDiscussion(d)
    })
  );

  const archiveGroupList = archivedGroupes.map(g =>
    newElement("div", [
      createGroupAvatar(g),
      newElement("div", [
        newElement("strong", g.name),
        newElement("p", g.description || "", { class: "text-sm text-gray-500" })
      ]),
      newElement("button", newElement("i", "", { class: "fas fa-box-open" }), {
        class: "ml-auto text-black hover:text-yellow-500 transition bg-transparent border-none shadow-none p-1",
        title: "Désarchiver",
        style: { background: "none", border: "none" },
        onclick: (e) => {
          e.stopPropagation();
          g.archived = false;
          saveData(discussions, groupes);
          showArchives(discussions, layout, openDiscussion, groupes, openGroupDiscussion);
        }
      })
    ], {
      class: "flex items-center gap-2 bg-white p-2 rounded hover:bg-gray-100 mb-2 cursor-pointer",
      onclick: () => openGroupDiscussion(g)
    })
  );

  const archiveSearchInput = createSearchInput("Recherche", (value) => {
    [...archiveList, ...archiveGroupList].forEach(item => {
      const name = item.querySelector("strong").textContent.toLowerCase();
      item.style.display = name.includes(value) ? "" : "none";
    });
  });

  const scrollableList = newElement("div", [...archiveList, ...archiveGroupList], {
    class: "flex flex-col gap-2 overflow-y-auto",
    style: { maxHeight: "70vh", overflowY: "auto" }
  });

  const archivesSidebar = newElement("div", [
    title,
    archiveSearchInput,
    scrollableList
  ], {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-4"]
  });

  layout.replaceChild(archivesSidebar, layout.children[1]);

  const archivesContent = newElement("div", [
      newElement("div", [
      newElement("i", "", { class: "fas fa-comments text-gray-600 text-6xl mb-6" }),
      newElement("h3", "Commencez a discuter", { class: "text-xl font-semibold text-gray-600 mb-2" }),
      newElement("p", "Sélectionnez un contact archivé  pour commencer à discuter", { class: "text-gray-500 text-center" }),
      newElement("p", "ou créez un nouveau contact pour discuter", { class: "text-gray-400 text-sm mt-2" })
    ], {
      class: "flex flex-col items-center justify-center text-center"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-center", "p-4"
    ]
  });
  layout.replaceChild(archivesContent, layout.children[2]);
}