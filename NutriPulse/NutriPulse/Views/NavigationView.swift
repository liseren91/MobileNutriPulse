import SwiftUI

struct BottomNavigationView: View {
    @Binding var currentView: ViewState
    let language: UserProfile.Language
    
    var body: some View {
        HStack(spacing: 0) {
            NavButton(
                icon: "chart.bar.fill",
                label: language == .ru ? "Статус" : "Status",
                isActive: currentView == .dashboard
            ) {
                currentView = .dashboard
            }
            
            NavButton(
                icon: "calendar",
                label: language == .ru ? "План" : "Plan",
                isActive: currentView == .meals
            ) {
                currentView = .meals
            }
            
            NavButton(
                icon: "cart.fill",
                label: language == .ru ? "Список" : "List",
                isActive: currentView == .shopping
            ) {
                currentView = .shopping
            }
            
            NavButton(
                icon: "message.fill",
                label: language == .ru ? "Коуч" : "Coach",
                isActive: currentView == .chat
            ) {
                currentView = .chat
            }
        }
        .frame(height: 60)
        .background(Color(uiColor: .systemBackground))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color.gray.opacity(0.2)),
            alignment: .top
        )
    }
}

struct NavButton: View {
    let icon: String
    let label: String
    let isActive: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                Text(label)
                    .font(.system(size: 10, weight: .medium))
            }
            .frame(maxWidth: .infinity)
            .foregroundColor(isActive ? .teal : .gray)
        }
    }
}

