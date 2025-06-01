// Enhanced HealthMate AI Chatbot with Triage Integration
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const welcomeScreen = document.querySelector('.welcome-screen');
    const chatScreen = document.querySelector('.chat-screen');
    const firstAidScreen = document.querySelector('.first-aid-screen');
    const startChatButton = document.getElementById('start-chat-button');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.querySelector('.chat-messages');
    const loadingDiagnosis = document.querySelector('.loading-diagnosis');
    const diagnosisPanel = document.querySelector('.diagnosis-panel');
    const promptSuggestionArea = document.querySelector('.prompt-suggestion-area');
    const promptButtons = document.querySelectorAll('.prompt-button');
    const refreshPromptsButton = document.querySelector('.refresh-prompts-button');

    // Sidebar elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const sidebarToggleButton = document.querySelector('.sidebar-toggle-button');
    const closeSidebarButton = document.querySelector('.close-sidebar-button');
    const navItems = document.querySelectorAll('.nav-item');

    // New screen elements
    const symptomsHistoryScreen = document.querySelector('.symptoms-history-screen');
    const healthFactsScreen = document.querySelector('.health-facts-screen');
    const emergencyContactsScreen = document.querySelector('.emergency-contacts-screen');
    const settingsScreen = document.querySelector('.settings-screen');
    const allBackButtons = document.querySelectorAll('.app-screen .back-button');

    // Configuration
    const API_BASE_URL = 'https://backendhealthmate13.vercel.app';
    
    // Chat state
    let threadId = null;
    let isWaitingForResponse = false;
    let conversationHistory = [];
    let currentActiveContentScreen = welcomeScreen;

    // Initialize chat
    function initializeChat() {
        // Reset thread ID for new conversation
        threadId = null;
        conversationHistory = [];
        
        // Clear chat messages
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Show welcome message
        addMessage("Hi! I'm HealthMate AI, your medical triage assistant. I can help you assess symptoms and suggest possible health conditions. Please describe your symptoms in detail, including when they started and how severe they are.", 'ai', true);
        
        // Show prompt suggestions
        if (promptSuggestionArea) {
            promptSuggestionArea.style.display = 'flex';
        }
    }

    // Add message to chat
    function addMessage(text, sender, isInitial = false) {
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-bubble', sender);
        
        if (isInitial) {
            messageDiv.classList.add('initial-ai-message');
        }
        
        // Handle different message types
        if (sender === 'ai' && typeof text === 'object') {
            // Handle structured AI response from triage
            messageDiv.innerHTML = formatTriageResponse(text);
        } else {
            // Handle plain text messages
            messageDiv.innerHTML = formatTextMessage(text);
        }
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        
        return messageDiv;
    }

    // Format text message with basic markdown support
    function formatTextMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    // Format triage response for display
    function formatTriageResponse(response) {
        let html = `<div class="triage-response">`;
        
        // Main response text
        if (response.text) {
            html += `<div class="response-text">${formatTextMessage(response.text)}</div>`;
        }
        
        // Triage level indicator
        if (response.triage && response.triage.type) {
            const triageClass = response.send_sos ? 'urgent' : 
                               response.triage.type === 'hospital' ? 'moderate' : 'mild';
            const triageText = response.send_sos ? 'Urgent - Seek immediate care' :
                              response.triage.type === 'hospital' ? 'Moderate - Hospital/Clinic visit recommended' :
                              response.triage.type === 'clinic' ? 'Mild - Clinic visit suggested' : 'Self-care possible';
            
            html += `<div class="triage-indicator ${triageClass}">
                        <strong>🏥 Recommendation:</strong> ${triageText}
                     </div>`;
        }
        
        // Emergency alert
        if (response.send_sos) {
            html += `<div class="emergency-alert">
                        <strong>🚨 URGENT:</strong> Please call emergency services immediately at 112
                        <div class="emergency-buttons" style="margin-top: 10px;">
                            <button class="emergency-call-btn" onclick="callEmergency()">
                                📞 Call 112 Now
                            </button>
                            <button class="first-aid-btn" onclick="showFirstAid()">
                                🏥 First Aid Guide
                            </button>
                        </div>
                     </div>`;
        }
        
        // Possible conditions
        if (response.possible_conditions && response.possible_conditions.length > 0) {
            html += `<div class="possible-conditions">
                        <strong>💭 Possible conditions to discuss with your doctor:</strong>
                        <ul>`;
            response.possible_conditions.forEach(condition => {
                html += `<li><strong>${condition.name}:</strong> ${condition.description}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Safety measures
        if (response.safety_measures && response.safety_measures.length > 0) {
            html += `<div class="safety-measures">
                        <strong>✅ What you can do now:</strong>
                        <ul>`;
            response.safety_measures.forEach(measure => {
                html += `<li>${measure}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Follow-up questions
        if (response.follow_up_questions && response.follow_up_questions.length > 0) {
            html += `<div class="follow-up-questions">
                        <strong>❓ To help me understand better, please answer:</strong>`;
            response.follow_up_questions.forEach((question, index) => {
                html += `<button class="follow-up-btn" onclick="sendFollowUp('${question.replace(/'/g, '\\\'')}')">${question}</button>`;
            });
            html += `</div>`;
        }
        
        // Symptoms count indicator
        if (response.symptoms_count !== undefined) {
            html += `<div class="symptoms-info">
                        <small>📋 Symptoms analyzed: ${response.symptoms_count}</small>
                     </div>`;
        }
        
        html += `</div>`;
        return html;
    }

    // Send follow-up question
    window.sendFollowUp = function(question) {
        if (chatInput) {
            chatInput.value = question;
            sendMessage();
        }
    };

    // Call emergency function
    window.callEmergency = function() {
        if (confirm('This will attempt to call emergency services (112). Do you want to proceed?')) {
            window.location.href = 'tel:112';
        }
    };

    // Show first aid function
    window.showFirstAid = function() {
        showScreen(firstAidScreen);
    };

    // Send message function
    async function sendMessage() {
        const message = chatInput?.value?.trim();
        if (!message || isWaitingForResponse) return;

        // Hide prompt suggestions
        if (promptSuggestionArea) {
            promptSuggestionArea.style.display = 'none';
        }

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';
        
        // Add to conversation history
        conversationHistory.push({ role: 'user', content: message });

        // Show loading state
        isWaitingForResponse = true;
        if (sendButton) sendButton.disabled = true;
        if (chatInput) chatInput.disabled = true;
        
        const loadingMessage = addTypingIndicator();

        try {
            // Call triage API
            const response = await fetch(`${API_BASE_URL}/api/triage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: message,
                    thread_id: threadId
                })
            });

            const data = await response.json();
            
            // Remove loading indicator
            removeTypingIndicator(loadingMessage);

            if (data.success) {
                // Update thread ID if provided
                if (data.thread_id) {
                    threadId = data.thread_id;
                    console.log('Thread ID updated:', threadId);
                }

                // Add AI response
                addMessage(data, 'ai');
                
                // Add to conversation history
                conversationHistory.push({ role: 'assistant', content: data.text });

                // Handle emergency cases
                if (data.send_sos) {
                    showEmergencyActions();
                }

                // Show diagnosis panel if relevant
                if ((data.possible_conditions && data.possible_conditions.length > 0) || data.send_sos) {
                    showDiagnosisPanel(data);
                }

            } else {
                // Handle error - try fallback to basic health analysis
                console.warn('Triage API failed, trying fallback:', data.error);
                await handleFallbackAnalysis(message);
            }

        } catch (error) {
            console.error('Error calling triage API:', error);
            removeTypingIndicator(loadingMessage);
            
            // Try fallback to basic health analysis
            await handleFallbackAnalysis(message);
        } finally {
            // Re-enable input
            isWaitingForResponse = false;
            if (sendButton) sendButton.disabled = false;
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.focus();
            }
        }
    }

    // Fallback to basic health analysis
    async function handleFallbackAnalysis(message) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            if (data.success) {
                addMessage(data.response, 'ai');
            } else {
                addMessage("I'm sorry, I encountered an error processing your request. Please try again or seek medical attention if your symptoms are concerning.", 'ai');
            }
        } catch (error) {
            console.error('Fallback API also failed:', error);
            addMessage("I'm sorry, there was a connection error. Please check your internet connection and try again. If this is an emergency, please call 112 immediately.", 'ai');
        }
    }

    // Add typing indicator
    function addTypingIndicator() {
        if (!chatMessages) return null;

        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message-bubble', 'ai', 'typing-indicator');
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">HealthMate AI is analyzing your symptoms...</span>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    // Remove typing indicator
    function removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.remove();
        }
    }

    // Show emergency actions
    function showEmergencyActions() {
        if (!chatMessages) return;

        const emergencyDiv = document.createElement('div');
        emergencyDiv.classList.add('emergency-actions');
        emergencyDiv.innerHTML = `
            <div class="emergency-banner">
                <h3>🚨 EMERGENCY RESPONSE NEEDED</h3>
                <p>Your symptoms may require immediate medical attention.</p>
                <div class="emergency-buttons">
                    <button class="emergency-call-btn" onclick="callEmergency()">
                        📞 Call 112 (Emergency)
                    </button>
                    <button class="first-aid-btn" onclick="showFirstAid()">
                        🏥 First Aid Guide
                    </button>
                </div>
            </div>
        `;
        chatMessages.appendChild(emergencyDiv);
        scrollToBottom();
    }

    // Show diagnosis panel
    function showDiagnosisPanel(data) {
        if (!diagnosisPanel) return;

        // Update panel content
        updateDiagnosisPanel(data);
        
        // Show panel
        diagnosisPanel.style.display = 'flex';
        setTimeout(() => {
            diagnosisPanel.classList.add('active');
        }, 10);
    }

    // Update diagnosis panel content
    function updateDiagnosisPanel(data) {
        if (!diagnosisPanel) return;

        // Update title based on urgency
        const title = diagnosisPanel.querySelector('#diagnosis-panel-title');
        if (title) {
            title.textContent = data.send_sos ? 'Urgent Action Required' : 'Health Assessment Results';
        }

        // Update triage level
        const triageElement = diagnosisPanel.querySelector('#diagnosis-triage');
        if (triageElement && data.triage) {
            const triageType = data.send_sos ? 'urgent' : 
                              data.triage.type === 'hospital' ? 'moderate' : 'mild';
            triageElement.className = `triage-level ${triageType}`;
            
            const indicator = data.send_sos ? '🟥' : 
                             data.triage.type === 'hospital' ? '🟡' : '🟢';
            const timeframe = data.send_sos ? 'Immediately' : 
                             data.triage.type === 'hospital' ? 'Within 24 hours' : 
                             'Within 3-5 days';
            
            triageElement.innerHTML = `
                <span class="level-indicator">${indicator}</span>
                ${triageType.charAt(0).toUpperCase() + triageType.slice(1)} 
                (Seek care ${timeframe})
            `;
        }

        // Show/hide urgent content
        const urgentContent = diagnosisPanel.querySelector('#urgent-diagnosis-content');
        if (urgentContent) {
            urgentContent.style.display = data.send_sos ? 'flex' : 'none';
        }

        // Update condition
        const conditionElement = diagnosisPanel.querySelector('#diagnosis-condition');
        if (conditionElement && data.possible_conditions && data.possible_conditions.length > 0) {
            conditionElement.textContent = data.possible_conditions[0].name;
        }

        // Update analysis summary
        const analysisList = diagnosisPanel.querySelector('#analysis-summary-list');
        if (analysisList && data.safety_measures) {
            analysisList.innerHTML = '';
            data.safety_measures.slice(0, 3).forEach(measure => {
                const li = document.createElement('li');
                li.textContent = measure;
                analysisList.appendChild(li);
            });
        }

        // Update next steps
        const nextStepsList = diagnosisPanel.querySelector('#next-steps-list');
        if (nextStepsList && data.follow_up_questions) {
            nextStepsList.innerHTML = '';
            data.follow_up_questions.forEach(question => {
                const li = document.createElement('li');
                li.textContent = question;
                nextStepsList.appendChild(li);
            });
        }
    }

    // Screen management functions
    function showScreen(screenToShow, fromSidebar = false) {
        // Hide all major app content screens
        [welcomeScreen, chatScreen, firstAidScreen, symptomsHistoryScreen, 
         healthFactsScreen, emergencyContactsScreen, settingsScreen].forEach(screen => {
            if (screen) screen.classList.remove('active-screen');
        });

        // Activate the desired screen
        if (screenToShow) {
            screenToShow.classList.add('active-screen');
            currentActiveContentScreen = screenToShow;
        }

        // If navigation happened from sidebar, close the sidebar
        if (fromSidebar) {
            closeSidebar();
        }
    }

    // Sidebar functions
    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    // Scroll to bottom
    function scrollToBottom() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Event Listeners
    if (startChatButton) {
        startChatButton.addEventListener('click', () => {
            showScreen(chatScreen);
            initializeChat();
            setTimeout(() => {
                if (chatInput) chatInput.focus();
            }, 600);
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Handle input field changes to hide/show prompt area
        chatInput.addEventListener('input', () => {
            if (chatInput.value.length > 0) {
                if (promptSuggestionArea) {
                    promptSuggestionArea.style.display = 'none';
                }
            } else {
                // Only show if no diagnosis panel is active and input is empty
                if (promptSuggestionArea && (!diagnosisPanel || !diagnosisPanel.classList.contains('active'))) {
                    promptSuggestionArea.style.display = 'flex';
                }
            }
        });
    }

    // Prompt buttons
    if (promptButtons) {
        promptButtons.forEach(button => {
            button.addEventListener('click', () => {
                const promptText = button.getAttribute('data-prompt');
                if (promptText && chatInput) {
                    chatInput.value = promptText;
                    sendMessage();
                }
            });
        });
    }

    // Refresh prompts button
    if (refreshPromptsButton) {
        refreshPromptsButton.addEventListener('click', () => {
            if (promptSuggestionArea && chatInput) {
                promptSuggestionArea.style.display = 'flex';
                chatInput.value = '';
                chatInput.focus();
            }
        });
    }

    // Sidebar toggle button
    if (sidebarToggleButton) {
        sidebarToggleButton.addEventListener('click', openSidebar);
    }

    // Close sidebar button
    if (closeSidebarButton) {
        closeSidebarButton.addEventListener('click', closeSidebar);
    }

    // Overlay click to close sidebar
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Sidebar navigation items
    if (navItems) {
        navItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const targetScreenId = item.dataset.targetScreen;
                let targetScreen;

                // Remove active class from all nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                // Add active class to the clicked nav item
                item.classList.add('active');

                // Map data-target-screen to actual DOM elements
                switch (targetScreenId) {
                    case 'chat-screen':
                        targetScreen = chatScreen;
                        // When navigating to chat from sidebar, ensure prompt area is visible if appropriate
                        if (conversationHistory.length === 0 && chatInput && chatInput.value === '') {
                            if (promptSuggestionArea) {
                                promptSuggestionArea.style.display = 'flex';
                            }
                        }
                        break;
                    case 'symptoms-history-screen':
                        targetScreen = symptomsHistoryScreen;
                        break;
                    case 'health-facts-screen':
                        targetScreen = healthFactsScreen;
                        break;
                    case 'emergency-contacts-screen':
                        targetScreen = emergencyContactsScreen;
                        break;
                    case 'settings-screen':
                        targetScreen = settingsScreen;
                        break;
                    default:
                        targetScreen = welcomeScreen;
                }
                showScreen(targetScreen, true);
            });
        });
    }

    // Back buttons for all app screens
    if (allBackButtons) {
        allBackButtons.forEach(button => {
            button.addEventListener('click', () => {
                showScreen(chatScreen);
                // Ensure chat nav item is active when going back to chat
                const chatNavItem = document.querySelector('.nav-item[data-target-screen="chat-screen"]');
                if (chatNavItem) {
                    navItems.forEach(nav => nav.classList.remove('active'));
                    chatNavItem.classList.add('active');
                }
            });
        });
    }

    // Close diagnosis panel
    const closeDiagnosisButton = document.getElementById('close-diagnosis-panel');
    if (closeDiagnosisButton) {
        closeDiagnosisButton.addEventListener('click', () => {
            if (diagnosisPanel) {
                diagnosisPanel.classList.remove('active');
                setTimeout(() => {
                    diagnosisPanel.style.display = 'none';
                }, 300);
            }
        });
    }

    // Reopen diagnosis panel button
    const reopenPanelButton = document.getElementById('reopen-panel-button');
    if (reopenPanelButton) {
        reopenPanelButton.addEventListener('click', () => {
            if (diagnosisPanel) {
                diagnosisPanel.style.display = 'flex';
                diagnosisPanel.classList.add('active');
                reopenPanelButton.style.display = 'none';
            }
        });
    }

    // Emergency and first aid buttons
    const callEmergencyButton = document.getElementById('call-emergency-button');
    if (callEmergencyButton) {
        callEmergencyButton.addEventListener('click', () => {
            window.callEmergency();
        });
    }

    const performFirstAidButton = document.getElementById('perform-first-aid-button');
    if (performFirstAidButton) {
        performFirstAidButton.addEventListener('click', () => {
            window.showFirstAid();
        });
    }

    // Back to chat from first aid
    const backToChatButton = document.querySelector('.first-aid-screen .back-button');
    if (backToChatButton) {
        backToChatButton.addEventListener('click', () => {
            showScreen(chatScreen);
        });
    }

    // Initialize on page load
    if (welcomeScreen) {
        showScreen(welcomeScreen);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key to close sidebar or diagnosis panel
        if (e.key === 'Escape') {
            if (sidebar && sidebar.classList.contains('active')) {
                closeSidebar();
            } else if (diagnosisPanel && diagnosisPanel.classList.contains('active')) {
                diagnosisPanel.classList.remove('active');
                setTimeout(() => {
                    diagnosisPanel.style.display = 'none';
                }, 300);
            }
        }
        
        // Ctrl/Cmd + Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && chatInput && !isWaitingForResponse) {
            sendMessage();
        }
    });

    // Auto-save conversation to localStorage (optional)
    function saveConversation() {
        if (threadId && conversationHistory.length > 0) {
            const conversationData = {
                threadId: threadId,
                history: conversationHistory,
                timestamp: new Date().toISOString()
            };
            try {
                localStorage.setItem(`healthmate_conversation_${threadId}`, JSON.stringify(conversationData));
            } catch (e) {
                console.warn('Could not save conversation to localStorage:', e);
            }
        }
    }

    // Load previous conversation (optional)
    function loadConversation(savedThreadId) {
        try {
            const saved = localStorage.getItem(`healthmate_conversation_${savedThreadId}`);
            if (saved) {
                const conversationData = JSON.parse(saved);
                threadId = conversationData.threadId;
                conversationHistory = conversationData.history || [];
                
                // Restore chat messages
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                    conversationHistory.forEach(msg => {
                        if (msg.role === 'user') {
                            addMessage(msg.content, 'user');
                        } else if (msg.role === 'assistant') {
                            addMessage(msg.content, 'ai');
                        }
                    });
                }
                
                return true;
            }
        } catch (e) {
            console.warn('Could not load conversation from localStorage:', e);
        }
        return false;
    }

    // Save conversation after each message
    const originalAddMessage = addMessage;
    addMessage = function(text, sender, isInitial = false) {
        const result = originalAddMessage.call(this, text, sender, isInitial);
        if (!isInitial && threadId) {
            setTimeout(saveConversation, 1000); // Save after 1 second delay
        }
        return result;
    };

    // Error handling for fetch requests
    function handleFetchError(error) {
        console.error('Fetch error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            return "I'm having trouble connecting to the server. Please check your internet connection and try again.";
        } else if (error.name === 'AbortError') {
            return "The request timed out. Please try again.";
        } else {
            return "An unexpected error occurred. Please try again or contact support if the problem persists.";
        }
    }

    // Add connection status indicator
    function updateConnectionStatus(isOnline) {
        const statusIndicator = document.querySelector('.connection-status') || createConnectionStatusIndicator();
        
        if (isOnline) {
            statusIndicator.textContent = '🟢 Connected';
            statusIndicator.className = 'connection-status online';
        } else {
            statusIndicator.textContent = '🔴 Offline';
            statusIndicator.className = 'connection-status offline';
        }
    }

    function createConnectionStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'connection-status';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 1000;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(indicator);
        return indicator;
    }

    // Monitor connection status
    window.addEventListener('online', () => updateConnectionStatus(true));
    window.addEventListener('offline', () => updateConnectionStatus(false));
    updateConnectionStatus(navigator.onLine);

    console.log('✅ HealthMate AI Chatbot initialized successfully');
    console.log('🔗 API Base URL:', API_BASE_URL);
    console.log('🧵 Thread ID will be maintained for conversation context');
});
