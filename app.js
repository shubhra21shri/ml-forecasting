/**
 * Frontend JavaScript for ML Forecasting Application
 * Handles API calls and UI updates
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Wizard Navigation
let currentStep = 1;
const totalSteps = 6;

function goToStep(step) {
    // Hide all pages
    document.querySelectorAll('.wizard-page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(`page-${step}`).classList.add('active');
    
    // Update step indicators
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.remove('active', 'completed');
        if (stepNum < step) {
            indicator.classList.add('completed');
        } else if (stepNum === step) {
            indicator.classList.add('active');
        }
    });
    
    currentStep = step;
}

function nextStep() {
    if (currentStep < totalSteps) {
        goToStep(currentStep + 1);
    }
}

function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

// Populate column dropdowns
function populateColumnDropdowns(columns) {
    if (!columns || columns.length === 0) return;
    
    // Populate date column dropdowns
    const dateDropdowns = ['date-column', 'train-date-column', 'forecast-date-column'];
    dateDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            // Keep first option (placeholder)
            const firstOption = dropdown.options[0];
            dropdown.innerHTML = '';
            if (firstOption) dropdown.appendChild(firstOption);
            
            columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                dropdown.appendChild(option);
            });
        }
    });
    
    // Populate value/target column dropdowns
    const valueDropdowns = ['value-column', 'train-target-column'];
    valueDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            const firstOption = dropdown.options[0];
            dropdown.innerHTML = '';
            if (firstOption) dropdown.appendChild(firstOption);
            
            columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                dropdown.appendChild(option);
            });
        }
    });
    
    // Populate category column dropdown (all columns can be categories)
    const categoryDropdown = document.getElementById('train-category-column');
    if (categoryDropdown) {
        // Keep first option (None)
        const firstOption = categoryDropdown.options[0];
        categoryDropdown.innerHTML = '';
        if (firstOption) categoryDropdown.appendChild(firstOption);
        
        columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            categoryDropdown.appendChild(option);
        });
    }
}

// Populate sheet dropdowns
function populateSheetDropdowns(sheets, selectedSheet = null) {
    if (!sheets || sheets.length === 0) return;
    
    // Populate all sheet dropdowns including preprocessing section
    const sheetDropdowns = ['eda-sheet-name', 'train-sheet-name', 'preprocess-sheet-name'];
    sheetDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">First Sheet (Default)</option>';
            sheets.forEach(sheet => {
                const option = document.createElement('option');
                option.value = sheet;
                option.textContent = sheet;
                if (selectedSheet && sheet === selectedSheet) {
                    option.selected = true;
                }
                dropdown.appendChild(option);
            });
            
            // Show the sheet selector if it's hidden (for preprocessing section)
            if (dropdownId === 'preprocess-sheet-name') {
                const selector = document.getElementById('preprocess-sheet-selector');
                if (selector) {
                    selector.style.display = 'block';
                }
            }
        }
    });
}

// Theme Toggle Functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleText = themeToggle.querySelector('.theme-toggle-text');
    const themeToggleIcon = themeToggle.querySelector('.theme-toggle-icon');
    
    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleUI(savedTheme);
    
    // Toggle theme on click
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggleUI(newTheme);
    });
    
    function updateThemeToggleUI(theme) {
        if (theme === 'light') {
            themeToggleText.textContent = 'Light Mode';
            themeToggleIcon.textContent = '☀️';
        } else {
            themeToggleText.textContent = 'Dark Mode';
            themeToggleIcon.textContent = '🌓';
        }
    }
}

// Initialize wizard on page load
// Check backend connection status
async function checkBackendConnection() {
    const statusElement = document.getElementById('backend-status');
    if (!statusElement) return false;
    
    // Set initial checking state
    statusElement.innerHTML = '<span style="color: #ff9800;">●</span> Checking connection...';
    statusElement.className = 'backend-status';
    
    // Create AbortController for timeout (more compatible than AbortSignal.timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    try {
        const baseUrl = API_BASE_URL.replace('/api', '');
        const response = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-cache' // Prevent caching
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            statusElement.innerHTML = '<span style="color: #4CAF50;">●</span> Backend Connected';
            statusElement.className = 'backend-status connected';
            statusElement.title = `Connected to ${baseUrl}`;
            return true;
        } else {
            throw new Error(`Backend returned status ${response.status}`);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        
        let errorMessage = 'Backend Disconnected';
        let errorTitle = `Cannot connect to ${API_BASE_URL.replace('/api', '')}`;
        
        if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.message.includes('aborted')) {
            errorMessage = 'Connection Timeout';
            errorTitle = `Backend server at ${API_BASE_URL.replace('/api', '')} is not responding. Please ensure it is running.`;
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ERR_CONNECTION_REFUSED')) {
            errorMessage = 'Backend Not Running';
            errorTitle = `❌ Backend server is not running!\n\n💡 To start the backend:\n1. Open a terminal\n2. Navigate to: ml_forecasting_app/backend\n3. Run: python main.py\n\nOr double-click: start_backend.bat`;
        } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS Error';
            errorTitle = 'Cross-origin request blocked. Check backend CORS settings.';
        }
        
        statusElement.innerHTML = `<span style="color: #f44336;">●</span> ${errorMessage}`;
        statusElement.className = 'backend-status disconnected';
        statusElement.title = errorTitle;
        
        // Also show a visible alert for first-time users
        if (!sessionStorage.getItem('backend-warning-shown')) {
            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 10000; max-width: 400px; font-family: Rajdhani, sans-serif;';
            alertDiv.innerHTML = `
                <strong>⚠️ Backend Server Not Running</strong><br>
                <p style="margin: 10px 0 0 0; font-size: 13px;">
                    Please start the backend server:<br>
                    <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">python backend/main.py</code>
                </p>
                <button onclick="this.parentElement.remove(); sessionStorage.setItem('backend-warning-shown', 'true');" 
                        style="margin-top: 10px; padding: 5px 15px; background: white; color: #f44336; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    Got it
                </button>
            `;
            document.body.appendChild(alertDiv);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                    sessionStorage.setItem('backend-warning-shown', 'true');
                }
            }, 10000);
        }
        
        console.error('Backend connection check failed:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    goToStep(1);
    
    // Check backend connection (non-blocking)
    setTimeout(() => {
        checkBackendConnection().catch(err => {
            console.error('Backend connection check error:', err);
        });
    }, 100); // Small delay to ensure DOM is fully ready
    
    listModels();
    updateHyperparameters();
    
    // Add click handlers to step indicators
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToStep(index + 1);
        });
    });
    
    // Populate preprocessing dropdowns when filename changes
    const preprocessFilenameInput = document.getElementById('preprocess-filename');
    if (preprocessFilenameInput) {
        preprocessFilenameInput.addEventListener('change', async () => {
            const filename = preprocessFilenameInput.value;
            if (filename) {
                // Refresh all dropdowns when preprocessing filename changes
                await refreshAllColumnDropdowns(filename);
            }
        });
    }
    
    // Populate training dropdowns when train filename changes
    const trainFilenameInput = document.getElementById('train-filename');
    if (trainFilenameInput) {
        trainFilenameInput.addEventListener('change', async () => {
            const filename = trainFilenameInput.value;
            if (filename) {
                // Refresh all dropdowns when train filename changes
                await refreshAllColumnDropdowns(filename);
            }
        });
    }
});

// Store column names globally
let availableColumns = [];
let availableSheets = [];

// Utility functions
function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Don't clear forecast-results if it contains forecast data (has download buttons)
    const isForecastResults = elementId === 'forecast-results';
    const hasForecastContent = isForecastResults && element.innerHTML.includes('Download as CSV');
    
    if (hasForecastContent) {
        // Create or update a separate status element for forecast
        let statusElement = document.getElementById('forecast-status-message');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'forecast-status-message';
            statusElement.className = `status-message ${type}`;
            element.insertBefore(statusElement, element.firstChild);
        } else {
            statusElement.className = `status-message ${type}`;
        }
        statusElement.textContent = message;
        // Clear status message after 5 seconds, but keep forecast results
        setTimeout(() => {
            if (statusElement) {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }
        }, 5000);
    } else {
        // Normal behavior for other elements
        element.textContent = message;
        element.className = `status-message ${type}`;
        setTimeout(() => {
            // Only clear if it's still a status message (not forecast results)
            if (!element.innerHTML.includes('Download as CSV')) {
                element.textContent = '';
                element.className = 'status-message';
            }
        }, 5000);
    }
}

function displayResults(elementId, data) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// Display forecast results with download option
function displayForecastResults(elementId, data) {
    const element = document.getElementById(elementId);
    
    // Clear any existing status messages
    const statusElement = document.getElementById('forecast-status-message');
    if (statusElement) {
        statusElement.remove();
    }
    
    // Check if this is category-based forecast
    if (data.is_category_based && data.category_forecasts) {
        let html = `
            <div class="forecast-results-container">
                <h3 style="color: #667eea; margin-bottom: 15px;">📈 Category-Based Forecast Results</h3>
                <div style="margin-bottom: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                    <p style="margin-bottom: 10px; font-weight: bold; color: #2e7d32;">💾 Download Options:</p>
                    <button onclick="downloadCategoryForecast('csv')" class="btn btn-success" style="margin-right: 10px; font-size: 1em; padding: 12px 24px;">
                        📥 Download Overall as CSV
                    </button>
                    <button onclick="downloadCategoryForecast('xlsx')" class="btn btn-success" style="font-size: 1em; padding: 12px 24px;">
                        📥 Download Overall as Excel
                    </button>
                    <button onclick="downloadAllCategoriesForecast('csv')" class="btn btn-success" style="margin-left: 10px; font-size: 1em; padding: 12px 24px;">
                        📥 Download All Categories as CSV
                    </button>
                    <p style="margin-top: 10px; font-size: 12px; color: #666;">
                        <em>Download overall forecast (sum) or all categories separately.</em>
                    </p>
                </div>
                <div class="forecast-summary">
                    <p><strong>Category Column:</strong> ${data.category_column || 'N/A'}</p>
                    <p><strong>Total Categories:</strong> ${data.categories?.length || 0}</p>
                    <p><strong>Overall Forecast Horizon:</strong> ${data.predictions?.length || 0} steps</p>
                    ${data.future_dates ? `<p><strong>Date Range:</strong> ${data.future_dates[0]} to ${data.future_dates[data.future_dates.length - 1]}</p>` : ''}
                </div>
                <div style="margin-top: 20px;">
                    <h4>Overall Forecast Values (Sum of All Categories):</h4>
        `;
        
        // Display overall forecast table
        html += '<table class="forecast-table" style="width: 100%; margin-top: 10px;"><thead><tr><th>Date/Step</th><th>Forecast</th>';
        if (data.lower_bound && data.upper_bound) {
            html += '<th>Lower Bound</th><th>Upper Bound</th>';
        }
        html += '</tr></thead><tbody>';
        
        for (let i = 0; i < data.predictions.length; i++) {
            html += '<tr>';
            html += `<td>${data.future_dates && data.future_dates[i] ? data.future_dates[i] : `Step ${i + 1}`}</td>`;
            html += `<td>${data.predictions[i]?.toFixed(4) || 'N/A'}</td>`;
            if (data.lower_bound && data.upper_bound) {
                html += `<td>${data.lower_bound[i]?.toFixed(4) || 'N/A'}</td>`;
                html += `<td>${data.upper_bound[i]?.toFixed(4) || 'N/A'}</td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table></div>';
        
        // Display per-category summary
        html += '<div style="margin-top: 30px;"><h4>Per-Category Forecast Summary:</h4>';
        Object.keys(data.category_forecasts).forEach(category => {
            const catForecast = data.category_forecasts[category];
            if (catForecast.error) {
                html += `<p style="color: #dc3545;"><strong>${category}:</strong> Error - ${catForecast.error}</p>`;
            } else {
                html += `<p><strong>${category}:</strong> ${catForecast.predictions?.length || 0} predictions generated</p>`;
            }
        });
        html += '</div>';
        
        html += '</div>';
        element.innerHTML = html;
        return;
    }
    
    // Standard single forecast display
    let html = `
        <div class="forecast-results-container">
            <h3 style="color: #667eea; margin-bottom: 15px;">📈 Forecast Results</h3>
            <div style="margin-bottom: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <p style="margin-bottom: 10px; font-weight: bold; color: #2e7d32;">💾 Download Options:</p>
                <button onclick="downloadForecast('csv')" class="btn btn-success" style="margin-right: 10px; font-size: 1em; padding: 12px 24px;">
                    📥 Download as CSV
                </button>
                <button onclick="downloadForecast('xlsx')" class="btn btn-success" style="font-size: 1em; padding: 12px 24px;">
                    📥 Download as Excel
                </button>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    <em>These download buttons will remain available. You can download the forecast results anytime.</em>
                </p>
            </div>
            <div class="forecast-summary">
                <p><strong>Horizon:</strong> ${data.horizon || data.predictions?.length || 0} steps</p>
                <p><strong>Predictions Generated:</strong> ${data.predictions?.length || 0}</p>
                ${data.future_dates ? `<p><strong>Date Range:</strong> ${data.future_dates[0]} to ${data.future_dates[data.future_dates.length - 1]}</p>` : ''}
            </div>
            <div style="margin-top: 20px;">
                <h4>Forecast Values:</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table class="forecast-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #667eea; color: white;">
                                <th style="padding: 10px; text-align: left;">Step</th>
                                ${data.future_dates ? '<th style="padding: 10px; text-align: left;">Date</th>' : ''}
                                <th style="padding: 10px; text-align: left;">Forecast</th>
                                ${data.lower_bound ? '<th style="padding: 10px; text-align: left;">Lower Bound</th>' : ''}
                                ${data.upper_bound ? '<th style="padding: 10px; text-align: left;">Upper Bound</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.predictions.map((pred, idx) => `
                                <tr style="border-bottom: 1px solid #e0e0e0;">
                                    <td style="padding: 8px;">${idx + 1}</td>
                                    ${data.future_dates ? `<td style="padding: 8px;">${data.future_dates[idx] || ''}</td>` : ''}
                                    <td style="padding: 8px; font-weight: bold;">${typeof pred === 'number' ? pred.toFixed(4) : pred}</td>
                                    ${data.lower_bound ? `<td style="padding: 8px;">${typeof data.lower_bound[idx] === 'number' ? data.lower_bound[idx].toFixed(4) : data.lower_bound[idx] || '-'}</td>` : ''}
                                    ${data.upper_bound ? `<td style="padding: 8px;">${typeof data.upper_bound[idx] === 'number' ? data.upper_bound[idx].toFixed(4) : data.upper_bound[idx] || '-'}</td>` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    element.innerHTML = html;
}

// Toggle forecast mode (existing file vs new file upload)
function toggleForecastMode() {
    const mode = document.querySelector('input[name="forecast-mode"]:checked').value;
    const existingMode = document.getElementById('forecast-existing-mode');
    const newMode = document.getElementById('forecast-new-mode');
    
    if (mode === 'existing') {
        existingMode.style.display = 'block';
        newMode.style.display = 'none';
    } else {
        existingMode.style.display = 'none';
        newMode.style.display = 'block';
    }
}

// Toggle forecast range type (horizon vs date range)
function toggleForecastRange() {
    const rangeType = document.getElementById('forecast-range-type').value;
    const horizonGroup = document.getElementById('forecast-horizon-group');
    const daterangeGroup = document.getElementById('forecast-daterange-group');
    
    if (rangeType === 'horizon') {
        horizonGroup.style.display = 'block';
        daterangeGroup.style.display = 'none';
    } else {
        horizonGroup.style.display = 'none';
        daterangeGroup.style.display = 'block';
    }
}

// Toggle forecast range type for new file upload
function toggleForecastRangeNew() {
    const rangeType = document.getElementById('forecast-range-type-new').value;
    const daterangeGroup = document.getElementById('forecast-daterange-group-new');
    
    if (rangeType === 'all') {
        daterangeGroup.style.display = 'none';
    } else {
        daterangeGroup.style.display = 'block';
    }
}

// Handle file selection for forecast
function handleForecastFileSelect() {
    const fileInput = document.getElementById('forecast-file-input');
    const file = fileInput.files[0];
    const sheetSelector = document.getElementById('forecast-sheet-selector-new');
    const sheetSelect = document.getElementById('forecast-sheet-select-new');
    
    if (!file) {
        if (sheetSelector) {
            sheetSelector.style.display = 'none';
        }
        return;
    }
    
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    // Show sheet selector for Excel files
    if (isExcel) {
        if (sheetSelector) {
            sheetSelector.style.display = 'block';
        }
        if (sheetSelect) {
            sheetSelect.innerHTML = '<option value="">Loading sheets...</option>';
            
            // Read Excel file client-side to get sheet names
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', sheetStubs: true });
                    
                    if (workbook.SheetNames && workbook.SheetNames.length > 0) {
                        sheetSelect.innerHTML = '<option value="">First Sheet (Default)</option>';
                        workbook.SheetNames.forEach(sheet => {
                            const option = document.createElement('option');
                            option.value = sheet;
                            option.textContent = sheet;
                            sheetSelect.appendChild(option);
                        });
                    } else {
                        sheetSelect.innerHTML = '<option value="">No sheets found</option>';
                    }
                } catch (error) {
                    console.error('Error reading Excel file:', error);
                    sheetSelect.innerHTML = '<option value="">Error reading file</option>';
                }
            };
            
            reader.onerror = function(error) {
                console.error('FileReader error:', error);
                sheetSelect.innerHTML = '<option value="">Error reading file</option>';
            };
            
            reader.readAsArrayBuffer(file);
        }
    } else {
        if (sheetSelector) {
            sheetSelector.style.display = 'none';
        }
    }
}

// Generate forecast with uploaded file
async function generateForecastWithFile() {
    const modelName = document.getElementById('forecast-model-name-new').value;
    const fileInput = document.getElementById('forecast-file-input');
    const file = fileInput.files[0];
    const sheetName = document.getElementById('forecast-sheet-select-new')?.value || '';
    const dateColumn = document.getElementById('forecast-date-column-new')?.value || '';
    
    if (!modelName) {
        showStatus('forecast-results', 'Please enter model name', 'error');
        return;
    }
    
    if (!file) {
        showStatus('forecast-results', 'Please select a file to upload', 'error');
        return;
    }
    
    try {
        showStatus('forecast-results', 'Uploading file and generating forecast...', 'info');
        
        const formData = new FormData();
        formData.append('model_name', modelName);
        formData.append('file', file);
        formData.append('include_confidence', 'true');
        
        if (sheetName) {
            formData.append('sheet_name', sheetName);
        }
        if (dateColumn) {
            formData.append('date_column', dateColumn);
        }
        
        const response = await fetch(`${API_BASE_URL}/forecast/predict-with-file`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Store forecast data globally for download
            window.lastForecastData = result.data;
            window.lastForecastModelName = modelName;
            window.lastForecastFilename = null; // No filename for uploaded file
            window.lastForecastDateColumn = dateColumn;
            window.lastForecastHorizon = result.data.predictions?.length || 0;
            
            displayForecastResults('forecast-results', result.data);
            
            // Plot forecast - check if category-based
            if (result.data.is_category_based && result.data.category_forecasts) {
                plotCategoryForecasts(result.data);
            } else {
                plotForecast(result.data);
            }
        } else {
            showStatus('forecast-results', result.detail || 'Forecast failed', 'error');
        }
    } catch (error) {
        showStatus('forecast-results', `Error: ${error.message}`, 'error');
        console.error('Forecast error:', error);
    }
}

// Download forecast function
async function downloadForecast(format = 'csv') {
    if (!window.lastForecastData) {
        showStatus('forecast-results', 'No forecast data available. Please generate a forecast first.', 'error');
        return;
    }
    
    try {
        showStatus('forecast-results', `Preparing ${format.toUpperCase()} download...`, 'info');
        
        const requestBody = {
            model_name: window.lastForecastModelName,
            horizon: window.lastForecastHorizon,
            format: format,
            include_confidence: true
        };
        
        if (window.lastForecastFilename) {
            requestBody.filename = window.lastForecastFilename;
        }
        if (window.lastForecastDateColumn) {
            requestBody.date_column = window.lastForecastDateColumn;
        }
        
        const response = await fetch(`${API_BASE_URL}/forecast/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || 'Download failed');
        }
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `forecast_${new Date().getTime()}.${format}`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showStatus('forecast-results', `Download started: ${filename}`, 'success');
    } catch (error) {
        showStatus('forecast-results', `Download error: ${error.message}`, 'error');
        console.error('Download error:', error);
    }
}

// Display model training results with metrics
function displayTrainingResults(elementId, data) {
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.error(`Element with id '${elementId}' not found`);
        return;
    }
    
    if (!data) {
        console.error('No data provided to displayTrainingResults');
        element.innerHTML = '<p style="color: red;">Error: No data received</p>';
        return;
    }
    
    console.log('Displaying training results for:', data.model_type, 'Metrics:', data.metrics);
    console.log('Data keys:', Object.keys(data));
    console.log('Has category_results?', !!data.category_results);
    console.log('Has categories?', !!data.categories);
    console.log('Metrics structure:', {
        has_metrics: !!data.metrics,
        metrics_keys: data.metrics ? Object.keys(data.metrics) : [],
        validation: data.metrics?.validation,
        test: data.metrics?.test,
        train: data.metrics?.train
    });
    
    try {
        // Check if this is category-based training
        if (data.category_results && data.categories && Array.isArray(data.categories)) {
        console.log('Processing category-based results. Categories:', data.categories);
        console.log('Category results:', data.category_results);
        // Display category-based results
        let html = `
            <div class="training-results-container">
                <h2 style="color: #667eea; margin-bottom: 20px;">✅ Category-Based Model Training Completed</h2>
                <div class="model-info-card">
                    <h3>📋 Training Summary</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Model Type:</span>
                            <span class="info-value">${data.model_type?.toUpperCase() || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Category Column:</span>
                            <span class="info-value">${data.category_column || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Categories:</span>
                            <span class="info-value">${data.total_categories || 0}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Successful:</span>
                            <span class="info-value" style="color: #28a745;">${data.successful_categories || 0}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Failed:</span>
                            <span class="info-value" style="color: #dc3545;">${data.failed_categories || 0}</span>
                        </div>
                    </div>
                </div>
        `;
        
        // Display aggregated metrics for entire dataset if available
        if (data.aggregated_metrics && Object.keys(data.aggregated_metrics).length > 0) {
            const aggMetrics = data.aggregated_metrics;
            html += `
                <div class="metrics-card" style="margin-top: 20px; border-left: 4px solid #C9A961; background: linear-gradient(135deg, rgba(201, 169, 97, 0.05) 0%, rgba(201, 169, 97, 0.02) 100%);">
                    <h3 style="color: #C9A961; font-size: 1.5em; margin-bottom: 15px;">📊 Overall Dataset Performance (Aggregated Across All Categories)</h3>
            `;
            
            // Training metrics
            if (aggMetrics.train && Object.keys(aggMetrics.train).length > 0) {
                html += `
                    <div class="metrics-section">
                        <h4 style="color: #667eea; font-size: 1.2em; margin-bottom: 10px;">📊 Training Set Performance (Overall)</h4>
                        <div class="metrics-grid">
                            ${aggMetrics.train && aggMetrics.train.mae !== undefined && aggMetrics.train.mae !== null && !isNaN(aggMetrics.train.mae) ? `
                                <div class="metric-item">
                                    <span class="metric-label">MAE</span>
                                    <span class="metric-value">${Number(aggMetrics.train.mae).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.train && aggMetrics.train.rmse !== undefined && aggMetrics.train.rmse !== null && !isNaN(aggMetrics.train.rmse) ? `
                                <div class="metric-item">
                                    <span class="metric-label">RMSE</span>
                                    <span class="metric-value">${Number(aggMetrics.train.rmse).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.train && aggMetrics.train.r2 !== undefined && aggMetrics.train.r2 !== null && !isNaN(aggMetrics.train.r2) ? `
                                <div class="metric-item">
                                    <span class="metric-label">R² Score</span>
                                    <span class="metric-value">${Number(aggMetrics.train.r2).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.train && aggMetrics.train.mape !== undefined && aggMetrics.train.mape !== null && !isNaN(aggMetrics.train.mape) ? `
                                <div class="metric-item">
                                    <span class="metric-label">MAPE (%)</span>
                                    <span class="metric-value">${Number(aggMetrics.train.mape).toFixed(2)}%</span>
                                </div>
                            ` : ''}
                            ${(() => {
                                let accuracy = null;
                                // Only use MAPE for accuracy (no R²)
                                if (aggMetrics.train && aggMetrics.train.mape !== undefined && aggMetrics.train.mape !== null && !isNaN(aggMetrics.train.mape)) {
                                    accuracy = Math.max(0, 100 - aggMetrics.train.mape);
                                }
                                if (accuracy !== null) {
                                    return `
                                        <div class="metric-item" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                            <span class="metric-label">Training Accuracy</span>
                                            <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    </div>
                `;
            }
            
            // Validation metrics
            if (aggMetrics.validation && Object.keys(aggMetrics.validation).length > 0) {
                html += `
                    <div class="metrics-section" style="margin-top: 20px;">
                        <h4 style="color: #FFA500; font-size: 1.2em; margin-bottom: 10px;">📊 Validation Set Performance (Overall)</h4>
                        <div class="metrics-grid">
                            ${aggMetrics.validation && aggMetrics.validation.mae !== undefined && aggMetrics.validation.mae !== null && !isNaN(aggMetrics.validation.mae) ? `
                                <div class="metric-item">
                                    <span class="metric-label">MAE</span>
                                    <span class="metric-value">${Number(aggMetrics.validation.mae).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.validation && aggMetrics.validation.rmse !== undefined && aggMetrics.validation.rmse !== null && !isNaN(aggMetrics.validation.rmse) ? `
                                <div class="metric-item">
                                    <span class="metric-label">RMSE</span>
                                    <span class="metric-value">${Number(aggMetrics.validation.rmse).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.validation && aggMetrics.validation.r2 !== undefined && aggMetrics.validation.r2 !== null && !isNaN(aggMetrics.validation.r2) ? `
                                <div class="metric-item">
                                    <span class="metric-label">R² Score</span>
                                    <span class="metric-value">${Number(aggMetrics.validation.r2).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.validation && aggMetrics.validation.mape !== undefined && aggMetrics.validation.mape !== null && !isNaN(aggMetrics.validation.mape) ? `
                                <div class="metric-item">
                                    <span class="metric-label">MAPE (%)</span>
                                    <span class="metric-value">${Number(aggMetrics.validation.mape).toFixed(2)}%</span>
                                </div>
                            ` : ''}
                            ${(() => {
                                let accuracy = null;
                                // Only use MAPE for accuracy (no R²)
                                if (aggMetrics.validation && aggMetrics.validation.mape !== undefined && aggMetrics.validation.mape !== null && !isNaN(aggMetrics.validation.mape)) {
                                    accuracy = Math.max(0, 100 - aggMetrics.validation.mape);
                                }
                                if (accuracy !== null) {
                                    return `
                                        <div class="metric-item" style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);">
                                            <span class="metric-label">Validation Accuracy</span>
                                            <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    </div>
                `;
            }
            
            // Test metrics
            if (aggMetrics.test && Object.keys(aggMetrics.test).length > 0) {
                html += `
                    <div class="metrics-section" style="margin-top: 20px;">
                        <h4 style="color: #dc3545; font-size: 1.2em; margin-bottom: 10px;">📊 Test Set Performance (Overall)</h4>
                        <div class="metrics-grid">
                            ${aggMetrics.test && aggMetrics.test.mae !== undefined && aggMetrics.test.mae !== null && !isNaN(aggMetrics.test.mae) ? `
                                <div class="metric-item">
                                    <span class="metric-label">MAE</span>
                                    <span class="metric-value">${Number(aggMetrics.test.mae).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.test && aggMetrics.test.rmse !== undefined && aggMetrics.test.rmse !== null && !isNaN(aggMetrics.test.rmse) ? `
                                <div class="metric-item">
                                    <span class="metric-label">RMSE</span>
                                    <span class="metric-value">${Number(aggMetrics.test.rmse).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.test && aggMetrics.test.r2 !== undefined && aggMetrics.test.r2 !== null && !isNaN(aggMetrics.test.r2) ? `
                                <div class="metric-item">
                                    <span class="metric-label">R² Score</span>
                                    <span class="metric-value">${Number(aggMetrics.test.r2).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${aggMetrics.test && aggMetrics.test.mape !== undefined && aggMetrics.test.mape !== null && !isNaN(aggMetrics.test.mape) ? `
                                <div class="metric-item">
                                    <span class="metric-label">MAPE (%)</span>
                                    <span class="metric-value">${Number(aggMetrics.test.mape).toFixed(2)}%</span>
                                </div>
                            ` : ''}
                            ${(() => {
                                let accuracy = null;
                                // Only use MAPE for accuracy (no R²)
                                if (aggMetrics.test && aggMetrics.test.mape !== undefined && aggMetrics.test.mape !== null && !isNaN(aggMetrics.test.mape)) {
                                    accuracy = Math.max(0, 100 - aggMetrics.test.mape);
                                } else if (aggMetrics.overall_accuracy !== undefined && aggMetrics.overall_accuracy !== null && !isNaN(aggMetrics.overall_accuracy)) {
                                    accuracy = Number(aggMetrics.overall_accuracy);
                                }
                                if (accuracy !== null) {
                                    return `
                                        <div class="metric-item" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); grid-column: span 2;">
                                            <span class="metric-label" style="font-size: 1.2em;">🎯 Overall Dataset Accuracy</span>
                                            <span class="metric-value" style="font-size: 3em; margin-top: 10px;">${accuracy.toFixed(2)}%</span>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    </div>
                `;
            }
            
            html += `</div>`;
        }
        
        // Display results for each category
        data.categories.forEach(category => {
            const categoryResult = data.category_results[category];
            if (categoryResult && categoryResult.error) {
                // Show error for this category
                html += `
                    <div class="metrics-card" style="margin-top: 20px; border-left: 4px solid #dc3545;">
                        <h3 style="color: #dc3545;">❌ Category: ${category}</h3>
                        <p style="color: #dc3545;">Error: ${categoryResult.error}</p>
                        ${categoryResult.rows ? `<p>Rows: ${categoryResult.rows}</p>` : ''}
                    </div>
                `;
            } else if (categoryResult) {
                // Calculate accuracy metrics for summary (MAPE-based as default)
                const metrics = categoryResult.metrics || {};
                let trainAccuracy = null;
                let valAccuracy = null;
                let testAccuracy = null;
                
                // Training Accuracy - MAPE ONLY (no R²)
                if (metrics.train_mape !== undefined && metrics.train_mape !== null && !isNaN(metrics.train_mape)) {
                    trainAccuracy = Math.max(0, 100 - metrics.train_mape);
                } else if (metrics.mape !== undefined && metrics.mape !== null && !isNaN(metrics.mape)) {
                    trainAccuracy = Math.max(0, 100 - metrics.mape);
                }
                
                // Validation Accuracy - MAPE ONLY (no R²)
                if (metrics.validation_mape !== undefined && metrics.validation_mape !== null && !isNaN(metrics.validation_mape)) {
                    valAccuracy = Math.max(0, 100 - metrics.validation_mape);
                }
                
                // Test Accuracy - MAPE ONLY (no R²)
                if (metrics.test_mape !== undefined && metrics.test_mape !== null && !isNaN(metrics.test_mape)) {
                    testAccuracy = Math.max(0, 100 - metrics.test_mape);
                }
                
                // Show successful training results for this category with full accuracy matrix
                html += `
                    <div class="metrics-card" style="margin-top: 20px; border-left: 4px solid #28a745;">
                        <h3 style="color: #C9A961; font-size: 1.4em; margin-bottom: 15px;">✅ Category: ${category}</h3>
                        
                        <!-- Accuracy Summary -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, rgba(201, 169, 97, 0.05) 0%, rgba(201, 169, 97, 0.02) 100%); border-radius: 8px;">
                            ${trainAccuracy !== null ? `
                                <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 8px; color: white;">
                                    <div style="font-size: 0.9em; opacity: 0.9;">Training Accuracy</div>
                                    <div style="font-size: 2em; font-weight: bold;">${trainAccuracy.toFixed(2)}%</div>
                                </div>
                            ` : ''}
                            ${valAccuracy !== null ? `
                                <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); border-radius: 8px; color: white;">
                                    <div style="font-size: 0.9em; opacity: 0.9;">Validation Accuracy</div>
                                    <div style="font-size: 2em; font-weight: bold;">${valAccuracy.toFixed(2)}%</div>
                                </div>
                            ` : ''}
                            ${testAccuracy !== null ? `
                                <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); border-radius: 8px; color: white;">
                                    <div style="font-size: 0.9em; opacity: 0.9;">Test Accuracy</div>
                                    <div style="font-size: 2em; font-weight: bold;">${testAccuracy.toFixed(2)}%</div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="info-grid" style="margin-bottom: 15px;">
                            <div class="info-item">
                                <span class="info-label">Model Filename:</span>
                                <span class="info-value">${categoryResult.model_filename || 'N/A'}</span>
                            </div>
                            ${categoryResult.order ? `
                                <div class="info-item">
                                    <span class="info-label">Order (p, d, q):</span>
                                    <span class="info-value">${Array.isArray(categoryResult.order) ? categoryResult.order.join(', ') : categoryResult.order}</span>
                                </div>
                            ` : ''}
                            ${categoryResult.seasonal_order ? `
                                <div class="info-item">
                                    <span class="info-label">Seasonal Order (P, D, Q, s):</span>
                                    <span class="info-value">${Array.isArray(categoryResult.seasonal_order) ? categoryResult.seasonal_order.join(', ') : categoryResult.seasonal_order}</span>
                                </div>
                            ` : ''}
                        </div>
                `;
                
                // Display comprehensive metrics for this category
                if (categoryResult.metrics && Object.keys(categoryResult.metrics).length > 0) {
                    const metrics = categoryResult.metrics;
                    
                    // Check if LSTM format (train/validation objects)
                    if (metrics.train && metrics.validation && typeof metrics.train === 'object') {
                        // LSTM format
                        html += `
                            <div class="metrics-section">
                                <h4 style="color: #667eea; font-size: 1.2em; margin-bottom: 10px;">📊 Training Set Performance</h4>
                                <div class="metrics-grid">
                                    <div class="metric-item">
                                        <span class="metric-label">MAE (Mean Absolute Error)</span>
                                        <span class="metric-value">${metrics.train.mae?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">RMSE (Root Mean Squared Error)</span>
                                        <span class="metric-value">${metrics.train.rmse?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">R² Score</span>
                                        <span class="metric-value">${metrics.train.r2?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">MAPE (%)</span>
                                        <span class="metric-value">${metrics.train.mape?.toFixed(2) || 'N/A'}%</span>
                                    </div>
                                    ${(() => {
                                        let accuracy = null;
                                        // Priority: MAPE > R²
                                        if (metrics.train.mape !== undefined && metrics.train.mape !== null && !isNaN(metrics.train.mape)) {
                                            accuracy = Math.max(0, 100 - metrics.train.mape);
                                        } else if (metrics.train.r2 !== undefined && metrics.train.r2 !== null) {
                                            accuracy = Math.max(0, metrics.train.r2 * 100);
                                        }
                                        if (accuracy !== null) {
                                            return `
                                                <div class="metric-item" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                                                    <span class="metric-label">Training Accuracy</span>
                                                    <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                                </div>
                                            `;
                                        }
                                        return '';
                                    })()}
                                </div>
                            </div>
                            
                            <div class="metrics-section" style="margin-top: 20px;">
                                <h4 style="color: #FFA500; font-size: 1.2em; margin-bottom: 10px;">📊 Validation Set Performance</h4>
                                <div class="metrics-grid">
                                    <div class="metric-item">
                                        <span class="metric-label">MAE (Mean Absolute Error)</span>
                                        <span class="metric-value">${metrics.validation.mae?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">RMSE (Root Mean Squared Error)</span>
                                        <span class="metric-value">${metrics.validation.rmse?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">R² Score</span>
                                        <span class="metric-value">${metrics.validation.r2?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">MAPE (%)</span>
                                        <span class="metric-value">${metrics.validation.mape?.toFixed(2) || 'N/A'}%</span>
                                    </div>
                                    ${(() => {
                                        let accuracy = null;
                                        // Only use MAPE for accuracy (no R²)
                                        if (metrics.validation.mape !== undefined && metrics.validation.mape !== null && !isNaN(metrics.validation.mape)) {
                                            accuracy = Math.max(0, 100 - metrics.validation.mape);
                                        }
                                        if (accuracy !== null) {
                                            return `
                                                <div class="metric-item" style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);">
                                                    <span class="metric-label">Validation Accuracy</span>
                                                    <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                                </div>
                                            `;
                                        }
                                        return '';
                                    })()}
                                </div>
                            </div>
                        `;
                    } else {
                        // Standard format - show Training, Validation, and Test metrics
                        html += `
                            <div class="metrics-section">
                                <h4 style="color: #667eea; font-size: 1.2em; margin-bottom: 10px;">📊 Training Set Performance</h4>
                                <div class="metrics-grid">
                                    <div class="metric-item">
                                        <span class="metric-label">MAE</span>
                                        <span class="metric-value">${(metrics.train_mae !== undefined && metrics.train_mae !== null && !isNaN(metrics.train_mae)) ? Number(metrics.train_mae).toFixed(4) : ((metrics.mae !== undefined && metrics.mae !== null && !isNaN(metrics.mae)) ? Number(metrics.mae).toFixed(4) : 'N/A')}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">RMSE</span>
                                        <span class="metric-value">${(metrics.train_rmse !== undefined && metrics.train_rmse !== null && !isNaN(metrics.train_rmse)) ? Number(metrics.train_rmse).toFixed(4) : ((metrics.rmse !== undefined && metrics.rmse !== null && !isNaN(metrics.rmse)) ? Number(metrics.rmse).toFixed(4) : 'N/A')}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">R² Score</span>
                                        <span class="metric-value">${(metrics.train_r2 !== undefined && metrics.train_r2 !== null && !isNaN(metrics.train_r2)) ? Number(metrics.train_r2).toFixed(4) : ((metrics.r2 !== undefined && metrics.r2 !== null && !isNaN(metrics.r2)) ? Number(metrics.r2).toFixed(4) : 'N/A')}</span>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-label">MAPE (%)</span>
                                        <span class="metric-value">${(metrics.train_mape !== undefined && metrics.train_mape !== null && !isNaN(metrics.train_mape)) ? Number(metrics.train_mape).toFixed(2) : ((metrics.mape !== undefined && metrics.mape !== null && !isNaN(metrics.mape)) ? Number(metrics.mape).toFixed(2) : 'N/A')}%</span>
                                    </div>
                                    ${metrics.aic !== undefined ? `
                                        <div class="metric-item">
                                            <span class="metric-label">AIC</span>
                                            <span class="metric-value">${metrics.aic.toFixed(2)}</span>
                                        </div>
                                    ` : ''}
                                    ${metrics.bic !== undefined ? `
                                        <div class="metric-item">
                                            <span class="metric-label">BIC</span>
                                            <span class="metric-value">${metrics.bic.toFixed(2)}</span>
                                        </div>
                                    ` : ''}
                                        ${(() => {
                                            let accuracy = null;
                                            // Only use MAPE for accuracy (no R²)
                                            if (metrics.train_mape !== undefined && metrics.train_mape !== null && !isNaN(metrics.train_mape)) {
                                                accuracy = Math.max(0, 100 - metrics.train_mape);
                                            } else if (metrics.mape !== undefined && metrics.mape !== null && !isNaN(metrics.mape)) {
                                                accuracy = Math.max(0, 100 - metrics.mape);
                                            }
                                            if (accuracy !== null) {
                                                return `
                                                    <div class="metric-item" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                                                        <span class="metric-label">Training Accuracy</span>
                                                        <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                                    </div>
                                                `;
                                            }
                                            return '';
                                        })()}
                                </div>
                            </div>
                        `;
                        
                        // Validation metrics - Always show section if any validation metric exists
                        const hasValidationMetrics = metrics.validation_mae !== undefined || 
                                                    metrics.validation_rmse !== undefined || 
                                                    metrics.validation_r2 !== undefined || 
                                                    metrics.validation_mape !== undefined;
                        
                        if (hasValidationMetrics) {
                            html += `
                                <div class="metrics-section" style="margin-top: 20px;">
                                    <h4 style="color: #FFA500; font-size: 1.2em; margin-bottom: 10px;">📊 Validation Set Performance</h4>
                                    <div class="metrics-grid">
                                        ${metrics.validation_mae !== undefined && metrics.validation_mae !== null && !isNaN(metrics.validation_mae) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">MAE (Mean Absolute Error)</span>
                                                <span class="metric-value">${Number(metrics.validation_mae).toFixed(4)}</span>
                                            </div>
                                        ` : ''}
                                        ${metrics.validation_rmse !== undefined && metrics.validation_rmse !== null && !isNaN(metrics.validation_rmse) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">RMSE (Root Mean Squared Error)</span>
                                                <span class="metric-value">${Number(metrics.validation_rmse).toFixed(4)}</span>
                                            </div>
                                        ` : ''}
                                        ${metrics.validation_r2 !== undefined && metrics.validation_r2 !== null && !isNaN(metrics.validation_r2) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">R² Score</span>
                                                <span class="metric-value">${Number(metrics.validation_r2).toFixed(4)}</span>
                                            </div>
                                        ` : ''}
                                        ${metrics.validation_mape !== undefined && metrics.validation_mape !== null && !isNaN(metrics.validation_mape) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">MAPE (%)</span>
                                                <span class="metric-value">${Number(metrics.validation_mape).toFixed(2)}%</span>
                                            </div>
                                        ` : ''}
                                        ${(() => {
                                            let accuracy = null;
                                            // Only use MAPE for accuracy (no R²)
                                            if (metrics.validation_mape !== undefined && metrics.validation_mape !== null && !isNaN(metrics.validation_mape)) {
                                                accuracy = Math.max(0, 100 - metrics.validation_mape);
                                            }
                                            if (accuracy !== null) {
                                                return `
                                                    <div class="metric-item" style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); grid-column: span 2;">
                                                        <span class="metric-label" style="font-size: 1.1em;">🎯 Validation Set Accuracy</span>
                                                        <span class="metric-value" style="font-size: 2.5em; margin-top: 10px;">${accuracy.toFixed(2)}%</span>
                                                    </div>
                                                `;
                                            }
                                            return '';
                                        })()}
                                    </div>
                                </div>
                            `;
                        } else {
                            // Show message if validation metrics are not available
                            html += `
                                <div class="metrics-section" style="margin-top: 20px; padding: 15px; background: rgba(255, 165, 0, 0.1); border-left: 4px solid #FFA500;">
                                    <h4 style="color: #FFA500; font-size: 1.2em; margin-bottom: 10px;">📊 Validation Set Performance</h4>
                                    <p style="color: #666;">⚠️ Validation metrics not available. This may be due to insufficient validation data or validation_size being set to 0.</p>
                                </div>
                            `;
                        }
                        
                        // Test metrics
                        if (metrics.test_mae !== undefined || metrics.test_rmse !== undefined || metrics.test_r2 !== undefined) {
                            html += `
                                <div class="metrics-section" style="margin-top: 20px;">
                                    <h4 style="color: #dc3545; font-size: 1.2em; margin-bottom: 10px;">📊 Test Set Performance</h4>
                                    <div class="metrics-grid">
                                        ${metrics.test_mae !== undefined && metrics.test_mae !== null && !isNaN(metrics.test_mae) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">MAE</span>
                                                <span class="metric-value">${Number(metrics.test_mae).toFixed(4)}</span>
                                            </div>
                                        ` : ''}
                                        ${metrics.test_rmse !== undefined && metrics.test_rmse !== null && !isNaN(metrics.test_rmse) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">RMSE</span>
                                                <span class="metric-value">${Number(metrics.test_rmse).toFixed(4)}</span>
                                            </div>
                                        ` : ''}
                                        ${metrics.test_r2 !== undefined && metrics.test_r2 !== null && !isNaN(metrics.test_r2) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">R² Score</span>
                                                <span class="metric-value">${Number(metrics.test_r2).toFixed(4)}</span>
                                            </div>
                                        ` : ''}
                                        ${metrics.test_mape !== undefined && metrics.test_mape !== null && !isNaN(metrics.test_mape) ? `
                                            <div class="metric-item">
                                                <span class="metric-label">MAPE (%)</span>
                                                <span class="metric-value">${Number(metrics.test_mape).toFixed(2)}%</span>
                                            </div>
                                        ` : ''}
                                        ${(() => {
                                            let accuracy = null;
                                            // Only use MAPE for accuracy (no R²)
                                            if (metrics.test_mape !== undefined && metrics.test_mape !== null && !isNaN(metrics.test_mape)) {
                                                accuracy = Math.max(0, 100 - metrics.test_mape);
                                            }
                                            if (accuracy !== null) {
                                                return `
                                                    <div class="metric-item" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); grid-column: span 2;">
                                                        <span class="metric-label" style="font-size: 1.1em;">🎯 Test Set Accuracy</span>
                                                        <span class="metric-value" style="font-size: 2.5em; margin-top: 10px;">${accuracy.toFixed(2)}%</span>
                                                    </div>
                                                `;
                                            }
                                            return '';
                                        })()}
                                    </div>
                                </div>
                            `;
                        }
                    }
                }
                
                html += `</div>`;
            }
        });
        
        html += `</div>`;
        element.innerHTML = html;
        return;
        }
        
        // Original single model display logic
    let html = `
        <div class="training-results-container">
            <h2 style="color: #667eea; margin-bottom: 20px;">✅ Model Training Completed</h2>
            
            <div class="model-info-card">
                <h3>📋 Model Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Model Type:</span>
                        <span class="info-value">${data.model_type?.toUpperCase() || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Model Filename:</span>
                        <span class="info-value">${data.model_filename || 'N/A'}</span>
                    </div>
                    ${data.order ? `
                        <div class="info-item">
                            <span class="info-label">Order (p, d, q):</span>
                            <span class="info-value">${Array.isArray(data.order) ? data.order.join(', ') : data.order}</span>
                        </div>
                    ` : ''}
                    ${data.seasonal_order ? `
                        <div class="info-item">
                            <span class="info-label">Seasonal Order (P, D, Q, s):</span>
                            <span class="info-value">${Array.isArray(data.seasonal_order) ? data.seasonal_order.join(', ') : data.seasonal_order}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
    `;
    
    // Display ensemble weights and individual model info if this is an Ensemble model
    if (data.model_type && data.model_type.toLowerCase() === 'ensemble' && data.weights) {
        html += `
            <div class="model-info-card" style="margin-top: 20px; border-left: 4px solid #C9A961;">
                <h3 style="color: #C9A961;">⚖️ Ensemble Weights</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Prophet Weight:</span>
                        <span class="info-value" style="color: #C9A961; font-weight: bold;">${((data.weights.prophet !== undefined && data.weights.prophet !== null && !isNaN(data.weights.prophet)) ? Number(data.weights.prophet) * 100 : 0).toFixed(2)}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">SARIMAX Weight:</span>
                        <span class="info-value" style="color: #C9A961; font-weight: bold;">${((data.weights.sarimax !== undefined && data.weights.sarimax !== null && !isNaN(data.weights.sarimax)) ? Number(data.weights.sarimax) * 100 : 0).toFixed(2)}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">GBM Weight:</span>
                        <span class="info-value" style="color: #C9A961; font-weight: bold;">${((data.weights.gbm !== undefined && data.weights.gbm !== null && !isNaN(data.weights.gbm)) ? Number(data.weights.gbm) * 100 : 0).toFixed(2)}%</span>
                    </div>
                </div>
                <p style="margin-top: 15px; font-size: 13px; color: #a0a0a0; line-height: 1.6;">
                    <strong>💡 How Ensemble Works:</strong> The ensemble combines predictions from Prophet, SARIMAX, and GBM models using inverse-RMSE weighting based on validation set performance. Models with RMSE > 1.35× best RMSE are excluded. The best model receives at least 80% weight.
                </p>
            </div>
        `;
        
        // Display individual model status if available
        if (data.ensemble_models) {
            html += `
                <div class="model-info-card" style="margin-top: 20px;">
                    <h3>🔧 Individual Model Status</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Prophet:</span>
                            <span class="info-value" style="color: ${data.ensemble_models.prophet?.model ? '#28a745' : '#dc3545'};">${data.ensemble_models.prophet?.model ? '✅ Trained' : '❌ Failed'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">SARIMAX:</span>
                            <span class="info-value" style="color: ${data.ensemble_models.sarimax?.model ? '#28a745' : '#dc3545'};">${data.ensemble_models.sarimax?.model ? '✅ Trained' : '❌ Failed'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">GBM:</span>
                            <span class="info-value" style="color: ${data.ensemble_models.gbm?.model ? '#28a745' : '#dc3545'};">${data.ensemble_models.gbm?.model ? '✅ Trained' : '❌ Failed'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Display metrics based on model type
    if (data.metrics && Object.keys(data.metrics).length > 0) {
        html += `
            <div class="metrics-card">
                <h3>📊 Model Performance Metrics</h3>
        `;
        
        // Ensemble models have validation/test split (no train metrics)
        if (data.model_type && data.model_type.toLowerCase() === 'ensemble' && 
            data.metrics && data.metrics.validation && typeof data.metrics.validation === 'object' && 
            Object.keys(data.metrics.validation).length > 0) {
            html += `
                <div class="metrics-section">
                    <h4 style="color: #FFA500; font-size: 1.2em; margin-bottom: 10px;">📊 Validation Set Performance</h4>
                    <div class="metrics-grid">
                        ${data.metrics.validation.mae !== undefined && data.metrics.validation.mae !== null && !isNaN(data.metrics.validation.mae) ? `
                            <div class="metric-item">
                                <span class="metric-label">Validation MAE</span>
                                <span class="metric-value">${Number(data.metrics.validation.mae).toFixed(4)}</span>
                            </div>
                        ` : ''}
                        ${data.metrics.validation.rmse !== undefined && data.metrics.validation.rmse !== null && !isNaN(data.metrics.validation.rmse) ? `
                            <div class="metric-item">
                                <span class="metric-label">Validation RMSE</span>
                                <span class="metric-value">${Number(data.metrics.validation.rmse).toFixed(4)}</span>
                            </div>
                        ` : ''}
                        ${data.metrics.validation.r2 !== undefined && data.metrics.validation.r2 !== null && !isNaN(data.metrics.validation.r2) ? `
                            <div class="metric-item">
                                <span class="metric-label">Validation R² Score</span>
                                <span class="metric-value">${Number(data.metrics.validation.r2).toFixed(4)}</span>
                            </div>
                        ` : ''}
                        ${data.metrics.validation.mape !== undefined && data.metrics.validation.mape !== null && !isNaN(data.metrics.validation.mape) ? `
                            <div class="metric-item">
                                <span class="metric-label">Validation MAPE (%)</span>
                                <span class="metric-value">${Number(data.metrics.validation.mape).toFixed(2)}%</span>
                            </div>
                        ` : ''}
                        ${(() => {
                            let accuracy = null;
                            if (data.metrics.validation.r2 !== undefined && data.metrics.validation.r2 !== null && !isNaN(data.metrics.validation.r2)) {
                                accuracy = Math.max(0, Math.min(100, data.metrics.validation.r2 * 100));
                            }
                            if (accuracy !== null && !isNaN(accuracy)) {
                                return `
                                    <div class="metric-item" style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);">
                                        <span class="metric-label">Validation Accuracy</span>
                                        <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                    </div>
                                `;
                            }
                            return '';
                        })()}
                    </div>
                </div>
            `;
            
            // Test metrics for ensemble
            if (data.metrics.test && typeof data.metrics.test === 'object') {
                html += `
                    <div class="metrics-section" style="margin-top: 20px;">
                        <h4 style="color: #dc3545; font-size: 1.2em; margin-bottom: 10px;">📊 Test Set Performance</h4>
                        <div class="metrics-grid">
                            ${data.metrics.test.mae !== undefined && data.metrics.test.mae !== null && !isNaN(data.metrics.test.mae) ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test MAE</span>
                                    <span class="metric-value">${Number(data.metrics.test.mae).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${data.metrics.test.rmse !== undefined && data.metrics.test.rmse !== null && !isNaN(data.metrics.test.rmse) ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test RMSE</span>
                                    <span class="metric-value">${Number(data.metrics.test.rmse).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${data.metrics.test.r2 !== undefined && data.metrics.test.r2 !== null && !isNaN(data.metrics.test.r2) ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test R² Score</span>
                                    <span class="metric-value">${Number(data.metrics.test.r2).toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${data.metrics.test.mape !== undefined && data.metrics.test.mape !== null && !isNaN(data.metrics.test.mape) ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test MAPE (%)</span>
                                    <span class="metric-value">${Number(data.metrics.test.mape).toFixed(2)}%</span>
                                </div>
                            ` : ''}
                            ${(() => {
                                let accuracy = null;
                                if (data.metrics.test.r2 !== undefined && data.metrics.test.r2 !== null && !isNaN(data.metrics.test.r2)) {
                                    accuracy = Math.max(0, Math.min(100, data.metrics.test.r2 * 100));
                                }
                                if (accuracy !== null && !isNaN(accuracy)) {
                                    return `
                                        <div class="metric-item" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
                                            <span class="metric-label">Test Accuracy</span>
                                            <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    </div>
                `;
            }
        }
        // LSTM models have train/validation split
        else if (data.metrics.train && data.metrics.validation && typeof data.metrics.train === 'object') {
            html += `
                <div class="metrics-section">
                    <h4>Training Metrics</h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">MAE (Mean Absolute Error)</span>
                            <span class="metric-value">${data.metrics.train.mae?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">RMSE (Root Mean Squared Error)</span>
                            <span class="metric-value">${data.metrics.train.rmse?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">R² Score</span>
                            <span class="metric-value">${data.metrics.train.r2?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">MAPE (%)</span>
                            <span class="metric-value">${data.metrics.train.mape?.toFixed(2) || 'N/A'}%</span>
                        </div>
                        ${(() => {
                            // Calculate training accuracy
                            let accuracy = null;
                            if (data.metrics.train.r2 !== undefined && data.metrics.train.r2 !== null) {
                                accuracy = Math.max(0, data.metrics.train.r2 * 100);
                            }
                            if (accuracy !== null) {
                                return `
                                    <div class="metric-item" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                                        <span class="metric-label">Training Accuracy</span>
                                        <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                    </div>
                                `;
                            }
                            return '';
                        })()}
                    </div>
                </div>
                
                <div class="metrics-section">
                    <h4>Validation Metrics</h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">MAE (Mean Absolute Error)</span>
                            <span class="metric-value">${data.metrics.validation.mae?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">RMSE (Root Mean Squared Error)</span>
                            <span class="metric-value">${data.metrics.validation.rmse?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">R² Score</span>
                            <span class="metric-value">${data.metrics.validation.r2?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">MAPE (%)</span>
                            <span class="metric-value">${data.metrics.validation.mape?.toFixed(2) || 'N/A'}%</span>
                        </div>
                        ${(() => {
                            // Calculate validation accuracy - check both formats
                            const valR2 = data.metrics.validation_r2 ?? data.metrics.validation?.r2;
                            const valMape = data.metrics.validation_mape ?? data.metrics.validation?.mape;
                            
                            console.log('LSTM Validation accuracy calculation:', {
                                validation_r2_flat: data.metrics.validation_r2,
                                validation_r2_nested: data.metrics.validation?.r2,
                                validation_mape_flat: data.metrics.validation_mape,
                                validation_mape_nested: data.metrics.validation?.mape,
                                valR2: valR2,
                                valMape: valMape
                            });
                            
                                let accuracy = null;
                                if (valR2 !== undefined && valR2 !== null && !isNaN(valR2)) {
                                    accuracy = Math.max(0, Math.min(100, valR2 * 100));
                                    console.log('Using R² for LSTM validation accuracy:', valR2, '->', accuracy);
                                }
                            
                            if (accuracy !== null && !isNaN(accuracy)) {
                                return `
                                    <div class="metric-item" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                                        <span class="metric-label">Validation Accuracy</span>
                                        <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                    </div>
                                `;
                            }
                            return '';
                        })()}
                    </div>
                </div>
            `;
        } else {
            // Standard metrics for ML models
            html += `
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span class="metric-label">MAE (Mean Absolute Error)</span>
                        <span class="metric-value">${data.metrics.mae !== undefined && data.metrics.mae !== null ? data.metrics.mae.toFixed(4) : (data.metrics.train_mae !== undefined && data.metrics.train_mae !== null ? data.metrics.train_mae.toFixed(4) : 'N/A')}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">RMSE (Root Mean Squared Error)</span>
                        <span class="metric-value">${data.metrics.rmse !== undefined && data.metrics.rmse !== null ? data.metrics.rmse.toFixed(4) : (data.metrics.train_rmse !== undefined && data.metrics.train_rmse !== null ? data.metrics.train_rmse.toFixed(4) : 'N/A')}</span>
                    </div>
                    ${(data.metrics.r2 !== undefined && data.metrics.r2 !== null) || (data.metrics.train_r2 !== undefined && data.metrics.train_r2 !== null) ? `
                        <div class="metric-item">
                            <span class="metric-label">R² Score</span>
                            <span class="metric-value">${data.metrics.r2 !== undefined && data.metrics.r2 !== null ? data.metrics.r2.toFixed(4) : (data.metrics.train_r2 !== undefined && data.metrics.train_r2 !== null ? data.metrics.train_r2.toFixed(4) : 'N/A')}</span>
                        </div>
                    ` : ''}
                    <div class="metric-item">
                        <span class="metric-label">MAPE (%)</span>
                        <span class="metric-value">${data.metrics.mape !== undefined && data.metrics.mape !== null ? data.metrics.mape.toFixed(2) : 'N/A'}%</span>
                    </div>
                    ${data.metrics.aic !== undefined ? `
                        <div class="metric-item">
                            <span class="metric-label">AIC (Akaike Information Criterion)</span>
                            <span class="metric-value">${data.metrics.aic?.toFixed(2) || 'N/A'}</span>
                        </div>
                    ` : ''}
                    ${data.metrics.bic !== undefined ? `
                        <div class="metric-item">
                            <span class="metric-label">BIC (Bayesian Information Criterion)</span>
                            <span class="metric-value">${data.metrics.bic?.toFixed(2) || 'N/A'}</span>
                        </div>
                    ` : ''}
                    ${(() => {
                        // Calculate accuracy percentage for standard ML models
                        let accuracy = null;
                        if (data.metrics.r2 !== undefined && data.metrics.r2 !== null) {
                            accuracy = Math.max(0, data.metrics.r2 * 100);
                        } else if (data.metrics.train_r2 !== undefined && data.metrics.train_r2 !== null) {
                            accuracy = Math.max(0, data.metrics.train_r2 * 100);
                        }
                        if (accuracy !== null) {
                            return `
                                <div class="metric-item" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                                    <span class="metric-label">Accuracy</span>
                                    <span class="metric-value" style="font-size: 2em;">${accuracy.toFixed(2)}%</span>
                                </div>
                            `;
                        }
                        return '';
                    })()}
                </div>
            `;
            
            // Show validation metrics if available (for all models)
            // Check both formats: validation_r2 (flat) or validation.r2 (nested)
            const hasValidationMetrics = (
                data.metrics.validation_mae !== undefined || 
                data.metrics.validation_rmse !== undefined || 
                data.metrics.validation_r2 !== undefined ||
                (data.metrics.validation && typeof data.metrics.validation === 'object' && (
                    data.metrics.validation.mae !== undefined ||
                    data.metrics.validation.rmse !== undefined ||
                    data.metrics.validation.r2 !== undefined
                ))
            );
            
            if (hasValidationMetrics) {
                // Get validation metrics from either format
                const valMae = data.metrics.validation_mae ?? data.metrics.validation?.mae;
                const valRmse = data.metrics.validation_rmse ?? data.metrics.validation?.rmse;
                const valR2 = data.metrics.validation_r2 ?? data.metrics.validation?.r2;
                const valMape = data.metrics.validation_mape ?? data.metrics.validation?.mape;
                
                html += `
                    <div class="metrics-section" style="margin-top: 20px;">
                        <h4 style="color: #FFA500; font-size: 1.3em; margin-bottom: 15px;">📊 Validation Set Performance</h4>
                        <div class="metrics-grid">
                            ${valMae !== undefined && valMae !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Validation MAE</span>
                                    <span class="metric-value">${valMae.toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${valRmse !== undefined && valRmse !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Validation RMSE</span>
                                    <span class="metric-value">${valRmse.toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${valR2 !== undefined && valR2 !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Validation R² Score</span>
                                    <span class="metric-value">${valR2.toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${valMape !== undefined && valMape !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Validation MAPE (%)</span>
                                    <span class="metric-value">${valMape.toFixed(2)}%</span>
                                </div>
                            ` : ''}
                            ${(() => {
                                // Calculate validation accuracy - prioritize R², fallback to MAPE
                                console.log('Validation accuracy calculation - Raw metrics:', {
                                    validation_r2_flat: data.metrics.validation_r2,
                                    validation_r2_nested: data.metrics.validation?.r2,
                                    validation_mape_flat: data.metrics.validation_mape,
                                    validation_mape_nested: data.metrics.validation?.mape,
                                    valR2: valR2,
                                    valMape: valMape
                                });
                                
                                let validationAccuracy = null;
                                if (valR2 !== undefined && valR2 !== null && !isNaN(valR2)) {
                                    // R² can be negative, so we clamp it to 0-100%
                                    validationAccuracy = Math.max(0, Math.min(100, valR2 * 100));
                                    console.log('Using R² for validation accuracy:', valR2, '->', validationAccuracy);
                                } else {
                                    console.log('No validation metrics found for accuracy calculation');
                                }
                                
                                if (validationAccuracy !== null && !isNaN(validationAccuracy)) {
                                    return `
                                        <div class="metric-item" style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); grid-column: span 2;">
                                            <span class="metric-label" style="font-size: 1.1em;">🎯 Validation Set Accuracy</span>
                                            <span class="metric-value" style="font-size: 2.5em; margin-top: 10px;">${validationAccuracy.toFixed(2)}%</span>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    </div>
                `;
            }
            
            // Show test metrics if available (for all models)
            // Check both formats: test_r2 (flat) or test.r2 (nested)
            const hasTestMetrics = (
                data.metrics.test_mae !== undefined || 
                data.metrics.test_rmse !== undefined || 
                data.metrics.test_r2 !== undefined ||
                (data.metrics.test && typeof data.metrics.test === 'object' && (
                    data.metrics.test.mae !== undefined ||
                    data.metrics.test.rmse !== undefined ||
                    data.metrics.test.r2 !== undefined
                ))
            );
            
            if (hasTestMetrics) {
                // Get test metrics from either format
                const testMae = data.metrics.test_mae ?? data.metrics.test?.mae;
                const testRmse = data.metrics.test_rmse ?? data.metrics.test?.rmse;
                const testR2 = data.metrics.test_r2 ?? data.metrics.test?.r2;
                const testMape = data.metrics.test_mape ?? data.metrics.test?.mape;
                
                html += `
                    <div class="metrics-section" style="margin-top: 20px;">
                        <h4 style="color: #dc3545; font-size: 1.3em; margin-bottom: 15px;">📊 Test Set Performance</h4>
                        <div class="metrics-grid">
                            ${testMae !== undefined && testMae !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test MAE</span>
                                    <span class="metric-value">${testMae.toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${testRmse !== undefined && testRmse !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test RMSE</span>
                                    <span class="metric-value">${testRmse.toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${testR2 !== undefined && testR2 !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test R² Score</span>
                                    <span class="metric-value">${testR2.toFixed(4)}</span>
                                </div>
                            ` : ''}
                            ${testMape !== undefined && testMape !== null ? `
                                <div class="metric-item">
                                    <span class="metric-label">Test MAPE (%)</span>
                                    <span class="metric-value">${testMape.toFixed(2)}%</span>
                                </div>
                            ` : ''}
                            ${(() => {
                                // Calculate test accuracy - prioritize R², fallback to MAPE
                                console.log('Test accuracy calculation - Raw metrics:', {
                                    test_r2_flat: data.metrics.test_r2,
                                    test_r2_nested: data.metrics.test?.r2,
                                    test_mape_flat: data.metrics.test_mape,
                                    test_mape_nested: data.metrics.test?.mape,
                                    testR2: testR2,
                                    testMape: testMape
                                });
                                
                                let testAccuracy = null;
                                if (testR2 !== undefined && testR2 !== null && !isNaN(testR2)) {
                                    // R² can be negative, so we clamp it to 0-100%
                                    testAccuracy = Math.max(0, Math.min(100, testR2 * 100));
                                    console.log('Using R² for test accuracy:', testR2, '->', testAccuracy);
                                } else {
                                    console.log('No test metrics found for accuracy calculation');
                                }
                                
                                if (testAccuracy !== null && !isNaN(testAccuracy)) {
                                    return `
                                        <div class="metric-item" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); grid-column: span 2;">
                                            <span class="metric-label" style="font-size: 1.1em;">🎯 Test Set Accuracy</span>
                                            <span class="metric-value" style="font-size: 2.5em; margin-top: 10px;">${testAccuracy.toFixed(2)}%</span>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    </div>
                `;
            }
        }
        
        html += `</div>`;
    } else {
        // If no metrics found, show a message and raw data for debugging
        html += `
            <div class="metrics-card">
                <h3>📊 Model Performance Metrics</h3>
                <p style="color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 5px;">
                    ⚠️ Metrics not available. Showing raw response data below for debugging.
                </p>
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; color: #667eea; font-weight: bold;">View Raw Response Data</summary>
                    <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `;
    }
    
    // Feature importance for tree-based models
    if (data.feature_importance && Object.keys(data.feature_importance).length > 0) {
        const features = Object.entries(data.feature_importance)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 features
        
        html += `
            <div class="feature-importance-card">
                <h3>🎯 Top Feature Importance</h3>
                <div class="feature-list">
                    ${features.map(([feature, importance]) => `
                        <div class="feature-item">
                            <span class="feature-name">${feature}</span>
                            <div class="feature-bar-container">
                                <div class="feature-bar" style="width: ${(importance * 100).toFixed(1)}%"></div>
                            </div>
                            <span class="feature-value">${(importance * 100).toFixed(2)}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Training history for LSTM
    if (data.training_history && data.training_history.loss) {
        html += `
            <div class="training-history-card">
                <h3>📈 Training History</h3>
                <p><em>Training history available. Loss and validation loss tracked during training.</em></p>
            </div>
        `;
    }
    
    // Display data leakage check results if available
    if (data.leakage_check) {
        const leakage = data.leakage_check;
        html += `
            <div class="metrics-card" style="margin-top: 20px; border-left: 4px solid ${leakage.has_leakage ? '#dc3545' : '#28a745'};">
                <h3 style="color: ${leakage.has_leakage ? '#dc3545' : '#28a745'};">
                    ${leakage.has_leakage ? '⚠️ Data Leakage Detected' : '✅ No Data Leakage'}
                </h3>
                <div style="margin-top: 10px;">
                    <p><strong>Summary:</strong> ${leakage.summary.critical_issues} critical issues, ${leakage.summary.warnings} warnings</p>
                    ${leakage.critical_issues && leakage.critical_issues.length > 0 ? `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(220, 53, 69, 0.1); border-radius: 5px;">
                            <strong style="color: #dc3545;">Critical Issues:</strong>
                            <ul style="margin-top: 5px;">
                                ${leakage.critical_issues.map(issue => `<li>${issue.message}<br><small>Fix: ${issue.fix}</small></li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${leakage.warnings && leakage.warnings.length > 0 ? `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(255, 193, 7, 0.1); border-radius: 5px;">
                            <strong style="color: #ffc107;">Warnings:</strong>
                            <ul style="margin-top: 5px;">
                                ${leakage.warnings.map(w => `<li>${w.message}${w.fix ? `<br><small>Fix: ${w.fix}</small>` : ''}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Display cross-validation results if available
    if (data.cross_validation && data.cross_validation.success) {
        const cv = data.cross_validation;
        html += `
            <div class="metrics-card" style="margin-top: 20px; border-left: 4px solid #667eea;">
                <h3 style="color: #667eea;">📊 Cross-Validation Results (${cv.n_splits} folds)</h3>
                <div style="margin-top: 15px;">
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">Mean MAE</span>
                            <span class="metric-value">${cv.mean_scores.mae.toFixed(4)} ± ${cv.std_scores.mae.toFixed(4)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Mean RMSE</span>
                            <span class="metric-value">${cv.mean_scores.rmse.toFixed(4)} ± ${cv.std_scores.rmse.toFixed(4)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Mean R²</span>
                            <span class="metric-value">${cv.mean_scores.r2.toFixed(4)} ± ${cv.std_scores.r2.toFixed(4)}</span>
                        </div>
                    </div>
                    <details style="margin-top: 15px;">
                        <summary style="cursor: pointer; color: #667eea; font-weight: bold;">View Individual Fold Results</summary>
                        <div style="margin-top: 10px;">
                            ${cv.fold_scores.map((fold, idx) => `
                                <div style="padding: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 4px; margin-bottom: 5px;">
                                    <strong>Fold ${fold.fold}:</strong> MAE=${fold.mae.toFixed(4)}, RMSE=${fold.rmse.toFixed(4)}, R²=${fold.r2.toFixed(4)}
                                </div>
                            `).join('')}
                        </div>
                    </details>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    element.innerHTML = html;
    } catch (error) {
        console.error('Error displaying training results:', error);
        element.innerHTML = `
            <div class="training-results-container">
                <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ Error Displaying Results</h2>
                <p style="color: #a0a0a0; margin-bottom: 20px;">
                    There was an error displaying the training results. Showing raw data below.
                </p>
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; color: #667eea; font-weight: bold;">View Error Details</summary>
                    <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 10px; color: #dc3545;">${error.message}\n\n${error.stack || ''}</pre>
                </details>
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; color: #667eea; font-weight: bold;">View Raw Response Data</summary>
                    <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `;
    }
}

// Handle file selection - check if it's Excel and load sheets client-side
async function handleFileSelect() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const sheetSelector = document.getElementById('sheet-selector');
    const sheetSelect = document.getElementById('sheet-select');
    
    if (!file) {
        sheetSelector.style.display = 'none';
        return;
    }
    
    // Validate file size before reading (max 50MB for client-side reading)
    const maxSizeForReading = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSizeForReading) {
        sheetSelector.style.display = 'none';
        showStatus('upload-status', 
            `⚠️ Warning: File is large (${(file.size / 1024 / 1024).toFixed(2)}MB). ` +
            `Sheet names will be loaded after upload.`, 
            'info');
        return;
    }
    
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (isExcel) {
        // Show sheet selector immediately
        sheetSelector.style.display = 'block';
        sheetSelect.innerHTML = '<option value="">Loading sheets...</option>';
        
        try {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                throw new Error('XLSX library not loaded. Please refresh the page.');
            }
            
            // Read Excel file client-side to get sheet names without uploading
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', sheetStubs: true });
                    
                    if (workbook.SheetNames && workbook.SheetNames.length > 0) {
                        console.log('Found sheets client-side:', workbook.SheetNames);
                        populateSheetSelector(workbook.SheetNames);
                    } else {
                        sheetSelect.innerHTML = '<option value="">No sheets found</option>';
                        showStatus('upload-status', 
                            '⚠️ Warning: No sheets found in Excel file. The file may be empty or corrupted.', 
                            'error');
                    }
                } catch (error) {
                    console.error('Error reading Excel file:', error);
                    sheetSelect.innerHTML = '<option value="">Error reading file</option>';
                    let errorMsg = `❌ Error reading Excel file: ${error.message}`;
                    if (error.message.includes('corrupt') || error.message.includes('invalid')) {
                        errorMsg += '<br><br>💡 <strong>Possible causes:</strong>';
                        errorMsg += '<br>• File is corrupted';
                        errorMsg += '<br>• File format is not supported';
                        errorMsg += '<br>• File is password protected';
                        errorMsg += '<br><br>💡 <strong>Solution:</strong> Try opening the file in Excel and saving it again, or upload a different file.';
                    }
                    showStatus('upload-status', errorMsg, 'error');
                }
            };
            
            reader.onerror = function(error) {
                console.error('FileReader error:', error);
                sheetSelect.innerHTML = '<option value="">Error reading file</option>';
                showStatus('upload-status', 
                    '❌ Error: Failed to read file. The file may be corrupted or inaccessible. ' +
                    'Please try selecting the file again or use a different file.', 
                    'error');
            };
            
            reader.onabort = function() {
                sheetSelect.innerHTML = '<option value="">Reading cancelled</option>';
                showStatus('upload-status', '⚠️ File reading was cancelled', 'info');
            };
            
            // Read file as array buffer
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            console.error('Error loading sheets:', error);
            sheetSelect.innerHTML = '<option value="">Error loading sheets</option>';
            let errorMsg = `❌ Error: ${error.message}`;
            if (error.message.includes('XLSX')) {
                errorMsg += '<br><br>💡 <strong>Solution:</strong> Please refresh the page to reload the required libraries.';
            }
            showStatus('upload-status', errorMsg, 'error');
        }
    } else {
        // Hide sheet selector for non-Excel files
        sheetSelector.style.display = 'none';
    }
}

// Populate sheet selector dropdown
function populateSheetSelector(sheets) {
    const sheetSelect = document.getElementById('sheet-select');
    const sheetSelector = document.getElementById('sheet-selector');
    
    if (!sheetSelect) {
        console.error('❌ Sheet select element not found');
        return;
    }
    
    if (!sheets || sheets.length === 0) {
        console.warn('⚠️ No sheets provided to populate');
        sheetSelect.innerHTML = '<option value="">No sheets available</option>';
        return;
    }
    
    // Clear and populate
    sheetSelect.innerHTML = '<option value="">First Sheet (Default)</option>';
    sheets.forEach(sheet => {
        const option = document.createElement('option');
        option.value = sheet;
        option.textContent = sheet;
        sheetSelect.appendChild(option);
    });
    
    // Make sure selector is visible
    if (sheetSelector) {
        sheetSelector.style.display = 'block';
    }
    
    console.log(`✅ Loaded ${sheets.length} sheets:`, sheets);
}

// Load sheets for an already uploaded file
async function loadSheets(filename) {
    try {
        console.log('Fetching sheets for:', filename);
        const response = await fetch(`${API_BASE_URL}/list-sheets?filename=${encodeURIComponent(filename)}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch sheets: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.sheets && result.sheets.length > 0) {
            populateSheetSelector(result.sheets);
        } else {
            console.error('No sheets found in response:', result);
            const sheetSelect = document.getElementById('sheet-select');
            if (sheetSelect) {
                sheetSelect.innerHTML = '<option value="">No sheets found</option>';
            }
        }
    } catch (error) {
        console.error('Error fetching sheets:', error);
        const sheetSelect = document.getElementById('sheet-select');
        if (sheetSelect) {
            sheetSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
        }
    }
}

// File Upload
async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const sheetSelect = document.getElementById('sheet-select');
    
    // Clear previous errors
    const statusElement = document.getElementById('upload-status');
    if (statusElement) {
        statusElement.innerHTML = '';
    }
    
    if (!file) {
        showStatus('upload-status', '❌ Error: Please select a file before uploading', 'error');
        return;
    }
    
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
        showStatus('upload-status', `❌ Error: File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 100MB`, 'error');
        return;
    }
    
    // Validate file type
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
        showStatus('upload-status', `❌ Error: Invalid file type "${fileExtension}". Supported formats: CSV, XLSX, XLS, JSON`, 'error');
        return;
    }
    
    // Check if file is empty
    if (file.size === 0) {
        showStatus('upload-status', '❌ Error: The selected file is empty. Please select a valid file.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Get selected sheet name and add to form data
    const selectedSheet = sheetSelect && sheetSelect.value ? sheetSelect.value : null;
    if (selectedSheet) {
        formData.append('sheet_name', selectedSheet);
    }
    
    try {
        showStatus('upload-status', `🔄 Uploading file "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)}MB)...`, 'info');
        
        // Update backend status before upload (non-blocking, don't wait)
        checkBackendConnection().catch(err => console.error('Connection check error:', err));
        
        // Create AbortController for upload timeout
        const uploadController = new AbortController();
        const uploadTimeoutId = setTimeout(() => uploadController.abort(), 60000); // 60 second timeout
        
        const response = await fetch(`${API_BASE_URL}/upload-file`, {
            method: 'POST',
            body: formData,
            signal: uploadController.signal
        });
        
        clearTimeout(uploadTimeoutId);
        
        // Check if response is OK
        if (!response.ok) {
            let errorMessage = `❌ Upload failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = `❌ Error: ${errorData.detail}`;
                    if (typeof errorData.detail === 'string' && errorData.detail.includes('Invalid file type')) {
                        errorMessage += '<br><br>💡 <strong>Supported formats:</strong> CSV, XLSX, XLS, JSON';
                    } else if (typeof errorData.detail === 'string' && errorData.detail.includes('empty')) {
                        errorMessage += '<br><br>💡 <strong>Solution:</strong> Please ensure your file contains data';
                    } else if (typeof errorData.detail === 'string' && errorData.detail.includes('reading file')) {
                        errorMessage += '<br><br>💡 <strong>Solution:</strong> Please check if the file is corrupted or in the correct format';
                    }
                }
            } catch (parseError) {
                errorMessage += `: ${response.statusText}`;
            }
            showStatus('upload-status', errorMessage, 'error');
            console.error('Upload error response:', response.status, response.statusText);
            return;
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus('upload-status', 'File uploaded successfully!', 'success');
            
            // Store column names globally
            availableColumns = result.data.column_names || [];
            availableSheets = result.data.available_sheets || [];
            
            let fileInfoHtml = `
                <h3>File Information</h3>
                <p><strong>Filename:</strong> ${result.data.filename}</p>
                <p><strong>Rows:</strong> ${result.data.rows}</p>
                <p><strong>Columns:</strong> ${result.data.columns}</p>
                <p><strong>Column Names:</strong> ${result.data.column_names.join(', ')}</p>
            `;
            
            if (result.data.sheet_name) {
                fileInfoHtml += `<p><strong>Selected Sheet:</strong> ${result.data.sheet_name}</p>`;
            }
            
            if (result.data.available_sheets && result.data.available_sheets.length > 0) {
                fileInfoHtml += `<p><strong>Available Sheets:</strong> ${result.data.available_sheets.join(', ')}</p>`;
                if (result.data.available_sheets.length > 1) {
                    fileInfoHtml += `<p><em>💡 To load a different sheet, select it from the dropdown above and click Upload File again.</em></p>`;
                }
                
                // Update sheet selector if it exists and sheets are available
                const sheetSelect = document.getElementById('sheet-select');
                const sheetSelector = document.getElementById('sheet-selector');
                
                // Show sheet selector for Excel files
                if (result.data.filename.toLowerCase().endsWith('.xlsx') || result.data.filename.toLowerCase().endsWith('.xls')) {
                    if (sheetSelector) {
                        sheetSelector.style.display = 'block';
                    }
                }
                
                if (sheetSelect && result.data.available_sheets && result.data.available_sheets.length > 0) {
                    populateSheetSelector(result.data.available_sheets);
                    // Select the current sheet if one was loaded
                    if (result.data.sheet_name) {
                        sheetSelect.value = result.data.sheet_name;
                    }
                } else if (result.data.filename.toLowerCase().endsWith('.xlsx') || result.data.filename.toLowerCase().endsWith('.xls')) {
                    // Try to fetch sheets if not in response
                    console.log('Attempting to fetch sheets for:', result.data.filename);
                    setTimeout(() => loadSheets(result.data.filename), 500);
                }
            }
            
            document.getElementById('file-info').innerHTML = fileInfoHtml;
            
            // Auto-fill filename fields
            document.getElementById('eda-filename').value = result.data.filename;
            document.getElementById('preprocess-filename').value = result.data.filename;
            document.getElementById('train-filename').value = result.data.filename;
            document.getElementById('forecast-filename').value = result.data.filename;
            
            // Store columns globally
            availableColumns = result.data.column_names || [];
            
            // Populate column dropdowns
            populateColumnDropdowns(availableColumns);
            
            // Populate preprocessing column dropdowns with available columns
            if (availableColumns && availableColumns.length > 0) {
                populatePreprocessColumnDropdownsFromColumns(availableColumns);
            } else {
                populatePreprocessColumnDropdowns();
            }
            
            // Populate sheet dropdowns
            populateSheetDropdowns(result.data.available_sheets || [], result.data.sheet_name);
            
            // Enable next button
            document.getElementById('next-btn-1').disabled = false;
            
            // Auto-load features for training section if filename matches
            if (document.getElementById('train-filename').value === result.data.filename) {
                setTimeout(() => loadFeatures(), 500);
            }
        } else {
            const errorMsg = result.detail || result.message || 'Upload failed for unknown reason';
            showStatus('upload-status', `❌ Error: ${errorMsg}`, 'error');
            console.error('Upload failed:', result);
        }
    } catch (error) {
        let errorMessage = '❌ Upload failed';
        
        // Handle different types of errors
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            errorMessage = `❌ Error: Upload timeout. The file may be too large or the server is taking too long to respond.`;
            errorMessage += '<br><br>💡 <strong>Solution:</strong> Try uploading a smaller file or check your internet connection.';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = `❌ Error: Cannot connect to backend server at ${API_BASE_URL}`;
            errorMessage += '<br><br>💡 <strong>Possible causes:</strong>';
            errorMessage += '<br>• Backend server is not running';
            errorMessage += '<br>• Incorrect API URL in configuration';
            errorMessage += '<br>• Network connectivity issues';
            errorMessage += '<br><br>💡 <strong>Solution:</strong> Start the backend server by running: <code>python backend/main.py</code>';
        } else if (error.message) {
            errorMessage = `❌ Error: ${error.message}`;
        } else {
            errorMessage = `❌ Error: ${error.toString()}`;
        }
        
        showStatus('upload-status', errorMessage, 'error');
        console.error('Upload error:', error);
        
        // Show additional debugging info in console
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            API_URL: API_BASE_URL
        });
    }
}

// EDA Functions
async function runEDA() {
    const filename = document.getElementById('eda-filename').value;
    const sheetName = document.getElementById('eda-sheet-name').value;
    const dateColumn = document.getElementById('date-column').value;
    const valueColumn = document.getElementById('value-column').value;
    
    if (!filename) {
        showStatus('eda-status', 'Please enter filename', 'error');
        return;
    }
    
    const resultsDiv = document.getElementById('eda-results');
    const statusDiv = document.getElementById('eda-status');
    
    // Build query parameters
    const buildQuery = (baseParams) => {
        const params = new URLSearchParams(baseParams);
        if (sheetName) {
            params.append('sheet_name', sheetName);
        }
        return params.toString();
    };
    
    try {
        showStatus('eda-status', 'Running EDA...', 'info');
        resultsDiv.innerHTML = ''; // Clear previous results
        
        // Get summary
        const summaryParams = buildQuery({ filename });
        console.log('Fetching summary:', `${API_BASE_URL}/eda/summary?${summaryParams}`);
        const summaryResponse = await fetch(`${API_BASE_URL}/eda/summary?${summaryParams}`);
        if (!summaryResponse.ok) {
            const errorData = await summaryResponse.json().catch(() => ({ detail: summaryResponse.statusText }));
            throw new Error(`Summary failed: ${errorData.detail || summaryResponse.statusText}`);
        }
        const summary = await summaryResponse.json();
        console.log('Summary received:', summary);
        
        // Get correlation
        const corrParams = buildQuery({ filename, method: 'pearson' });
        console.log('Fetching correlation:', `${API_BASE_URL}/eda/correlation?${corrParams}`);
        const corrResponse = await fetch(`${API_BASE_URL}/eda/correlation?${corrParams}`);
        if (!corrResponse.ok) {
            const errorData = await corrResponse.json().catch(() => ({ detail: corrResponse.statusText }));
            console.error('Correlation error:', errorData);
            throw new Error(`Correlation failed: ${errorData.detail || corrResponse.statusText}`);
        }
        const correlation = await corrResponse.json();
        console.log('Correlation received:', correlation);
        
        // Get stationarity if columns provided
        let stationarity = null;
        let stationarityError = null;
        if (valueColumn) {
            try {
                const statParams = buildQuery({ filename, value_column: valueColumn });
                const statResponse = await fetch(`${API_BASE_URL}/eda/stationarity?${statParams}`);
                if (statResponse.ok) {
                    stationarity = await statResponse.json();
                } else {
                    const errorData = await statResponse.json();
                    stationarityError = errorData.detail || `Stationarity test failed: ${statResponse.statusText}`;
                }
            } catch (err) {
                stationarityError = `Error testing stationarity: ${err.message}`;
            }
        }
        
        // Get seasonality if columns provided
        let seasonality = null;
        let seasonalityError = null;
        if (dateColumn && valueColumn) {
            try {
                const seasonParams = buildQuery({ filename, date_column: dateColumn, value_column: valueColumn });
                const seasonResponse = await fetch(`${API_BASE_URL}/eda/seasonality?${seasonParams}`);
                if (seasonResponse.ok) {
                    seasonality = await seasonResponse.json();
                } else {
                    const errorData = await seasonResponse.json();
                    seasonalityError = errorData.detail || `Seasonality analysis failed: ${seasonResponse.statusText}`;
                }
            } catch (err) {
                seasonalityError = `Error analyzing seasonality: ${err.message}`;
            }
        }
        
        // Get plots
        let plots = null;
        let plotsError = null;
        try {
            const plotsParams = buildQuery({ filename, date_column: dateColumn || '', value_column: valueColumn || '' });
            console.log('Fetching plots:', `${API_BASE_URL}/eda/plots?${plotsParams}`);
            const plotsResponse = await fetch(`${API_BASE_URL}/eda/plots?${plotsParams}`);
            if (plotsResponse.ok) {
                plots = await plotsResponse.json();
                console.log('Plots received:', plots);
            } else {
                const errorData = await plotsResponse.json().catch(() => ({ detail: plotsResponse.statusText }));
                plotsError = errorData.detail || `Plots failed: ${plotsResponse.statusText}`;
                console.warn('Plots error:', plotsError);
            }
        } catch (err) {
            plotsError = `Error fetching plots: ${err.message}`;
            console.error('Error fetching plots:', err);
        }
        
        // Display results with beautiful visualizations
        let resultsHtml = `
            <div class="eda-results-container">
                <h2 style="color: #667eea; margin-bottom: 20px;">📊 Exploratory Data Analysis Results</h2>
        `;
        
        // Summary Statistics Card
        if (summary && summary.data) {
            const numericSummary = summary.data.numeric_summary || {};
            console.log('Numeric summary structure:', numericSummary); // Debug log
            
            // Get column names from numeric summary (from any stat like 'count')
            const getColumnNames = () => {
                if (numericSummary && Object.keys(numericSummary).length > 0) {
                    const firstStatKey = Object.keys(numericSummary)[0]; // e.g., 'count'
                    const firstStat = numericSummary[firstStatKey];
                    if (firstStat && typeof firstStat === 'object') {
                        return Object.keys(firstStat).slice(0, 10); // Get up to 10 columns
                    }
                }
                return [];
            };
            
            const columnNames = getColumnNames();
            console.log('Column names extracted:', columnNames); // Debug log
            
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">📈 Summary Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Total Rows</span>
                            <span class="stat-value">${summary.data.shape?.rows || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total Columns</span>
                            <span class="stat-value">${summary.data.shape?.columns || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Missing Values</span>
                            <span class="stat-value">${Object.values(summary.data.missing_values || {}).reduce((a, b) => a + b, 0)}</span>
                        </div>
                    </div>
                    ${columnNames.length > 0 ? `
                        <div class="stats-table-container">
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        ${columnNames.map(col => `<th>${col}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map(metric => `
                                        <tr>
                                            <td><strong>${metric}</strong></td>
                                            ${columnNames.map(col => {
                                                const val = numericSummary[metric]?.[col];
                                                const displayVal = (val !== undefined && val !== null) 
                                                    ? (typeof val === 'number' ? val.toFixed(2) : String(val))
                                                    : '-';
                                                return `<td>${displayVal}</td>`;
                                            }).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p style="padding: 15px; color: #666;">No numeric columns found in the dataset.</p>'}
                </div>
            `;
        }
        
        // Correlation Heatmap
        if (plots && plots.data && plots.data.correlation_heatmap) {
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">🔥 Correlation Heatmap</h3>
                    <div id="correlation-chart" class="chart-container"></div>
                </div>
            `;
        }
        
        // Time Series Plot
        if (plots && plots.data && plots.data.time_series) {
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">📅 Time Series Plot</h3>
                    <div id="timeseries-chart" class="chart-container"></div>
                </div>
            `;
        }
        
        // Distribution Plots
        if (plots && plots.data) {
            const distPlots = Object.keys(plots.data).filter(k => k.startsWith('distribution_'));
            if (distPlots.length > 0) {
                resultsHtml += `
                    <div class="eda-card">
                        <h3 class="eda-card-title">📊 Distribution Plots</h3>
                        <div class="distributions-grid">
                `;
                distPlots.forEach((plotKey, idx) => {
                    const colName = plotKey.replace('distribution_', '');
                    resultsHtml += `
                        <div class="dist-plot-item">
                            <div id="dist-chart-${idx}" class="chart-container-small"></div>
                        </div>
                    `;
                });
                resultsHtml += `</div></div>`;
            }
        }
        
        // Box Plots
        if (plots && plots.data && plots.data.box_plots) {
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">📦 Box Plots (Outlier Detection)</h3>
                    <div id="boxplot-chart" class="chart-container"></div>
                </div>
            `;
        }
        
        // Stationarity Test
        if (stationarity && stationarity.status === 'success') {
            const statData = stationarity.data;
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">⚖️ Stationarity Test (ADF)</h3>
                    <div class="stationarity-results">
                        <div class="stat-test-item ${statData.is_stationary ? 'stationary' : 'non-stationary'}">
                            <span class="test-label">Status:</span>
                            <span class="test-value">${statData.is_stationary ? '✅ Stationary' : '❌ Non-Stationary'}</span>
                        </div>
                        <div class="stat-test-item">
                            <span class="test-label">ADF Statistic:</span>
                            <span class="test-value">${statData.adf_statistic?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="stat-test-item">
                            <span class="test-label">P-Value:</span>
                            <span class="test-value">${statData.p_value?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div class="stat-test-item">
                            <span class="test-label">Interpretation:</span>
                            <span class="test-value">${statData.interpretation || 'N/A'}</span>
                        </div>
                    </div>
                    ${plots && plots.data && plots.data.stationarity_plot ? `
                        <div id="stationarity-chart" class="chart-container" style="margin-top: 20px;"></div>
                    ` : ''}
                </div>
            `;
        } else if (stationarityError) {
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">⚖️ Stationarity Test</h3>
                    <p class="error-message">❌ ${stationarityError}</p>
                </div>
            `;
        }
        
        // Seasonality Analysis
        if (seasonality && seasonality.status === 'success') {
            const seasonData = seasonality.data;
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">🔄 Seasonality Analysis</h3>
                    <div class="seasonality-results">
                        <div class="stat-test-item">
                            <span class="test-label">Has Seasonality:</span>
                            <span class="test-value">${seasonData.has_seasonality ? '✅ Yes' : '❌ No'}</span>
                        </div>
                        <div class="stat-test-item">
                            <span class="test-label">Seasonal Strength:</span>
                            <span class="test-value">${(seasonData.seasonal_strength * 100).toFixed(2)}%</span>
                        </div>
                        <div class="stat-test-item">
                            <span class="test-label">Trend Strength:</span>
                            <span class="test-value">${(seasonData.trend_strength * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                    ${plots && plots.data && plots.data.seasonality_decomposition ? `
                        <div id="seasonality-chart" class="chart-container" style="margin-top: 20px;"></div>
                    ` : ''}
                </div>
            `;
        } else if (seasonalityError) {
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">🔄 Seasonality Analysis</h3>
                    <p class="error-message">❌ ${seasonalityError}</p>
                </div>
            `;
        }
        
        // Show plots error if any
        if (plotsError) {
            resultsHtml += `
                <div class="eda-card">
                    <h3 class="eda-card-title">⚠️ Plot Generation Warning</h3>
                    <p class="error-message">${plotsError}</p>
                    <p style="margin-top: 10px;"><em>Other EDA results are still available above.</em></p>
                </div>
            `;
        }
        
        resultsHtml += `</div>`;
        resultsDiv.innerHTML = resultsHtml;
        
        // Render Plotly charts
        if (plots && plots.data) {
            // Correlation heatmap
            if (plots.data.correlation_heatmap) {
                Plotly.newPlot('correlation-chart', plots.data.correlation_heatmap.data, plots.data.correlation_heatmap.layout, {responsive: true});
            }
            
            // Time series
            if (plots.data.time_series) {
                Plotly.newPlot('timeseries-chart', plots.data.time_series.data, plots.data.time_series.layout, {responsive: true});
            }
            
            // Distribution plots
            const distPlots = Object.keys(plots.data).filter(k => k.startsWith('distribution_'));
            distPlots.forEach((plotKey, idx) => {
                if (plots.data[plotKey]) {
                    Plotly.newPlot(`dist-chart-${idx}`, plots.data[plotKey].data, plots.data[plotKey].layout, {responsive: true});
                }
            });
            
            // Box plots
            if (plots.data.box_plots) {
                Plotly.newPlot('boxplot-chart', plots.data.box_plots.data, plots.data.box_plots.layout, {responsive: true});
            }
            
            // Stationarity plot
            if (plots.data.stationarity_plot) {
                Plotly.newPlot('stationarity-chart', plots.data.stationarity_plot.data, plots.data.stationarity_plot.layout, {responsive: true});
            }
            
            // Seasonality decomposition
            if (plots.data.seasonality_decomposition) {
                Plotly.newPlot('seasonality-chart', plots.data.seasonality_decomposition.data, plots.data.seasonality_decomposition.layout, {responsive: true});
            }
        }
        
        showStatus('eda-status', 'EDA completed successfully!', 'success');
        
    } catch (error) {
        console.error('EDA Error:', error);
        showStatus('eda-status', `Error: ${error.message}`, 'error');
        resultsDiv.innerHTML = `
            <div style="padding: 20px; background: #f8d7da; border-radius: 8px; border-left: 4px solid #dc3545;">
                <h3 style="color: #721c24; margin-bottom: 10px;">❌ EDA Error</h3>
                <p style="color: #721c24;"><strong>Error:</strong> ${error.message}</p>
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; color: #721c24; font-weight: bold;">View Error Details</summary>
                    <pre style="background: white; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 10px; color: #333;">${error.stack || error.toString()}</pre>
                </details>
            </div>
        `;
    }
}

// Preprocessing Functions
async function handleMissing() {
    const filename = document.getElementById('preprocess-filename').value;
    const strategy = document.getElementById('preprocess-strategy').value;
    
    if (!filename) {
        showStatus('preprocess-results', 'Please enter filename', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/preprocess/handle-missing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, strategy })
        });
        
        const result = await response.json();
        displayResults('preprocess-results', result);
    } catch (error) {
        showStatus('preprocess-results', `Error: ${error.message}`, 'error');
    }
}

async function detectOutliers() {
    const filename = document.getElementById('preprocess-filename').value;
    
    if (!filename) {
        showStatus('preprocess-results', 'Please enter filename', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/preprocess/outliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, method: 'iqr' })
        });
        
        const result = await response.json();
        displayResults('preprocess-results', result);
    } catch (error) {
        showStatus('preprocess-results', `Error: ${error.message}`, 'error');
    }
}

async function scaleFeatures() {
    const filename = document.getElementById('preprocess-filename').value;
    
    if (!filename) {
        showStatus('preprocess-results', 'Please enter filename', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/preprocess/scale`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, method: 'standard' })
        });
        
        const result = await response.json();
        displayResults('preprocess-results', result);
    } catch (error) {
        showStatus('preprocess-results', `Error: ${error.message}`, 'error');
    }
}

// Stationarity and Seasonality Functions
async function checkStationarity() {
    const filename = document.getElementById('preprocess-filename').value;
    const dateColumn = document.getElementById('stationarity-date-column').value;
    const valueColumn = document.getElementById('stationarity-value-column').value;
    
    // Try multiple sources for sheet name:
    // 1. preprocess-sheet-name dropdown (in preprocessing section)
    // 2. eda-sheet-name dropdown (in EDA section)
    // 3. sheet-select dropdown (in upload section)
    let sheetName = null;
    const preprocessSheetElement = document.getElementById('preprocess-sheet-name');
    const edaSheetElement = document.getElementById('eda-sheet-name');
    const uploadSheetElement = document.getElementById('sheet-select');
    
    if (preprocessSheetElement && preprocessSheetElement.value) {
        sheetName = preprocessSheetElement.value;
        console.log('Using sheet name from preprocess-sheet-name:', sheetName);
    } else if (edaSheetElement && edaSheetElement.value) {
        sheetName = edaSheetElement.value;
        console.log('Using sheet name from eda-sheet-name:', sheetName);
    } else if (uploadSheetElement && uploadSheetElement.value) {
        sheetName = uploadSheetElement.value;
        console.log('Using sheet name from sheet-select:', sheetName);
    } else {
        console.log('No sheet name found in any dropdown');
    }
    
    if (!filename) {
        showStatus('stationarity-status', 'Please enter filename', 'error');
        return;
    }
    
    if (!dateColumn || !valueColumn) {
        showStatus('stationarity-status', 'Please select date and value columns', 'error');
        return;
    }
    
    try {
        showStatus('stationarity-status', 'Checking stationarity...', 'info');
        
        const url = `${API_BASE_URL}/preprocess/check-stationarity`;
        const requestBody = { 
            filename, 
            date_column: dateColumn, 
            value_column: valueColumn 
        };
        
        // Always add sheet_name if we have one (even if empty string, backend will handle it)
        if (sheetName) {
            requestBody.sheet_name = sheetName;
            console.log('Added sheet_name to request:', sheetName);
        } else {
            console.log('No sheet_name to add to request');
        }
        
        console.log('Checking stationarity - URL:', url);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Stationarity check response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Stationarity check error response:', errorText);
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || errorMessage;
            } catch (e) {
                // If not JSON, use the text as is
                errorMessage = errorText || errorMessage;
            }
            showStatus('stationarity-status', `Error: ${errorMessage}`, 'error');
            return;
        }
        
        const result = await response.json();
        console.log('Stationarity check result:', result);
        
        if (result.status === 'success') {
            const data = result.data;
            const isStationary = data.is_stationary;
            const statusHtml = `
                <div style="padding: 10px; background: ${isStationary ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)'}; border-radius: 6px; border-left: 4px solid ${isStationary ? '#28a745' : '#dc3545'};">
                    <strong style="color: ${isStationary ? '#28a745' : '#dc3545'};">
                        ${isStationary ? '✅ Stationary' : '❌ Non-Stationary'}
                    </strong>
                    <div style="margin-top: 8px; font-size: 11px; color: #a0a0a0;">
                        <div>ADF Statistic: ${data.adf_statistic?.toFixed(4) || 'N/A'}</div>
                        <div>P-Value: ${data.p_value?.toFixed(4) || 'N/A'}</div>
                        <div>${data.interpretation || ''}</div>
                    </div>
                </div>
            `;
            document.getElementById('stationarity-status').innerHTML = statusHtml;
            
            // Show fix section if non-stationary
            if (!isStationary) {
                document.getElementById('fix-stationarity-section').style.display = 'block';
            }
        } else {
            const errorMsg = result.detail || result.error || 'Stationarity check failed';
            console.error('Stationarity check failed:', errorMsg);
            showStatus('stationarity-status', `Error: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('Stationarity check exception:', error);
        showStatus('stationarity-status', `Error: ${error.message}`, 'error');
    }
}

async function checkSeasonality() {
    const filename = document.getElementById('preprocess-filename').value;
    const dateColumn = document.getElementById('seasonality-date-column').value;
    const valueColumn = document.getElementById('seasonality-value-column').value;
    
    // Try multiple sources for sheet name:
    // 1. preprocess-sheet-name dropdown (in preprocessing section)
    // 2. eda-sheet-name dropdown (in EDA section)
    // 3. sheet-select dropdown (in upload section)
    let sheetName = null;
    const preprocessSheetElement = document.getElementById('preprocess-sheet-name');
    const edaSheetElement = document.getElementById('eda-sheet-name');
    const uploadSheetElement = document.getElementById('sheet-select');
    
    if (preprocessSheetElement && preprocessSheetElement.value) {
        sheetName = preprocessSheetElement.value;
        console.log('Using sheet name from preprocess-sheet-name:', sheetName);
    } else if (edaSheetElement && edaSheetElement.value) {
        sheetName = edaSheetElement.value;
        console.log('Using sheet name from eda-sheet-name:', sheetName);
    } else if (uploadSheetElement && uploadSheetElement.value) {
        sheetName = uploadSheetElement.value;
        console.log('Using sheet name from sheet-select:', sheetName);
    } else {
        console.log('No sheet name found in any dropdown');
    }
    
    if (!filename) {
        showStatus('seasonality-status', 'Please enter filename', 'error');
        return;
    }
    
    if (!dateColumn || !valueColumn) {
        showStatus('seasonality-status', 'Please select date and value columns', 'error');
        return;
    }
    
    try {
        showStatus('seasonality-status', 'Checking seasonality...', 'info');
        
        const url = `${API_BASE_URL}/preprocess/check-seasonality`;
        const requestBody = { 
            filename, 
            date_column: dateColumn, 
            value_column: valueColumn 
        };
        
        // Always add sheet_name if we have one (even if empty string, backend will handle it)
        if (sheetName) {
            requestBody.sheet_name = sheetName;
            console.log('Added sheet_name to request:', sheetName);
        } else {
            console.log('No sheet_name to add to request');
        }
        
        console.log('Checking seasonality - URL:', url);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Seasonality check response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Seasonality check error response:', errorText);
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || errorMessage;
            } catch (e) {
                // If not JSON, use the text as is
                errorMessage = errorText || errorMessage;
            }
            showStatus('seasonality-status', `Error: ${errorMessage}`, 'error');
            return;
        }
        
        const result = await response.json();
        console.log('Seasonality check result:', result);
        
        if (result.status === 'success') {
            const data = result.data;
            const hasSeasonality = data.has_seasonality;
            const statusHtml = `
                <div style="padding: 10px; background: ${hasSeasonality ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)'}; border-radius: 6px; border-left: 4px solid ${hasSeasonality ? '#28a745' : '#dc3545'};">
                    <strong style="color: ${hasSeasonality ? '#28a745' : '#dc3545'};">
                        ${hasSeasonality ? '✅ Has Seasonality' : '❌ No Significant Seasonality'}
                    </strong>
                    <div style="margin-top: 8px; font-size: 11px; color: #a0a0a0;">
                        <div>Seasonal Strength: ${(data.seasonal_strength * 100)?.toFixed(2) || 'N/A'}%</div>
                        <div>${data.interpretation || ''}</div>
                    </div>
                </div>
            `;
            document.getElementById('seasonality-status').innerHTML = statusHtml;
            
            // Show fix section
            document.getElementById('fix-seasonality-section').style.display = 'block';
        } else {
            const errorMsg = result.detail || result.error || 'Seasonality check failed';
            console.error('Seasonality check failed:', errorMsg);
            showStatus('seasonality-status', `Error: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('Seasonality check exception:', error);
        showStatus('seasonality-status', `Error: ${error.message}`, 'error');
    }
}

async function fixStationarity() {
    const filename = document.getElementById('preprocess-filename').value;
    const dateColumn = document.getElementById('stationarity-date-column').value;
    const valueColumn = document.getElementById('stationarity-value-column').value;
    const method = document.getElementById('stationarity-method').value;
    const order = parseInt(document.getElementById('stationarity-order').value) || 1;
    const saveAs = document.getElementById('stationarity-save-as').value.trim();
    
    // Try multiple sources for sheet name
    let sheetName = null;
    const preprocessSheetElement = document.getElementById('preprocess-sheet-name');
    const edaSheetElement = document.getElementById('eda-sheet-name');
    const uploadSheetElement = document.getElementById('sheet-select');
    
    if (preprocessSheetElement && preprocessSheetElement.value) {
        sheetName = preprocessSheetElement.value;
        console.log('Using sheet name from preprocess-sheet-name:', sheetName);
    } else if (edaSheetElement && edaSheetElement.value) {
        sheetName = edaSheetElement.value;
        console.log('Using sheet name from eda-sheet-name:', sheetName);
    } else if (uploadSheetElement && uploadSheetElement.value) {
        sheetName = uploadSheetElement.value;
        console.log('Using sheet name from sheet-select:', sheetName);
    } else {
        console.log('No sheet name found in any dropdown');
    }
    
    if (!filename) {
        showStatus('preprocess-results', 'Please enter filename', 'error');
        return;
    }
    
    if (!dateColumn || !valueColumn) {
        showStatus('preprocess-results', 'Please select date and value columns', 'error');
        return;
    }
    
    try {
        showStatus('preprocess-results', 'Fixing stationarity...', 'info');
        
        const body = {
            filename,
            date_column: dateColumn,
            value_column: valueColumn,
            method,
            order
        };
        
        // Add sheet_name if available
        if (sheetName) {
            body.sheet_name = sheetName;
            console.log('Added sheet_name to fix-stationarity request:', sheetName);
        }
        
        if (saveAs) {
            body.save_as = saveAs;
        }
        
        const url = `${API_BASE_URL}/preprocess/fix-stationarity`;
        console.log('Fixing stationarity - URL:', url);
        console.log('Request body:', JSON.stringify(body, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        console.log('Fix stationarity response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fix stationarity error response:', errorText);
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            showStatus('preprocess-results', `Error: ${errorMessage}`, 'error');
            return;
        }
        
        const result = await response.json();
        console.log('Fix stationarity result:', result);
        
        if (result.status === 'success') {
            // Update filename field with processed file
            document.getElementById('preprocess-filename').value = result.processed_file;
            
            // Also update train filename if it matches the original
            const originalFilename = filename;
            const trainFilenameInput = document.getElementById('train-filename');
            const shouldUpdateTrainFilename = trainFilenameInput && trainFilenameInput.value === originalFilename;
            
            if (shouldUpdateTrainFilename) {
                trainFilenameInput.value = result.processed_file;
                console.log('📝 Updated train filename to:', result.processed_file);
            }
            
            // Show loading message
            showStatus('preprocess-results', 'Refreshing column dropdowns...', 'info');
            
            // Refresh ALL column dropdowns (preprocessing AND training)
            console.log('🔄 Refreshing dropdowns for processed file:', result.processed_file);
            await refreshAllColumnDropdowns(result.processed_file, result.new_column_name);
            
            // If train filename was updated, trigger change event to ensure any listeners fire
            if (shouldUpdateTrainFilename) {
                trainFilenameInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('🔄 Triggered change event on train filename input');
            }
            
            // Show success message with new column name highlighted AFTER refresh completes
            const successHtml = `
                <div style="padding: 15px; background: rgba(40, 167, 69, 0.2); border-radius: 8px; border-left: 4px solid #28a745; margin-top: 15px;">
                    <h4 style="color: #28a745; margin-bottom: 10px;">✅ Stationarity Fixed Successfully</h4>
                    <div style="font-size: 13px; color: #a0a0a0; line-height: 1.8;">
                        <div><strong>Processed File:</strong> ${result.processed_file}</div>
                        <div><strong>Column Updated:</strong> <span style="color: #C9A961; font-weight: bold; font-size: 14px;">${result.new_column_name}</span> (updated in place)</div>
                        <div><strong>Transformation:</strong> ${result.transformation_applied}</div>
                        <div><strong>Stationary After Fix:</strong> ${result.is_stationary_after ? '✅ Yes' : '❌ No'}</div>
                        <div style="margin-top: 10px; padding: 10px; background: rgba(15, 15, 15, 0.5); border-radius: 4px; border-left: 3px solid #C9A961;">
                            <strong style="color: #C9A961;">💡 Tip:</strong> The column "<strong style="color: #C9A961;">${result.new_column_name}</strong>" has been updated with the transformed values. Continue using this column name when training models. <br>
                            <span style="color: #28a745; font-size: 12px;">✅ Column dropdowns have been refreshed! The transformation will be automatically reversed during forecasting.</span>
                        </div>
                        <div style="margin-top: 10px; padding: 8px; background: rgba(201, 169, 97, 0.1); border-radius: 4px;">
                            <button onclick="goToStep(4)" style="background: linear-gradient(135deg, #C9A961 0%, #D4AF37 100%); color: #0f0f0f; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-family: 'Orbitron', sans-serif;">
                                Go to Train Model Section →
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('preprocess-results').innerHTML = successHtml;
        } else {
            const errorMsg = result.detail || result.error || 'Failed to fix stationarity';
            console.error('Fix stationarity failed:', errorMsg);
            showStatus('preprocess-results', `Error: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('Fix stationarity exception:', error);
        showStatus('preprocess-results', `Error: ${error.message}`, 'error');
    }
}

async function fixSeasonality() {
    const filename = document.getElementById('preprocess-filename').value;
    const dateColumn = document.getElementById('seasonality-date-column').value;
    const valueColumn = document.getElementById('seasonality-value-column').value;
    const method = document.getElementById('seasonality-method').value;
    const periodInput = document.getElementById('seasonality-period').value.trim();
    const seasonalPeriod = periodInput ? parseInt(periodInput) : null;
    const saveAs = document.getElementById('seasonality-save-as').value.trim();
    
    // Try multiple sources for sheet name
    let sheetName = null;
    const preprocessSheetElement = document.getElementById('preprocess-sheet-name');
    const edaSheetElement = document.getElementById('eda-sheet-name');
    const uploadSheetElement = document.getElementById('sheet-select');
    
    if (preprocessSheetElement && preprocessSheetElement.value) {
        sheetName = preprocessSheetElement.value;
        console.log('Using sheet name from preprocess-sheet-name:', sheetName);
    } else if (edaSheetElement && edaSheetElement.value) {
        sheetName = edaSheetElement.value;
        console.log('Using sheet name from eda-sheet-name:', sheetName);
    } else if (uploadSheetElement && uploadSheetElement.value) {
        sheetName = uploadSheetElement.value;
        console.log('Using sheet name from sheet-select:', sheetName);
    } else {
        console.log('No sheet name found in any dropdown');
    }
    
    if (!filename) {
        showStatus('preprocess-results', 'Please enter filename', 'error');
        return;
    }
    
    if (!dateColumn || !valueColumn) {
        showStatus('preprocess-results', 'Please select date and value columns', 'error');
        return;
    }
    
    try {
        showStatus('preprocess-results', 'Fixing seasonality...', 'info');
        
        const body = {
            filename,
            date_column: dateColumn,
            value_column: valueColumn,
            method
        };
        
        // Add sheet_name if available
        if (sheetName) {
            body.sheet_name = sheetName;
            console.log('Added sheet_name to fix-seasonality request:', sheetName);
        }
        
        if (seasonalPeriod) {
            body.seasonal_period = seasonalPeriod;
        }
        
        if (saveAs) {
            body.save_as = saveAs;
        }
        
        const url = `${API_BASE_URL}/preprocess/fix-seasonality`;
        console.log('Fixing seasonality - URL:', url);
        console.log('Request body:', JSON.stringify(body, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        console.log('Fix seasonality response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fix seasonality error response:', errorText);
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            showStatus('preprocess-results', `Error: ${errorMessage}`, 'error');
            return;
        }
        
        const result = await response.json();
        console.log('Fix seasonality result:', result);
        
        if (result.status === 'success') {
            // Update filename field with processed file
            document.getElementById('preprocess-filename').value = result.processed_file;
            
            // Also update train filename if it matches the original
            const originalFilename = filename;
            const trainFilenameInput = document.getElementById('train-filename');
            const shouldUpdateTrainFilename = trainFilenameInput && trainFilenameInput.value === originalFilename;
            
            if (shouldUpdateTrainFilename) {
                trainFilenameInput.value = result.processed_file;
                console.log('📝 Updated train filename to:', result.processed_file);
            }
            
            // Show loading message
            showStatus('preprocess-results', 'Refreshing column dropdowns...', 'info');
            
            // Refresh ALL column dropdowns (preprocessing AND training)
            console.log('🔄 Refreshing dropdowns for processed file:', result.processed_file);
            await refreshAllColumnDropdowns(result.processed_file, result.new_column_name);
            
            // If train filename was updated, trigger change event to ensure any listeners fire
            if (shouldUpdateTrainFilename) {
                trainFilenameInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('🔄 Triggered change event on train filename input');
            }
            
            // Show success message - column name stays the same since we update in place
            const successHtml = `
                <div style="padding: 15px; background: rgba(40, 167, 69, 0.2); border-radius: 8px; border-left: 4px solid #28a745; margin-top: 15px;">
                    <h4 style="color: #28a745; margin-bottom: 10px;">✅ Seasonality Fixed Successfully</h4>
                    <div style="font-size: 13px; color: #a0a0a0; line-height: 1.8;">
                        <div><strong>Processed File:</strong> ${result.processed_file}</div>
                        <div><strong>Column Updated:</strong> <span style="color: #C9A961; font-weight: bold; font-size: 14px;">${result.new_column_name}</span> (updated in place)</div>
                        <div><strong>Transformation:</strong> ${result.transformation_applied}</div>
                        <div><strong>Seasonal Period Used:</strong> ${result.seasonal_period}</div>
                        <div><strong>Has Seasonality After Fix:</strong> ${result.has_seasonality_after === false ? '✅ No' : result.has_seasonality_after === true ? '⚠️ Yes' : 'N/A'}</div>
                        <div style="margin-top: 10px; padding: 10px; background: rgba(15, 15, 15, 0.5); border-radius: 4px; border-left: 3px solid #C9A961;">
                            <strong style="color: #C9A961;">💡 Tip:</strong> The column "<strong style="color: #C9A961;">${result.new_column_name}</strong>" has been updated with the transformed values. Continue using this column name when training models. <br>
                            <span style="color: #28a745; font-size: 12px;">✅ Column dropdowns have been refreshed! The transformation will be automatically reversed during forecasting.</span>
                        </div>
                        <div style="margin-top: 10px; padding: 8px; background: rgba(201, 169, 97, 0.1); border-radius: 4px;">
                            <button onclick="goToStep(4)" style="background: linear-gradient(135deg, #C9A961 0%, #D4AF37 100%); color: #0f0f0f; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-family: 'Orbitron', sans-serif;">
                                Go to Train Model Section →
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('preprocess-results').innerHTML = successHtml;
        } else {
            const errorMsg = result.detail || result.error || 'Failed to fix seasonality';
            console.error('Fix seasonality failed:', errorMsg);
            showStatus('preprocess-results', `Error: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('Fix seasonality exception:', error);
        showStatus('preprocess-results', `Error: ${error.message}`, 'error');
    }
}

// Populate column dropdowns for preprocessing (from API)
async function populatePreprocessColumnDropdowns() {
    const filename = document.getElementById('preprocess-filename').value;
    if (!filename) return;
    
    try {
        // Get file summary to extract column names
        const response = await fetch(`${API_BASE_URL}/eda/summary?filename=${encodeURIComponent(filename)}`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.columns) {
            populatePreprocessColumnDropdownsFromColumns(result.data.columns);
        }
    } catch (error) {
        console.error('Error populating column dropdowns:', error);
    }
}

// Refresh all column dropdowns (preprocessing AND training) from a file
async function refreshAllColumnDropdowns(filename) {
    if (!filename) {
        console.warn('refreshAllColumnDropdowns: No filename provided');
        return;
    }
    
    try {
        console.log('🔄 Refreshing all column dropdowns for file:', filename);
        
        // Get file summary to extract column names
        const url = `${API_BASE_URL}/eda/summary?filename=${encodeURIComponent(filename)}`;
        console.log('Fetching columns from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to fetch file summary. Status:', response.status, 'Response:', errorText);
            return;
        }
        
        const result = await response.json();
        console.log('📊 File summary response:', result);
        
        if (result.status === 'success' && result.data) {
            // Try multiple ways to get column names
            let columns = null;
            
            if (result.data.columns && Array.isArray(result.data.columns)) {
                columns = result.data.columns;
                console.log('✅ Found columns in result.data.columns:', columns);
            } else if (result.data.column_names && Array.isArray(result.data.column_names)) {
                columns = result.data.column_names;
                console.log('✅ Found columns in result.data.column_names:', columns);
            } else if (result.data.columns_list && Array.isArray(result.data.columns_list)) {
                columns = result.data.columns_list;
                console.log('✅ Found columns in result.data.columns_list:', columns);
            } else {
                console.warn('⚠️ No columns found in expected locations. Available keys:', Object.keys(result.data));
            }
            
            if (columns && columns.length > 0) {
                // Update global available columns
                availableColumns = columns;
                console.log('📝 Updated global availableColumns:', availableColumns);
                
                // Populate preprocessing dropdowns
                console.log('🔄 Populating preprocessing dropdowns...');
                populatePreprocessColumnDropdownsFromColumns(columns);
                
                // Populate training dropdowns (date, target, category)
                console.log('🔄 Populating training dropdowns with', columns.length, 'columns...');
                console.log('📋 Columns being populated:', columns);
                
                // Clear and repopulate training dropdowns
                populateColumnDropdowns(columns);
                
                // Small delay to ensure DOM updates
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verify the dropdowns were populated
                const trainTargetDropdown = document.getElementById('train-target-column');
                const trainDateDropdown = document.getElementById('train-date-column');
                const trainCategoryDropdown = document.getElementById('train-category-column');
                
                if (trainTargetDropdown) {
                    const optionCount = trainTargetDropdown.options.length;
                    console.log('✅ Training target column dropdown now has', optionCount, 'options');
                    const optionValues = Array.from(trainTargetDropdown.options).map(opt => opt.value);
                    console.log('📋 Available target column options:', optionValues);
                    
                    // Check if new column is in the list
                    if (newColumnName && optionValues.includes(newColumnName)) {
                        console.log('✅✅✅ SUCCESS! New column FOUND in dropdown:', newColumnName);
                    } else if (newColumnName) {
                        console.error('❌❌❌ ERROR: New column NOT found in dropdown!');
                        console.error('Expected column:', newColumnName);
                        console.error('Available columns:', optionValues);
                        console.error('Columns from API:', columns);
                        
                        // Try to manually add the column if it's missing
                        if (columns.includes(newColumnName) && !optionValues.includes(newColumnName)) {
                            console.log('🔧 Attempting to manually add missing column...');
                            const option = document.createElement('option');
                            option.value = newColumnName;
                            option.textContent = newColumnName;
                            trainTargetDropdown.appendChild(option);
                            console.log('✅ Manually added column to dropdown');
                        }
                    }
                } else {
                    console.error('❌ train-target-column dropdown not found in DOM!');
                }
                
                if (trainDateDropdown) {
                    const dateOptionCount = trainDateDropdown.options.length;
                    console.log('✅ Training date column dropdown now has', dateOptionCount, 'options');
                }
                
                if (trainCategoryDropdown) {
                    const categoryOptionCount = trainCategoryDropdown.options.length;
                    console.log('✅ Training category column dropdown now has', categoryOptionCount, 'options');
                }
                
                console.log('✅ Successfully refreshed column dropdowns. Total columns:', columns.length);
            } else {
                console.error('❌ No valid column list found in response. Response data:', result.data);
            }
        } else {
            console.error('❌ Failed to get column list. Response:', result);
        }
    } catch (error) {
        console.error('❌ Error refreshing column dropdowns:', error);
        console.error('Error stack:', error.stack);
    }
}

// Populate column dropdowns for preprocessing (from provided columns)
function populatePreprocessColumnDropdownsFromColumns(columns) {
    if (!columns || columns.length === 0) return;
    
    // Helper function to populate a single dropdown
    const populateDropdown = (dropdownId) => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            // Keep first option if it exists, otherwise create new one
            const firstOption = dropdown.options[0];
            dropdown.innerHTML = '';
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Select column';
            dropdown.appendChild(placeholderOption);
            
            columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                dropdown.appendChild(option);
            });
        }
    };
    
    // Populate stationarity dropdowns
    populateDropdown('stationarity-date-column');
    populateDropdown('stationarity-value-column');
    
    // Populate seasonality dropdowns
    populateDropdown('seasonality-date-column');
    populateDropdown('seasonality-value-column');
}

// Load available features for selection
async function loadFeatures() {
    const filename = document.getElementById('train-filename').value;
    const sheetName = document.getElementById('train-sheet-name').value;
    const targetColumn = document.getElementById('train-target-column').value;
    
    if (!filename) {
        alert('Please enter filename first');
        return;
    }
    
    try {
        // Get file summary to extract column names
        let url = `${API_BASE_URL}/eda/summary?filename=${encodeURIComponent(filename)}`;
        if (sheetName) {
            url += `&sheet_name=${encodeURIComponent(sheetName)}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.columns) {
            const checkboxesDiv = document.getElementById('feature-checkboxes');
            checkboxesDiv.innerHTML = '';
            
            result.data.columns.forEach(col => {
                // Skip target column and date column
                if (col === targetColumn) return;
                
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.gap = '5px';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = col;
                checkbox.id = `feature-${col}`;
                
                const span = document.createElement('span');
                span.textContent = col;
                
                label.appendChild(checkbox);
                label.appendChild(span);
                checkboxesDiv.appendChild(label);
            });
            
            document.getElementById('feature-selection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading features:', error);
    }
}

// Update hyperparameters UI based on model type
function updateHyperparameters() {
    const modelType = document.getElementById('model-type').value;
    const hyperparamsDiv = document.getElementById('hyperparams-content');
    
    let html = '';
    
    if (modelType === 'arima' || modelType === 'sarima') {
        html = `
            <div class="hyperparam-group">
                <label>Order (p, d, q):</label>
                <input type="number" id="param-p" value="1" min="0" class="input-field" style="width: 80px;" placeholder="p">
                <input type="number" id="param-d" value="1" min="0" class="input-field" style="width: 80px;" placeholder="d">
                <input type="number" id="param-q" value="1" min="0" class="input-field" style="width: 80px;" placeholder="q">
            </div>
        `;
        if (modelType === 'sarima') {
            html += `
                <div class="hyperparam-group" style="margin-top: 10px;">
                    <label>Seasonal Order (P, D, Q, s):</label>
                    <input type="number" id="param-P" value="1" min="0" class="input-field" style="width: 80px;" placeholder="P">
                    <input type="number" id="param-D" value="1" min="0" class="input-field" style="width: 80px;" placeholder="D">
                    <input type="number" id="param-Q" value="1" min="0" class="input-field" style="width: 80px;" placeholder="Q">
                    <input type="number" id="param-s" value="12" min="1" class="input-field" style="width: 80px;" placeholder="s">
                </div>
            `;
        }
    } else if (modelType === 'lstm') {
        html = `
            <div class="hyperparam-group">
                <label>Sequence Length:</label>
                <input type="number" id="param-sequence-length" value="30" min="1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>LSTM Units:</label>
                <input type="number" id="param-lstm-units" value="50" min="1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>Epochs:</label>
                <input type="number" id="param-epochs" value="50" min="1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>Batch Size:</label>
                <input type="number" id="param-batch-size" value="32" min="1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(201, 169, 97, 0.2);">
                <h4 style="color: #C9A961; font-size: 0.9em; margin-bottom: 10px;">🛡️ Regularization & Overfitting Prevention</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 0.85em;">Dropout Rate:</label>
                        <input type="number" id="param-dropout-rate" value="0.2" min="0" max="1" step="0.1" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">0.0-1.0 (higher = more regularization)</small>
                    </div>
                    <div>
                        <label style="font-size: 0.85em;">Recurrent Dropout:</label>
                        <input type="number" id="param-recurrent-dropout" value="0.0" min="0" max="1" step="0.1" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">LSTM internal dropout</small>
                    </div>
                    <div>
                        <label style="font-size: 0.85em;">L1 Regularization:</label>
                        <input type="number" id="param-l1-reg" value="0.0" min="0" step="0.0001" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">Lasso regularization</small>
                    </div>
                    <div>
                        <label style="font-size: 0.85em;">L2 Regularization:</label>
                        <input type="number" id="param-l2-reg" value="0.0" min="0" step="0.0001" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">Ridge regularization</small>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="param-early-stopping-lstm" checked style="width: auto;">
                        <span style="font-size: 0.85em;">Enable Early Stopping</span>
                    </label>
                    <div style="margin-left: 24px; margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 0.8em;">Patience:</label>
                            <input type="number" id="param-patience" value="10" min="1" class="input-field" style="width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 0.8em;">Min Delta:</label>
                            <input type="number" id="param-min-delta" value="0.0001" min="0" step="0.0001" class="input-field" style="width: 100%;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (modelType === 'xgboost' || modelType === 'lightgbm') {
        html = `
            <div class="hyperparam-group">
                <label>N Estimators:</label>
                <input type="number" id="param-n-estimators" value="100" min="1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>Max Depth:</label>
                <input type="number" id="param-max-depth" value="6" min="1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>Learning Rate:</label>
                <input type="number" id="param-learning-rate" value="0.1" min="0.001" max="1" step="0.001" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(201, 169, 97, 0.2);">
                <h4 style="color: #C9A961; font-size: 0.9em; margin-bottom: 10px;">🛡️ Regularization (L1/L2)</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 0.85em;">L1 (Alpha) - Lasso:</label>
                        <input type="number" id="param-reg-alpha" value="0.0" min="0" step="0.1" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">Feature selection</small>
                    </div>
                    <div>
                        <label style="font-size: 0.85em;">L2 (Lambda) - Ridge:</label>
                        <input type="number" id="param-reg-lambda" value="1.0" min="0" step="0.1" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">Weight shrinkage</small>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="param-early-stopping-gbm" style="width: auto;">
                        <span style="font-size: 0.85em;">Enable Early Stopping</span>
                    </label>
                    <div style="margin-left: 24px; margin-top: 5px;">
                        <label style="font-size: 0.8em;">Early Stopping Rounds:</label>
                        <input type="number" id="param-early-stopping-rounds" value="10" min="1" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">Stop if no improvement for N rounds</small>
                    </div>
                </div>
            </div>
        `;
    } else if (modelType === 'random_forest') {
        html = `
            <div class="hyperparam-group">
                <label>N Estimators:</label>
                <input type="number" id="param-n-estimators" value="100" min="1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>Max Depth (0 = unlimited):</label>
                <input type="number" id="param-max-depth" value="0" min="0" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(201, 169, 97, 0.2);">
                <h4 style="color: #C9A961; font-size: 0.9em; margin-bottom: 10px;">🛡️ Regularization</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 0.85em;">Min Samples Split:</label>
                        <input type="number" id="param-min-samples-split" value="2" min="2" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">Higher = more regularization</small>
                    </div>
                    <div>
                        <label style="font-size: 0.85em;">Min Samples Leaf:</label>
                        <input type="number" id="param-min-samples-leaf" value="1" min="1" class="input-field" style="width: 100%;">
                        <small style="font-size: 0.75em; color: #a0a0a0;">Higher = more regularization</small>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="param-early-stopping-rf" style="width: auto;">
                        <span style="font-size: 0.85em;">Enable Early Stopping</span>
                    </label>
                    <div style="margin-left: 24px; margin-top: 5px;">
                        <label style="font-size: 0.8em;">Patience (iterations):</label>
                        <input type="number" id="param-n-iter-no-change" value="10" min="1" class="input-field" style="width: 100%;">
                    </div>
                </div>
            </div>
        `;
    } else if (modelType === 'svr') {
        html = `
            <div class="hyperparam-group">
                <label>Kernel:</label>
                <select id="param-kernel" class="input-field" style="width: 120px;">
                    <option value="rbf">RBF</option>
                    <option value="linear">Linear</option>
                    <option value="poly">Polynomial</option>
                    <option value="sigmoid">Sigmoid</option>
                </select>
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>C:</label>
                <input type="number" id="param-C" value="1.0" min="0.1" step="0.1" class="input-field" style="width: 120px;">
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>Epsilon:</label>
                <input type="number" id="param-epsilon" value="0.1" min="0.01" step="0.01" class="input-field" style="width: 120px;">
            </div>
        `;
    } else if (modelType === 'ets') {
        html = `
            <div class="hyperparam-group">
                <label>Trend:</label>
                <select id="param-trend" class="input-field" style="width: 120px;">
                    <option value="add">Additive</option>
                    <option value="mul">Multiplicative</option>
                </select>
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>Seasonal:</label>
                <select id="param-seasonal" class="input-field" style="width: 120px;">
                    <option value="add">Additive</option>
                    <option value="mul">Multiplicative</option>
                </select>
            </div>
        `;
    } else if (modelType === 'prophet') {
        html = `
            <div class="hyperparam-group">
                <label>
                    <input type="checkbox" id="param-yearly-seasonality" checked> Yearly Seasonality
                </label>
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>
                    <input type="checkbox" id="param-weekly-seasonality" checked> Weekly Seasonality
                </label>
            </div>
            <div class="hyperparam-group" style="margin-top: 10px;">
                <label>
                    <input type="checkbox" id="param-daily-seasonality"> Daily Seasonality
                </label>
            </div>
        `;
    }
    
    hyperparamsDiv.innerHTML = html;
}

// Update split method UI
function updateSplitMethod() {
    const splitMethod = document.getElementById('split-method').value;
    const percentageGroup = document.getElementById('test-size-group');
    const countGroup = document.getElementById('test-size-count-group');
    
    if (splitMethod === 'time' || splitMethod === 'percentage') {
        percentageGroup.style.display = 'block';
        countGroup.style.display = 'none';
    } else {
        percentageGroup.style.display = 'none';
        countGroup.style.display = 'block';
    }
}

// Update split percentages and validate they sum to 1.0
function updateSplitPercentages() {
    const trainSize = parseFloat(document.getElementById('train-size').value) || 0;
    const validationSize = parseFloat(document.getElementById('validation-size').value) || 0;
    const testSize = parseFloat(document.getElementById('test-size').value) || 0;
    const total = trainSize + validationSize + testSize;
    const messageDiv = document.getElementById('split-validation-message');
    
    if (Math.abs(total - 1.0) > 0.01) {
        messageDiv.textContent = `⚠️ Total is ${(total * 100).toFixed(1)}%. Should be 100%`;
        messageDiv.style.color = '#ff6b6b';
    } else {
        messageDiv.textContent = `✓ Total: ${(total * 100).toFixed(1)}% (Train: ${(trainSize * 100).toFixed(0)}%, Val: ${(validationSize * 100).toFixed(0)}%, Test: ${(testSize * 100).toFixed(0)}%)`;
        messageDiv.style.color = '#C9A961';
    }
}

// Model Training
async function trainModel() {
    const filename = document.getElementById('train-filename').value;
    const sheetName = document.getElementById('train-sheet-name').value;
    const dateColumn = document.getElementById('train-date-column').value;
    const targetColumn = document.getElementById('train-target-column').value;
    const categoryColumn = document.getElementById('train-category-column').value; // Can be empty
    const modelType = document.getElementById('model-type').value;
    // Read split sizes - handle empty strings properly
    const trainSizeInput = document.getElementById('train-size').value.trim();
    const validationSizeInput = document.getElementById('validation-size').value.trim();
    const testSizeInput = document.getElementById('test-size').value.trim();
    
    const trainSize = trainSizeInput ? parseFloat(trainSizeInput) : 0.6;
    const validationSize = validationSizeInput ? parseFloat(validationSizeInput) : 0.2;
    const testSize = testSizeInput ? parseFloat(testSizeInput) : 0.2;
    
    // Check for NaN values
    if (isNaN(trainSize) || isNaN(validationSize) || isNaN(testSize)) {
        showStatus('train-status', 'Please enter valid numbers for all split sizes', 'error');
        return;
    }
    
    // Validate split percentages
    const total = trainSize + validationSize + testSize;
    if (Math.abs(total - 1.0) > 0.01) {
        showStatus('train-status', `Split percentages must sum to 1.0 (currently ${(total * 100).toFixed(1)}%: Train=${(trainSize * 100).toFixed(1)}%, Val=${(validationSize * 100).toFixed(1)}%, Test=${(testSize * 100).toFixed(1)}%)`, 'error');
        return;
    }
    
        if (!filename || !dateColumn || !targetColumn) {
            showStatus('train-status', 'Please fill all required fields', 'error');
            return;
        }
        
        // Validate category column is not same as date or target column
        if (categoryColumn && (categoryColumn === dateColumn || categoryColumn === targetColumn)) {
            showStatus('train-status', 'Category column must be different from date and target columns', 'error');
            return;
        }
        
        try {
            // Show progress bar
            showTrainingProgress(0, 'Initializing training...', '');
            const progressContainer = document.getElementById('train-progress-container');
            if (progressContainer) {
                progressContainer.style.display = 'block';
            }
            
            // Clear previous results
            document.getElementById('train-results').innerHTML = '';
            showStatus('train-status', 'Training model... This may take a while.', 'info');
        
        // Collect selected features
        const featureCheckboxes = document.querySelectorAll('#feature-checkboxes input[type="checkbox"]:checked');
        const selectedFeatures = Array.from(featureCheckboxes).map(cb => cb.value);
        
        // Collect hyperparameters
        const modelParams = {};
        if (modelType === 'arima' || modelType === 'sarima') {
            modelParams.order = [
                parseInt(document.getElementById('param-p')?.value || 1),
                parseInt(document.getElementById('param-d')?.value || 1),
                parseInt(document.getElementById('param-q')?.value || 1)
            ];
            if (modelType === 'sarima') {
                modelParams.seasonal_order = [
                    parseInt(document.getElementById('param-P')?.value || 1),
                    parseInt(document.getElementById('param-D')?.value || 1),
                    parseInt(document.getElementById('param-Q')?.value || 1),
                    parseInt(document.getElementById('param-s')?.value || 12)
                ];
            }
        } else if (modelType === 'lstm') {
            modelParams.sequence_length = parseInt(document.getElementById('param-sequence-length')?.value || 30);
            modelParams.lstm_units = parseInt(document.getElementById('param-lstm-units')?.value || 50);
            modelParams.epochs = parseInt(document.getElementById('param-epochs')?.value || 50);
            modelParams.batch_size = parseInt(document.getElementById('param-batch-size')?.value || 32);
            // Regularization and dropout
            modelParams.dropout_rate = parseFloat(document.getElementById('param-dropout-rate')?.value || 0.2);
            modelParams.recurrent_dropout = parseFloat(document.getElementById('param-recurrent-dropout')?.value || 0.0);
            modelParams.l1_reg = parseFloat(document.getElementById('param-l1-reg')?.value || 0.0);
            modelParams.l2_reg = parseFloat(document.getElementById('param-l2-reg')?.value || 0.0);
            // Early stopping
            modelParams.early_stopping = document.getElementById('param-early-stopping-lstm')?.checked ?? true;
            modelParams.patience = parseInt(document.getElementById('param-patience')?.value || 10);
            modelParams.min_delta = parseFloat(document.getElementById('param-min-delta')?.value || 0.0001);
        } else if (modelType === 'xgboost' || modelType === 'lightgbm') {
            modelParams.n_estimators = parseInt(document.getElementById('param-n-estimators')?.value || 100);
            modelParams.max_depth = parseInt(document.getElementById('param-max-depth')?.value || 6);
            modelParams.learning_rate = parseFloat(document.getElementById('param-learning-rate')?.value || 0.1);
            // Regularization
            modelParams.reg_alpha = parseFloat(document.getElementById('param-reg-alpha')?.value || 0.0);
            modelParams.reg_lambda = parseFloat(document.getElementById('param-reg-lambda')?.value || 1.0);
            // Early stopping
            const earlyStoppingEnabled = document.getElementById('param-early-stopping-gbm')?.checked ?? false;
            if (earlyStoppingEnabled) {
                modelParams.early_stopping_rounds = parseInt(document.getElementById('param-early-stopping-rounds')?.value || 10);
            }
        } else if (modelType === 'random_forest') {
            modelParams.n_estimators = parseInt(document.getElementById('param-n-estimators')?.value || 100);
            const maxDepth = parseInt(document.getElementById('param-max-depth')?.value || 0);
            modelParams.max_depth = maxDepth === 0 ? null : maxDepth;
            // Regularization
            modelParams.min_samples_split = parseInt(document.getElementById('param-min-samples-split')?.value || 2);
            modelParams.min_samples_leaf = parseInt(document.getElementById('param-min-samples-leaf')?.value || 1);
            // Early stopping
            modelParams.early_stopping = document.getElementById('param-early-stopping-rf')?.checked ?? false;
            if (modelParams.early_stopping) {
                modelParams.n_iter_no_change = parseInt(document.getElementById('param-n-iter-no-change')?.value || 10);
            }
        } else if (modelType === 'svr') {
            modelParams.kernel = document.getElementById('param-kernel')?.value || 'rbf';
            modelParams.C = parseFloat(document.getElementById('param-C')?.value || 1.0);
            modelParams.epsilon = parseFloat(document.getElementById('param-epsilon')?.value || 0.1);
        } else if (modelType === 'ets') {
            modelParams.trend = document.getElementById('param-trend')?.value || 'add';
            modelParams.seasonal = document.getElementById('param-seasonal')?.value || 'add';
        } else if (modelType === 'prophet') {
            modelParams.yearly_seasonality = document.getElementById('param-yearly-seasonality')?.checked ?? true;
            modelParams.weekly_seasonality = document.getElementById('param-weekly-seasonality')?.checked ?? true;
            modelParams.daily_seasonality = document.getElementById('param-daily-seasonality')?.checked ?? false;
        }
        
        // Collect advanced options
        const enableCV = document.getElementById('enable-cv')?.checked ?? false;
        const checkLeakage = document.getElementById('check-leakage')?.checked ?? true;
        const cvFolds = parseInt(document.getElementById('cv-folds')?.value || 5);
        
        console.log('🔬 Advanced options:', {
            enable_cross_validation: enableCV,
            check_data_leakage: checkLeakage,
            cv_folds: cvFolds
        });
        
        const requestBody = {
            filename,
            model_type: modelType,
            date_column: dateColumn,
            target_column: targetColumn,
            train_size: parseFloat(trainSize.toFixed(4)), // Ensure proper float precision
            validation_size: parseFloat(validationSize.toFixed(4)),
            test_size: parseFloat(testSize.toFixed(4)),
            model_params: modelParams,
            enable_cross_validation: enableCV,
            cv_folds: cvFolds,
            check_data_leakage: checkLeakage
        };
        
        // Add category_column if provided
        if (categoryColumn) {
            requestBody.category_column = categoryColumn;
        }
        
        // Log for debugging
        console.log('📊 Training parameters:', {
            train_size: requestBody.train_size,
            validation_size: requestBody.validation_size,
            test_size: requestBody.test_size,
            total: requestBody.train_size + requestBody.validation_size + requestBody.test_size,
            category_column: categoryColumn || 'None',
            model_params: modelParams,
            enable_cv: enableCV,
            check_leakage: checkLeakage
        });
        
        // Add sheet_name if provided
        if (sheetName) {
            requestBody.sheet_name = sheetName;
        }
        
        // Add feature_columns if any selected
        if (selectedFeatures.length > 0) {
            requestBody.feature_columns = selectedFeatures;
        }
        
        // Update progress
        showTrainingProgress(10, 'Preparing data...', '');
        
        // Estimate total categories if category-based training
        let estimatedCategories = 1;
        if (categoryColumn) {
            // We'll update this after we get the response, but estimate 3-5 categories
            estimatedCategories = 3;
        }
        
        // Simulate progress during training
        const progressInterval = setInterval(() => {
            const currentProgress = parseInt(document.getElementById('train-progress-bar').style.width) || 10;
            if (currentProgress < 85) {
                // Gradually increase progress
                const increment = categoryColumn ? 5 / estimatedCategories : 2;
                showTrainingProgress(Math.min(currentProgress + increment, 85), 
                    categoryColumn ? 'Training models for each category...' : 'Training model...', '');
            }
        }, 1000);
        
        console.log('🚀 Sending training request with parameters:', {
            model_type: modelType,
            regularization: modelParams.reg_alpha || modelParams.reg_lambda || modelParams.dropout_rate ? 'enabled' : 'disabled',
            early_stopping: modelParams.early_stopping || modelParams.early_stopping_rounds ? 'enabled' : 'disabled',
            cross_validation: enableCV,
            data_leakage_check: checkLeakage
        });
        
        const response = await fetch(`${API_BASE_URL}/train/model`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        clearInterval(progressInterval);
        showTrainingProgress(90, 'Processing results...', '');
        
        console.log('📥 Received training response');
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showTrainingProgress(100, 'Training completed!', '');
            console.log('Training result data:', result.data); // Debug log
            
            // Hide progress bar after a short delay
            setTimeout(() => {
                const progressContainer = document.getElementById('train-progress-container');
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                }
            }, 2000);
            
            try {
                console.log('Full result.data structure:', JSON.stringify(result.data, null, 2));
                console.log('Has category_results?', !!result.data.category_results);
                console.log('Has categories?', !!result.data.categories);
                if (result.data.category_results) {
                    console.log('Category results keys:', Object.keys(result.data.category_results));
                    console.log('First category result:', result.data.category_results[Object.keys(result.data.category_results)[0]]);
                }
                
                displayTrainingResults('train-results', result.data);
                // Auto-fill forecast model name
                if (result.data.model_filename) {
                    document.getElementById('forecast-model-name').value = result.data.model_filename;
                } else if (result.data.category_models && Object.keys(result.data.category_models).length > 0) {
                    // For category-based training, use the first model filename
                    const firstCategory = Object.keys(result.data.category_models)[0];
                    document.getElementById('forecast-model-name').value = result.data.category_models[firstCategory];
                }
                showStatus('train-status', 'Model trained successfully!', 'success');
            } catch (error) {
                console.error('Error displaying training results:', error);
                console.error('Error stack:', error.stack);
                console.error('Result data that caused error:', result.data);
                console.error('Error details:', {
                    message: error.message,
                    name: error.name,
                    data: result.data,
                    metrics: result.data?.metrics,
                    model_type: result.data?.model_type
                });
                
                // Try to show at least basic info before falling back to JSON
                try {
                    const errorHtml = `
                        <div class="training-results-container">
                            <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ Display Error</h2>
                            <p style="color: #a0a0a0; margin-bottom: 20px;">
                                There was an error displaying the formatted results. Showing raw data below.
                            </p>
                            <details style="margin-top: 15px;">
                                <summary style="cursor: pointer; color: #667eea; font-weight: bold;">View Raw Response Data</summary>
                                <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 10px;">${JSON.stringify(result.data, null, 2)}</pre>
                            </details>
                        </div>
                    `;
                    document.getElementById('train-results').innerHTML = errorHtml;
                } catch (fallbackError) {
                    // Final fallback to JSON display
                    displayResults('train-results', result.data);
                }
                showStatus('train-status', 'Model trained successfully! (Display error occurred)', 'success');
            }
        } else {
            // Hide progress bar on error
            const progressContainer = document.getElementById('train-progress-container');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
            showStatus('train-status', result.detail || 'Training failed', 'error');
        }
    } catch (error) {
        // Hide progress bar on error
        const progressContainer = document.getElementById('train-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
        showStatus('train-status', `Error: ${error.message}`, 'error');
    }
}

// Show training progress bar
function showTrainingProgress(percent, text, details) {
    const progressBar = document.getElementById('train-progress-bar');
    const progressText = document.getElementById('train-progress-text');
    const progressPercent = document.getElementById('train-progress-percent');
    const progressDetails = document.getElementById('train-progress-details');
    
    if (progressBar) {
        progressBar.style.width = Math.min(Math.max(percent, 0), 100) + '%';
    }
    if (progressText && text) {
        progressText.textContent = text;
    }
    if (progressPercent) {
        progressPercent.textContent = Math.min(Math.max(percent, 0), 100).toFixed(0) + '%';
    }
    if (progressDetails && details) {
        progressDetails.textContent = details;
    } else if (progressDetails && !details) {
        progressDetails.textContent = '';
    }
}

// Initialize hyperparameters on page load
// Forecasting
async function generateForecast() {
    const modelName = document.getElementById('forecast-model-name').value;
    const filename = document.getElementById('forecast-filename').value;
    const dateColumn = document.getElementById('forecast-date-column')?.value || '';
    const rangeType = document.getElementById('forecast-range-type').value;
    
    if (!modelName) {
        showStatus('forecast-results', 'Please enter model name', 'error');
        return;
    }
    
    let horizon = null;
    let startDate = null;
    let endDate = null;
    
    if (rangeType === 'horizon') {
        horizon = parseInt(document.getElementById('forecast-horizon').value);
        if (!horizon || horizon < 1) {
            showStatus('forecast-results', 'Please enter a valid forecast horizon', 'error');
            return;
        }
    } else {
        startDate = document.getElementById('forecast-start-date').value;
        endDate = document.getElementById('forecast-end-date').value;
        if (!startDate || !endDate) {
            showStatus('forecast-results', 'Please select both start and end dates', 'error');
            return;
        }
        if (new Date(startDate) >= new Date(endDate)) {
            showStatus('forecast-results', 'End date must be after start date', 'error');
            return;
        }
    }
    
    try {
        showStatus('forecast-results', 'Generating forecast...', 'info');
        
        const requestBody = {
            model_name: modelName,
            include_confidence: true
        };
        
        if (horizon) {
            requestBody.horizon = horizon;
        } else {
            requestBody.start_date = startDate;
            requestBody.end_date = endDate;
        }
        
        if (filename) {
            requestBody.filename = filename;
        }
        
        // Add date_column if provided (will be auto-retrieved from metadata if not provided)
        if (dateColumn) {
            requestBody.date_column = dateColumn;
        }
        
        const response = await fetch(`${API_BASE_URL}/forecast/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Store forecast data globally for download
            window.lastForecastData = result.data;
            window.lastForecastModelName = modelName;
            window.lastForecastFilename = filename;
            window.lastForecastDateColumn = dateColumn;
            window.lastForecastHorizon = result.data.horizon || horizon;
            window.lastForecastDates = result.data.future_dates || [];
            
            displayForecastResults('forecast-results', result.data);
            
            // Plot forecast - check if category-based
            if (result.data.is_category_based && result.data.category_forecasts) {
                plotCategoryForecasts(result.data);
            } else {
                plotForecast(result.data);
            }
        } else {
            showStatus('forecast-results', result.detail || 'Forecast failed', 'error');
        }
    } catch (error) {
        showStatus('forecast-results', `Error: ${error.message}`, 'error');
    }
}

function plotForecast(data) {
    const predictions = data.predictions;
    const lowerBound = data.lower_bound;
    const upperBound = data.upper_bound;
    const futureDates = data.future_dates || [];
    
    // Use dates if available, otherwise use time steps
    let x;
    let xAxisTitle = 'Time Step';
    
    if (futureDates && futureDates.length > 0 && futureDates.length === predictions.length) {
        x = futureDates;
        xAxisTitle = 'Date';
    } else {
        x = Array.from({ length: predictions.length }, (_, i) => i + 1);
    }
    
    const trace1 = {
        x: x,
        y: predictions,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Forecast',
        line: { color: '#C9A961', width: 2.5 },
        marker: { size: 6, color: '#C9A961' }
    };
    
    const traces = [trace1];
    
    if (lowerBound && upperBound) {
        traces.push({
            x: x,
            y: upperBound,
            type: 'scatter',
            mode: 'lines',
            name: 'Upper Bound',
            line: { width: 0 },
            showlegend: false
        });
        
        traces.push({
            x: x,
            y: lowerBound,
            type: 'scatter',
            mode: 'lines',
            name: 'Confidence Interval',
            fill: 'tonexty',
            fillcolor: 'rgba(201, 169, 97, 0.2)',
            line: { width: 0 }
        });
    }
    
    const layout = {
        title: {
            text: 'Forecast Results',
            font: { family: 'Orbitron', size: 18, color: '#C9A961' }
        },
        xaxis: { 
            title: xAxisTitle,
            titlefont: { family: 'Rajdhani', size: 14, color: '#C9A961' },
            tickfont: { family: 'Rajdhani', size: 12, color: '#e0e0e0' },
            gridcolor: 'rgba(201, 169, 97, 0.1)',
            zeroline: false
        },
        yaxis: { 
            title: 'Value',
            titlefont: { family: 'Rajdhani', size: 14, color: '#C9A961' },
            tickfont: { family: 'Rajdhani', size: 12, color: '#e0e0e0' },
            gridcolor: 'rgba(201, 169, 97, 0.1)',
            zeroline: false
        },
        hovermode: 'closest',
        plot_bgcolor: '#0f0f0f',
        paper_bgcolor: '#0f0f0f',
        font: { family: 'Rajdhani', color: '#e0e0e0' },
        legend: {
            font: { family: 'Rajdhani', color: '#C9A961' },
            bgcolor: 'rgba(15, 15, 15, 0.8)',
            bordercolor: 'rgba(201, 169, 97, 0.3)',
            borderwidth: 1
        }
    };
    
    Plotly.newPlot('forecast-chart', traces, layout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    });
}

// Plot category-based forecasts
function plotCategoryForecasts(data) {
    console.log('plotCategoryForecasts called with data:', data);
    console.log('Categories:', data.categories);
    console.log('Category forecasts:', data.category_forecasts);
    console.log('Overall predictions length:', data.predictions?.length);
    
    const overallPredictions = data.predictions || [];
    const overallLowerBound = data.lower_bound;
    const overallUpperBound = data.upper_bound;
    const futureDates = data.future_dates || [];
    const categoryForecasts = data.category_forecasts || {};
    const categories = data.categories || [];
    
    console.log(`Found ${categories.length} categories:`, categories);
    console.log(`Found ${Object.keys(categoryForecasts).length} category forecasts:`, Object.keys(categoryForecasts));
    
    // Create container for all charts
    const chartContainer = document.getElementById('forecast-chart');
    if (!chartContainer) {
        console.error('forecast-chart element not found!');
        return;
    }
    
    let html = `
        <div style="margin-bottom: 30px;">
            <h3 style="color: #C9A961; font-size: 1.5em; margin-bottom: 15px;">📊 Overall Forecast (Sum of All Categories)</h3>
            <div id="overall-forecast-chart" style="width: 100%; height: 400px;"></div>
        </div>
    `;
    
    // Add chart containers for each category
    categories.forEach(category => {
        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #C9A961; font-size: 1.3em; margin-bottom: 15px;">📊 Category: ${category}</h3>
                <div id="category-forecast-chart-${category.replace(/[^a-zA-Z0-9]/g, '_')}" style="width: 100%; height: 350px;"></div>
            </div>
        `;
    });
    
    chartContainer.innerHTML = html;
    
    // Plot overall forecast
    const overallX = futureDates && futureDates.length === overallPredictions.length ? futureDates : 
                     Array.from({ length: overallPredictions.length }, (_, i) => i + 1);
    
    const overallTraces = [{
        x: overallX,
        y: overallPredictions,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Overall Forecast',
        line: { color: '#C9A961', width: 3 },
        marker: { size: 8, color: '#C9A961' }
    }];
    
    if (overallLowerBound && overallUpperBound) {
        overallTraces.push({
            x: overallX,
            y: overallUpperBound,
            type: 'scatter',
            mode: 'lines',
            name: 'Upper Bound',
            line: { width: 0 },
            showlegend: false
        });
        overallTraces.push({
            x: overallX,
            y: overallLowerBound,
            type: 'scatter',
            mode: 'lines',
            name: 'Confidence Interval',
            fill: 'tonexty',
            fillcolor: 'rgba(201, 169, 97, 0.2)',
            line: { width: 0 }
        });
    }
    
    const overallLayout = {
        title: {
            text: 'Overall Forecast (Sum of All Categories)',
            font: { family: 'Orbitron', size: 18, color: '#C9A961' }
        },
        xaxis: { 
            title: futureDates && futureDates.length > 0 ? 'Date' : 'Time Step',
            titlefont: { family: 'Rajdhani', size: 14, color: '#C9A961' },
            tickfont: { family: 'Rajdhani', size: 12, color: '#e0e0e0' },
            gridcolor: 'rgba(201, 169, 97, 0.1)',
            zeroline: false
        },
        yaxis: { 
            title: 'Value',
            titlefont: { family: 'Rajdhani', size: 14, color: '#C9A961' },
            tickfont: { family: 'Rajdhani', size: 12, color: '#e0e0e0' },
            gridcolor: 'rgba(201, 169, 97, 0.1)',
            zeroline: false
        },
        hovermode: 'closest',
        plot_bgcolor: '#0f0f0f',
        paper_bgcolor: '#0f0f0f',
        font: { family: 'Rajdhani', color: '#e0e0e0' },
        legend: {
            font: { family: 'Rajdhani', color: '#C9A961' },
            bgcolor: 'rgba(15, 15, 15, 0.8)',
            bordercolor: 'rgba(201, 169, 97, 0.3)',
            borderwidth: 1
        }
    };
    
    Plotly.newPlot('overall-forecast-chart', overallTraces, overallLayout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    });
    
    // Plot each category forecast
    categories.forEach(category => {
        console.log(`Processing category: ${category}`);
        const catForecast = categoryForecasts[category];
        if (!catForecast) {
            console.warn(`No forecast found for category: ${category}`);
            return;
        }
        if (catForecast.error) {
            console.error(`Error for category ${category}:`, catForecast.error);
            // Still show error message in chart
            const chartId = `category-forecast-chart-${category.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const errorDiv = document.getElementById(chartId);
            if (errorDiv) {
                errorDiv.innerHTML = `<p style="color: #dc3545; padding: 20px;">Error forecasting for category ${category}: ${catForecast.error}</p>`;
            }
            return;
        }
        
        const catPredictions = catForecast.predictions || [];
        const catLowerBound = catForecast.lower_bound;
        const catUpperBound = catForecast.upper_bound;
        const catFutureDates = catForecast.future_dates || futureDates;
        
        console.log(`Category ${category} has ${catPredictions.length} predictions`);
        
        const catX = catFutureDates && catFutureDates.length === catPredictions.length ? catFutureDates :
                     Array.from({ length: catPredictions.length }, (_, i) => i + 1);
        
        const catTraces = [{
            x: catX,
            y: catPredictions,
            type: 'scatter',
            mode: 'lines+markers',
            name: `${category} Forecast`,
            line: { color: '#C9A961', width: 2.5 },
            marker: { size: 6, color: '#C9A961' }
        }];
        
        if (catLowerBound && catUpperBound) {
            catTraces.push({
                x: catX,
                y: catUpperBound,
                type: 'scatter',
                mode: 'lines',
                name: 'Upper Bound',
                line: { width: 0 },
                showlegend: false
            });
            catTraces.push({
                x: catX,
                y: catLowerBound,
                type: 'scatter',
                mode: 'lines',
                name: 'Confidence Interval',
                fill: 'tonexty',
                fillcolor: 'rgba(201, 169, 97, 0.2)',
                line: { width: 0 }
            });
        }
        
        const catLayout = {
            title: {
                text: `Forecast for Category: ${category}`,
                font: { family: 'Orbitron', size: 16, color: '#C9A961' }
            },
            xaxis: { 
                title: catFutureDates && catFutureDates.length > 0 ? 'Date' : 'Time Step',
                titlefont: { family: 'Rajdhani', size: 14, color: '#C9A961' },
                tickfont: { family: 'Rajdhani', size: 12, color: '#e0e0e0' },
                gridcolor: 'rgba(201, 169, 97, 0.1)',
                zeroline: false
            },
            yaxis: { 
                title: 'Value',
                titlefont: { family: 'Rajdhani', size: 14, color: '#C9A961' },
                tickfont: { family: 'Rajdhani', size: 12, color: '#e0e0e0' },
                gridcolor: 'rgba(201, 169, 97, 0.1)',
                zeroline: false
            },
            hovermode: 'closest',
            plot_bgcolor: '#0f0f0f',
            paper_bgcolor: '#0f0f0f',
            font: { family: 'Rajdhani', color: '#e0e0e0' },
            legend: {
                font: { family: 'Rajdhani', color: '#C9A961' },
                bgcolor: 'rgba(15, 15, 15, 0.8)',
                bordercolor: 'rgba(201, 169, 97, 0.3)',
                borderwidth: 1
            }
        };
        
        const chartId = `category-forecast-chart-${category.replace(/[^a-zA-Z0-9]/g, '_')}`;
        Plotly.newPlot(chartId, catTraces, catLayout, {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        });
    });
    
    // Update download function to handle category forecasts
    window.lastForecastData = {
        overall: {
            predictions: overallPredictions,
            future_dates: futureDates,
            lower_bound: overallLowerBound,
            upper_bound: overallUpperBound
        },
        categories: categoryForecasts,
        is_category_based: true
    };
}

// List Models
async function listModels() {
    try {
        const response = await fetch(`${API_BASE_URL}/train/list-models`);
        
        if (!response.ok) {
            if (response.status === 0 || response.statusText === '') {
                // Connection refused or network error
                const modelsList = document.getElementById('models-list');
                if (modelsList) {
                    modelsList.innerHTML = '<p style="color: #f44336;">⚠️ Cannot connect to backend server. Please start it by running: <code>python backend/main.py</code></p>';
                }
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const modelsList = document.getElementById('models-list');
            if (result.models.length === 0) {
                modelsList.innerHTML = '<p>No models trained yet.</p>';
            } else {
                modelsList.innerHTML = `
                    <h3>Trained Models</h3>
                    <ul>
                        ${result.models.map(model => `
                            <li>
                                <strong>${model.name}</strong><br>
                                Size: ${(model.size / 1024).toFixed(2)} KB<br>
                                Modified: ${new Date(model.modified * 1000).toLocaleString()}
                            </li>
                        `).join('')}
                    </ul>
                `;
            }
        }
    } catch (error) {
        const modelsList = document.getElementById('models-list');
        if (modelsList) {
            if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED') || error.name === 'TypeError') {
                modelsList.innerHTML = '<p style="color: #f44336; padding: 15px; background: rgba(244, 67, 54, 0.1); border-radius: 8px; border-left: 4px solid #f44336;">⚠️ <strong>Backend Server Not Running</strong><br><br>Please start the backend server:<br><code style="background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">python backend/main.py</code></p>';
            } else {
                modelsList.innerHTML = `<p style="color: #f44336;">Error loading models: ${error.message}</p>`;
            }
        }
        console.error('Error listing models:', error);
    }
}

// All initialization is handled in the DOMContentLoaded listener above

