import { useEffect, useState } from "react";
import { ChatCoach } from "./components/ChatCoach";
import { Dashboard } from "./components/Dashboard";
import { Insights } from "./components/Insights";
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
  DailyHistoryEntry,
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
  const [dailyHistory, setDailyHistory] = useState<DailyHistoryEntry[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("nutripulse_profile");
    const savedMeals = localStorage.getItem("nutripulse_meals");
    const savedShop = localStorage.getItem("nutripulse_shopping");
    const savedOffPlan = localStorage.getItem("nutripulse_offplan");
    const savedEatenMeals = localStorage.getItem("nutripulse_eaten");
    const savedHistory = localStorage.getItem("nutripulse_history");

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
    if (savedHistory) setDailyHistory(JSON.parse(savedHistory));
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

  // Save daily history
  useEffect(() => {
    localStorage.setItem("nutripulse_history", JSON.stringify(dailyHistory));
  }, [dailyHistory]);

  // Update daily history when eatenMeals change
  useEffect(() => {
    if (eatenMeals.length === 0) return;

    // Group meals by date
    const mealsByDate = new Map<string, EatenMealEntry[]>();
    eatenMeals.forEach((meal) => {
      const date = new Date(meal.timestamp);
      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (!mealsByDate.has(dateStr)) {
        mealsByDate.set(dateStr, []);
      }
      mealsByDate.get(dateStr)!.push(meal);
    });

    // Calculate daily totals
    const newHistory: DailyHistoryEntry[] = [];
    mealsByDate.forEach((meals, date) => {
      const calories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const protein = meals.reduce(
        (sum, m) => sum + (m.macronutrients?.protein || 0),
        0
      );
      const carbs = meals.reduce(
        (sum, m) => sum + (m.macronutrients?.carbs || 0),
        0
      );
      const fat = meals.reduce(
        (sum, m) => sum + (m.macronutrients?.fat || 0),
        0
      );

      newHistory.push({
        date,
        calories,
        protein,
        carbs,
        fat,
        meals,
      });
    });

    // Merge with existing history (keep old entries if they don't have new data)
    setDailyHistory((prevHistory) => {
      const historyMap = new Map<string, DailyHistoryEntry>();
      // Add existing entries
      prevHistory.forEach((entry) => {
        historyMap.set(entry.date, entry);
      });
      // Update or add new entries
      newHistory.forEach((entry) => {
        historyMap.set(entry.date, entry);
      });
      // Convert back to array and sort by date
      return Array.from(historyMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
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

    // Helper function to save meal to eaten meals
    const saveMealToEaten = (meal: Meal) => {
      const calories = meal.calories || 0;
      if (calories > 0 && profile) {
        // Analyze BJU asynchronously
        analyzeMacronutrients(meal.description || meal.name, calories, profile)
          .then((macronutrients) => {
            // Calculate activity hours (rough estimate: 1 hour of moderate activity = ~300 kcal)
            const activityHours =
              calories > 0 ? Math.round((calories / 300) * 10) / 10 : 0;

            const eatenMeal: EatenMealEntry = {
              id: `eaten-${now}-${meal.id}`,
              name: meal.name,
              description: meal.description,
              timestamp: now,
              calories: calories,
              macronutrients: macronutrients || undefined,
              activityHours: activityHours > 0 ? activityHours : undefined,
              source: "planned",
              mealId: meal.id,
              day: meal.day,
            };
            setEatenMeals((prev) => {
              // Check if already exists
              const exists = prev.find((m) => m.id === eatenMeal.id);
              if (exists) {
                return prev.map((m) => (m.id === eatenMeal.id ? eatenMeal : m));
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
              id: `eaten-${now}-${meal.id}`,
              name: meal.name,
              description: meal.description,
              timestamp: now,
              calories: calories,
              activityHours: activityHours > 0 ? activityHours : undefined,
              source: "planned",
              mealId: meal.id,
              day: meal.day,
            };
            setEatenMeals((prev) => {
              const exists = prev.find((m) => m.id === eatenMeal.id);
              if (exists) {
                return prev.map((m) => (m.id === eatenMeal.id ? eatenMeal : m));
              }
              return [...prev, eatenMeal];
            });
          });
      } else {
        // Save without BJU if no calories
        const eatenMeal: EatenMealEntry = {
          id: `eaten-${now}-${meal.id}`,
          name: meal.name,
          description: meal.description,
          timestamp: now,
          calories: calories,
          source: "planned",
          mealId: meal.id,
          day: meal.day,
        };
        setEatenMeals((prev) => {
          const exists = prev.find((m) => m.id === eatenMeal.id);
          if (exists) {
            return prev.map((m) => (m.id === eatenMeal.id ? eatenMeal : m));
          }
          return [...prev, eatenMeal];
        });
      }
    };

    // Mark corresponding meal as completed and save to eaten meals
    const mealToMark = getMealToMark();
    let mealToUpdate: Meal | null = null;

    if (mealToMark && meals.length > 0) {
      // First, try to find exact match that is not completed
      mealToUpdate = meals.find(
        (m) =>
          m.day === mealToMark.day &&
          m.type === mealToMark.type &&
          !m.completedAt
      );

      // If not found, try to find any meal of that type (even if completed)
      if (!mealToUpdate) {
        mealToUpdate = meals.find(
          (m) => m.day === mealToMark.day && m.type === mealToMark.type
        );
      }

      // If still not found, find the next uncompleted meal of that day
      if (!mealToUpdate) {
        const dayMeals = meals.filter(
          (m) => m.day === mealToMark.day && !m.completedAt
        );
        if (dayMeals.length > 0) {
          // Return the first uncompleted meal (prioritize by meal order: Breakfast, Lunch, Dinner, Snack)
          const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snack"];
          const sortedMeals = dayMeals.sort((a, b) => {
            const aIndex = mealOrder.indexOf(a.type);
            const bIndex = mealOrder.indexOf(b.type);
            return aIndex - bIndex;
          });
          mealToUpdate = sortedMeals[0];
        }
      }

      // If still not found, use any meal from that day
      if (!mealToUpdate) {
        const dayMeals = meals.filter((m) => m.day === mealToMark.day);
        if (dayMeals.length > 0) {
          const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snack"];
          const sortedMeals = dayMeals.sort((a, b) => {
            const aIndex = mealOrder.indexOf(a.type);
            const bIndex = mealOrder.indexOf(b.type);
            return aIndex - bIndex;
          });
          mealToUpdate = sortedMeals[0];
        }
      }
    }

    // If we have a meal to update, mark it as completed and save to eaten meals
    if (mealToUpdate) {
      // Only mark as completed if it wasn't already completed
      if (!mealToUpdate.completedAt) {
        const updatedMeals = meals.map((m) =>
          m.id === mealToUpdate!.id ? { ...m, completedAt: now } : m
        );
        setMeals(updatedMeals);
      }

      // Always save to eaten meals (even if already completed, with new timestamp)
      saveMealToEaten(mealToUpdate);
    } else if (meals.length > 0) {
      // If no specific meal found but we have meals, use the first meal from day 1
      const firstMeal = meals.find((m) => m.day === 1);
      if (firstMeal) {
        saveMealToEaten(firstMeal);
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

  // Function to toggle meal completion status and save to eaten meals
  const toggleMeal = (mealId: string) => {
    if (!profile) return;
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;

    const now = Date.now();
    const isCurrentlyCompleted = !!meal.completedAt;

    // Toggle completion status
    const updatedMeals = meals.map((m) =>
      m.id === mealId
        ? { ...m, completedAt: isCurrentlyCompleted ? undefined : now }
        : m
    );
    setMeals(updatedMeals);

    // If marking as completed, save to eaten meals
    if (!isCurrentlyCompleted) {
      // Helper function to save meal to eaten meals (reuse from updateLastMeal)
      const saveMealToEaten = (mealToSave: Meal) => {
        const calories = mealToSave.calories || 0;
        if (calories > 0 && profile) {
          // Analyze BJU asynchronously
          analyzeMacronutrients(
            mealToSave.description || mealToSave.name,
            calories,
            profile
          )
            .then((macronutrients) => {
              // Calculate activity hours (rough estimate: 1 hour of moderate activity = ~300 kcal)
              const activityHours =
                calories > 0 ? Math.round((calories / 300) * 10) / 10 : 0;

              const eatenMeal: EatenMealEntry = {
                id: `eaten-${now}-${mealToSave.id}`,
                name: mealToSave.name,
                description: mealToSave.description,
                timestamp: now,
                calories: calories,
                macronutrients: macronutrients || undefined,
                activityHours: activityHours > 0 ? activityHours : undefined,
                source: "planned",
                mealId: mealToSave.id,
                day: mealToSave.day,
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
                id: `eaten-${now}-${mealToSave.id}`,
                name: mealToSave.name,
                description: mealToSave.description,
                timestamp: now,
                calories: calories,
                activityHours: activityHours > 0 ? activityHours : undefined,
                source: "planned",
                mealId: mealToSave.id,
                day: mealToSave.day,
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
            id: `eaten-${now}-${mealToSave.id}`,
            name: mealToSave.name,
            description: mealToSave.description,
            timestamp: now,
            calories: calories,
            source: "planned",
            mealId: mealToSave.id,
            day: mealToSave.day,
          };
          setEatenMeals((prev) => {
            const exists = prev.find((m) => m.id === eatenMeal.id);
            if (exists) {
              return prev.map((m) => (m.id === eatenMeal.id ? eatenMeal : m));
            }
            return [...prev, eatenMeal];
          });
        }
      };

      saveMealToEaten(meal);
    } else {
      // If unmarking, remove from eaten meals (optional - you might want to keep history)
      // For now, we'll keep the history but just unmark the meal
    }
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
          <MealList
            meals={meals}
            language={currentLang}
            onMealToggle={toggleMeal}
            profile={profile}
          />
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
        {view === ViewState.INSIGHTS && (
          <Insights
            history={dailyHistory}
            language={currentLang}
            profile={profile}
          />
        )}
      </main>

      <Navigation currentView={view} setView={setView} language={currentLang} />
    </div>
  );
};

export default App;
