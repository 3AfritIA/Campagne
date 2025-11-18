// --- Configuration ---
const API_URL = 'http://localhost:3000';
const DEBOUNCE_DELAY = 300;

// --- State ---
let currentContact = null;
let debounceTimer = null;

// --- DOM Elements ---
const searchInput = document.getElementById('search');
const suggestionsEl = document.getElementById('suggestions');
const selectedContactEl = document.getElementById('selected-contact');
const loaderEl = document.getElementById('loader');
const toastEl = document.getElementById('toast');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    searchInput.focus();

    // Event Listeners
    searchInput.addEventListener('input', handleSearchInput);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!suggestionsEl.contains(e.target) && e.target !== searchInput) {
            hideSuggestions();
        }
    });
});

// --- Logic ---

function handleSearchInput(e) {
    const query = e.target.value.trim();

    clearTimeout(debounceTimer);

    if (!query) {
        hideSuggestions();
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchContacts(query);
    }, DEBOUNCE_DELAY);
}

async function fetchContacts(query) {
    showLoader(true);
    try {
        const res = await fetch(`${API_URL}/contacts?search=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Erreur réseau');
        const contacts = await res.json();
        renderSuggestions(contacts);
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de la recherche', 'error');
    } finally {
        showLoader(false);
    }
}

function renderSuggestions(contacts) {
    suggestionsEl.innerHTML = '';

    if (contacts.length === 0) {
        hideSuggestions();
        return;
    }

    contacts.forEach(contact => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
      <span class="suggestion-name">${contact.nom} ${contact.prenom}</span>
      <span class="suggestion-address">${contact.adresse}</span>
    `;
        div.onclick = () => selectContact(contact);
        suggestionsEl.appendChild(div);
    });

    suggestionsEl.classList.add('active');
}

function selectContact(contact) {
    currentContact = contact;
    hideSuggestions();
    searchInput.value = `${contact.nom} ${contact.prenom}`;
    renderContactCard(contact);
}

function renderContactCard(contact) {
    selectedContactEl.innerHTML = `
    <div class="contact-card">
      <div class="card-header">
        <div class="contact-name">${contact.nom} ${contact.prenom}</div>
        <div class="contact-address">📍 ${contact.adresse}</div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Note d'adhésion (0-10)</label>
        <div class="note-selector" id="note-selector">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `
            <button class="note-btn ${contact.note_adh == n ? 'active' : ''}" onclick="setNote(${n})">${n}</button>
          `).join('')}
        </div>
        <input type="hidden" id="note-input" value="${contact.note_adh || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Commentaire</label>
        <textarea id="comment-input" placeholder="Informations utiles, préoccupations, disponibilité..." maxlength="140">${contact.commentaire || ''}</textarea>
      </div>

      <button class="btn-submit" onclick="saveContact()">Enregistrer la fiche</button>
    </div>
  `;
}

// Global function for note selection (called from HTML string)
window.setNote = function (n) {
    document.getElementById('note-input').value = n;
    document.querySelectorAll('.note-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent == n);
    });
}

async function saveContact() {
    if (!currentContact) return;

    const note = document.getElementById('note-input').value;
    const commentaire = document.getElementById('comment-input').value;

    try {
        const res = await fetch(`${API_URL}/contacts/${currentContact.id}/note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note, commentaire })
        });

        if (!res.ok) throw new Error('Erreur sauvegarde');

        showToast('Fiche enregistrée avec succès !', 'success');

        // Reset UI
        selectedContactEl.innerHTML = '';
        searchInput.value = '';
        searchInput.focus();
        currentContact = null;

    } catch (err) {
        console.error(err);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// --- UI Helpers ---

function hideSuggestions() {
    suggestionsEl.classList.remove('active');
}

function showLoader(show) {
    loaderEl.classList.toggle('active', show);
}

function showToast(message, type = 'success') {
    toastEl.textContent = message;
    toastEl.className = `toast ${type} show`;

    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}
