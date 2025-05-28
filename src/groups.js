
import { newElement, confirmAction, saveData, showPopup, createSearchInput } from './component.js';

export function showGroupes(groupes, discussions, layout, mainContent, openGroupDiscussion) {
  const createGroupButton = newElement("button", [
    newElement("i", "", { class: "fas fa-plus mr-2" }),
    "Nouveau groupe"
  ], {
    class: "ml-auto px-3 py-1 bg-yellow-400 rounded text-white hover:bg-yellow-500 transition cursor-pointer",
    onclick: () => showCreateGroupForm(groupes, discussions, layout, openGroupDiscussion)
  });

  const stickyHeader = newElement("div", [
    newElement("div", [
      newElement("h2", "Groupes", { class: "text-lg font-semibold" }),
      createGroupButton
    ], { class: "flex items-center justify-between mb-4 w-full" }),
    createSearchInput("Recherche")
  ], {
    style: {
      position: "sticky",
      top: 0,
      background: "#e5e7eb",
      zIndex: 10
    }
  });

  const groupList = groupes
    .filter(g => !g.archived)
    .map(g =>
      newElement("div", [
        newElement("div", "", { class: "w-10 h-10 rounded-full bg-gray-400 mr-3" }),
        newElement("div", [
          newElement("strong", g.name),
          newElement("p", `${g.members} membres`, { class: "text-xs text-gray-500" })
        ])
      ], {
        class: "flex items-center gap-2 bg-white p-2 rounded hover:bg-gray-100 mb-2 cursor-pointer",
        onclick: () => openGroupDiscussion(g)
      })
    );

  const groupListContainer = newElement("div", groupList, {
    class: "flex flex-col gap-2 flex-1 overflow-y-auto",
    style: { maxHeight: "80vh", overflowY: "auto" }
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
    newElement("div", "Sélectionnez un groupe ou créez-en un nouveau.", {
      class: "text-gray-500 text-center m-auto text-lg"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-center", "p-4"
    ]
  });
  layout.replaceChild(groupesContent, layout.children[2]);
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
      archived: false
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
      newElement("span", newElement("i", "", { class: "fas fa-user-times text-sm" }), {
        class: "cursor-pointer ml-3",
        title: "Quitter le groupe",
        onclick: () => {
          confirmAction("Voulez-vous vraiment supprimer ce groupe ?", () => {
            const idx = groupes.indexOf(group);
            if (idx !== -1) {
              groupes.splice(idx, 1);
              saveData(discussions, groupes);
              showGroupes(groupes, discussions, layout, null, openGroupDiscussion);
            }
          });
        }
      })
    ], { class: "flex items-center" })
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

  const sendButton = newElement("button", newElement("i", "", { class: "fas fa-paper-plane text-yellow-500" }), {
    class: "ml-2 px-4 py-2 bg-white rounded hover:bg-gray-100 transition"
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

  sendButton.addEventListener("click", sendMessage);
  inputField.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  const chatInputBar = newElement("div", [
    inputField,
    sendButton
  ], {
    class: "flex items-center w-full p-2 bg-white border-t border-gray-200 mt-auto"
  });

  const chatContent = newElement("div", [
    chatHeader,
    messagesContainer,
    chatInputBar
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-start", "p-4"
    ]
  });

  layout.replaceChild(chatContent, layout.children[2]);
}

function showGroupInfo(group, discussions, groupes, layout, openGroupDiscussion) {
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
    min-width: 350px; max-width: 90vw; max-height: 80vh; overflow-y: auto;
  `;

  const nameInput = document.createElement("input");
  nameInput.value = group.name;
  nameInput.className = "w-full p-2 rounded border border-gray-300 mb-2";
  nameInput.placeholder = "Nom du groupe";

  const descInput = document.createElement("textarea");
  descInput.value = group.description || "";
  descInput.className = "w-full p-2 rounded border border-gray-300 mb-2";
  descInput.placeholder = "Description du groupe";
  descInput.rows = 3;

  const adminSelect = document.createElement("select");
  adminSelect.className = "w-full p-2 rounded border border-gray-300 mb-4";
  adminSelect.appendChild(new Option("Vous", "Vous"));
  discussions
    .filter(d => !d.archived)
    .forEach(d => {
      const label = (d.firstName ? `${d.firstName} ` : "") + (d.name || "");
      adminSelect.appendChild(new Option(label, d.name));
    });
  adminSelect.value = group.admin;

  const membersDiv = document.createElement("div");
  membersDiv.className = "mb-2 w-full";
  membersDiv.innerHTML = "<b>Membres :</b><br>";

  // Ajoute la case "Vous" d'abord
  const vousCheckbox = document.createElement("input");
  vousCheckbox.type = "checkbox";
  vousCheckbox.value = "Vous";
  vousCheckbox.className = "mr-2";
  if (group.membersList && group.membersList.some(m => m.firstName === "Vous")) {
    vousCheckbox.checked = true;
  }
  const vousLabel = document.createElement("label");
  vousLabel.className = "flex items-center gap-2 mb-2";
  vousLabel.appendChild(vousCheckbox);
  vousLabel.appendChild(document.createTextNode("Vous"));
  membersDiv.appendChild(vousLabel);

  const memberCheckboxes = discussions
    .filter(d => !d.archived)
    .map(d => {
      const label = (d.firstName ? `${d.firstName} ` : "") + (d.name || "") + (d.phone ? ` (${d.phone})` : "");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = d.name;
      checkbox.className = "mr-2";
      if (group.membersList && group.membersList.some(m => m.name === d.name && m.firstName === d.firstName)) {
        checkbox.checked = true;
      }
      const lbl = document.createElement("label");
      lbl.className = "flex items-center gap-2 mb-2";
      lbl.appendChild(checkbox);
      lbl.appendChild(document.createTextNode(label));
      return lbl;
    });

  memberCheckboxes.forEach(lbl => membersDiv.appendChild(lbl));

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display: flex; gap: 1rem; margin-top: 1rem; align-self: flex-end;";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Enregistrer";
  saveBtn.style.cssText = "background: #facc15; color: white; padding: 0.5rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Annuler";
  cancelBtn.style.cssText = "background: #e5e7eb; color: #111; padding: 0.5rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;";

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(cancelBtn);

  box.innerHTML = `<h2 style="font-size:1.2rem;margin-bottom:1rem;">Infos du groupe</h2>`;
  box.appendChild(nameInput);
  box.appendChild(descInput);
  
  const adminLabel = document.createElement("label");
  adminLabel.textContent = "Administrateur du groupe";
  adminLabel.className = "mb-2 font-semibold";
  box.appendChild(adminLabel);
  box.appendChild(adminSelect);
  box.appendChild(membersDiv);
  box.appendChild(btnRow);

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  cancelBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  saveBtn.onclick = () => {
    const groupName = nameInput.value.trim();
    const groupDesc = descInput.value.trim();
    const adminValue = adminSelect.value;

    if (!groupName) {
      showPopup("Le nom du groupe est obligatoire.");
      return;
    }

    const checked = Array.from(membersDiv.querySelectorAll('input[type="checkbox"]:checked'));
    let selectedContacts = checked
      .map(input => {
        if (input.value === "Vous") {
          return { firstName: "Vous", name: "", phone: "" };
        }
        return discussions.find(d => d.name === input.value);
      })
      .filter(Boolean);

    if (adminValue === "Vous") {
      if (!selectedContacts.some(c => c.firstName === "Vous")) {
        selectedContacts.push({ firstName: "Vous", name: "", phone: "" });
      }
    } else {
      const adminContact = discussions.find(d => d.name === adminValue);
      if (adminContact && !selectedContacts.some(c => c.name === adminContact.name && c.firstName === adminContact.firstName)) {
        selectedContacts.push(adminContact);
      }
    }

    if (selectedContacts.length < 2) {
      showPopup("Un groupe doit avoir au moins 2 membres.");
      return;
    }

    group.name = groupName;
    group.description = groupDesc;
    group.admin = adminValue;
    group.members = selectedContacts.length;
    group.membersList = selectedContacts.map(c => ({
      firstName: c.firstName,
      name: c.name,
      phone: c.phone
    }));

    saveData(discussions, groupes);
    document.body.removeChild(overlay);
    openGroupDiscussion(group, layout, discussions, groupes);
    showGroupes(groupes, discussions, layout, null, openGroupDiscussion);
  };
}