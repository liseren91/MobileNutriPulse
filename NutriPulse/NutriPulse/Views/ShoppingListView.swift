import SwiftUI

struct ShoppingListView: View {
    @Binding var items: [Ingredient]
    let onRegenerate: (String) -> Void
    let isRegenerating: Bool
    let currentExclusions: String?
    let language: UserProfile.Language
    
    @State private var showRegenerate = false
    @State private var exclusions = ""
    @State private var copied = false
    
    private var completedCount: Int {
        items.filter { $0.checked }.count
    }
    
    private var progress: Double {
        items.isEmpty ? 0 : Double(completedCount) / Double(items.count) * 100
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        Text(language == .ru ? "Список покупок" : "Shopping List")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text(isRegenerating ? (language == .ru ? "Обновляем список..." : "Updating list...") : "\(language == .ru ? "Осталось купить" : "Items left"): \(items.count - completedCount)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    HStack(spacing: 12) {
                        Button(action: copyList) {
                            Image(systemName: "doc.on.doc")
                                .foregroundColor(.teal)
                                .padding(8)
                                .background(Color.teal.opacity(0.1))
                                .clipShape(Circle())
                        }
                        .overlay(alignment: .bottom) {
                            if copied {
                                Text(language == .ru ? "Скопировано!" : "Copied!")
                                    .font(.caption2)
                                    .padding(4)
                                    .background(Color.black)
                                    .foregroundColor(.white)
                                    .cornerRadius(4)
                                    .offset(y: 32)
                            }
                        }
                        
                        Button(action: { items.removeAll() }) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                                .padding(8)
                                .background(Color.red.opacity(0.1))
                                .clipShape(Circle())
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.top)
                
                if isRegenerating {
                    VStack(spacing: 16) {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text(language == .ru ? "Пересобираем меню..." : "Regenerating menu...")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                } else if items.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "cart")
                            .font(.system(size: 64))
                            .foregroundColor(.gray.opacity(0.3))
                        Text(language == .ru ? "Список пуст" : "List is empty")
                            .font(.headline)
                        Text(language == .ru ? "Список продуктов появится здесь после создания плана." : "Shopping list will appear here after creating a plan.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                } else {
                    // Progress bar
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 8)
                                .cornerRadius(4)
                            Rectangle()
                                .fill(Color.teal)
                                .frame(width: geometry.size.width * progress / 100, height: 8)
                                .cornerRadius(4)
                        }
                    }
                    .frame(height: 8)
                    .padding(.horizontal)
                    
                    // List
                    VStack(spacing: 0) {
                        ForEach(Array(items.indices), id: \.self) { index in
                            let item = items[index]
                            Button(action: {
                                items[index].checked.toggle()
                            }) {
                                HStack(spacing: 16) {
                                    Image(systemName: item.checked ? "checkmark.square.fill" : "square")
                                        .foregroundColor(item.checked ? .teal : .gray)
                                        .font(.title3)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(item.item)
                                            .font(.body)
                                            .fontWeight(.medium)
                                            .foregroundColor(item.checked ? .secondary : .primary)
                                            .strikethrough(item.checked)
                                        if !item.amount.isEmpty {
                                            Text(item.amount)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    Spacer()
                                }
                                .padding()
                                .background(item.checked ? Color.gray.opacity(0.05) : Color.clear)
                            }
                            .buttonStyle(.plain)
                            
                            if index < items.count - 1 {
                                Divider()
                                    .padding(.leading, 60)
                            }
                        }
                    }
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    .padding(.horizontal)
                    
                    // Exclude section
                    if !showRegenerate {
                        Button(action: { showRegenerate = true }) {
                            HStack {
                                Image(systemName: "xmark.circle")
                                Text(language == .ru ? "Что-то исключить? / У меня нет этих продуктов" : "Exclude items? / I don't have these")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white)
                            .foregroundColor(.secondary)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(style: StrokeStyle(lineWidth: 1, dash: [5]))
                                    .foregroundColor(.gray.opacity(0.3))
                            )
                        }
                        .padding(.horizontal)
                    } else {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text(language == .ru ? "Исключить продукты" : "Exclude products")
                                    .font(.headline)
                                Spacer()
                                Button(action: { showRegenerate = false }) {
                                    Image(systemName: "xmark")
                                        .foregroundColor(.secondary)
                                }
                            }
                            
                            Text(language == .ru ? "Введите продукты, которые вы не любите или не можете купить. Мы запомним это и пересоздадим план." : "Enter products you dislike or can't buy. We'll remember this and regenerate the plan.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            TextField(language == .ru ? "Например: лук, чеснок, дорогое мясо..." : "E.g. onion, garlic, expensive meat...", text: $exclusions, axis: .vertical)
                                .textFieldStyle(.roundedBorder)
                                .lineLimit(3...6)
                            
                            Button(action: {
                                if !exclusions.trimmingCharacters(in: .whitespaces).isEmpty {
                                    onRegenerate(exclusions)
                                    showRegenerate = false
                                }
                            }) {
                                HStack {
                                    Image(systemName: "arrow.clockwise")
                                    Text(language == .ru ? "Пересоздать план (3 дня)" : "Regenerate plan (3 days)")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(exclusions.trimmingCharacters(in: .whitespaces).isEmpty ? Color.gray : Color.teal)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                                .fontWeight(.medium)
                            }
                            .disabled(exclusions.trimmingCharacters(in: .whitespaces).isEmpty)
                        }
                        .padding()
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(16)
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.bottom, 100)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .onAppear {
            exclusions = currentExclusions ?? ""
        }
    }
    
    private func copyList() {
        let text = items.map { item in
            "[\(item.checked ? "x" : " ")] \(item.item) (\(item.amount))"
        }.joined(separator: "\n")
        
        UIPasteboard.general.string = text
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            copied = false
        }
    }
}

