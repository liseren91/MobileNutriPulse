import Foundation

class GeminiService {
    static let shared = GeminiService()
    
    private let apiKey: String
    private let baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
    
    init() {
        // API ключ должен быть установлен в Info.plist или через переменную окружения
        // Для разработки можно использовать Bundle.main.object(forInfoDictionaryKey: "GEMINI_API_KEY") as? String
        if let key = Bundle.main.object(forInfoDictionaryKey: "GEMINI_API_KEY") as? String, !key.isEmpty {
            self.apiKey = key
        } else if let key = ProcessInfo.processInfo.environment["GEMINI_API_KEY"], !key.isEmpty {
            self.apiKey = key
        } else {
            fatalError("GEMINI_API_KEY не найден. Установите его в Info.plist или переменных окружения.")
        }
    }
    
    func generateMealPlan(profile: UserProfile) async throws -> MealPlanResponse {
        let lang = profile.language == .en ? "ENGLISH" : "RUSSIAN"
        
        let exclusions = profile.excludedIngredients?.isEmpty == false
            ? "STRICTLY EXCLUDE the following ingredients/foods: \(profile.excludedIngredients!)."
            : ""
        
        let prompt = """
        Generate a delicious 3-day meal plan in \(lang) language for a user with the following details:
        - Dietary Preferences: \(profile.dietaryPreferences)
        - Goal: \(profile.goals)
        - CRITICAL CONSTRAINT: Every single meal must take ONLY 5-10 minutes to prepare.
        - FOCUS: Meals should be tasty, healthy, and use simple ingredients found in any supermarket.
        - Meal Types per day: Breakfast, Lunch, Dinner, Snack.
        \(exclusions)
        
        Also generate a consolidated shopping list for these 3 days in \(lang).
        Ensure the shopping list is accurate so the user can buy everything in one trip.
        
        IMPORTANT: The content (name, description, ingredients, instructions) MUST be in \(lang).
        The 'type' field in the schema MUST remain one of the English enum values: "Breakfast", "Lunch", "Dinner", "Snack".
        
        Return ONLY valid JSON matching this exact schema:
        {
          "meals": [
            {
              "id": "string",
              "day": 1,
              "type": "Breakfast" | "Lunch" | "Dinner" | "Snack",
              "name": "string",
              "description": "string",
              "prepTime": "5-10 mins",
              "ingredients": ["string"],
              "instructions": ["string"],
              "calories": 0
            }
          ],
          "shoppingList": [
            {
              "item": "string",
              "amount": "string",
              "checked": false
            }
          ]
        }
        """
        
        let requestBody: [String: Any] = [
            "contents": [
                [
                    "parts": [
                        ["text": prompt]
                    ]
                ]
            ],
            "generationConfig": [
                "responseMimeType": "application/json"
            ]
        ]
        
        guard let url = URL(string: "\(baseURL)?key=\(apiKey)") else {
            throw NSError(domain: "GeminiService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "GeminiService", code: -2, userInfo: [NSLocalizedDescriptionKey: "HTTP request failed"])
        }
        
        let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let candidates = jsonResponse?["candidates"] as? [[String: Any]],
              let firstCandidate = candidates.first,
              let content = firstCandidate["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let firstPart = parts.first,
              let text = firstPart["text"] as? String else {
            throw NSError(domain: "GeminiService", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid response format"])
        }
        
        let jsonData = text.data(using: .utf8)!
        let decoder = JSONDecoder()
        return try decoder.decode(MealPlanResponse.self, from: jsonData)
    }
    
    func chatWithNutritionist(history: [[String: Any]], newMessage: String, profile: UserProfile) async throws -> String {
        let lang = profile.language == .en ? "ENGLISH" : "RUSSIAN"
        
        var contents: [[String: Any]] = []
        
        // Add history
        for msg in history {
            contents.append(msg)
        }
        
        // Add new user message
        contents.append([
            "parts": [["text": newMessage]],
            "role": "user"
        ])
        
        let systemInstruction = """
        You are a supportive, kind, but strict nutritionist.
        The user's goal is: \(profile.goals).
        They struggle with remembering to eat and eating regularly.
        User Dislikes/Exclusions: \(profile.excludedIngredients ?? "None").
        Keep answers concise, encouraging, and actionable.
        Always remind them that "done is better than perfect" regarding quick meals.
        COMMUNICATE IN \(lang) LANGUAGE ONLY.
        """
        
        let requestBody: [String: Any] = [
            "contents": contents,
            "systemInstruction": [
                "parts": [["text": systemInstruction]]
            ]
        ]
        
        guard let url = URL(string: "\(baseURL)?key=\(apiKey)") else {
            throw NSError(domain: "GeminiService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "GeminiService", code: -2, userInfo: [NSLocalizedDescriptionKey: "HTTP request failed"])
        }
        
        let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let candidates = jsonResponse?["candidates"] as? [[String: Any]],
              let firstCandidate = candidates.first,
              let content = firstCandidate["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let firstPart = parts.first,
              let text = firstPart["text"] as? String else {
            throw NSError(domain: "GeminiService", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid response format"])
        }
        
        return text
    }
}

