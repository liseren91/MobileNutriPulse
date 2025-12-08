import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Meal, Ingredient } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey });
};

export const generateMealPlan = async (profile: UserProfile): Promise<{ meals: Meal[], shoppingList: Ingredient[] }> => {
  const ai = getAiClient();
  
  const exclusions = profile.excludedIngredients 
    ? `STRICTLY EXCLUDE the following ingredients/foods: ${profile.excludedIngredients}.` 
    : '';

  const prompt = `
    Generate a delicious 3-day meal plan in RUSSIAN language for a user with the following details:
    - Dietary Preferences: ${profile.dietaryPreferences}
    - Goal: ${profile.goals}
    - CRITICAL CONSTRAINT: Every single meal must take ONLY 5-10 minutes to prepare.
    - FOCUS: Meals should be tasty, healthy, and use simple ingredients found in any supermarket.
    - Meal Types per day: Breakfast, Lunch, Dinner, Snack.
    ${exclusions}
    
    Also generate a consolidated shopping list for these 3 days in RUSSIAN. 
    Ensure the shopping list is accurate so the user can buy everything in one trip.
    
    IMPORTANT: The content (name, description, ingredients, instructions) MUST be in Russian.
    The 'type' field in the schema MUST remain one of the English enum values: "Breakfast", "Lunch", "Dinner", "Snack".
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                day: { type: Type.INTEGER },
                type: { type: Type.STRING, enum: ["Breakfast", "Lunch", "Dinner", "Snack"] },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                calories: { type: Type.INTEGER }
              }
            }
          },
          shoppingList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                amount: { type: Type.STRING },
                checked: { type: Type.BOOLEAN }
              }
            }
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  throw new Error("Failed to generate meal plan");
};

export const chatWithNutritionist = async (history: { role: string, parts: { text: string }[] }[], newMessage: string, profile: UserProfile) => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction: `You are a supportive, kind, but strict nutritionist. 
      The user's goal is: ${profile.goals}.
      They struggle with remembering to eat and eating regularly.
      User Dislikes/Exclusions: ${profile.excludedIngredients || 'None'}.
      Keep answers concise, encouraging, and actionable. 
      Always remind them that "done is better than perfect" regarding quick meals.
      COMMUNICATE IN RUSSIAN LANGUAGE ONLY.`
    }
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};