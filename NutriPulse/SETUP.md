# Инструкция по настройке проекта в Xcode

## Важно: Добавление файлов в проект

После открытия проекта в Xcode вам нужно вручную добавить все созданные файлы в проект:

### Шаг 1: Откройте проект
```bash
open NutriPulse/NutriPulse.xcodeproj
```

### Шаг 2: Добавьте файлы в проект

1. **Правой кнопкой мыши** на папку `NutriPulse` в навигаторе проекта
2. Выберите **"Add Files to NutriPulse..."**
3. Добавьте следующие папки и файлы:
   - `Models/Models.swift`
   - `Services/GeminiService.swift`
   - `Services/StorageService.swift`
   - `Views/OnboardingView.swift`
   - `Views/DashboardView.swift`
   - `Views/MealListView.swift`
   - `Views/ShoppingListView.swift`
   - `Views/ChatCoachView.swift`
   - `Views/NavigationView.swift`
   - `NutriPulseApp.swift`
   - `ContentView.swift`
   - `Info.plist`

4. **Убедитесь**, что в диалоге добавления файлов:
   - ✅ Отмечено "Copy items if needed" (если файлы не в папке проекта)
   - ✅ Выбрана правильная Target: "NutriPulse"

### Шаг 3: Настройте Info.plist

1. Откройте `Info.plist`
2. Найдите `GEMINI_API_KEY`
3. Замените `YOUR_API_KEY_HERE` на ваш реальный API ключ

### Шаг 4: Проверьте Build Settings

1. Выберите проект в навигаторе
2. Выберите Target "NutriPulse"
3. Перейдите на вкладку "Build Settings"
4. Найдите "Info.plist File" и убедитесь, что путь правильный: `NutriPulse/Info.plist`

### Шаг 5: Соберите проект

Нажмите ⌘B для сборки проекта. Если есть ошибки:
- Проверьте, что все файлы добавлены в Target
- Проверьте, что API ключ установлен
- Убедитесь, что используется iOS 17.0+

## Альтернативный способ: Создать проект заново

Если возникают проблемы, можно создать новый проект в Xcode:

1. File → New → Project
2. Выберите "iOS" → "App"
3. Название: NutriPulse
4. Interface: SwiftUI
5. Language: Swift
6. Minimum Deployment: iOS 17.0
7. Скопируйте все файлы из этой папки в новый проект

