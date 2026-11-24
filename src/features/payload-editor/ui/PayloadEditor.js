import { state } from "../../../entities/qr-code/index.js";
import {
  initCustomDropdown,
  renderCustomDropdown,
} from "../../../shared/ui/dropdown/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";
import { renderToggleSwitch } from "../../../shared/ui/toggle-switch/index.js";
import { swapField, updateAccordionHeight } from "../model/field-swap.js";
import { smartPaste } from "../model/smart-paste.js";

const IMAGE_MIME_RE = /^image\//u;

const CONTENT_TYPE_OPTIONS = [
  {
    value: "url",
    label: "Web Link",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  },
  {
    value: "tel",
    label: "Phone Call",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  },
  {
    value: "wifi",
    label: "Wi-Fi Network",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  },
  {
    value: "email",
    label: "Email",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/></svg>',
  },
  {
    value: "sms",
    label: "SMS Message",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  },
  {
    value: "text",
    label: "Plain Text",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  },
  {
    value: "vcard",
    label: "vCard Contact",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  },
  {
    value: "geo",
    label: "Coordinates",
    icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  },
];

const renderClearButton = ({
  target,
  group,
  title = "Clear field",
  ariaLabel = "Clear input",
  isAbsolute = false,
} = {}) => {
  const targetAttr = target ? ` data-target="${target}"` : "";
  const groupAttr = group ? ` data-group="${group}"` : "";
  const classes = isAbsolute
    ? "btn-clear btn-icon-tactile absolute right-1 h-6 w-6 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center"
    : "btn-clear btn-icon-tactile h-full px-1 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center shrink-0";
  const iconSize = isAbsolute ? "w-3 h-3" : "w-3.5 h-3.5";

  return `<button type="button" class="${classes}"${groupAttr}${targetAttr} title="${title}" aria-label="${ariaLabel}">
    <svg class="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  </button>`;
};

export function renderPayloadEditor() {
  return `        <!-- SECTION 1: Content -->
        <div class="studio-section border-b border-neutral-200 flex flex-col gap-2">
          <div class="flex flex-col gap-1">
            <label for="select-content-type" class="text-xs font-medium text-neutral-700">Content</label>
            ${renderCustomDropdown({
              id: "select-content-type",
              options: CONTENT_TYPE_OPTIONS,
              selectedValue: state.contentType || "url",
              ariaLabel: "Content Type",
            })}
          </div>

          <div id="payload-accordion-container" class="w-full flex flex-col justify-start">
            <div id="payload-accordion-inner" class="w-full flex flex-col">
            
            <!-- Web URL -->
            <div id="field-url" class="type-field flex flex-col w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="flex items-center h-8 w-full rounded-lg bg-transparent border border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-300 focus-within:shadow-field transition-all overflow-hidden relative">
                <input type="text" id="input-url" class="flex-1 min-w-0 bg-transparent px-2 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" value="" spellcheck="false" autocomplete="off" placeholder="https://example.com" aria-label="Web URL">
                ${renderClearButton({ target: "input-url", title: "Clear field", ariaLabel: "Clear Web URL input" })}
              </div>
            </div>

            <!-- Phone Call (tel:) -->
            <div id="field-tel" class="type-field hidden flex-col w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="flex items-center h-8 w-full rounded-lg bg-transparent border border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-300 focus-within:shadow-field transition-all overflow-hidden relative">
                <input type="tel" id="tel-phone" class="flex-1 min-w-0 bg-transparent px-2 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" value="" spellcheck="false" autocomplete="off" placeholder="+1 555 000-0000" aria-label="Phone number for call">
                ${renderClearButton({ target: "tel-phone", title: "Clear field", ariaLabel: "Clear phone input" })}
              </div>
            </div>

            <!-- Email (Mailto) -->
            <div id="field-email" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="flex items-center h-8 w-full rounded-lg bg-transparent border border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-300 focus-within:shadow-field transition-all overflow-hidden">
                <input type="email" id="email-to" class="flex-1 min-w-0 bg-transparent px-2 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" placeholder="Recipient (e.g. hello@example.com)" aria-label="Recipient email address">
                ${renderClearButton({ group: "email", target: "email-to", title: "Clear all email fields", ariaLabel: "Clear recipient input" })}
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="email-subject" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="Subject" aria-label="Email Subject">
                <input type="text" id="email-body" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="Message body" aria-label="Email message body">
              </div>
            </div>

            <!-- SMS -->
            <div id="field-sms" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="flex items-center h-8 w-full rounded-lg bg-transparent border border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-300 focus-within:shadow-field transition-all overflow-hidden">
                <input type="tel" id="sms-phone" class="flex-1 min-w-0 bg-transparent px-2 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" placeholder="Phone number (+1 555 000-0000)" aria-label="SMS Phone number">
                ${renderClearButton({ group: "sms", target: "sms-phone", title: "Clear SMS fields", ariaLabel: "Clear phone input" })}
              </div>
              <input type="text" id="sms-body" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500 w-full" placeholder="SMS text (optional)" aria-label="SMS message body">
            </div>

            <!-- Wi-Fi Network -->
            <div id="field-wifi" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="grid grid-cols-2 gap-2">
                <div class="relative flex items-center">
                  <input type="text" id="wifi-ssid" class="field-input h-8 px-2 pr-7 text-xs placeholder-neutral-500 font-medium w-full" placeholder="SSID (Network Name)" aria-label="Wi-Fi SSID network name">
                  ${renderClearButton({ group: "wifi", title: "Clear Wi-Fi credentials", ariaLabel: "Clear Wi-Fi fields", isAbsolute: true })}
                </div>
                <select id="wifi-type" class="field-input h-8 px-2 text-xs cursor-pointer font-medium" aria-label="Wi-Fi Security Type">
                  <option value="WPA">WPA/WPA2</option>
                  <option value="SAE">WPA3 (SAE)</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open (No password)</option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <input type="password" id="wifi-password" class="field-input h-8 px-2 text-xs placeholder-neutral-500 font-medium flex-1" placeholder="Network Password" aria-label="Wi-Fi Password">
                ${renderToggleSwitch({
                  id: "wifi-hidden",
                  label: "Hidden",
                  title: "Hidden Wi-Fi SSID network",
                  ariaLabel: "Hidden Wi-Fi SSID network",
                  className:
                    "btn-tactile h-8 px-2 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-transparent shrink-0",
                })}
              </div>
            </div>

            <!-- Plain Text -->
            <div id="field-text" class="type-field hidden flex-col w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="flex items-center h-8 w-full rounded-lg bg-transparent border border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-300 focus-within:shadow-field transition-all overflow-hidden">
                <input type="text" id="input-text" class="flex-1 min-w-0 bg-transparent px-2 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" placeholder="Enter text or note..." aria-label="Plain Text note content">
                ${renderClearButton({ target: "input-text", title: "Clear field", ariaLabel: "Clear text input" })}
              </div>
            </div>

            <!-- vCard Contact -->
            <div id="field-vcard" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="vcard-fn" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="First Name" aria-label="vCard First Name">
                <input type="text" id="vcard-ln" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="Last Name" aria-label="vCard Last Name">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="vcard-org" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="Company / Organization" aria-label="vCard Company Organization">
                <input type="text" id="vcard-url" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="Website (https://...)" aria-label="vCard Website URL">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="vcard-phone" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="Phone Number" aria-label="vCard Phone Number">
                <input type="email" id="vcard-email" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="Email Address" aria-label="vCard Email Address">
              </div>
            </div>

            <!-- Geo Marker -->
            <div id="field-geo" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="select-content-type">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="geo-lat" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="0.000000" aria-label="Geographic Latitude">
                <input type="text" id="geo-lng" class="field-input h-8 px-2 text-xs font-medium placeholder-neutral-500" placeholder="0.000000" aria-label="Geographic Longitude">
              </div>
              <div class="flex items-center gap-2">
                <select id="geo-format" class="field-input h-8 px-2 text-xs w-full cursor-pointer font-medium" aria-label="Geo URI Link Format">
                  <option value="maps">Google Maps Link</option>
                  <option value="geo">URI Standard (geo:lat,lng)</option>
                </select>
              </div>
            </div>

            </div>
          </div>
        </div>`;
}

export function initPayloadEditor(
  { onRenderQR, onUpdateContainerWidth, onSetLogoFile, onSyncAllUIControls },
  options = {}
) {
  const { signal } = options;

  const dropdownWrapper = document.querySelector(
    "#select-content-type-wrapper"
  );
  if (dropdownWrapper) {
    initCustomDropdown(dropdownWrapper, { signal });
  }

  const selectType = document.querySelector("#select-content-type");
  if (selectType) {
    selectType.addEventListener(
      "change",
      (e) => {
        state.contentType = e.target.value;

        swapField(
          document.querySelector(".type-field:not(.hidden)"),
          document.querySelector(`#field-${state.contentType}`)
        );

        updateAccordionHeight();
        if (onUpdateContainerWidth) {
          onUpdateContainerWidth();
        }
        if (onSyncAllUIControls) {
          onSyncAllUIControls();
        }
        onRenderQR();
      },
      { signal }
    );
  }

  const inputIds = [
    "input-url",
    "tel-phone",
    "email-to",
    "email-subject",
    "email-body",
    "sms-phone",
    "sms-body",
    "wifi-ssid",
    "wifi-password",
    "wifi-type",
    "input-text",
    "vcard-fn",
    "vcard-ln",
    "vcard-phone",
    "vcard-email",
    "vcard-org",
    "vcard-url",
    "geo-lat",
    "geo-lng",
    "geo-format",
  ];

  for (const id of inputIds) {
    const el = document.querySelector(`#${id}`);
    if (el) {
      el.addEventListener(
        "input",
        () => {
          updateAccordionHeight();
          onRenderQR();
        },
        { signal }
      );
      el.addEventListener(
        "change",
        () => {
          updateAccordionHeight();
          onRenderQR();
        },
        { signal }
      );
    }
  }

  const wifiHiddenEl = document.querySelector("#wifi-hidden");
  if (wifiHiddenEl) {
    wifiHiddenEl.addEventListener("change", onRenderQR, { signal });
  }

  const clearGroupHandlers = {
    email: () => {
      const to = document.querySelector("#email-to");
      const subj = document.querySelector("#email-subject");
      const body = document.querySelector("#email-body");
      if (to) {
        to.value = "";
      }
      if (subj) {
        subj.value = "";
      }
      if (body) {
        body.value = "";
      }
      to?.focus();
    },
    sms: () => {
      const ph = document.querySelector("#sms-phone");
      const body = document.querySelector("#sms-body");
      if (ph) {
        ph.value = "";
      }
      if (body) {
        body.value = "";
      }
      ph?.focus();
    },
    wifi: () => {
      const ssid = document.querySelector("#wifi-ssid");
      const pass = document.querySelector("#wifi-password");
      const type = document.querySelector("#wifi-type");
      const hidden = document.querySelector("#wifi-hidden");
      if (ssid) {
        ssid.value = "";
      }
      if (pass) {
        pass.value = "";
        pass.classList.remove("hidden");
      }
      if (type) {
        type.value = "WPA";
      }
      if (hidden) {
        hidden.checked = false;
      }
      ssid?.focus();
    },
  };

  for (const btn of document.querySelectorAll(".btn-clear")) {
    btn.addEventListener(
      "click",
      () => {
        const { group, target } = btn.dataset;
        const clearHandler = group ? clearGroupHandlers[group] : null;
        if (clearHandler) {
          clearHandler();
        } else if (target) {
          const input = document.querySelector(`#${target}`);
          if (input) {
            input.value = "";
            input.focus();
          }
        }
        updateAccordionHeight();
        onRenderQR();
        showToast("Fields cleared");
      },
      { signal }
    );
  }

  const wifiTypeEl = document.querySelector("#wifi-type");
  const wifiPassEl = document.querySelector("#wifi-password");
  if (wifiTypeEl && wifiPassEl) {
    wifiTypeEl.addEventListener(
      "change",
      () => {
        if (wifiTypeEl.value === "nopass") {
          wifiPassEl.classList.add("hidden");
        } else {
          wifiPassEl.classList.remove("hidden");
        }
        updateAccordionHeight();
        onRenderQR();
      },
      { signal }
    );
  }

  document.addEventListener(
    "paste",
    (e) => {
      const cd = e.clipboardData;
      const pastedImage =
        cd && [...(cd.files || [])].find((f) => IMAGE_MIME_RE.test(f.type));
      if (pastedImage && !(cd.getData("text") || "").trim()) {
        e.preventDefault();
        if (onSetLogoFile) {
          onSetLogoFile(pastedImage);
        }
        return;
      }
      if (e.target.closest?.("input, textarea, select")) {
        return;
      }
      const txt = e.clipboardData?.getData("text");
      if (!txt?.trim()) {
        return;
      }
      e.preventDefault();
      try {
        showToast(`Pasted as ${smartPaste(txt)}`);
      } catch {
        showToast("Could not parse clipboard");
      }
    },
    { signal }
  );
}
