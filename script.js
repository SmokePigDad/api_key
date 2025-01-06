document.addEventListener('DOMContentLoaded', () => {
      const credentialsList = document.getElementById('credentialsList');
      const addCredentialBtn = document.getElementById('addCredentialBtn');
      const modal = document.getElementById('modal');
      const closeBtn = document.querySelector('.close');
      const credentialForm = document.getElementById('credentialForm');
      const importBtn = document.getElementById('importBtn');
      const exportBtn = document.getElementById('exportBtn');
      const fileInput = document.getElementById('fileInput');
      let editIndex = -1;

      function loadCredentials() {
        const storedCredentials = localStorage.getItem('credentials');
        return storedCredentials ? JSON.parse(storedCredentials) : [];
      }

      function saveCredentials(credentials) {
        localStorage.setItem('credentials', JSON.stringify(credentials));
      }

      function renderCredentials() {
        credentialsList.innerHTML = '';
        const credentials = loadCredentials();
        credentials.forEach((credential, index) => {
          const credentialDiv = document.createElement('div');
          credentialDiv.classList.add('credential');
          credentialDiv.innerHTML = `
            <h3>${credential.name}</h3>
            <p>Description: ${credential.description || 'N/A'}</p>
            <p>API Key: <span class="masked" data-key="${credential.apiKey}">••••••••</span> <button class="copy-key">Copy</button></p>
            <p>Endpoint: <span class="masked" data-endpoint="${credential.endpoint}">••••••••</span> <button class="copy-endpoint">Copy</button></p>
            <p>Key-Endpoint: <button class="copy-pair">Copy Pair</button></p>
            <div class="actions">
              <button class="edit-btn" data-index="${index}">Edit</button>
              <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
          `;
          credentialsList.appendChild(credentialDiv);
        });
        attachEventListeners();
      }

      function attachEventListeners() {
        document.querySelectorAll('.masked').forEach(span => {
          span.addEventListener('click', function() {
            if (this.dataset.key) {
              this.textContent = this.dataset.key;
            } else if (this.dataset.endpoint) {
              this.textContent = this.dataset.endpoint;
            }
            this.classList.remove('masked');
          });
        });

        document.querySelectorAll('.copy-key').forEach(button => {
          button.addEventListener('click', function() {
            const key = this.parentElement.querySelector('.masked').dataset.key;
            copyToClipboard(key);
          });
        });

        document.querySelectorAll('.copy-endpoint').forEach(button => {
          button.addEventListener('click', function() {
            const endpoint = this.parentElement.querySelector('.masked').dataset.endpoint;
            copyToClipboard(endpoint);
          });
        });

        document.querySelectorAll('.copy-pair').forEach(button => {
          button.addEventListener('click', function() {
            const keySpan = this.parentElement.parentElement.querySelector('[data-key]');
            const endpointSpan = this.parentElement.parentElement.querySelector('[data-endpoint]');
            const key = keySpan.dataset.key;
            const endpoint = endpointSpan.dataset.endpoint;
            copyToClipboard(`${key} ${endpoint}`);
          });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
          button.addEventListener('click', function() {
            editIndex = parseInt(this.dataset.index);
            const credentials = loadCredentials();
            const credential = credentials[editIndex];
            document.getElementById('name').value = credential.name;
            document.getElementById('description').value = credential.description || '';
            document.getElementById('apiKey').value = credential.apiKey;
            document.getElementById('endpoint').value = credential.endpoint;
            modal.style.display = 'block';
          });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
          button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            deleteCredential(index);
          });
        });
      }

      function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
          alert('Copied to clipboard!');
        }).catch(err => {
          console.error('Failed to copy: ', err);
        });
      }

      addCredentialBtn.addEventListener('click', () => {
        editIndex = -1;
        document.getElementById('name').value = '';
        document.getElementById('description').value = '';
        document.getElementById('apiKey').value = '';
        document.getElementById('endpoint').value = '';
        modal.style.display = 'block';
      });

      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      window.addEventListener('click', (event) => {
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });

      credentialForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const description = document.getElementById('description').value;
        const apiKey = document.getElementById('apiKey').value;
        const endpoint = document.getElementById('endpoint').value;
        const newCredential = { name, description, apiKey, endpoint };
        const credentials = loadCredentials();
        if (editIndex === -1) {
          credentials.push(newCredential);
        } else {
          credentials[editIndex] = newCredential;
        }
        saveCredentials(credentials);
        renderCredentials();
        modal.style.display = 'none';
      });

      function deleteCredential(index) {
        const credentials = loadCredentials();
        credentials.splice(index, 1);
        saveCredentials(credentials);
        renderCredentials();
      }

      importBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedData = JSON.parse(e.target.result);
              if (Array.isArray(importedData)) {
                saveCredentials(importedData);
                renderCredentials();
              } else {
                alert('Invalid file format. Please import a JSON or CSV file containing an array of credentials.');
              }
            } catch (error) {
              try {
                const csvData = e.target.result;
                const parsedData = parseCSV(csvData);
                saveCredentials(parsedData);
                renderCredentials();
              } catch (csvError) {
                alert('Error parsing file. Please ensure it is valid JSON or CSV.');
              }
            }
          };
          reader.readAsText(file);
        }
      });

      function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(value => value.trim());
          const entry = {};
          for (let j = 0; j < headers.length; j++) {
            entry[headers[j]] = values[j];
          }
          data.push(entry);
        }
        return data;
      }

      exportBtn.addEventListener('click', () => {
        const credentials = loadCredentials();
        const json = JSON.stringify(credentials, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'credentials.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      renderCredentials();
    });
