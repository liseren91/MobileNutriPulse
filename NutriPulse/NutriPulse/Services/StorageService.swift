import Foundation

class StorageService {
    static let shared = StorageService()
    
    private let profileKey = "nutripulse_profile"
    private let mealsKey = "nutripulse_meals"
    private let shoppingKey = "nutripulse_shopping"
    
    private init() {}
    
    func saveProfile(_ profile: UserProfile) {
        if let encoded = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(encoded, forKey: profileKey)
        }
    }
    
    func loadProfile() -> UserProfile? {
        guard let data = UserDefaults.standard.data(forKey: profileKey),
              let profile = try? JSONDecoder().decode(UserProfile.self, from: data) else {
            return nil
        }
        return profile
    }
    
    func saveMeals(_ meals: [Meal]) {
        if let encoded = try? JSONEncoder().encode(meals) {
            UserDefaults.standard.set(encoded, forKey: mealsKey)
        }
    }
    
    func loadMeals() -> [Meal] {
        guard let data = UserDefaults.standard.data(forKey: mealsKey),
              let meals = try? JSONDecoder().decode([Meal].self, from: data) else {
            return []
        }
        return meals
    }
    
    func saveShoppingList(_ items: [Ingredient]) {
        if let encoded = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(encoded, forKey: shoppingKey)
        }
    }
    
    func loadShoppingList() -> [Ingredient] {
        guard let data = UserDefaults.standard.data(forKey: shoppingKey),
              let items = try? JSONDecoder().decode([Ingredient].self, from: data) else {
            return []
        }
        return items
    }
}

