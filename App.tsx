import { useEffect, useState } from "react";
import { ChatCoach } from "./components/ChatCoach";
import { Dashboard } from "./components/Dashboard";
import { MealList } from "./components/MealList";
import { Navigation } from "./components/Navigation";
import { Onboarding } from "./components/Onboarding";
import { ShoppingList } from "./components/ShoppingList";
import { Statistics } from "./components/Statistics";
import {
  analyzeMacronutrients,
  generateMealPlan,
  replaceMealsWithIngredient,
} from "./services/geminiService";
import {
  EatenMealEntry,
  Ingredient,
  Meal,
  OffPlanMealEntry,
  UserProfile,
  ViewState,
} from "./types";

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [offPlanMeals, setOffPlanMeals] = useState<OffPlanMealEntry[]>([]);
  const [eatenMeals, setEatenMeals] = useState<EatenMealEntry[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("nutripulse_profile");
    const savedMeals = localStorage.getItem("nutripulse_meals");
    const savedShop = localStorage.getItem("nutripulse_shopping");
    const savedOffPlan = localStorage.getItem("nutripulse_offplan");
    const savedEatenMeals = localStorage.getItem("nutripulse_eaten");

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      // Migration for old profiles without language
      if (!parsedProfile.language) parsedProfile.language = "ru";
      setProfile(parsedProfile);
      setView(ViewState.DASHBOARD);
    }
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    if (savedShop) setShoppingList(JSON.parse(savedShop));
    if (savedOffPlan) setOffPlanMeals(JSON.parse(savedOffPlan));
    if (savedEatenMeals) setEatenMeals(JSON.parse(savedEatenMeals));
  }, []);

  // Save profile updates
  useEffect(() => {
    if (profile)
      localStorage.setItem("nutripulse_profile", JSON.stringify(profile));
  }, [profile]);

  // Save meal/shopping updates
  useEffect(() => {
    localStorage.setItem("nutripulse_meals", JSON.stringify(meals));
    localStorage.setItem("nutripulse_shopping", JSON.stringify(shoppingList));
  }, [meals, shoppingList]);

  // Save off-plan meals
  useEffect(() => {
    localStorage.setItem("nutripulse_offplan", JSON.stringify(offPlanMeals));
  }, [offPlanMeals]);

  // Save eaten meals
  useEffect(() => {
    localStorage.setItem("nutripulse_eaten", JSON.stringify(eatenMeals));
  }, [eatenMeals]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setView(ViewState.DASHBOARD);
  };

  // Helper function to determine which meal should be marked based on current time
  const getMealToMark = (): {
    day: number;
    type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  } | null => {
    if (!profile || meals.length === 0) return null;

    const now = new Date();
    const currentHour = now.getHours();

    // For MVP, use day 1 of the plan (can be improved to track plan start date)
    const planDay = 1;

    // Determine meal type based on time of day
    let mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
    if (currentHour >= profile.breakfastHour && currentHour < 12) {
      mealType = "Breakfast";
    } else if (currentHour >= 12 && currentHour < 16) {
      mealType = "Lunch";
    } else if (currentHour >= 16 && currentHour < 21) {
      mealType = "Dinner";
    } else {
      mealType = "Snack";
    }

    // First, try to find exact match
    const exactMatch = meals.find(
      (m) => m.day === planDay && m.type === mealType && !m.completedAt
    );

    if (exactMatch) {
      return { day: planDay, type: mealType };
    }

    // If exact match not found or already completed, find the next uncompleted meal of that day
    const dayMeals = meals.filter((m) => m.day === planDay && !m.completedAt);
    if (dayMeals.length > 0) {
      // Return the first uncompleted meal (prioritize by meal order: Breakfast, Lunch, Dinner, Snack)
      const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snack"];
      const sortedMeals = dayMeals.sort((a, b) => {
        const aIndex = mealOrder.indexOf(a.type);
        const bIndex = mealOrder.indexOf(b.type);
        return aIndex - bIndex;
      });
      return { day: planDay, type: sortedMeals[0].type };
    }

    return null;
  };

  const updateLastMeal = () => {
    if (!profile) return;
    const now = Date.now();
    const updated = { ...profile, lastMealTime: now };
    setProfile(updated);

    // Mark corresponding meal as completed and save to eaten meals
    const mealToMark = getMealToMark();
    if (mealToMark && meals.length > 0) {
      const mealToUpdate = meals.find(
        (m) => m.day === mealToMark.day && m.type === mealToMark.type
      );
      if (mealToUpdate && !mealToUpdate.completedAt) {
        const updatedMeals = meals.map((m) =>
          m.id === mealToUpdate.id ? { ...m, completedAt: now } : m
        );
        setMeals(updatedMeals);

        // Save to eaten meals with BJU analysis
        const calories = mealToUpdate.calories || 0;
        if (calories > 0 && profile) {
          // Analyze BJU asynchronously
          analyzeMacronutrients(
            mealToUpdate.description || mealToUpdate.name,
            calories,
            profile
          )
            .then((macronutrients) => {
              // Calculate activity hours (rough estimate: 1 hour of moderate activity = ~300 kcal)
              const activityHours =
                calories > 0 ? Math.round((calories / 300) * 10) / 10 : 0;

              const eatenMeal: EatenMealEntry = {
                id: `eaten-${now}-${mealToUpdate.id}`,
                name: mealToUpdate.name,
                description: mealToUpdate.description,
                timestamp: now,
                calories: calories,
                macronutrients: macronutrients || undefined,
                activityHours: activityHours > 0 ? activityHours : undefined,
                source: "planned",
                mealId: mealToUpdate.id,
                day: mealToUpdate.day,
              };
              setEatenMeals((prev) => {
                // Check if already exists
                const exists = prev.find((m) => m.id === eatenMeal.id);
                if (exists) {
                  return prev.map((m) =>
                    m.id === eatenMeal.id ? eatenMeal : m
                  );
                }
                return [...prev, eatenMeal];
              });
            })
            .catch((error) => {
              console.error("Failed to analyze macronutrients", error);
              // Save without BJU
              const activityHours =
                calories > 0 ? Math.round((calories / 300) * 10) / 10 : 0;
              const eatenMeal: EatenMealEntry = {
                id: `eaten-${now}-${mealToUpdate.id}`,
                name: mealToUpdate.name,
                description: mealToUpdate.description,
                timestamp: now,
                calories: calories,
                activityHours: activityHours > 0 ? activityHours : undefined,
                source: "planned",
                mealId: mealToUpdate.id,
                day: mealToUpdate.day,
              };
              setEatenMeals((prev) => {
                const exists = prev.find((m) => m.id === eatenMeal.id);
                if (exists) {
                  return prev.map((m) =>
                    m.id === eatenMeal.id ? eatenMeal : m
                  );
                }
                return [...prev, eatenMeal];
              });
            });
        } else {
          // Save without BJU if no calories
          const eatenMeal: EatenMealEntry = {
            id: `eaten-${now}-${mealToUpdate.id}`,
            name: mealToUpdate.name,
            description: mealToUpdate.description,
            timestamp: now,
            calories: calories,
            source: "planned",
            mealId: mealToUpdate.id,
            day: mealToUpdate.day,
          };
          setEatenMeals((prev) => {
            const exists = prev.find((m) => m.id === eatenMeal.id);
            if (exists) {
              return prev.map((m) => (m.id === eatenMeal.id ? eatenMeal : m));
            }
            return [...prev, eatenMeal];
          });
        }
      }
    }
  };

  const handleGeneratePlan = async () => {
    if (!profile) return;
    setIsLoadingPlan(true);
    try {
      const data = await generateMealPlan(profile);
      setMeals(data.meals);
      setShoppingList(data.shoppingList);
      setView(ViewState.MEALS);
    } catch (e) {
      console.error("Failed generation", e);
      alert("Не удалось создать план. Попробуйте позже.");
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleRegenerateWithExclusions = async (exclusions: string) => {
    if (!profile || meals.length === 0) return;

    // Check if it's a single ingredient replacement (simple case: no commas, short text)
    const isSingleIngredient =
      !exclusions.includes(",") && exclusions.trim().split(/\s+/).length <= 3;
    const lang = profile.language || "ru";

    setIsLoadingPlan(true);
    try {
      if (isSingleIngredient) {
        // Replace only meals containing this ingredient
        const ingredientToReplace = exclusions.trim();
        const data = await replaceMealsWithIngredient(
          meals,
          ingredientToReplace,
          profile
        );
        setMeals(data.meals);
        if (data.shoppingList.length > 0) {
          setShoppingList(data.shoppingList);
        }
      } else {
        // Multiple exclusions or complex case - regenerate full plan
        const updatedProfile = { ...profile, excludedIngredients: exclusions };
        setProfile(updatedProfile);
        const data = await generateMealPlan(updatedProfile);
        setMeals(data.meals);
        setShoppingList(data.shoppingList);
      }
    } catch (e) {
      console.error("Failed regeneration", e);
      const errorMsg =
        lang === "ru"
          ? "Не удалось пересоздать план. Попробуйте позже."
          : "Failed to regenerate plan. Please try again later.";
      alert(errorMsg);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const toggleShoppingItem = (idx: number) => {
    const newList = [...shoppingList];
    newList[idx].checked = !newList[idx].checked;
    setShoppingList(newList);
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };

  if (!profile || view === ViewState.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const currentLang = profile.language || "ru";

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <main className="mx-auto w-full">
        {view === ViewState.DASHBOARD && (
          <Dashboard
            profile={profile}
            updateLastMeal={updateLastMeal}
            onRequestPlan={handleGeneratePlan}
            hasPlan={meals.length > 0}
            isLoadingPlan={isLoadingPlan}
            meals={meals}
            onOffPlanMealSaved={async (meal) => {
              setOffPlanMeals((prev) => [...prev, meal]);
              // Also save to eaten meals with BJU analysis
              const calories = meal.estimatedCalories || 0;
              let macronutrients;
              if (calories > 0 && profile) {
                try {
                  macronutrients = await analyzeMacronutrients(
                    meal.description,
                    calories,
                    profile
                  );
                } catch (error) {
                  console.error("Failed to analyze macronutrients", error);
                }
              }

              // Calculate activity hours (rough estimate: 1 hour of moderate activity = ~300 kcal)
              const activityHours =
                calories > 0 ? Math.round((calories / 300) * 10) / 10 : 0;

              const eatenMeal: EatenMealEntry = {
                id: `eaten-${meal.timestamp}-${meal.id}`,
                name: meal.description,
                description: meal.description,
                timestamp: meal.timestamp,
                calories: calories,
                macronutrients: macronutrients || undefined,
                activityHours: activityHours > 0 ? activityHours : undefined,
                source: "off-plan",
                day: meal.day,
              };
              setEatenMeals((prev) => [...prev, eatenMeal]);
            }}
          />
        )}
        {view === ViewState.MEALS && (
          <MealList meals={meals} language={currentLang} />
        )}
        {view === ViewState.SHOPPING && (
          <ShoppingList
            items={shoppingList}
            toggleItem={toggleShoppingItem}
            clearAll={clearShoppingList}
            onRegenerate={handleRegenerateWithExclusions}
            isRegenerating={isLoadingPlan}
            currentExclusions={profile.excludedIngredients}
            language={currentLang}
          />
        )}
        {view === ViewState.CHAT && <ChatCoach profile={profile} />}
        {view === ViewState.STATS && (
          <Statistics
            meals={meals}
            offPlanMeals={offPlanMeals}
            eatenMeals={eatenMeals}
            language={currentLang}
          />
        )}
      </main>

      <Navigation currentView={view} setView={setView} language={currentLang} />
    </div>
  );
};

export default App;
