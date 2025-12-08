import Foundation

enum ViewState: String, Codable {
    case onboarding
    case dashboard
    case meals
    case shopping
    case chat
}

struct UserProfile: Codable, Identifiable {
    var id: String { name }
    var name: String
    var eatingFrequencyHours: Int
    var dietaryPreferences: String
    var goals: String
    var lastMealTime: TimeInterval?
    var sleepStartHour: Int
    var breakfastHour: Int
    var excludedIngredients: String?
    var language: Language
    
    enum Language: String, Codable {
        case ru, en
    }
}

struct Ingredient: Codable, Identifiable {
    var id: String { item }
    var item: String
    var amount: String
    var checked: Bool
}

struct Meal: Codable, Identifiable {
    var id: String
    var day: Int
    var type: MealType
    var name: String
    var description: String
    var prepTime: String
    var ingredients: [String]
    var instructions: [String]
    var calories: Int?
    
    enum MealType: String, Codable {
        case breakfast = "Breakfast"
        case lunch = "Lunch"
        case dinner = "Dinner"
        case snack = "Snack"
    }
}

struct ChatMessage: Codable, Identifiable {
    var id: String
    var role: MessageRole
    var text: String
    var timestamp: TimeInterval
    
    enum MessageRole: String, Codable {
        case user, model
    }
}

struct MealPlanResponse: Codable {
    var meals: [Meal]
    var shoppingList: [Ingredient]
}

