import SwiftUI
import UserNotifications

struct DashboardView: View {
    let profile: UserProfile
    let updateLastMeal: () -> Void
    let onRequestPlan: () -> Void
    let hasPlan: Bool
    let isLoadingPlan: Bool
    
    @State private var timeLeft = "00:00:00"
    @State private var progress: Double = 100
    @State private var status: MealStatus = .good
    @State private var notificationsEnabled = false
    
    enum MealStatus {
        case good, hungry, urgent, night
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        Text(profile.language == .ru ? "Привет" : "Hello")
                            .font(.title2)
                            .fontWeight(.bold)
                        + Text(", \(profile.name)")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text(profile.language == .ru ? "Поддерживаем уровень энергии." : "Maintaining energy levels.")
                            .foregroundColor(.secondary)
                            .font(.subheadline)
                    }
                    Spacer()
                    HStack(spacing: 12) {
                        Button(action: requestNotificationAccess) {
                            Image(systemName: notificationsEnabled ? "bell.fill" : "bell.slash.fill")
                                .foregroundColor(notificationsEnabled ? .teal : .gray)
                                .padding(8)
                                .background(notificationsEnabled ? Color.teal.opacity(0.1) : Color.gray.opacity(0.1))
                                .clipShape(Circle())
                        }
                        Circle()
                            .fill(statusColor)
                            .frame(width: 12, height: 12)
                            .opacity(0.8)
                    }
                }
                .padding(.horizontal)
                .padding(.top)
                
                // Main Timer Card
                VStack(spacing: 16) {
                    GeometryReader { geometry in
                        Rectangle()
                            .fill(statusColor)
                            .frame(width: geometry.size.width * progress / 100, height: 4)
                    }
                    .frame(height: 4)
                    
                    statusIcon
                        .font(.system(size: 48))
                        .foregroundColor(statusColor)
                    
                    Text(status == .night ? (profile.language == .ru ? "Завтрак через" : "Breakfast in") : (profile.language == .ru ? "Следующий прием пищи" : "Next meal"))
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)
                        .tracking(1)
                    
                    Text(timeLeft)
                        .font(.system(size: 48, weight: .bold, design: .monospaced))
                        .foregroundColor(status == .night ? .white : .primary)
                    
                    Button(action: updateLastMeal) {
                        HStack {
                            Image(systemName: status == .night ? "sunrise.fill" : "clock.fill")
                            Text(status == .night ? (profile.language == .ru ? "Я позавтракал(а)" : "I ate breakfast") : (profile.language == .ru ? "Я поел(а)" : "I ate"))
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(status == .night ? Color(white: 0.3) : Color.black)
                        .foregroundColor(.white)
                        .cornerRadius(16)
                        .fontWeight(.semibold)
                    }
                    
                    if status == .urgent {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                            Text(profile.language == .ru ? "Пожалуйста, перекусите сейчас!" : "Please have a snack now!")
                        }
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.red)
                    }
                    if status == .night {
                        Text(profile.language == .ru ? "Отдыхайте. До встречи утром!" : "Rest. See you in the morning!")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.indigo.opacity(0.7))
                    }
                }
                .padding(32)
                .background(status == .night ? Color(white: 0.1) : Color.white)
                .cornerRadius(24)
                .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 2)
                .padding(.horizontal)
                
                // Plan section
                if !hasPlan {
                    VStack(spacing: 12) {
                        Text(profile.language == .ru ? "Нет активного плана" : "No active plan")
                            .font(.headline)
                            .foregroundColor(.teal)
                        Text(profile.language == .ru ? "Создайте план на 3 дня с рецептами по 5-10 минут." : "Create a 3-day plan with 5-10 min recipes.")
                            .font(.subheadline)
                            .foregroundColor(.teal.opacity(0.8))
                            .multilineTextAlignment(.center)
                        Button(action: onRequestPlan) {
                            HStack {
                                if isLoadingPlan {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: "play.fill")
                                    Text(profile.language == .ru ? "Создать план" : "Create plan")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.teal)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                            .fontWeight(.medium)
                        }
                        .disabled(isLoadingPlan)
                    }
                    .padding()
                    .background(Color.teal.opacity(0.1))
                    .cornerRadius(16)
                    .padding(.horizontal)
                } else {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(profile.language == .ru ? "План активен" : "Plan active")
                                .font(.headline)
                                .foregroundColor(.indigo)
                            Text(profile.language == .ru ? "У вас есть готовые рецепты и список продуктов." : "You have recipes and a shopping list.")
                                .font(.caption)
                                .foregroundColor(.indigo.opacity(0.8))
                        }
                        Spacer()
                        Button(action: onRequestPlan) {
                            HStack {
                                if isLoadingPlan {
                                    ProgressView()
                                        .tint(.indigo)
                                } else {
                                    Image(systemName: "arrow.clockwise")
                                    Text(profile.language == .ru ? "Новый план" : "New plan")
                                        .font(.caption)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .foregroundColor(.indigo)
                            .cornerRadius(12)
                            .fontWeight(.semibold)
                        }
                        .disabled(isLoadingPlan)
                    }
                    .padding()
                    .background(Color.indigo.opacity(0.1))
                    .cornerRadius(16)
                    .padding(.horizontal)
                }
                
                // Stats
                HStack(spacing: 12) {
                    StatCard(emoji: "🔥", title: profile.language == .ru ? "Серия" : "Streak", value: "2 \(profile.language == .ru ? "дня" : "days")", color: .orange)
                    StatCard(emoji: "💧", title: profile.language == .ru ? "Вода" : "Water", value: profile.language == .ru ? "В норме" : "Normal", color: .blue)
                }
                .padding(.horizontal)
            }
            .padding(.bottom, 100)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .onAppear {
            checkNotificationPermission()
            startTimer()
        }
    }
    
    private var statusIcon: some View {
        Group {
            switch status {
            case .night:
                Image(systemName: "moon.fill")
            case .good:
                Image(systemName: "battery.100")
            case .hungry:
                Image(systemName: "battery.50")
            case .urgent:
                Image(systemName: "battery.25")
            }
        }
    }
    
    private var statusColor: Color {
        switch status {
        case .night: return .indigo
        case .good: return .green
        case .hungry: return .orange
        case .urgent: return .red
        }
    }
    
    private func checkNotificationPermission() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                notificationsEnabled = settings.authorizationStatus == .authorized
            }
        }
    }
    
    private func requestNotificationAccess() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async {
                notificationsEnabled = granted
            }
        }
    }
    
    private func startTimer() {
        updateTimer()
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            updateTimer()
        }
    }
    
    private func updateTimer() {
        guard let lastMealTime = profile.lastMealTime else {
            timeLeft = "00:00:00"
            progress = 100
            return
        }
        
        let now = Date().timeIntervalSince1970
        let currentHour = Calendar.current.component(.hour, from: Date())
        
        let sleepStart = profile.sleepStartHour
        let breakfastHour = profile.breakfastHour
        
        let isNightNow: Bool
        if sleepStart > breakfastHour {
            isNightNow = currentHour >= sleepStart || currentHour < breakfastHour
        } else {
            isNightNow = currentHour >= sleepStart && currentHour < breakfastHour
        }
        
        var nextMealTime = lastMealTime + Double(profile.eatingFrequencyHours * 3600)
        let nextMealDate = Date(timeIntervalSince1970: nextMealTime)
        let nextMealHour = Calendar.current.component(.hour, from: nextMealDate)
        
        var isOvernight = false
        var shouldReschedule = false
        
        if sleepStart > breakfastHour {
            shouldReschedule = nextMealHour >= sleepStart || nextMealHour < breakfastHour
        } else {
            shouldReschedule = nextMealHour >= sleepStart && nextMealHour < breakfastHour
        }
        
        if shouldReschedule {
            var rescheduledDate = nextMealDate
            if nextMealHour >= sleepStart && sleepStart > breakfastHour {
                rescheduledDate = Calendar.current.date(byAdding: .day, value: 1, to: rescheduledDate) ?? rescheduledDate
            }
            rescheduledDate = Calendar.current.date(bySettingHour: breakfastHour, minute: 0, second: 0, of: rescheduledDate) ?? rescheduledDate
            nextMealTime = rescheduledDate.timeIntervalSince1970
            isOvernight = true
        }
        
        let diff = nextMealTime - now
        let totalDuration = nextMealTime - lastMealTime
        
        if isNightNow && diff > 0 {
            status = .night
            let hours = Int(diff / 3600)
            let minutes = Int((diff.truncatingRemainder(dividingBy: 3600)) / 60)
            timeLeft = "\(hours)h \(minutes)m"
            progress = 100
        } else if diff <= 0 {
            timeLeft = "00:00:00"
            progress = 0
            if isNightNow {
                status = .night
            } else {
                status = .urgent
                if notificationsEnabled {
                    sendNotification()
                }
            }
        } else {
            let hours = Int(diff / 3600)
            let minutes = Int((diff.truncatingRemainder(dividingBy: 3600)) / 60)
            let seconds = Int(diff.truncatingRemainder(dividingBy: 60))
            timeLeft = String(format: "%02d:%02d:%02d", hours, minutes, seconds)
            
            let pct = (diff / totalDuration) * 100
            progress = pct
            
            if isOvernight {
                status = .good
            } else {
                if pct < 20 {
                    status = .urgent
                } else if pct < 50 {
                    status = .hungry
                } else {
                    status = .good
                }
            }
        }
    }
    
    private func sendNotification() {
        let content = UNMutableNotificationContent()
        content.title = profile.language == .ru ? "NutriPulse: Пора есть! 🍽️" : "NutriPulse: Time to eat! 🍽️"
        content.body = profile.language == .ru ? "Пожалуйста, перекусите сейчас!" : "Please have a snack now!"
        content.sound = .default
        
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}

struct StatCard: View {
    let emoji: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(emoji)
                .font(.title2)
            Text(title)
                .font(.caption2)
                .fontWeight(.bold)
                .textCase(.uppercase)
                .foregroundColor(color.opacity(0.8))
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(16)
    }
}

