import SwiftUI

struct MealListView: View {
    let meals: [Meal]
    let language: UserProfile.Language
    
    @State private var expandedId: String? = nil
    @State private var activeDay = 1
    
    private var mealsByDay: [Int: [Meal]] {
        Dictionary(grouping: meals, by: { $0.day })
    }
    
    private var availableDays: [Int] {
        Array(mealsByDay.keys).sorted()
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.teal)
                    Text(language == .ru ? "Ваш план на 3 дня" : "Your 3-day Plan")
                        .font(.title2)
                        .fontWeight(.bold)
                }
                Text(language == .ru ? "Быстрые рецепты за 5-10 минут." : "Quick recipes in 5-10 mins.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            
            // Day tabs
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(availableDays, id: \.self) { day in
                        Button(action: { activeDay = day }) {
                            Text("\(language == .ru ? "День" : "Day") \(day)")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(activeDay == day ? Color.teal : Color.white)
                                .foregroundColor(activeDay == day ? .white : .primary)
                                .cornerRadius(12)
                        }
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 8)
            .background(Color.white)
            
            // Meals list
            if meals.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "fork.knife")
                        .font(.system(size: 64))
                        .foregroundColor(.gray.opacity(0.3))
                    Text(language == .ru ? "План не создан" : "No plan created")
                        .font(.headline)
                    Text(language == .ru ? "Создайте план на главной странице, чтобы начать." : "Create a plan on the dashboard to start.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(mealsByDay[activeDay] ?? [], id: \.id) { meal in
                            MealCard(meal: meal, isExpanded: expandedId == meal.id, language: language) {
                                withAnimation {
                                    expandedId = expandedId == meal.id ? nil : meal.id
                                }
                            }
                        }
                    }
                    .padding()
                    .padding(.bottom, 100)
                }
            }
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .onAppear {
            if !availableDays.isEmpty && !availableDays.contains(activeDay) {
                activeDay = availableDays[0]
            }
        }
    }
}

struct MealCard: View {
    let meal: Meal
    let isExpanded: Bool
    let language: UserProfile.Language
    let onTap: () -> Void
    
    private var mealTypeColor: Color {
        switch meal.type {
        case .breakfast: return .orange
        case .lunch: return .blue
        case .dinner: return .indigo
        case .snack: return .gray
        }
    }
    
    private var mealTypeName: String {
        switch meal.type {
        case .breakfast: return language == .ru ? "Завтрак" : "Breakfast"
        case .lunch: return language == .ru ? "Обед" : "Lunch"
        case .dinner: return language == .ru ? "Ужин" : "Dinner"
        case .snack: return language == .ru ? "Перекус" : "Snack"
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: onTap) {
                HStack {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Text(mealTypeName)
                                .font(.caption2)
                                .fontWeight(.bold)
                                .textCase(.uppercase)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(mealTypeColor.opacity(0.2))
                                .foregroundColor(mealTypeColor)
                                .cornerRadius(6)
                            
                            HStack(spacing: 4) {
                                Image(systemName: "clock")
                                    .font(.caption2)
                                Text(meal.prepTime)
                                    .font(.caption2)
                            }
                            .foregroundColor(.secondary)
                        }
                        
                        Text(meal.name)
                            .font(.headline)
                            .foregroundColor(.primary)
                            .multilineTextAlignment(.leading)
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                }
                .padding()
            }
            .buttonStyle(.plain)
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 16) {
                    Text("\"\(meal.description)\"")
                        .font(.subheadline)
                        .italic()
                        .foregroundColor(.secondary)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text(language == .ru ? "Ингредиенты" : "Ingredients")
                            .font(.caption)
                            .fontWeight(.bold)
                            .textCase(.uppercase)
                        
                        FlowLayout(spacing: 8) {
                            ForEach(meal.ingredients, id: \.self) { ingredient in
                                Text(ingredient)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.white)
                                    .cornerRadius(6)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 6)
                                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                    )
                            }
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text(language == .ru ? "Инструкции" : "Instructions")
                            .font(.caption)
                            .fontWeight(.bold)
                            .textCase(.uppercase)
                        
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(Array(meal.instructions.enumerated()), id: \.offset) { index, instruction in
                                HStack(alignment: .top, spacing: 12) {
                                    Circle()
                                        .fill(Color.teal)
                                        .frame(width: 8, height: 8)
                                        .padding(.top, 6)
                                    Text(instruction)
                                        .font(.subheadline)
                                }
                            }
                        }
                    }
                    
                    if let calories = meal.calories {
                        HStack {
                            Spacer()
                            HStack(spacing: 4) {
                                Image(systemName: "flame.fill")
                                    .foregroundColor(.orange)
                                Text(language == .ru ? "Ок. \(calories) ккал" : "Approx. \(calories) kcal")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                .padding()
                .padding(.top, 8)
                .background(Color(uiColor: .systemGroupedBackground))
            }
        }
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.width ?? 0,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.frames[index].minX, y: bounds.minY + result.frames[index].minY), proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var frames: [CGRect] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }
                
                frames.append(CGRect(x: currentX, y: currentY, width: size.width, height: size.height))
                lineHeight = max(lineHeight, size.height)
                currentX += size.width + spacing
            }
            
            self.size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

