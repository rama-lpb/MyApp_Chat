
export function newElement(tag, content = '', props = {}) {
  if (typeof props !== 'object' || props === null) {
    throw new Error("props must be a valid object");
  }

  if ('vIf' in props && !props.vIf) {
    throw new Error("value of vIf didn't permit the creation of tag");
  }

  if (typeof tag !== 'string') {
    throw new Error("tag must be a string");
  }

  const element = document.createElement(tag);
  const fragment = document.createDocumentFragment();

  // vFor
  if ('vFor' in props) {
    const { each, render } = props.vFor;
    each.forEach(item => {
      const child = render(item);
      if (child instanceof Node) {
        fragment.appendChild(child);
      }
    });
  }

  // Gestion des props
  for (let key in props) {
    const value = props[key];

    if (key === "class" || key === "className") {
      element.className = Array.isArray(value) ? value.join(" ") : value;
    } else if (key.startsWith("on") && typeof value === "function") {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else if (key === "vShow") {
      element.style.display = value ? "" : "none";
    } else if (key === 'vIf' || key === 'vFor') {
      continue;
    } else if (key === 'style' && typeof value === "object") {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  // Contenu
  if (Array.isArray(content)) {
    content.forEach(item => {
      if (typeof item === 'string') {
        element.appendChild(document.createTextNode(item));
      } else if (item instanceof Node) {
        element.appendChild(item);
      }
    });
  } else if (typeof content === "string") {
    element.textContent = content;
  } else if (content instanceof Node) {
    element.appendChild(content);
  }

  element.appendChild(fragment);

  element.addElement = function (tag, content = '', props = {}) {
    const newEl = newElement(tag, content, props);
    this.appendChild(newEl);
    return this;
  };

  element.addNode = function (node) {
    this.appendChild(node);
    return this;
  };

  return element;
}

// // avatar 
// export function getInitials(firstName, name) {
//   if (firstName && name) return (firstName[0] + name[0]).toUpperCase();
//   if (firstName) return firstName.slice(0, 2).toUpperCase();
//   // if (name) return name.slice(0, 2).toUpperCase();
//   return "?";
// }

// const avatarColors = [
//   "#facc15", "#fbbf24", "#f59e42", "#f472b6", "#60a5fa", "#34d399", "#a78bfa", "#f87171", "#fcd34d"
// ];

// export function getAvatarColor(str) {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   return avatarColors[Math.abs(hash) % avatarColors.length];
// }



//mes popups

// popup1 confirmation
export function confirmAction(message, onConfirm) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.3); display: flex; align-items: center;
    justify-content: center; z-index: 1000;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background: white; padding: 2rem; border-radius: 1rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.2); display: flex;
    flex-direction: column; align-items: center;
  `;
  
  box.innerHTML = `
    <div style="margin-bottom:1rem;font-size:1.1rem;">${message}</div>
    <div style="display:flex;gap:1rem;">
      <button id="popup-confirm" style="background:#facc15;color:white;padding:0.5rem 1.5rem;border:none;border-radius:0.5rem;cursor:pointer;">Oui</button>
      <button id="popup-cancel" style="background:#e5e7eb;color:#111;padding:0.5rem 1.5rem;border:none;border-radius:0.5rem;cursor:pointer;">Non</button>
    </div>
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  box.querySelector("#popup-confirm").onclick = () => {
    document.body.removeChild(overlay);
    onConfirm();
  };
  box.querySelector("#popup-cancel").onclick = () => {
    document.body.removeChild(overlay);
  };
}

// popup 2 message alertes
export function showPopup(message) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.3); display: flex; align-items: center;
    justify-content: center; z-index: 2000;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background: white; padding: 2rem; border-radius: 1rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.2); display: flex;
    flex-direction: column; align-items: center;
  `;
  
  box.innerHTML = `
    <div style="margin-bottom:1rem;font-size:1.1rem;">${message}</div>
    <button id="popup-ok" style="background:#facc15;color:white;padding:0.5rem 1.5rem;border:none;border-radius:0.5rem;cursor:pointer;">OK</button>
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  box.querySelector("#popup-ok").onclick = () => {
    document.body.removeChild(overlay);
  };
}


export function saveData(discussions, groupes) {
  localStorage.setItem("discussions", JSON.stringify(discussions));
  localStorage.setItem("groupes", JSON.stringify(groupes));
}

export function loadData() {
  const discussions = [];
  const groupes = [];
  
  const d = localStorage.getItem("discussions");
  const g = localStorage.getItem("groupes");
  
  if (d) {
    const parsed = JSON.parse(d);
    parsed.forEach(x => discussions.push(x));
  }
  if (g) {
    const parsed = JSON.parse(g);
    parsed.forEach(x => groupes.push(x));
  }
  
  return { discussions, groupes };
}


export function createSearchInput(placeholder = "Recherche", onSearch) {
  const searchInput = newElement("input", "", {
    type: "text",
    placeholder,
    class: ["w-full", "p-2", "rounded", "border", "border-gray-300"]
  });

  if (onSearch) {
    searchInput.addEventListener("input", () => onSearch(searchInput.value.toLowerCase()));
  }

  return searchInput;
}





// Avatar amelioré
export function getInitials(firstName, name) {
  if (firstName && name) {
    return (firstName[0] + name[0]).toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (name) {
    return name.slice(0, 2).toUpperCase();
  }
  return "?";
}

// Palette fluidde
const avatarColors = [
  "#facc15", // Jaune doré
  "#fbbf24", // Jaune ambre
  "#f59e42", // Orange
  "#f472b6", // Rose
  "#60a5fa", // Bleu
  "#34d399", // Vert émeraude
  "#a78bfa", // Violet
  "#f87171", // Rouge corail
  "#fcd34d", // Jaune citron
  "#fb7185", // Rose vif
  "#38bdf8", // Bleu ciel
  "#4ade80"  // Vert lime
];

export function getAvatarColor(str) {
  if (!str) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function createAvatar(firstName, name, size = "w-10 h-10", textSize = "text-sm") {
  const initials = getInitials(firstName, name);
  const fullName = `${firstName || ""} ${name || ""}`.trim();
  const backgroundColor = getAvatarColor(fullName);
  
  return newElement("div", initials, {
    class: [size, "rounded-full", "flex", "items-center", "justify-center", 
            "font-bold", "text-white", textSize, "shadow-sm"],
    style: {
      backgroundColor: backgroundColor,
      userSelect: "none"
    },
    title: fullName || "Utilisateur"
  });
}

export function createAvatarWithStatus(firstName, name, isOnline = false, size = "w-10 h-10") {
  const avatar = createAvatar(firstName, name, size);
  
  if (isOnline) {
    const statusIndicator = newElement("div", "", {
      class: ["absolute", "bottom-0", "right-0", "w-3", "h-3", "bg-green-500", 
              "rounded-full", "border-2", "border-white"],
      title: "En ligne"
    });
    
    return newElement("div", [avatar, statusIndicator], {
      class: ["relative", "inline-block"]
    });
  }
  
  return avatar;
}

// Crée un avatar de groupe (plusieurs personnes)
export function createGroupAvatar(groupName, memberCount, size = "w-10 h-10") {
  const initials = groupName ? groupName.slice(0, 2).toUpperCase() : "GR";
  const backgroundColor = getAvatarColor(groupName);
  
  const avatar = newElement("div", [
    newElement("div", initials, {
      class: ["font-bold", "text-white", "text-sm"]
    }),
    newElement("div", memberCount.toString(), {
      class: ["text-xs", "text-white", "opacity-80", "absolute", "bottom-0", "right-0"]
    })
  ], {
    class: [size, "rounded-full", "flex", "items-center", "justify-center", 
            "relative", "shadow-sm"],
    style: {
      backgroundColor: backgroundColor,
      userSelect: "none"
    },
    title: `${groupName} (${memberCount} membres)`
  });
  
  return avatar;
}

// Crée un mini-avatar pour les listes compactes
export function createMiniAvatar(firstName, name) {
  return createAvatar(firstName, name, "w-8 h-8", "text-xs");
}

// Crée un grand avatar pour les profils
export function createLargeAvatar(firstName, name) {
  return createAvatar(firstName, name, "w-16 h-16", "text-lg");
}

// Crée un avatar avec une image (si disponible) sinon fallback sur initiales
export function createImageAvatar(firstName, name, imageUrl = null, size = "w-10 h-10") {
  if (imageUrl) {
    return newElement("img", "", {
      src: imageUrl,
      alt: `${firstName || ""} ${name || ""}`.trim(),
      class: [size, "rounded-full", "object-cover", "shadow-sm"],
      style: { userSelect: "none" },
      onerror: function() {
        // Si l'image ne charge pas, remplace par un avatar avec initiales
        this.replaceWith(createAvatar(firstName, name, size));
      }
    });
  }
  
  return createAvatar(firstName, name, size);
}

// Utilitaire pour créer des avatars empilés (pour montrer plusieurs membres)
export function createStackedAvatars(members, maxVisible = 3) {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - maxVisible);
  
  const avatars = visibleMembers.map((member, index) => {
    const avatar = createMiniAvatar(member.firstName, member.name);
    avatar.style.marginLeft = index > 0 ? "-8px" : "0";
    avatar.style.zIndex = visibleMembers.length - index;
    avatar.classList.add("border-2", "border-white");
    return avatar;
  });
  
  if (remainingCount > 0) {
    const moreAvatar = newElement("div", `+${remainingCount}`, {
      class: ["w-8", "h-8", "rounded-full", "bg-gray-400", "text-white", 
              "text-xs", "font-bold", "flex", "items-center", "justify-center",
              "border-2", "border-white"],
      style: {
        marginLeft: "-8px",
        zIndex: "1"
      },
      title: `${remainingCount} membre(s) de plus`
    });
    avatars.push(moreAvatar);
  }
  
  return newElement("div", avatars, {
    class: ["flex", "items-center"]
  });
}

/*

// Dans discussions.js :
const avatar = createAvatarWithStatus(discussion.firstName, discussion.name, discussion.online);

// Dans groups.js :
const groupAvatar = createGroupAvatar(group.name, group.members);

// Pour une liste de membres :
const memberAvatars = createStackedAvatars(group.membersList);

// Pour un profil :
const profileAvatar = createLargeAvatar(user.firstName, user.name);

*/