import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            if appState.profile == nil || appState.view == .onboarding {
                OnboardingView(profile: Binding(
                    get: { appState.profile },
                    set: { newProfile in
                        if let profile = newProfile {
                            appState.saveProfile(profile)
                            appState.view = .dashboard
                        }
                    }
                ))
            } else {
                ZStack(alignment: .bottom) {
                    Group {
                        switch appState.view {
                        case .dashboard:
                            DashboardView(
                                profile: appState.profile!,
                                updateLastMeal: appState.updateLastMeal,
                                onRequestPlan: appState.generatePlan,
                                hasPlan: !appState.meals.isEmpty,
                                isLoadingPlan: appState.isLoadingPlan
                            )
                        case .meals:
                            MealListView(
                                meals: appState.meals,
                                language: appState.profile!.language
                            )
                        case .shopping:
                            ShoppingListView(
                                items: Binding(
                                    get: { appState.shoppingList },
                                    set: { appState.updateShoppingList($0) }
                                ),
                                onRegenerate: appState.regeneratePlan,
                                isRegenerating: appState.isLoadingPlan,
                                currentExclusions: appState.profile?.excludedIngredients,
                                language: appState.profile!.language
                            )
                        case .chat:
                            ChatCoachView(profile: appState.profile!)
                        case .onboarding:
                            EmptyView()
                        }
                    }
                    
                    if appState.view != .onboarding {
                        BottomNavigationView(
                            currentView: Binding(
                                get: { appState.view },
                                set: { appState.view = $0 }
                            ),
                            language: appState.profile!.language
                        )
                    }
                }
            }
        }
    }
}

