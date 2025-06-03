import { newElement, confirmAction, saveData, showPopup, createSearchInput } from './component.js';
import { draftManager, setupDraftForInput } from './ges_brouillons.js';


function createModernGroupItem(group, openGroupDiscussion) {
  const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-teal-400'];
  const colorIndex = group.name.length % colors.length;
  const avatarColor = colors[colorIndex];
  

  const initial = group.name ? group.name[0].toUpperCase() : "G";

    const draft = draftManager.getDraft('group', group.name);

    
  
  return newElement("div", [
    newElement("div", [
      newElement("div", "", { 
        class: `w-12 h-12 rounded-full ${avatarColor} text-white flex items-center justify-center text-sm font-bold mr-3`,
        textContent: initial
      }),
      newElement("div", [
        newElement("div", group.name || "Groupe sans nom", { 
          class: "font-medium text-sm text-gray-800" 
        }),
        newElement("div", `${group.members || 0} membre${(group.members || 0) > 1 ? 's' : ''}`, { 
          class: "text-xs text-gray-500" 
        }),
        group.lastMsg ? newElement("div", group.lastMsg, { 
          class: "text-xs text-gray-400 mt-1 truncate max-w-[150px]" 
        }) : null
      ].filter(Boolean), { class: "flex-1 min-w-0" }),
      newElement("div", [
        group.time ? newElement("div", group.time, { 
          class: "text-xs text-gray-400 mb-1" 
        }) : null,
        group.active ? newElement("div", "●", { 
          class: "text-green-500 text-sm text-center" 
        }) : newElement("div", "○", { 
          class: "text-gray-300 text-sm text-center" 
        }),
        newElement("i", "", { 
          class: "fas fa-users text-gray-400 text-xs mt-1", 
          title: "Groupe" 
        })
      ].filter(Boolean), { class: "text-right flex flex-col items-end" })
    ], {
      class: "flex items-center"
    })
  ], {
    class: "p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100 bg-white mb-2 transition-colors duration-200 shadow-sm hover:shadow-md",
    onclick: () => openGroupDiscussion(group)
  });
}

export function showGroupes(groupes, discussions, layout, mainContent, openGroupDiscussion) {
  const createGroupButton = newElement("button", [
    newElement("i", "", { class: "fas fa-plus mr-2" }),
    "Nouveau groupe"
  ], {
    class: "ml-auto px-4 py-2 bg-yellow-400 rounded-lg text-white hover:bg-yellow-500 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md font-medium text-sm",
    onclick: () => showCreateGroupForm(groupes, discussions, layout, openGroupDiscussion)
  });

  const stickyHeader = newElement("div", [
    newElement("div", [
      newElement("h2", "Groupes", { 
        class: "text-lg font-semibold text-gray-800" 
      }),
      createGroupButton
    ], { 
      class: "flex items-center justify-between mb-4 w-full" 
    }),
    newElement("input", "", {
      type: "text",
      placeholder: "Rechercher un groupe...",
      class: ["w-full", "p-3", "rounded-lg", "border", "border-gray-300", "mb-4", "focus:outline-none", "focus:border-yellow-400", "focus:ring-2", "focus:ring-yellow-100", "transition-all", "duration-200"],
      id: "groupSearchInput"
    })
  ], {
    class: "sticky top-0 bg-zinc-200 z-10 pb-2",
    style: {
      position: "sticky",
      top: 0,
      background: "#e5e7eb",
      zIndex: 10
    }
  });

  const filteredGroups = groupes.filter(g =>
    !g.archived &&
    !g.blocked &&
    g.membersList &&
    g.membersList.some(m => m.firstName === "Vous")
  );

  const groupList = filteredGroups.map(group => 
    createModernGroupItem(group, openGroupDiscussion)
  );

  const groupListContainer = newElement("div", groupList.length > 0 ? groupList : [
    newElement("div", [
      newElement("i", "", { class: "fas fa-users text-gray-400 text-4xl mb-4" }),
      newElement("p", "Aucun groupe trouvé", { class: "text-gray-500 font-medium" }),
      newElement("p", "Créez votre premier groupe pour commencer", { class: "text-gray-400 text-sm mt-2" })
    ], {
      class: "flex flex-col items-center justify-center text-center py-8"
    })
  ], {
    class: "flex flex-col gap-2 flex-1 overflow-y-auto",
    style: { maxHeight: "70vh", overflowY: "auto" }
  });

  const groupesSidebar = newElement("div", [
    stickyHeader,
    groupListContainer
  ], {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-2", "overflow-y-auto"],
    style: { maxHeight: "90vh", overflowY: "auto" }
  });

  layout.replaceChild(groupesSidebar, layout.children[1]);

  const groupesContent = newElement("div", [
    newElement("div", [
      newElement("i", "", { class: "fas fa-comments text-gray-600 text-6xl mb-6" }),
      newElement("h3", "Discussions de groupe", { class: "text-xl font-semibold text-gray-600 mb-2" }),
      newElement("p", "Sélectionnez un groupe pour commencer à discuter", { class: "text-gray-500 text-center" }),
      newElement("p", "ou créez un nouveau groupe avec vos contacts", { class: "text-gray-400 text-sm mt-2" })
    ], {
      class: "flex flex-col items-center justify-center text-center"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-center", "p-4"
    ]
  });
  
  layout.replaceChild(groupesContent, layout.children[2]);

  const searchInput = groupesSidebar.querySelector('#groupSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const groupItems = groupListContainer.children;
      
      Array.from(groupItems).forEach(item => {
        if (item.classList.contains('flex') && item.onclick) {
          const groupNameElement = item.querySelector('.font-medium');
          if (groupNameElement) {
            const groupName = groupNameElement.textContent.toLowerCase();
            item.style.display = groupName.includes(searchTerm) ? 'block' : 'none';
          }
        }
      });
    });
  }
}

function showCreateGroupForm(groupes, discussions, layout, openGroupDiscussion) {
  const contactCheckboxes = discussions
    .filter(d => !d.archived)
    .map((d) =>
      newElement("label", [
        newElement("input", "", { type: "checkbox", value: d.name, class: "mr-2" }),
        (d.firstName ? `${d.firstName} ` : "") + (d.name || "") + (d.phone ? ` (${d.phone})` : "")
      ], { class: "flex items-center gap-2 mb-2" })
    );

  const adminSelect = document.createElement("select");
  adminSelect.className = "w-full p-2 rounded border border-gray-300 mb-4";
  adminSelect.appendChild(new Option("Vous", "Vous"));
  discussions
    .filter(d => !d.archived)
    .forEach(d => {
      const label = (d.firstName ? `${d.firstName} ` : "") + (d.name || "");
      adminSelect.appendChild(new Option(label, d.name));
    });

  const groupNameInput = newElement("input", "", {
    type: "text",
    placeholder: "Nom du groupe",
    class: "w-full p-2 rounded border border-gray-300 mb-4"
  });

  const groupDescInput = newElement("textarea", "", {
    placeholder: "Description du groupe (facultatif)",
    class: "w-full p-2 rounded border border-gray-300 mb-4"
  });

  const submitBtn = newElement("button", "Créer", {
    class: "w-full px-3 py-2 bg-yellow-400 rounded text-white hover:bg-yellow-500 transition mt-2"
  });

  const form = newElement("form", [
    newElement("h2", "Créer un groupe", { class: "text-lg font-semibold mb-4" }),
    groupNameInput,
    groupDescInput,
    newElement("label", [
      "Administrateur du groupe",
      adminSelect
    ], { class: "mb-2 font-semibold" }),
    newElement("div", contactCheckboxes, { class: "mb-4" }),
    submitBtn
  ], {
    class: "bg-white p-4 rounded shadow flex flex-col gap-2"
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const groupName = groupNameInput.value.trim();
    const groupDesc = groupDescInput.value.trim();
    const adminValue = adminSelect.value;

    if (!groupName) {
      showPopup("Le nom du groupe est obligatoire.");
      return;
    }

    const checked = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'));
    let selectedContacts = checked
      .map(input => discussions.find(d => d.name === input.value))
      .filter(Boolean);

    if (adminValue === "Vous") {
      if (!selectedContacts.some(c => c.firstName === "Vous")) {
        selectedContacts.push({
          firstName: "Vous",
          name: "",
          phone: ""
        });
      }
    } else {
      const adminContact = discussions.find(d => d.name === adminValue);
      if (adminContact && !selectedContacts.includes(adminContact)) {
        selectedContacts.push(adminContact);
      }
    }

    if (selectedContacts.length < 2) {
      showPopup("Un groupe doit avoir au moins 2 membres.");
      return;
    }

    groupes.push({
      name: groupName,
      description: groupDesc,
      admin: adminValue,
      members: selectedContacts.length,
      membersList: selectedContacts.map(c => ({
        firstName: c.firstName,
        name: c.name,
        phone: c.phone
      })),
      messages: [],
      archived: false,
      blocked: false 
    });
    
    saveData(discussions, groupes);
    showGroupes(groupes, discussions, layout, null, openGroupDiscussion);
  });

  const formSidebar = newElement("div", [
    newElement("div", [
      newElement("h2", "Groupes", { class: "text-lg font-semibold" })
    ], { class: "mb-4" }),
    createSearchInput("Recherche"),
    form
  ], {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-4"],
    style: {
      maxHeight: "90vh",
      overflowY: "auto"
    }
  });

  layout.replaceChild(formSidebar, layout.children[1]);
}

export function openGroupDiscussion(group, layout, discussions, groupes) {
  if (!group.messages) group.messages = [];

  const isCurrentUserAdmin = group.admin === "Vous";

  const chatHeader = newElement("div", [
    newElement("div", [
      newElement("div", [
        newElement("div", "", { class: "w-10 h-10 rounded-full bg-gray-400 mr-3" }),
        newElement("span", group.name, { class: "font-bold text-base" })
      ], { class: "flex items-center" }),
      newElement(
        "span",
        group.membersList
          ? group.membersList.map(m => {
              const fullName = (m.firstName ? `${m.firstName} ` : "") + (m.name || "");
              if (group.admin === "Vous" && m.firstName === "Vous") {
                return "Vous (admin)";
              }
              if (group.admin !== "Vous" && 
                  ((m.name && group.admin === m.name) || (fullName.trim() && group.admin === fullName.trim()))) {
                return `${fullName} (admin)`;
              }
              return fullName;
            }).join(", ")
          : "",
        { class: "text-xs text-gray-500 mt-1 block ml-12" }
      )
    ], { class: "flex flex-col items-start" }),
    
    newElement("div", [
      newElement("span", newElement("i", "", { class: "fas fa-trash-alt text-sm" }), {
        class: "cursor-pointer",
        title: "Supprimer tous les messages",
        onclick: () => {
          confirmAction("Voulez-vous vraiment supprimer tous les messages de ce groupe ?", () => {
            group.messages = [];
            saveData(discussions, groupes);
            renderMessages();
          });
        }
      }),
      
      newElement("span", newElement("i", "", { class: "fas fa-archive text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Archiver le groupe",
        onclick: () => {
          confirmAction("Archiver ce groupe ?", () => {
            group.archived = true;
            saveData(discussions, groupes);
            showGroupes(groupes, discussions, layout, null, openGroupDiscussion);
          });
        }
      }),
      
      newElement("span", newElement("i", "", { class: "fas fa-users text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Infos du groupe",
        onclick: () => showGroupInfo(group, discussions, groupes, layout, openGroupDiscussion)
      }),
      
      isCurrentUserAdmin ? newElement("span", newElement("i", "", { class: "fas fa-ban text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Bloquer ce groupe",
        onclick: () => {
          confirmAction("Bloquer ce groupe ? Les membres ne pourront plus envoyer ou recevoir de messages.", () => {
            group.blocked = true;
            saveData(discussions, groupes);
            openGroupDiscussion(group, layout, discussions, groupes);
          });
        }
      }) : null,
      
      isCurrentUserAdmin ? newElement("span", newElement("i", "", { class: "fas fa-user-times text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Supprimer le groupe",
        onclick: () => {
          confirmAction("Voulez-vous vraiment supprimer ce groupe définitivement ?", () => {
            const idx = groupes.indexOf(group);
            if (idx !== -1) {
              groupes.splice(idx, 1);
              saveData(discussions, groupes);
              showGroupes(groupes, discussions, layout, null, openGroupDiscussion);
            }
          });
        }
      }) : newElement("span", newElement("i", "", { class: "fas fa-sign-out-alt text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Quitter le groupe",
        onclick: () => {
          confirmAction("Voulez-vous vraiment quitter ce groupe ?", () => {
            if (group.membersList) {
              group.membersList = group.membersList.filter(m => m.firstName !== "Vous");
              group.members = group.membersList.length;
            }
            saveData(discussions, groupes);
            showGroupes(groupes, discussions, layout, null, openGroupDiscussion);
          });
        }
      })
    ].filter(Boolean), { class: "flex items-center" })
  ], {
    class: [
      "flex", "justify-between", "items-center",
      "p-4", "bg-white", "shadow", "w-full", "box-border"
    ]
  });

  const messagesContainer = newElement("div", [], {
    class: "flex flex-col gap-2 p-4 flex-1 w-full overflow-y-auto",
    style: { maxHeight: "60vh", overflowY: "auto" }
  });

  function renderMessages() {
    messagesContainer.innerHTML = "";
    group.messages.forEach(m => {
      const isReply = group.membersList && group.membersList.some(mem => {
        const fullName = (mem.firstName ? mem.firstName : "") + (mem.name ? " " + mem.name : "");
        return m.text.startsWith(fullName.trim() + " :");
      });
      messagesContainer.appendChild(
        newElement("div", [
          newElement("span", m.text),
          newElement("span", `${m.time} ${m.status || ""}`, { class: "text-xs ml-2" })
        ], {
          class: isReply
            ? ["bg-white", "text-gray-800", "self-start", "rounded-lg", "px-3", "py-1", "my-1", "max-w-[60%]", "border", "border-gray-300"]
            : ["bg-yellow-400", "text-white", "self-end", "rounded-lg", "px-3", "py-1", "my-1", "max-w-[60%]"]
        })
      );
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  renderMessages();

  const inputField = newElement("input", "", {
    type: "text",
    placeholder: "Écrire un message au groupe...",
    class: "flex-1 p-2 rounded border border-gray-300 focus:outline-none"
  });

    const draftSetup = setupDraftForInput(
    inputField,
    'group',
    group.name,
    group.name,
    sendMessage
     );


  const sendButton = newElement("button", newElement("i", "", { class: "fas fa-paper-plane text-yellow-500" }), {
    class: "ml-2 px-4 py-2 bg-white rounded hover:bg-gray-100 transition",
    onclick: draftSetup.send

  });

  function sendMessage() {
    const text = inputField.value.trim();
    if (text) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      group.messages.push({ text, time, status: "✓" });
      inputField.value = "";
      renderMessages();
      saveData(discussions, groupes);
      draftManager.deleteDraft('group', group.name);

      
  
      const otherMembers = group.membersList ? group.membersList.filter(m => m.firstName !== "Vous") : [];
      if (otherMembers.length > 0) {
        const randomMember = otherMembers[Math.floor(Math.random() * otherMembers.length)];
        setTimeout(() => {
          const fakeReplies = [
            "Ok !", "Bonne idée.", "Je suis d'accord.", "Merci pour l'info.", "😂", "👍", "Je regarde ça.", "Super !"
          ];
          const reply = fakeReplies[Math.floor(Math.random() * fakeReplies.length)];
          const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          group.messages.push({
            text: `${randomMember.firstName ? randomMember.firstName : ""}${randomMember.name ? " " + randomMember.name : ""} : ${reply}`,
            time: replyTime,
            status: ""
          });
          renderMessages();
          saveData(discussions, groupes);
        }, 1200 + Math.random() * 2000);
      }
    }
  }

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

  // Banner de groupe bloqué
  let blockedBanner = null;
  if (group.blocked) {
    blockedBanner = newElement("div", "Ce groupe a été bloqué par l'administrateur. Impossible d'envoyer ou recevoir des messages.", {
      class: "w-full text-center text-gray-500 font-semibold mb-2 bg-gray-100 rounded p-2"
    });
    inputField.disabled = true;
    inputField.placeholder = "Groupe bloqué";
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
}

function showGroupInfo(group, discussions, groupes, layout, openGroupDiscussion) {
  const isMainAdmin = group.admin === "Vous" || 
    (group.mainAdmin && group.mainAdmin === "Vous") ||
    (!group.mainAdmin && group.admin === "Vous");
  
  if (!group.mainAdmin) {
    group.mainAdmin = group.admin;
  }
  
  if (!group.admins) {
    group.admins = [group.mainAdmin];
  }
  
  if (!group.admins.includes(group.mainAdmin)) {
    group.admins.unshift(group.mainAdmin);
  }
  
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.3); display: flex; align-items: center;
    justify-content: center; z-index: 3000;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background: white; padding: 2rem; border-radius: 1rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.2); display: flex;
    flex-direction: column; align-items: flex-start;
    min-width: 450px; max-width: 90vw; max-height: 85vh; overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb #fff;
  `;

  const title = document.createElement("h2");
  title.textContent = "Informations du groupe";
  title.style.cssText = "font-size: 1.3rem; margin-bottom: 1rem; font-weight: bold;";

  let adminNote;
  if (!isMainAdmin) {
    adminNote = document.createElement("div");
    adminNote.textContent = "Seul l'administrateur principal peut modifier les informations du groupe.";
    adminNote.style.cssText = "color: #dc2626; font-size: 0.875rem; margin-bottom: 1rem; font-style: italic; background: #fef2f2; padding: 0.5rem; border-radius: 0.5rem; border-left: 4px solid #dc2626;";
  }

  const nameInput = document.createElement("input");
  nameInput.value = group.name;
  nameInput.className = "w-full p-2 rounded border border-gray-300 mb-3";
  nameInput.placeholder = "Nom du groupe";
  nameInput.disabled = !isMainAdmin;

  const descInput = document.createElement("textarea");
  descInput.value = group.description || "";
  descInput.className = "w-full p-2 rounded border border-gray-300 mb-4";
  descInput.placeholder = "Description du groupe";
  descInput.rows = 3;
  descInput.disabled = !isMainAdmin;

  const membersTitle = document.createElement("h3");
  membersTitle.textContent = "Membres du groupe :";
  membersTitle.style.cssText = "font-weight: bold; margin-bottom: 0.5rem; color: #374151;";

  const adminCountDiv = document.createElement("div");
  adminCountDiv.className = "mb-2 text-sm text-gray-600";
  
  function updateAdminCount() {
    const currentAdminCount = group.admins ? group.admins.length : 1;
    adminCountDiv.textContent = `Administrateurs : ${currentAdminCount}/3`;
    adminCountDiv.style.color = currentAdminCount >= 3 ? "#dc2626" : "#374151";
  }
  updateAdminCount();

  const membersContainer = document.createElement("div");
  membersContainer.className = "w-full mb-4 max-h-[350px] overflow-y-auto border rounded p-3 bg-gray-50";

  const memberControls = [];

  (group.membersList || []).forEach(member => {
    const memberRow = document.createElement("div");
    memberRow.className = "flex items-center justify-between py-2 px-2 mb-2 bg-white rounded border border-gray-200";

    const memberInfo = document.createElement("div");
    memberInfo.className = "flex items-center flex-1";
    
    const memberName = document.createElement("span");
    memberName.textContent = (member.firstName ? `${member.firstName} ` : "") + (member.name || "");
    memberName.className = "font-medium";

    const memberKey = member.firstName === "Vous" ? "Vous" : member.name;
    const isThisMainAdmin = memberKey === group.mainAdmin;
    const isThisAdmin = group.admins && group.admins.includes(memberKey);
    
    if (isThisMainAdmin) {
      const adminBadge = document.createElement("span");
      adminBadge.textContent = "Admin Principal";
      adminBadge.className = "ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded font-bold";
      memberInfo.appendChild(memberName);
      memberInfo.appendChild(adminBadge);
    } else if (isThisAdmin) {
      const adminBadge = document.createElement("span");
      adminBadge.textContent = "Admin";
      adminBadge.className = "ml-2 px-2 py-1 bg-yellow-400 text-white text-xs rounded";
      memberInfo.appendChild(memberName);
      memberInfo.appendChild(adminBadge);
    } else {
      memberInfo.appendChild(memberName);
    }

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "flex items-center gap-3";

    if (isMainAdmin) {
      const keepCheckbox = document.createElement("input");
      keepCheckbox.type = "checkbox";
      keepCheckbox.checked = true;
      keepCheckbox.disabled = isThisMainAdmin; 
      keepCheckbox.className = "mr-2";
      
      if (isThisMainAdmin) {
        keepCheckbox.title = "L'administrateur principal ne peut pas être retiré";
      }
      
      const statusSelect = document.createElement("select");
      statusSelect.className = "px-2 py-1 rounded border border-gray-300 text-sm min-w-32";
      
      if (isThisMainAdmin) {
        statusSelect.innerHTML = '<option value="main_admin" selected>Admin Principal</option>';
        statusSelect.disabled = true;
        statusSelect.title = "Le statut de l'admin principal ne peut pas être modifié";
      } else {
        statusSelect.innerHTML = `
          <option value="member" ${!isThisAdmin ? 'selected' : ''}>Membre</option>
          <option value="admin" ${isThisAdmin ? 'selected' : ''}>Administrateur</option>
        `;
      }

      statusSelect.addEventListener('change', () => {
        let newAdminCount = 1; 
        memberControls.forEach(({ statusSelect: otherSelect }) => {
          if (otherSelect.value === "admin") newAdminCount++;
        });
        
        if (statusSelect.value === "admin" && newAdminCount > 3) {
          statusSelect.value = "member";
          showPopup("Maximum 3 administrateurs autorisés.");
          return;
        }
        
        updateAdminCount();
      });

      controlsDiv.appendChild(keepCheckbox);
      controlsDiv.appendChild(statusSelect);

      memberControls.push({
        member: member,
        memberKey: memberKey,
        keepCheckbox: keepCheckbox,
        statusSelect: statusSelect,
        isMainAdmin: isThisMainAdmin
      });
    } else {
      const statusLabel = document.createElement("span");
      if (isThisMainAdmin) {
        statusLabel.textContent = "Administrateur Principal";
        statusLabel.className = "text-sm font-bold text-red-600";
      } else if (isThisAdmin) {
        statusLabel.textContent = "Administrateur";
        statusLabel.className = "text-sm font-medium text-yellow-600";
      } else {
        statusLabel.textContent = "Membre";
        statusLabel.className = "text-sm text-gray-600";
      }
      controlsDiv.appendChild(statusLabel);
    }

    memberRow.appendChild(memberInfo);
    memberRow.appendChild(controlsDiv);
    membersContainer.appendChild(memberRow);
  });

  let addMembersSection;
  let newMemberCheckboxes = [];
  
  if (isMainAdmin) {
    const availableContacts = discussions.filter(d =>
      !d.archived &&
      !d.blocked &&
      !(group.membersList || []).some(m => m.name === d.name && m.firstName === d.firstName)
    );

    if (availableContacts.length > 0) {
      const addTitle = document.createElement("h3");
      addTitle.textContent = "Ajouter des membres :";
      addTitle.style.cssText = "font-weight: bold; margin-bottom: 0.5rem; color: #374151;";

      addMembersSection = document.createElement("div");
      addMembersSection.className = "w-full mb-4 max-h-[250px] overflow-y-auto border rounded p-3 bg-blue-50";

      availableContacts.forEach(contact => {
        const contactRow = document.createElement("div");
        contactRow.className = "flex items-center py-1 px-2 hover:bg-blue-100 rounded";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "mr-3";

        const label = document.createElement("span");
        label.textContent = (contact.firstName ? `${contact.firstName} ` : "") + 
                           (contact.name || "") + 
                           (contact.phone ? ` (${contact.phone})` : "");
        label.className = "text-sm";

        contactRow.appendChild(checkbox);
        contactRow.appendChild(label);
        addMembersSection.appendChild(contactRow);

        newMemberCheckboxes.push({ checkbox, contact });
      });
    }
  }

  const buttonsDiv = document.createElement("div");
  buttonsDiv.className = "flex gap-3 mt-6 self-end";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = isMainAdmin ? "Annuler" : "Fermer";
  cancelBtn.className = "px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition";

  let saveBtn;
  if (isMainAdmin) {
    saveBtn = document.createElement("button");
    saveBtn.textContent = "Enregistrer les modifications";
    saveBtn.className = "px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition font-medium";
  }

  box.appendChild(title);
  if (adminNote) box.appendChild(adminNote);
  box.appendChild(nameInput);
  box.appendChild(descInput);
  box.appendChild(membersTitle);
  box.appendChild(adminCountDiv);
  box.appendChild(membersContainer);
  
  if (addMembersSection) {
    const addTitle = document.createElement("h3");
    addTitle.textContent = "Ajouter des membres :";
    addTitle.style.cssText = "font-weight: bold; margin-bottom: 0.5rem; color: #374151;";
    box.appendChild(addTitle);
    box.appendChild(addMembersSection);
  }

  if (saveBtn) buttonsDiv.appendChild(saveBtn);
  buttonsDiv.appendChild(cancelBtn);
  box.appendChild(buttonsDiv);

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  cancelBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  if (saveBtn) {
    saveBtn.onclick = () => {
      const groupName = nameInput.value.trim();
      const groupDesc = descInput.value.trim();

      if (!groupName) {
        showPopup("Le nom du groupe est obligatoire.");
        return;
      }

      const updatedMembers = [];
      const newAdmins = [group.mainAdmin]; 

      memberControls.forEach(({ member, memberKey, keepCheckbox, statusSelect, isMainAdmin }) => {
        if (keepCheckbox.checked) {
          updatedMembers.push(member);
          
          if (statusSelect.value === "admin" && !isMainAdmin) {
            newAdmins.push(memberKey);
          }
        }
      });

      newMemberCheckboxes.forEach(({ checkbox, contact }) => {
        if (checkbox.checked) {
          updatedMembers.push({
            firstName: contact.firstName,
            name: contact.name,
            phone: contact.phone
          });
        }
      });

      if (updatedMembers.length < 2) {
        showPopup("Un groupe doit avoir au moins 2 membres.");
        return;
      }

      const mainAdminPresent = updatedMembers.some(m => 
        (group.mainAdmin === "Vous" && m.firstName === "Vous") ||
        (group.mainAdmin !== "Vous" && m.name === group.mainAdmin)
      );

      if (!mainAdminPresent) {
        showPopup("L'administrateur principal ne peut pas être retiré du groupe.");
        return;
      }

      if (newAdmins.length > 3) {
        showPopup("Maximum 3 administrateurs autorisés.");
        return;
      }

      group.name = groupName;
      group.description = groupDesc;
      group.membersList = updatedMembers;
      group.members = updatedMembers.length;
      group.admins = [...new Set(newAdmins)]; 
      group.mainAdmin = group.mainAdmin; 
      
      group.admin = group.mainAdmin;

      saveData(discussions, groupes);
      document.body.removeChild(overlay);
      
      openGroupDiscussion(group, layout, discussions, groupes);
      showGroupes(groupes, discussions, layout, null, openGroupDiscussion);
      
      showPopup("Modifications enregistrées avec succès !");
    };
  }
}

import('./main.js').then(m => m.showMainInterface());