export function renderCustomDropdown({
  id,
  options = [],
  selectedValue = "",
  ariaLabel = "Select option",
}) {
  const currentOption = options.find((opt) => opt.value === selectedValue) ||
    options[0] || {
      value: "",
      label: "",
      icon: "",
    };

  const optionsHtml = options
    .map((opt) => {
      const isSelected = opt.value === currentOption.value;
      return `
        <button
          type="button"
          class="custom-dropdown-option ${isSelected ? "active" : ""}"
          role="option"
          aria-selected="${isSelected ? "true" : "false"}"
          data-value="${opt.value}"
          tabindex="-1"
        >
          <div class="flex items-center gap-2 min-w-0">
            ${opt.icon ? `<span class="custom-dropdown-option-icon" aria-hidden="true">${opt.icon}</span>` : ""}
            <span class="text-xs font-medium truncate">${opt.label}</span>
          </div>
          <svg class="custom-dropdown-check w-3.5 h-3.5 shrink-0 ${isSelected ? "" : "hidden"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      `;
    })
    .join("");

  const nativeOptionsHtml = options
    .map((opt) => {
      const isSelected = opt.value === currentOption.value;
      return `<option value="${opt.value}" ${isSelected ? "selected" : ""}>${opt.label}</option>`;
    })
    .join("");

  return `
    <div id="${id}-wrapper" class="custom-dropdown">
      <!-- Native Hidden Select for full standard state & form interoperability -->
      <select id="${id}" class="sr-only" tabindex="-1" aria-hidden="true">
        ${nativeOptionsHtml}
      </select>

      <!-- Custom Tactile Trigger Button -->
      <button
        type="button"
        id="${id}-trigger"
        class="custom-dropdown-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="${id}-menu"
        aria-label="${ariaLabel}"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="custom-dropdown-trigger-icon flex items-center justify-center shrink-0 text-neutral-500" aria-hidden="true">
            ${currentOption.icon || ""}
          </span>
          <span class="custom-dropdown-trigger-label text-xs font-medium text-neutral-900 truncate">
            ${currentOption.label}
          </span>
        </div>
        <svg class="custom-dropdown-chevron w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <!-- Custom Listbox Menu -->
      <div
        id="${id}-menu"
        class="custom-dropdown-menu hidden"
        role="listbox"
        aria-label="${ariaLabel}"
        tabindex="-1"
      >
        ${optionsHtml}
      </div>
    </div>
  `;
}

const updateOptionVisuals = (optionButtons, val) => {
  let chosen = null;
  for (const optBtn of optionButtons) {
    const match = optBtn.dataset.value === val;
    optBtn.classList.toggle("active", match);
    optBtn.setAttribute("aria-selected", match ? "true" : "false");
    const check = optBtn.querySelector(".custom-dropdown-check");
    check?.classList.toggle("hidden", !match);
    if (match) {
      chosen = optBtn;
    }
  }
  return chosen;
};

const syncTriggerDisplay = (chosenOption, triggerLabel, triggerIcon) => {
  if (!chosenOption) {
    return;
  }
  const text = chosenOption.querySelector(".text-xs")?.textContent?.trim();
  const iconHtml =
    chosenOption.querySelector(".custom-dropdown-option-icon")?.innerHTML ?? "";
  if (triggerLabel && text) {
    triggerLabel.textContent = text;
  }
  if (triggerIcon) {
    triggerIcon.innerHTML = iconHtml;
  }
};

const handleMenuKeydown = (e, optionButtons, closeMenu, onSelect) => {
  const focusedIndex = optionButtons.indexOf(document.activeElement);

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const next = optionButtons[(focusedIndex + 1) % optionButtons.length];
    next?.focus();
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    const prev =
      optionButtons[
        (focusedIndex - 1 + optionButtons.length) % optionButtons.length
      ];
    prev?.focus();
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    closeMenu(true);
    return;
  }

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (focusedIndex >= 0) {
      const val = optionButtons[focusedIndex]?.dataset.value;
      if (val) {
        onSelect(val);
      }
    }
    return;
  }

  if (e.key === "Tab") {
    closeMenu(false);
  }
};

export function initCustomDropdown(wrapperElement, options = {}) {
  if (!wrapperElement) {
    return;
  }

  const { signal } = options;
  const trigger = wrapperElement.querySelector(".custom-dropdown-trigger");
  const menu = wrapperElement.querySelector(".custom-dropdown-menu");
  const nativeSelect = wrapperElement.querySelector("select");
  const triggerLabel = wrapperElement.querySelector(
    ".custom-dropdown-trigger-label"
  );
  const triggerIcon = wrapperElement.querySelector(
    ".custom-dropdown-trigger-icon"
  );
  const optionButtons = [
    ...wrapperElement.querySelectorAll(".custom-dropdown-option"),
  ];

  let isOpen = false;

  const openMenu = () => {
    if (isOpen) {
      return;
    }
    isOpen = true;
    menu?.classList.remove("hidden");
    trigger?.setAttribute("aria-expanded", "true");
    const activeOption = wrapperElement.querySelector(
      ".custom-dropdown-option.active"
    );
    activeOption?.focus();
  };

  const closeMenu = (focusTrigger = false) => {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    menu?.classList.add("hidden");
    trigger?.setAttribute("aria-expanded", "false");
    if (focusTrigger) {
      trigger?.focus();
    }
  };

  const selectValue = (val, dispatch = true) => {
    const chosen = updateOptionVisuals(optionButtons, val);
    syncTriggerDisplay(chosen, triggerLabel, triggerIcon);

    if (nativeSelect && nativeSelect.value !== val) {
      nativeSelect.value = val;
      if (dispatch) {
        nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

  trigger?.addEventListener(
    "click",
    (e) => {
      e.stopPropagation();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    },
    { signal }
  );

  trigger?.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
    },
    { signal }
  );

  for (const optBtn of optionButtons) {
    optBtn.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        const val = optBtn.dataset.value;
        if (val) {
          selectValue(val, true);
        }
        closeMenu(true);
      },
      { signal }
    );
  }

  menu?.addEventListener(
    "keydown",
    (e) => {
      handleMenuKeydown(e, optionButtons, closeMenu, (val) => {
        selectValue(val, true);
        closeMenu(true);
      });
    },
    { signal }
  );

  document.addEventListener(
    "click",
    (e) => {
      if (isOpen && !wrapperElement.contains(e.target)) {
        closeMenu(false);
      }
    },
    { signal }
  );

  nativeSelect?.addEventListener(
    "change",
    () => {
      selectValue(nativeSelect.value, false);
    },
    { signal }
  );

  if (nativeSelect?.value) {
    selectValue(nativeSelect.value, false);
  }
}
