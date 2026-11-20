import { state } from "../../../entities/qr-code/index.js";
import { updatePillPosition } from "../../../shared/ui/segmented-control/index.js";
import { showToast } from "../../../shared/ui/toast/index.js";
import { swapField, updateAccordionHeight } from "../model/field-swap.js";
import { smartPaste } from "../model/smart-paste.js";

const IMAGE_MIME_RE = /^image\//u;

export function renderPayloadEditor() {
  return `        <!-- SECTION 1: Content -->
        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium text-neutral-700">Content</span>

          <!-- Payload Type Selector (9 types) -->
          <div class="segmented-track grid-cols-9 h-8" role="tablist" aria-label="Payload Type">
            <button type="button" id="tab-url" class="segmented-item active" data-type="url" role="tab" aria-selected="true" aria-controls="field-url" title="Web Link">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            <button type="button" id="tab-tel" class="segmented-item" data-type="tel" role="tab" aria-selected="false" aria-controls="field-tel" title="Phone Call">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>
            <button type="button" id="tab-wifi" class="segmented-item" data-type="wifi" role="tab" aria-selected="false" aria-controls="field-wifi" title="Wi-Fi Hotspot">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </button>
            <button type="button" id="tab-email" class="segmented-item" data-type="email" role="tab" aria-selected="false" aria-controls="field-email" title="Email (Mailto)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </button>
            <button type="button" id="tab-sms" class="segmented-item" data-type="sms" role="tab" aria-selected="false" aria-controls="field-sms" title="SMS Message">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button type="button" id="tab-text" class="segmented-item" data-type="text" role="tab" aria-selected="false" aria-controls="field-text" title="Plain Text">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="17" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="13" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>
            <button type="button" id="tab-vcard" class="segmented-item" data-type="vcard" role="tab" aria-selected="false" aria-controls="field-vcard" title="vCard Contact">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            <button type="button" id="tab-geo" class="segmented-item" data-type="geo" role="tab" aria-selected="false" aria-controls="field-geo" title="Geo Location (GPS)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </button>
            <button type="button" id="tab-sbp" class="segmented-item" data-type="sbp" role="tab" aria-selected="false" aria-controls="field-sbp" title="СБП payment">
              <span class="text-micro font-medium tracking-tight">СБП</span>
            </button>
          </div>

          <div id="payload-accordion-container" class="w-full flex flex-col justify-start">
            <div id="payload-accordion-inner" class="w-full flex flex-col">
            
            <!-- Web URL -->
            <div id="field-url" class="type-field flex flex-col w-full" role="tabpanel" aria-labelledby="tab-url">
              <div class="flex items-center h-8 w-full rounded-lg surface-control-field border border-transparent focus-within:border-neutral-300 focus-within:surface-panel focus-within:shadow-field transition-all overflow-hidden relative">
                <label for="input-url" class="pl-2.5 text-neutral-500 shrink-0" aria-label="Web URL Icon">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </label>
                <input type="text" id="input-url" class="flex-1 min-w-0 bg-transparent px-2 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" value="" spellcheck="false" autocomplete="off" placeholder="https://example.com" aria-label="Web URL">
                
                <button type="button" class="btn-clear btn-icon-tactile h-full px-1.5 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center shrink-0" data-target="input-url" title="Clear field" aria-label="Clear Web URL input">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <button type="button" id="btn-paste-url" class="btn-icon-tactile h-full px-2.5 text-neutral-600 hover:text-neutral-900 hover:surface-control-field transition-colors flex items-center justify-center border-l border-neutral-300 shrink-0" title="Paste from clipboard" aria-label="Paste URL from clipboard">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Phone Call (tel:) -->
            <div id="field-tel" class="type-field hidden flex-col w-full" role="tabpanel" aria-labelledby="tab-tel">
              <div class="flex items-center h-8 w-full rounded-lg surface-control-field border border-transparent focus-within:border-neutral-300 focus-within:surface-panel focus-within:shadow-field transition-all overflow-hidden relative">
                <label for="tel-phone" class="pl-2.5 text-neutral-500 shrink-0" aria-label="Phone Icon">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </label>
                <input type="tel" id="tel-phone" class="flex-1 min-w-0 bg-transparent px-2 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" value="" spellcheck="false" autocomplete="off" placeholder="+1 555 000-0000" aria-label="Phone number for call">
                
                <button type="button" class="btn-clear btn-icon-tactile h-full px-1.5 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center shrink-0" data-target="tel-phone" title="Clear field" aria-label="Clear phone input">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>

            <!-- Email (Mailto) -->
            <div id="field-email" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="tab-email">
              <div class="flex items-center h-8 w-full rounded-lg surface-control-field border border-transparent focus-within:border-neutral-300 focus-within:surface-panel focus-within:shadow-field transition-all overflow-hidden">
                <input type="email" id="email-to" class="flex-1 min-w-0 bg-transparent px-2.5 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" placeholder="Recipient (e.g. hello@example.com)" aria-label="Recipient email address">
                <button type="button" class="btn-clear btn-icon-tactile h-full px-1.5 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center shrink-0" data-group="email" data-target="email-to" title="Clear all email fields" aria-label="Clear recipient input"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="email-subject" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Subject" aria-label="Email Subject">
                <input type="text" id="email-body" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Message body" aria-label="Email message body">
              </div>
            </div>

            <!-- SMS -->
            <div id="field-sms" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="tab-sms">
              <div class="flex items-center h-8 w-full rounded-lg surface-control-field border border-transparent focus-within:border-neutral-300 focus-within:surface-panel focus-within:shadow-field transition-all overflow-hidden">
                <input type="tel" id="sms-phone" class="flex-1 min-w-0 bg-transparent px-2.5 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" placeholder="Phone number (+1 555 000-0000)" aria-label="SMS Phone number">
                <button type="button" class="btn-clear btn-icon-tactile h-full px-1.5 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center shrink-0" data-group="sms" data-target="sms-phone" title="Clear SMS fields" aria-label="Clear phone input"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <input type="text" id="sms-body" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500 w-full" placeholder="SMS text (optional)" aria-label="SMS message body">
            </div>

            <!-- Wi-Fi Network -->
            <div id="field-wifi" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="tab-wifi">
              <div class="grid grid-cols-2 gap-2">
                <div class="relative flex items-center">
                  <input type="text" id="wifi-ssid" class="field-input h-8 px-2.5 pr-7 text-xs placeholder-neutral-500 font-medium w-full" placeholder="SSID (Network Name)" aria-label="Wi-Fi SSID network name">
                  <button type="button" class="btn-clear btn-icon-tactile absolute right-1 h-6 w-6 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center" data-group="wifi" title="Clear Wi-Fi credentials" aria-label="Clear Wi-Fi fields">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <select id="wifi-type" class="field-input h-8 px-2 text-xs cursor-pointer font-medium" aria-label="Wi-Fi Security Type">
                  <option value="WPA">WPA/WPA2</option>
                  <option value="SAE">WPA3 (SAE)</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open (No password)</option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <input type="password" id="wifi-password" class="field-input h-8 px-2.5 text-xs placeholder-neutral-500 font-medium flex-1" placeholder="Network Password" aria-label="Wi-Fi Password">
                <label class="btn-tactile flex items-center gap-2 px-2.5 h-8 rounded-lg surface-control-field hover:surface-control-field text-caption font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer select-none shrink-0 transition-all border border-transparent focus-within:border-neutral-300 group" title="Hidden Wi-Fi SSID network">
                  <span>Hidden</span>
                  <div class="relative inline-flex items-center">
                    <input type="checkbox" id="wifi-hidden" class="sr-only peer" aria-label="Hidden Wi-Fi SSID network">
                    <div class="w-7 h-4 bg-neutral-200 peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-400 rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-panel after:empty-content after:absolute after:offset-knob after:surface-panel after:rounded-full after:h-3 after:w-3 after:transition-all after:shadow-sm peer-checked:bg-neutral-900 transition-colors"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Plain Text -->
            <div id="field-text" class="type-field hidden flex-col w-full" role="tabpanel" aria-labelledby="tab-text">
              <div class="flex items-center h-8 w-full rounded-lg surface-control-field border border-transparent focus-within:border-neutral-300 focus-within:surface-panel focus-within:shadow-field transition-all overflow-hidden">
                <input type="text" id="input-text" class="flex-1 min-w-0 bg-transparent px-2.5 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" placeholder="Enter text or note..." aria-label="Plain Text note content">
                <button type="button" class="btn-clear btn-icon-tactile h-full px-1.5 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center shrink-0" data-target="input-text" title="Clear field" aria-label="Clear text input"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
            </div>

            <!-- vCard Contact -->
            <div id="field-vcard" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="tab-vcard">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="vcard-fn" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="First Name" aria-label="vCard First Name">
                <input type="text" id="vcard-ln" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Last Name" aria-label="vCard Last Name">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="vcard-org" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Company / Organization" aria-label="vCard Company Organization">
                <input type="text" id="vcard-url" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Website (https://...)" aria-label="vCard Website URL">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="vcard-phone" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Phone Number" aria-label="vCard Phone Number">
                <input type="email" id="vcard-email" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Email Address" aria-label="vCard Email Address">
              </div>
            </div>

            <!-- Geo Marker -->
            <div id="field-geo" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="tab-geo">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="geo-lat" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="0.000000" aria-label="Geographic Latitude">
                <input type="text" id="geo-lng" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="0.000000" aria-label="Geographic Longitude">
              </div>
              <div class="flex items-center gap-2">
                <select id="geo-format" class="field-input h-8 px-2 text-xs w-full cursor-pointer font-medium" aria-label="Geo URI Link Format">
                  <option value="maps">Google Maps Link</option>
                  <option value="geo">URI Standard (geo:lat,lng)</option>
                </select>
              </div>
            </div>

            <!-- SBP Payment -->
            <div id="field-sbp" class="type-field hidden flex-col gap-2 w-full" role="tabpanel" aria-labelledby="tab-sbp">
              <div class="flex items-center h-8 w-full rounded-lg surface-control-field border border-transparent focus-within:border-neutral-300 focus-within:surface-panel focus-within:shadow-field transition-all overflow-hidden">
                <input type="text" id="sbp-link" class="flex-1 min-w-0 bg-transparent px-2.5 text-xs text-neutral-900 outline-none font-medium placeholder-neutral-500" placeholder="https://qr.nspk.ru/..." aria-label="СБП link URI">
                <button type="button" class="btn-clear btn-icon-tactile h-full px-1.5 text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center shrink-0" data-group="sbp" data-target="sbp-link" title="Clear all СБП fields" aria-label="Clear СБП link input"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                <button type="button" id="btn-paste-sbp" class="btn-icon-tactile h-full px-2.5 text-neutral-600 hover:text-neutral-900 hover:surface-control-field transition-colors flex items-center justify-center border-l border-neutral-300 shrink-0" title="Paste СБП link" aria-label="Paste СБП link from clipboard">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" inputmode="decimal" id="sbp-amount" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Amount (e.g. 150.50)" aria-label="Payment amount (RUB)">
                <input type="text" id="sbp-desc" class="field-input h-8 px-2.5 text-xs font-medium placeholder-neutral-500" placeholder="Payment note" aria-label="Payment note description">
              </div>
            </div>

            </div>
          </div>
        </div>`;
}

export function initPayloadEditor(
  { onRenderQR, onUpdateContainerWidth, onSetLogoFile },
  options = {}
) {
  const { signal } = options;

  for (const btn of document.querySelectorAll("[data-type]")) {
    btn.addEventListener(
      "click",
      () => {
        for (const b of document.querySelectorAll("[data-type]")) {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        }
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        state.contentType = btn.dataset.type;

        swapField(
          document.querySelector(".type-field:not(.hidden)"),
          document.querySelector(`#field-${state.contentType}`)
        );

        const track = btn.closest(".segmented-track");
        if (track) {
          updatePillPosition(track, true);
        }

        updateAccordionHeight();
        if (onUpdateContainerWidth) {
          onUpdateContainerWidth();
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
    "sbp-link",
    "sbp-amount",
    "sbp-desc",
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
    sbp: () => {
      const link = document.querySelector("#sbp-link");
      const amt = document.querySelector("#sbp-amount");
      const desc = document.querySelector("#sbp-desc");
      if (link) {
        link.value = "";
      }
      if (amt) {
        amt.value = "";
      }
      if (desc) {
        desc.value = "";
      }
      link?.focus();
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

  const btnPasteUrl = document.querySelector("#btn-paste-url");
  if (btnPasteUrl) {
    btnPasteUrl.addEventListener(
      "click",
      async () => {
        try {
          if (navigator.clipboard?.readText) {
            const txt = await navigator.clipboard.readText();
            if (txt) {
              const inputUrl = document.querySelector("#input-url");
              if (inputUrl) {
                inputUrl.value = txt;
              }
              onRenderQR();
              showToast("Pasted from clipboard");
            }
          } else {
            showToast("Clipboard API not supported");
          }
        } catch {
          showToast("Clipboard access denied");
        }
      },
      { signal }
    );
  }

  const btnPasteSbp = document.querySelector("#btn-paste-sbp");
  if (btnPasteSbp) {
    btnPasteSbp.addEventListener(
      "click",
      async () => {
        try {
          if (navigator.clipboard?.readText) {
            const txt = await navigator.clipboard.readText();
            if (txt) {
              const sbpLink = document.querySelector("#sbp-link");
              if (sbpLink) {
                sbpLink.value = txt;
              }
              onRenderQR();
              showToast("СБП link pasted");
            }
          } else {
            showToast("Clipboard API not supported");
          }
        } catch {
          showToast("Clipboard access denied");
        }
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
