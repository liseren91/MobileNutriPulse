import SwiftUI

@main
struct NutriPulseApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

class AppState: ObservableObject {
    @Published var view: ViewState = .onboarding
    @Published var profile: UserProfile?
    @Published var meals: [Meal] = []
    @Published var shoppingList: [Ingredient] = []
    @Published var isLoadingPlan = false
    
    init() {
        loadData()
    }
    
    func loadData() {
        if let savedProfile = StorageService.shared.loadProfile() {
            profile = savedProfile
            view = .dashboard
        }
        meals = StorageService.shared.loadMeals()
        shoppingList = StorageService.shared.loadShoppingList()
    }
    
    func saveProfile(_ newProfile: UserProfile) {
        profile = newProfile
        StorageService.shared.saveProfile(newProfile)
    }
    
    func updateLastMeal() {
        guard var currentProfile = profile else { return }
        currentProfile.lastMealTime = Date().timeIntervalSince1970
        saveProfile(currentProfile)
    }
    
    func generatePlan() {
        guard let currentProfile = profile else { return }
        isLoadingPlan = true
        
        Task {
            do {
                let response = try await GeminiService.shared.generateMealPlan(profile: currentProfile)
                await MainActor.run {
                    meals = response.meals
                    shoppingList = response.shoppingList
                    StorageService.shared.saveMeals(response.meals)
                    StorageService.shared.saveShoppingList(response.shoppingList)
                    view = .meals
                    isLoadingPlan = false
                }
            } catch {
                await MainActor.run {
                    isLoadingPlan = false
                    // TODO: Show error alert
                    print("Failed to generate plan: \(error)")
                }
            }
        }
    }
    
    func regeneratePlan(exclusions: String) {
        guard var currentProfile = profile else { return }
        currentProfile.excludedIngredients = exclusions
        saveProfile(currentProfile)
        isLoadingPlan = true
        
        Task {
            do {
                let response = try await GeminiService.shared.generateMealPlan(profile: currentProfile)
                await MainActor.run {
                    meals = response.meals
                    shoppingList = response.shoppingList
                    StorageService.shared.saveMeals(response.meals)
                    StorageService.shared.saveShoppingList(response.shoppingList)
                    isLoadingPlan = false
                }
            } catch {
                await MainActor.run {
                    isLoadingPlan = false
                    print("Failed to regenerate plan: \(error)")
                }
            }
        }
    }
    
    func toggleShoppingItem(at index: Int) {
        guard index < shoppingList.count else { return }
        shoppingList[index].checked.toggle()
        StorageService.shared.saveShoppingList(shoppingList)
    }
    
    func clearShoppingList() {
        shoppingList.removeAll()
        StorageService.shared.saveShoppingList(shoppingList)
    }
    
    func updateShoppingList(_ newList: [Ingredient]) {
        shoppingList = newList
        StorageService.shared.saveShoppingList(shoppingList)
    }
}

