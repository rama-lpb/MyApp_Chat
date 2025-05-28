
import { newElement, confirmAction, saveData, createSearchInput } from './component.js';

export function renderSidebar(discussions, layout, sidebar, openDiscussion) {
  const discussionItems = discussions
    .filter(d => !d.archived)
    .map((d) => newElement("div", [
      newElement("div", "", {
        class: ["w-10", "h-10", "rounded-full", "bg-gray-400"]
      }),
      newElement("div", [
        newElement("strong", d.firstName ? `${d.firstName} ${d.name || ""}`.trim() : d.name),
        newElement("p", d.lastMsg, { class: "text-sm text-gray-500" })
      ], { class: "flex-1 ml-2" }),
      newElement("div", [
        newElement("span", d.time, { class: "text-xs text-green-600 block" }),
        newElement("span", "●", { class: "text-green-600 text-xs" }),
        d.blocked
          ? newElement("i", "", { class: "fas fa-ban text-black ml-2", title: "Contact bloqué" })
          : null
      ].filter(Boolean))
    ], {
      class: ["flex", "items-center", "gap-2", "bg-white", "p-2", "rounded", "hover:bg-gray-100"],
      onclick: () => openDiscussion(d)
    }));

  const searchInput = createSearchInput("Recherche", (value) => {
    discussionItems.forEach(item => {
      const name = item.querySelector("strong").textContent.toLowerCase();
      item.style.display = name.includes(value) ? "" : "none";
    });
  });

  const discussionsListContainer = newElement("div", discussionItems, {
    class: "flex flex-col gap-2 flex-1 overflow-y-auto",
    style: { maxHeight: "70vh", overflowY: "auto" }
  });

  sidebar.innerHTML = "";
  sidebar.appendChild(newElement("h2", "Discussions", { class: ["text-lg", "font-semibold", "mb-2"] }));
  sidebar.appendChild(searchInput);
  sidebar.appendChild(discussionsListContainer);
}

export function openDiscussion(discussion, layout, mainContent, discussions, groupes) {
  
  const chatHeader = newElement("div", [
    newElement("div", [
      newElement("div", "", {
        class: "w-10 h-10 rounded-full bg-gray-400 mr-3"
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
            saveData(discussions, groupes);
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
            saveData(discussions, groupes);
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
            saveData(discussions, groupes);
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
              saveData(discussions, groupes);
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
      messagesContainer.appendChild(
        newElement("div", [
          newElement("span", m.text),
          newElement("span", `${m.time} ${m.status}`, { class: "text-xs ml-2" })
        ], {
          class: [
            "bg-green-400", "text-white", "self-end", "rounded-lg",
            "px-3", "py-1", "my-1", "max-w-[60%]"
          ]
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

  const sendButton = newElement("button", newElement("i", "", { class: "fas fa-paper-plane text-green-500" }), {
    class: "ml-2 px-4 py-2 bg-white rounded hover:bg-gray-100 transition"
  });

  function sendMessage() {
    const text = inputField.value.trim();
    if (text) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      discussion.messages.push({ text, time, status: "✓" });
      discussion.lastMsg = text;
      discussion.time = time;
      inputField.value = "";
      renderMessages();
      saveData(discussions, groupes);
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
}

export function showDiscussionsMulti(discussions, groupes, layout) {
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

  const sidebarMulti = newElement("div", [
    title,
    multiSearchInput,
    ...contactCheckboxes
  ], {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-2"]
  });

  layout.replaceChild(sidebarMulti, layout.children[1]);

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
        contact.messages.push({ text, time, status: "✓" });
        contact.lastMsg = text;
        contact.time = time;
      });
      inputField.value = "";
      saveData(discussions, groupes);
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
}