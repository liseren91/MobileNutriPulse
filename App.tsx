import { useEffect, useState } from "react";
import { ChatCoach } from "./components/ChatCoach";
import { Dashboard } from "./components/Dashboard";
import { MealList } from "./components/MealList";
import { Navigation } from "./components/Navigation";
import { Onboarding } from "./components/Onboarding";
import { ShoppingList } from "./components/ShoppingList";
import {
  generateMealPlan,
  replaceMealsWithIngredient,
} from "./services/geminiService";
import { Ingredient, Meal, UserProfile, ViewState } from "./types";

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("nutripulse_profile");
    const savedMeals = localStorage.getItem("nutripulse_meals");
    const savedShop = localStorage.getItem("nutripulse_shopping");

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      // Migration for old profiles without language
      if (!parsedProfile.language) parsedProfile.language = "ru";
      setProfile(parsedProfile);
      setView(ViewState.DASHBOARD);
    }
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    if (savedShop) setShoppingList(JSON.parse(savedShop));
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

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setView(ViewState.DASHBOARD);
  };

  const updateLastMeal = () => {
    if (!profile) return;
    const updated = { ...profile, lastMealTime: Date.now() };
    setProfile(updated);
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
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pt-safe pb-safe">
      <main className="mx-auto w-full">
        {view === ViewState.DASHBOARD && (
          <Dashboard
            profile={profile}
            updateLastMeal={updateLastMeal}
            onRequestPlan={handleGeneratePlan}
            hasPlan={meals.length > 0}
            isLoadingPlan={isLoadingPlan}
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
      </main>

      <Navigation currentView={view} setView={setView} language={currentLang} />
    </div>
  );
};

export default App;
