import SwiftUI

struct OnboardingView: View {
    @Binding var profile: UserProfile?
    @State private var step = 1
    @State private var name = ""
    @State private var goal = ""
    @State private var diet = ""
    @State private var freq = 4
    @State private var sleepTime = 23
    @State private var wakeTime = 8
    @State private var language: UserProfile.Language = .ru
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Language toggle
                HStack {
                    Spacer()
                    Button(action: {
                        language = language == .ru ? .en : .ru
                        goal = ""
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "globe")
                            Text(language.rawValue.uppercased())
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                    .padding()
                }
                
                VStack(spacing: 24) {
                    // Progress
                    HStack {
                        Text(language == .ru ? "Шаг \(step) из 4" : "Step \(step) of 4")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.teal)
                        Spacer()
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(height: 4)
                                    .cornerRadius(2)
                                Rectangle()
                                    .fill(Color.teal)
                                    .frame(width: geometry.size.width * CGFloat(step) / 4.0, height: 4)
                                    .cornerRadius(2)
                            }
                        }
                        .frame(height: 4)
                    }
                    .padding(.horizontal)
                    
                    // Step content
                    Group {
                        if step == 1 {
                            step1View
                        } else if step == 2 {
                            step2View
                        } else if step == 3 {
                            step3View
                        } else {
                            step4View
                        }
                    }
                    .padding(.horizontal)
                    
                    // Next button
                    Button(action: handleNext) {
                        HStack {
                            Text(step == 4 ? (language == .ru ? "Начать путь" : "Start Journey") : (language == .ru ? "Далее" : "Next"))
                            Image(systemName: "arrow.right")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(name.isEmpty && step == 1 ? Color.gray : Color.teal)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .fontWeight(.semibold)
                    }
                    .disabled(step == 1 && name.isEmpty)
                    .padding(.horizontal)
                    .padding(.bottom, 40)
                }
                .padding(.top, 20)
            }
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
    
    private var step1View: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(language == .ru ? "Добро пожаловать в NutriPulse" : "Welcome to NutriPulse")
                .font(.title2)
                .fontWeight(.bold)
            Text(language == .ru ? "Давайте настроим вашего личного помощника по питанию." : "Let's set up your personal nutrition assistant.")
                .foregroundColor(.secondary)
            
            Text(language == .ru ? "Как к вам обращаться?" : "What should we call you?")
                .font(.subheadline)
                .fontWeight(.medium)
                .padding(.top, 8)
            
            TextField(language == .ru ? "например, Александр" : "e.g., Alex", text: $name)
                .textFieldStyle(.roundedBorder)
                .padding(.top, 4)
        }
    }
    
    private var step2View: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(language == .ru ? "Ваши цели и питание" : "Your Goals & Diet")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(language == .ru ? "Какова ваша главная цель?" : "What is your main goal?")
                .font(.subheadline)
                .fontWeight(.medium)
            
            Picker("", selection: $goal) {
                Text(language == .ru ? "Похудеть и питаться регулярно" : "Lose weight & eat regularly").tag(language == .ru ? "Похудеть и питаться регулярно" : "Lose weight & eat regularly")
                Text(language == .ru ? "Набрать мышечную массу" : "Build muscle mass").tag(language == .ru ? "Набрать мышечную массу" : "Build muscle mass")
                Text(language == .ru ? "Поддерживать здоровые привычки" : "Maintain healthy habits").tag(language == .ru ? "Поддерживать здоровые привычки" : "Maintain healthy habits")
                Text(language == .ru ? "Повысить уровень энергии" : "Increase energy levels").tag(language == .ru ? "Повысить уровень энергии" : "Increase energy levels")
            }
            .pickerStyle(.menu)
            .padding(.top, 4)
            
            if goal.isEmpty {
                goal = language == .ru ? "Похудеть и питаться регулярно" : "Lose weight & eat regularly"
            }
            
            Text(language == .ru ? "Есть ли ограничения в еде?" : "Any dietary restrictions?")
                .font(.subheadline)
                .fontWeight(.medium)
                .padding(.top, 8)
            
            TextField(language == .ru ? "например, Вегетарианец, Аллергия на орехи..." : "e.g., Vegetarian, Nut allergy, Keto...", text: $diet, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...6)
                .padding(.top, 4)
        }
    }
    
    private var step3View: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(language == .ru ? "Интервалы" : "Intervals")
                .font(.title2)
                .fontWeight(.bold)
            Text(language == .ru ? "Как часто вы хотите есть в течение дня?" : "How often do you want to eat?")
                .foregroundColor(.secondary)
                .font(.subheadline)
            
            VStack(spacing: 12) {
                ForEach([3, 4, 5], id: \.self) { hours in
                    Button(action: { freq = hours }) {
                        HStack {
                            Text(language == .ru ? "Каждые \(hours) часа(ов)" : "Every \(hours) hours")
                            Spacer()
                            if freq == hours {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.teal)
                            }
                        }
                        .padding()
                        .background(freq == hours ? Color.teal.opacity(0.1) : Color.clear)
                        .foregroundColor(freq == hours ? .teal : .primary)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(freq == hours ? Color.teal : Color.gray.opacity(0.3), lineWidth: 1)
                        )
                    }
                }
            }
            .padding(.top, 8)
        }
    }
    
    private var step4View: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(language == .ru ? "Режим дня" : "Daily Schedule")
                .font(.title2)
                .fontWeight(.bold)
            Text(language == .ru ? "Настройте время сна, чтобы мы не беспокоили вас ночью." : "Set your sleep time so we don't disturb you.")
                .foregroundColor(.secondary)
                .font(.subheadline)
            
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "moon.fill")
                            .foregroundColor(.indigo)
                        Text(language == .ru ? "Отбой (начало сна)" : "Bedtime (Sleep start)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    Picker("", selection: $sleepTime) {
                        ForEach(0..<24, id: \.self) { hour in
                            Text(String(format: "%02d:00", hour)).tag(hour)
                        }
                    }
                    .pickerStyle(.menu)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "sunrise.fill")
                            .foregroundColor(.orange)
                        Text(language == .ru ? "Завтрак (подъем)" : "Wake up (Breakfast)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    Picker("", selection: $wakeTime) {
                        ForEach(0..<24, id: \.self) { hour in
                            Text(String(format: "%02d:00", hour)).tag(hour)
                        }
                    }
                    .pickerStyle(.menu)
                }
            }
            .padding(.top, 8)
        }
    }
    
    private func handleNext() {
        if step < 4 {
            step += 1
        } else {
            let newProfile = UserProfile(
                name: name,
                eatingFrequencyHours: freq,
                dietaryPreferences: diet.isEmpty ? "None" : diet,
                goals: goal,
                lastMealTime: Date().timeIntervalSince1970,
                sleepStartHour: sleepTime,
                breakfastHour: wakeTime,
                excludedIngredients: nil,
                language: language
            )
            StorageService.shared.saveProfile(newProfile)
            profile = newProfile
        }
    }
}

