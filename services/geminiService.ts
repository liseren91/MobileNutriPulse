import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Meal, UserProfile } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey });
};

export const generateMealPlan = async (
  profile: UserProfile
): Promise<{ meals: Meal[]; shoppingList: Ingredient[] }> => {
  const ai = getAiClient();
  const lang = profile.language === "en" ? "ENGLISH" : "RUSSIAN";

  const exclusions = profile.excludedIngredients
    ? `STRICTLY EXCLUDE the following ingredients/foods: ${profile.excludedIngredients}.`
    : "";

  const prompt = `
    Generate a delicious 3-day meal plan in ${lang} language for a user with the following details:
    - Dietary Preferences: ${profile.dietaryPreferences}
    - Goal: ${profile.goals}
    - CRITICAL CONSTRAINT: Every single meal must take ONLY 5-10 minutes to prepare.
    - FOCUS: Meals should be tasty, healthy, and use simple ingredients found in any supermarket.
    - Meal Types per day: Breakfast, Lunch, Dinner, Snack.
    ${exclusions}
    
    Also generate a consolidated shopping list for these 3 days in ${lang}. 
    Ensure the shopping list is accurate so the user can buy everything in one trip.
    
    IMPORTANT: The content (name, description, ingredients, instructions) MUST be in ${lang}.
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
                type: {
                  type: Type.STRING,
                  enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
                },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                calories: { type: Type.INTEGER },
              },
            },
          },
          shoppingList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                amount: { type: Type.STRING },
                checked: { type: Type.BOOLEAN },
              },
            },
          },
        },
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  throw new Error("Failed to generate meal plan");
};

export const replaceMealsWithIngredient = async (
  currentMeals: Meal[],
  ingredientToReplace: string,
  profile: UserProfile
): Promise<{ meals: Meal[]; shoppingList: Ingredient[] }> => {
  const ai = getAiClient();
  const lang = profile.language === "en" ? "ENGLISH" : "RUSSIAN";

  // Find meals that contain the ingredient
  const mealsToReplace = currentMeals.filter((meal) => {
    const ingredientsText = meal.ingredients.join(" ").toLowerCase();
    const ingredientLower = ingredientToReplace.toLowerCase();
    return ingredientsText.includes(ingredientLower);
  });

  // If no meals contain this ingredient, return original plan
  if (mealsToReplace.length === 0) {
    return { meals: currentMeals, shoppingList: [] };
  }

  const mealsToKeep = currentMeals.filter(
    (meal) => !mealsToReplace.includes(meal)
  );

  const prompt = `
    The user wants to replace the ingredient "${ingredientToReplace}" in their meal plan.
    You need to replace ONLY the following meals (keep the same day, type, and meal structure):
    ${JSON.stringify(mealsToReplace, null, 2)}
    
    Generate replacement meals in ${lang} language that:
    - Are on the same day and same type (Breakfast/Lunch/Dinner/Snack)
    - Take ONLY 5-10 minutes to prepare
    - Do NOT contain "${ingredientToReplace}" or any similar ingredient
    - Match the user's dietary preferences: ${profile.dietaryPreferences}
    - Match the user's goal: ${profile.goals}
    - Use simple ingredients found in any supermarket
    
    Also generate an updated shopping list for ALL meals (both kept and replaced) in ${lang}.
    
    IMPORTANT: 
    - The content (name, description, ingredients, instructions) MUST be in ${lang}.
    - The 'type' field MUST remain one of: "Breakfast", "Lunch", "Dinner", "Snack".
    - Return the complete meal plan with replaced meals and all original meals that don't contain "${ingredientToReplace}".
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
                type: {
                  type: Type.STRING,
                  enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
                },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                calories: { type: Type.INTEGER },
              },
            },
          },
          shoppingList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                amount: { type: Type.STRING },
                checked: { type: Type.BOOLEAN },
              },
            },
          },
        },
      },
    },
  });

  if (response.text) {
    const data = JSON.parse(response.text);
    // Merge kept meals with replaced meals
    const allMeals = [...mealsToKeep, ...data.meals];
    return { meals: allMeals, shoppingList: data.shoppingList };
  }
  throw new Error("Failed to replace meals");
};

export const analyzeOffPlanMeal = async (
  mealDescription: string,
  profile: UserProfile
): Promise<string> => {
  const ai = getAiClient();
  const lang = profile.language === "en" ? "ENGLISH" : "RUSSIAN";

  const prompt = `The user ate something outside of their meal plan. They described: "${mealDescription}"

    Analyze this meal and provide feedback in ${lang} language. Be supportive, kind, and understanding:
    
    1. ALWAYS start by praising them for eating - acknowledge that eating is important and they did the right thing by eating something, even if it wasn't ideal. Say something like "Хорошо, что ты поел(а)!" or "Good that you ate!"
    
    2. Show understanding - acknowledge that sometimes there's no time to cook, or they were too tired, or healthy delivery is slow/expensive. Be empathetic.
    
    3. Provide practical, specific recommendations for next time:
       - If they ate fast food (like McDonald's, Burger King): suggest better street food options (e.g., "может стоило скушать гирос без соусов?" or "maybe you could have eaten a gyro without sauces?")
       - If they ordered delivery: suggest healthier but still convenient options
       - If they grabbed something from a bakery: suggest better bakery options with more protein/vegetables
       - Give 1-2 specific, actionable alternatives that are realistic for when they're in a hurry or don't want to cook
    
    4. Be encouraging - remind them that one meal doesn't ruin progress and that consistency matters more than perfection
    
    5. Keep it friendly and conversational (2-3 short paragraphs max)
    
    The user's goal is: ${profile.goals}
    Their dietary preferences: ${profile.dietaryPreferences}
    
    COMMUNICATE IN ${lang} LANGUAGE ONLY. Use a warm, supportive tone like a caring friend who understands their situation.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: `You are a supportive, kind, but honest nutritionist. You understand that people sometimes eat outside their plan due to time constraints, cost, or convenience. You provide practical, non-judgmental advice.`,
    },
  });

  return (
    response.text ||
    (lang === "ENGLISH"
      ? "Unable to analyze meal."
      : "Не удалось проанализировать еду.")
  );
};

export const estimateMealCalories = async (
  mealDescription: string,
  profile: UserProfile
): Promise<number | null> => {
  const ai = getAiClient();
  const lang = profile.language === "en" ? "ENGLISH" : "RUSSIAN";

  const prompt = `The user ate: "${mealDescription}"

    Estimate the approximate calories for this meal. Return ONLY a number (no text, no explanation, just the number).
    
    Be realistic - if it's fast food like a Big Mac, estimate around 500-600 kcal. If it's a pizza slice, estimate 200-300 kcal. If it's a full meal, estimate based on typical portions.
    
    Return ONLY the number, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "text/plain",
      },
    });

    const text = response.text?.trim() || "";
    const calories = parseInt(text.replace(/[^\d]/g, ""), 10);

    // Validate the result
    if (isNaN(calories) || calories < 0 || calories > 5000) {
      // Fallback estimation based on common foods
      const lower = mealDescription.toLowerCase();
      if (
        lower.includes("big mac") ||
        lower.includes("бургер") ||
        lower.includes("burger")
      ) {
        return 550;
      }
      if (lower.includes("пицца") || lower.includes("pizza")) {
        return 250;
      }
      if (
        lower.includes("шаурма") ||
        lower.includes("shawarma") ||
        lower.includes("гирос") ||
        lower.includes("gyro")
      ) {
        return 400;
      }
      if (lower.includes("суши") || lower.includes("sushi")) {
        return 300;
      }
      // Default estimate
      return 350;
    }

    return calories;
  } catch (error) {
    console.error("Failed to estimate calories", error);
    // Fallback estimation
    return 350;
  }
};

export const chatWithNutritionist = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  profile: UserProfile
) => {
  const ai = getAiClient();
  const lang = profile.language === "en" ? "ENGLISH" : "RUSSIAN";

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction: `You are a supportive, kind, but strict nutritionist. 
      The user's goal is: ${profile.goals}.
      They struggle with remembering to eat and eating regularly.
      User Dislikes/Exclusions: ${profile.excludedIngredients || "None"}.
      Keep answers concise, encouraging, and actionable. 
      Always remind them that "done is better than perfect" regarding quick meals.
      COMMUNICATE IN ${lang} LANGUAGE ONLY.`,
    },
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};
