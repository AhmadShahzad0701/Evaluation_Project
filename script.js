// Global state
let currentStep = 1;
let criteriaCounter = 2; // Start at 2 since we have 2 initial criteria

let evaluationData = {
    style: 'balanced',
    partialCredit: true,
    grammarCheck: true,
    plagiarismCheck: false,
    threshold: 50,
    files: [],
    submissionFormat: 'excel',
    concurrentRequests: 10,
    rubricMode: 'text', // 'text' or 'structured'
    rubricText: '',
    expectedFormatText: '',
    structuredCriteria: [],
    expectedFormat: {
        requireExamples: false,
        requireExplanation: true,
        requireSteps: false,
        requireDiagrams: false,
        requireCitations: false,
        minWords: null,
        maxWords: null,
        keywords: [],
        concepts: []
    }
};

// ==================== Step Navigation ====================

function nextStep() {
    if (currentStep < 3) {
        if (!validateStep(currentStep)) {
            return;
        }
        currentStep++;
        updateStepDisplay();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function validateStep(step) {
    if (step === 2) {
        const quizId = document.getElementById('quizId').value;
        const quizTitle = document.getElementById('quizTitle').value;
        
        if (!quizId || !quizTitle) {
            alert('Please fill in Quiz ID and Title');
            return false;
        }
        
        if (evaluationData.files.length === 0) {
            alert('Please upload at least one file');
            return false;
        }

        // Validate rubric
        if (evaluationData.rubricMode === 'text') {
            const rubricText = document.getElementById('rubricText').value;
            if (!rubricText || rubricText.trim() === '') {
                alert('Please provide a rubric description');
                return false;
            }
            evaluationData.rubricText = rubricText;
            evaluationData.expectedFormatText = document.getElementById('expectedFormatText').value;
        } else {
            // Collect structured criteria
            collectStructuredCriteria();
            if (evaluationData.structuredCriteria.length === 0) {
                alert('Please add at least one evaluation criterion');
                return false;
            }
        }
    }
    return true;
}

function updateStepDisplay() {
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });

    // Update content
    document.querySelectorAll('.step-content').forEach((content, index) => {
        content.classList.remove('active');
        if (index + 1 === currentStep) {
            content.classList.add('active');
        }
    });

    // Update progress bar
    const progress = ((currentStep - 1) / 2) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;

    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const navButtons = document.getElementById('navigationButtons');

    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }

    if (currentStep === 3) {
        navButtons.style.display = 'none';
        updateReviewSummary();
    } else {
        navButtons.style.display = 'flex';
    }
}

// ==================== Evaluation Style ====================

function selectStyle(style) {
    evaluationData.style = style;
    document.querySelectorAll('.style-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-style="${style}"]`).classList.add('selected');
}

// ==================== Concurrent Requests ====================

function adjustConcurrent(delta) {
    const current = evaluationData.concurrentRequests;
    const newValue = Math.max(1, Math.min(20, current + delta));
    evaluationData.concurrentRequests = newValue;
    document.getElementById('concurrentDisplay').textContent = newValue;
}

// ==================== File Upload ====================

function switchTab(tab) {
    evaluationData.submissionFormat = tab;
    
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
}

function handleExcelUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        evaluationData.files = Array.from(files);
        displayFileList('excelFileList', files);
    }
}

function handlePdfUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        evaluationData.files = Array.from(files);
        displayFileList('pdfFileList', files);
    }
}

function handleJsonUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        evaluationData.files = Array.from(files);
        displayFileList('jsonFileList', files);
    }
}

function displayFileList(listId, files) {
    const listElement = document.getElementById(listId);
    listElement.classList.remove('hidden');
    listElement.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <span class="file-name">📄 ${file.name}</span>
                <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <button class="file-remove" onclick="removeFile(${index}, '${listId}')">×</button>
        `;
        listElement.appendChild(fileItem);
    });
}

function removeFile(index, listId) {
    evaluationData.files.splice(index, 1);
    if (evaluationData.files.length === 0) {
        document.getElementById(listId).classList.add('hidden');
    } else {
        displayFileList(listId, evaluationData.files);
    }
}

// ==================== Rubric Mode ====================

function switchRubricMode(mode) {
    evaluationData.rubricMode = mode;
    
    // Update tabs
    const rubricTabs = document.querySelectorAll('#step2 .tab-container:last-of-type .tab');
    rubricTabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update content
    document.getElementById('textRubricTab').classList.remove('active');
    document.getElementById('structuredRubricTab').classList.remove('active');
    
    if (mode === 'text') {
        document.getElementById('textRubricTab').classList.add('active');
    } else {
        document.getElementById('structuredRubricTab').classList.add('active');
    }
}

// ==================== Structured Rubric ====================

function addCriterion() {
    criteriaCounter++;
    const criteriaList = document.getElementById('criteriaList');
    
    const criterionDiv = document.createElement('div');
    criterionDiv.className = 'criteria-item-edit';
    criterionDiv.setAttribute('data-index', criteriaCounter);
    criterionDiv.innerHTML = `
        <div class="criteria-header">
            <input type="text" class="form-input" placeholder="Criterion name (e.g., Use of Examples)">
            <button class="button-icon" onclick="removeCriterion(${criteriaCounter})">🗑️</button>
        </div>
        <textarea class="form-textarea" placeholder="Describe what you're looking for..." style="min-height: 80px;"></textarea>
        <div class="criteria-weight-row">
            <label>Weight (out of 10):</label>
            <input type="number" class="form-input" style="width: 80px;" min="0" max="10" value="5">
        </div>
    `;
    
    criteriaList.appendChild(criterionDiv);
}

function removeCriterion(index) {
    const criterion = document.querySelector(`.criteria-item-edit[data-index="${index}"]`);
    if (criterion) {
        criterion.remove();
    }
}

function collectStructuredCriteria() {
    const criteriaItems = document.querySelectorAll('.criteria-item-edit');
    const criteria = [];
    
    criteriaItems.forEach(item => {
        const name = item.querySelector('.criteria-header input').value.trim();
        const description = item.querySelector('textarea').value.trim();
        const weight = parseInt(item.querySelector('.criteria-weight-row input').value);
        
        if (name && description) {
            criteria.push({ name, description, weight });
        }
    });
    
    evaluationData.structuredCriteria = criteria;
    
    // Also collect checkboxes and word counts
    evaluationData.expectedFormat = {
        requireExamples: document.getElementById('requireExamples')?.checked || false,
        requireExplanation: document.getElementById('requireExplanation')?.checked || false,
        requireSteps: document.getElementById('requireSteps')?.checked || false,
        minWords: document.getElementById('minWords')?.value ? parseInt(document.getElementById('minWords').value) : null,
        maxWords: document.getElementById('maxWords')?.value ? parseInt(document.getElementById('maxWords').value) : null,
        keywords: evaluationData.expectedFormat.keywords,
        concepts: evaluationData.expectedFormat.concepts
    };
}

// ==================== Tags (Keywords/Concepts) ====================

function addTag(event, type) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById(`${type}Input`);
        const value = input.value.trim();
        
        if (value && !evaluationData.expectedFormat[type].includes(value)) {
            evaluationData.expectedFormat[type].push(value);
            
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `${value} <span class="tag-remove" onclick="removeTag('${type}', '${value.replace(/'/g, "\\'")}')">×</span>`;
            
            const container = document.getElementById(`${type}Container`);
            container.insertBefore(tag, input);
            input.value = '';
        }
    }
}

function removeTag(type, value) {
    const index = evaluationData.expectedFormat[type].indexOf(value);
    if (index > -1) {
        evaluationData.expectedFormat[type].splice(index, 1);
    }
    event.target.parentElement.remove();
}

function focusTagInput(type) {
    document.getElementById(`${type}Input`).focus();
}

// ==================== Review Summary ====================

function updateReviewSummary() {
    const summary = document.getElementById('reviewSummary');
    const filesCount = evaluationData.files.length;
    const estimatedStudents = evaluationData.submissionFormat === 'excel' ? '~100' : filesCount;
    
    summary.innerHTML = `
        <strong>Evaluation Style:</strong> ${evaluationData.style.charAt(0).toUpperCase() + evaluationData.style.slice(1)}<br>
        <strong>Quiz ID:</strong> ${document.getElementById('quizId').value}<br>
        <strong>Quiz Title:</strong> ${document.getElementById('quizTitle').value}<br>
        <strong>Submission Format:</strong> ${evaluationData.submissionFormat.toUpperCase()}<br>
        <strong>Files Uploaded:</strong> ${filesCount}<br>
        <strong>Estimated Students:</strong> ${estimatedStudents}<br>
        <strong>Parallel Processing:</strong> ${document.getElementById('parallelProcessing').checked ? 'Enabled' : 'Disabled'}<br>
        <strong>Concurrent Requests:</strong> ${evaluationData.concurrentRequests}<br>
        <strong>Partial Credit:</strong> ${document.getElementById('partialCredit').checked ? 'Enabled' : 'Disabled'}<br>
        <strong>Grammar Check:</strong> ${document.getElementById('grammarCheck').checked ? 'Enabled' : 'Disabled'}<br>
        <strong>Rubric Type:</strong> ${evaluationData.rubricMode === 'text' ? 'Text-Based' : 'Structured'}<br>
    `;

    // Display rubric preview
    const reviewRubric = document.getElementById('reviewRubric');
    
    if (evaluationData.rubricMode === 'text') {
        reviewRubric.innerHTML = `
            <strong>Rubric Description:</strong><br>
            ${evaluationData.rubricText || '(No rubric provided)'}
            <br><br>
            <strong>Expected Answer Format:</strong><br>
            ${evaluationData.expectedFormatText || '(No format specified)'}
        `;
    } else {
        let criteriaHTML = '<strong>Evaluation Criteria:</strong><br><br>';
        evaluationData.structuredCriteria.forEach((criterion, index) => {
            criteriaHTML += `
                ${index + 1}. <strong>${criterion.name}</strong> (${criterion.weight}/10)<br>
                   ${criterion.description}<br><br>
            `;
        });
        
        criteriaHTML += '<strong>Answer Requirements:</strong><br>';
        const requirements = [];
        if (evaluationData.expectedFormat.requireExamples) requirements.push('Requires Examples');
        if (evaluationData.expectedFormat.requireExplanation) requirements.push('Requires Explanation');
        if (evaluationData.expectedFormat.requireSteps) requirements.push('Requires Step-by-Step Solution');
        if (evaluationData.expectedFormat.minWords) requirements.push(`Min ${evaluationData.expectedFormat.minWords} words`);
        if (evaluationData.expectedFormat.maxWords) requirements.push(`Max ${evaluationData.expectedFormat.maxWords} words`);
        
        if (requirements.length > 0) {
            criteriaHTML += requirements.join(', ') + '<br><br>';
        }
        
        if (evaluationData.expectedFormat.keywords.length > 0) {
            criteriaHTML += `<strong>Required Keywords:</strong> ${evaluationData.expectedFormat.keywords.join(', ')}<br>`;
        }
        if (evaluationData.expectedFormat.concepts.length > 0) {
            criteriaHTML += `<strong>Required Concepts:</strong> ${evaluationData.expectedFormat.concepts.join(', ')}<br>`;
        }
        
        reviewRubric.innerHTML = criteriaHTML;
    }

    // Update estimated time
    const studentCount = evaluationData.submissionFormat === 'excel' ? 100 : filesCount;
    const timePerStudent = evaluationData.style === 'fast' ? 3 : evaluationData.style === 'balanced' ? 5 : 8;
    const totalTime = Math.ceil((studentCount * timePerStudent) / evaluationData.concurrentRequests);
    document.getElementById('estimatedTime').textContent = `~${totalTime} minutes`;
}

// ==================== Submit Evaluation ====================

function submitEvaluation() {
    // Collect all form data
    const formData = {
        // Step 1: Evaluation Setup
        evaluationStyle: evaluationData.style,
        blueprint: {
            partialCreditEnabled: document.getElementById('partialCredit').checked,
            partialCreditThreshold: evaluationData.threshold / 100,
            grammarPenaltyEnabled: document.getElementById('grammarCheck').checked,
            plagiarismCheckEnabled: document.getElementById('plagiarismCheck').checked
        },
        
        // Step 2: Quiz Info
        quizId: document.getElementById('quizId').value,
        quizTitle: document.getElementById('quizTitle').value,
        
        // Submission details
        submissionFormat: evaluationData.submissionFormat,
        filesUploaded: evaluationData.files.map(f => ({ name: f.name, size: f.size })),
        
        // Processing options
        processingOptions: {
            parallelProcessing: document.getElementById('parallelProcessing').checked,
            maxConcurrentRequests: evaluationData.concurrentRequests
        },
        
        // Rubric (Dynamic)
        rubric: evaluationData.rubricMode === 'text' ? {
            type: 'text',
            description: evaluationData.rubricText,
            expectedFormat: evaluationData.expectedFormatText
        } : {
            type: 'structured',
            criteria: evaluationData.structuredCriteria,
            expectedFormat: evaluationData.expectedFormat
        },
        
        // Step 3: Additional settings
        additionalNotes: document.getElementById('additionalNotes').value,
        generateReports: document.getElementById('generateReports').checked,
        emailResults: document.getElementById('emailResults').checked,
        
        // Metadata
        timestamp: new Date().toISOString()
    };

    console.log('=== EVALUATION REQUEST ===');
    console.log(JSON.stringify(formData, null, 2));
    console.log('=========================');
    
    // Show success message
    alert('Evaluation submitted successfully! Check console for the full request payload.\n\nIn production, this would be sent to your FastAPI backend at /evaluate/batch');
    
    // In production, you would send this to your backend:
    /*
    fetch('/evaluate/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Evaluation started:', data);
        // Redirect to results page or show progress
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit evaluation');
    });
    */
}

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', function() {
    // Add drag and drop support for file uploads
    setupDragAndDrop('excelUpload', 'excelFile');
    setupDragAndDrop('pdfUpload', 'pdfFiles');
    setupDragAndDrop('jsonUpload', 'jsonFile');
});

function setupDragAndDrop(uploadDivId, inputId) {
    const uploadDiv = document.getElementById(uploadDivId);
    const fileInput = document.getElementById(inputId);
    
    if (!uploadDiv || !fileInput) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadDiv.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadDiv.addEventListener(eventName, () => {
            uploadDiv.classList.add('dragover');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadDiv.addEventListener(eventName, () => {
            uploadDiv.classList.remove('dragover');
        });
    });
    
    uploadDiv.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        
        // Trigger the appropriate handler
        if (uploadDivId === 'excelUpload') {
            handleExcelUpload({ target: fileInput });
        } else if (uploadDivId === 'pdfUpload') {
            handlePdfUpload({ target: fileInput });
        } else if (uploadDivId === 'jsonUpload') {
            handleJsonUpload({ target: fileInput });
        }
    });
}
