import SwiftUI

struct ChatCoachView: View {
    let profile: UserProfile
    
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isLoading = false
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(messages) { message in
                            ChatBubble(message: message, language: profile.language)
                                .id(message.id)
                        }
                        
                        if isLoading {
                            HStack(alignment: .bottom, spacing: 8) {
                                Circle()
                                    .fill(Color.teal.opacity(0.2))
                                    .frame(width: 32, height: 32)
                                    .overlay(
                                        Image(systemName: "brain.head.profile")
                                            .foregroundColor(.teal)
                                            .font(.caption)
                                    )
                                HStack(spacing: 4) {
                                    Circle()
                                        .fill(Color.gray)
                                        .frame(width: 8, height: 8)
                                    Circle()
                                        .fill(Color.gray)
                                        .frame(width: 8, height: 8)
                                        .offset(y: -4)
                                    Circle()
                                        .fill(Color.gray)
                                        .frame(width: 8, height: 8)
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color.white)
                                .cornerRadius(16)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal)
                        }
                    }
                    .padding()
                    .padding(.bottom, 100)
                }
                .onChange(of: messages.count) { _ in
                    if let lastMessage = messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            // Input area
            HStack(spacing: 12) {
                TextField(profile.language == .ru ? "Спросите что-нибудь..." : "Ask something...", text: $inputText, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)
                    .focused($isInputFocused)
                    .onSubmit {
                        sendMessage()
                    }
                
                Button(action: sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(inputText.trimmingCharacters(in: .whitespaces).isEmpty || isLoading ? .gray : .teal)
                }
                .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
            }
            .padding()
            .background(Color(uiColor: .systemBackground))
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(Color.gray.opacity(0.2)),
                alignment: .top
            )
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .onAppear {
            if messages.isEmpty {
                let welcomeText = (profile.language == .ru ? "Привет, \(profile.name)! Я твой персональный консультант по питанию. Я знаю, что твоя цель: \(profile.goals.lowercased()). Как ты себя чувствуешь сегодня?" : "Hi \(profile.name)! I'm your personal nutrition coach. I know your goal is: \(profile.goals.lowercased()). How are you feeling today?")
                messages.append(ChatMessage(
                    id: "welcome",
                    role: .model,
                    text: welcomeText,
                    timestamp: Date().timeIntervalSince1970
                ))
            }
        }
    }
    
    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty, !isLoading else { return }
        
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            text: text,
            timestamp: Date().timeIntervalSince1970
        )
        
        messages.append(userMessage)
        inputText = ""
        isInputFocused = false
        isLoading = true
        
        Task {
            do {
                let history = messages.dropLast().map { msg in
                    [
                        "role": msg.role.rawValue,
                        "parts": [["text": msg.text]]
                    ] as [String: Any]
                }
                
                let response = try await GeminiService.shared.chatWithNutritionist(
                    history: Array(history),
                    newMessage: userMessage.text,
                    profile: profile
                )
                
                let botMessage = ChatMessage(
                    id: UUID().uuidString,
                    role: .model,
                    text: response,
                    timestamp: Date().timeIntervalSince1970
                )
                
                await MainActor.run {
                    messages.append(botMessage)
                    isLoading = false
                }
            } catch {
                let errorMessage = ChatMessage(
                    id: UUID().uuidString,
                    role: .model,
                    text: profile.language == .ru ? "Извините, нет связи с сервером. Проверьте интернет." : "Sorry, no server connection. Check internet.",
                    timestamp: Date().timeIntervalSince1970
                )
                
                await MainActor.run {
                    messages.append(errorMessage)
                    isLoading = false
                }
            }
        }
    }
}

struct ChatBubble: View {
    let message: ChatMessage
    let language: UserProfile.Language
    
    private var isUser: Bool {
        message.role == .user
    }
    
    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if !isUser {
                Circle()
                    .fill(Color.teal.opacity(0.2))
                    .frame(width: 32, height: 32)
                    .overlay(
                        Image(systemName: "brain.head.profile")
                            .foregroundColor(.teal)
                            .font(.caption)
                    )
            }
            
            Text(message.text)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(isUser ? Color.black : Color.white)
                .foregroundColor(isUser ? .white : .primary)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
            
            if isUser {
                Circle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 32, height: 32)
                    .overlay(
                        Image(systemName: "person.fill")
                            .foregroundColor(.gray)
                            .font(.caption)
                    )
            }
        }
        .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)
    }
}

