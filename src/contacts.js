
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
      finalName = `(${maxIndex}) ${baseName}`;
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
    window.location.reload();
  });

  const formSidebar = newElement("div", [
    newElement("div", [
      newElement("h2", "Contacts", { class: "text-lg font-semibold" })
    ], { class: "mb-4" }),
    createSearchInput("Recherche"),
    form
  ], {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-4"]
  });

  layout.replaceChild(formSidebar, layout.children[1]);
}

export function showArchives(discussions, layout, openDiscussion) {
  const title = newElement("h2", "Archives", {
    class: "text-lg font-semibold mb-2"
  });

  const archivedDiscussions = discussions.filter(d => d.archived);

  const archiveList = archivedDiscussions.map(d =>
    newElement("div", [
      newElement("div", "", { class: "w-10 h-10 rounded-full bg-gray-400 mr-3" }),
      newElement("div", [
        newElement("strong", d.firstName ? `${d.firstName} ${d.name || ""}`.trim() : d.name),
        newElement("p", d.lastMsg, { class: "text-sm text-gray-500" })
      ])
    ], {
      class: "flex items-center gap-2 bg-white p-2 rounded hover:bg-gray-100 mb-2 cursor-pointer",
      onclick: () => openDiscussion(d)
    })
  );

  const archiveSearchInput = createSearchInput("Recherche", (value) => {
    archiveList.forEach(item => {
      const name = item.querySelector("strong").textContent.toLowerCase();
      item.style.display = name.includes(value) ? "" : "none";
    });
  });

  const archivesSidebar = newElement("div", [
    title,
    archiveSearchInput,
    newElement("div", archiveList, { class: "flex flex-col gap-2" })
  ], {
    class: ["w-[30%]", "h-full", "bg-zinc-200", "p-4", "flex", "flex-col", "gap-4"]
  });

  layout.replaceChild(archivesSidebar, layout.children[1]);

  const archivesContent = newElement("div", [
    newElement("div", "Sélectionnez une discussion archivée pour la consulter.", {
      class: "text-gray-500 text-center m-auto text-lg"
    })
  ], {
    class: [
      "w-[64%]", "h-full", "bg-gradient-to-b", "from-[#f5e9d6]", "to-[#d3c2ab]",
      "flex", "flex-col", "items-center", "justify-center", "p-4"
    ]
  });
  layout.replaceChild(archivesContent, layout.children[2]);
}