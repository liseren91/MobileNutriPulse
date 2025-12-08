import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, Meal, Ingredient } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { MealList } from './components/MealList';
import { ShoppingList } from './components/ShoppingList';
import { ChatCoach } from './components/ChatCoach';
import { Navigation } from './components/Navigation';
import { generateMealPlan } from './services/geminiService';

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('nutripulse_profile');
    const savedMeals = localStorage.getItem('nutripulse_meals');
    const savedShop = localStorage.getItem('nutripulse_shopping');

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setView(ViewState.DASHBOARD);
    }
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    if (savedShop) setShoppingList(JSON.parse(savedShop));
  }, []);

  // Save profile updates
  useEffect(() => {
    if (profile) localStorage.setItem('nutripulse_profile', JSON.stringify(profile));
  }, [profile]);

  // Save meal/shopping updates
  useEffect(() => {
    localStorage.setItem('nutripulse_meals', JSON.stringify(meals));
    localStorage.setItem('nutripulse_shopping', JSON.stringify(shoppingList));
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
    if (!profile) return;
    
    // 1. Update Profile with new exclusions
    const updatedProfile = { ...profile, excludedIngredients: exclusions };
    setProfile(updatedProfile);
    
    // 2. Trigger generation with updated profile
    setIsLoadingPlan(true);
    try {
      const data = await generateMealPlan(updatedProfile);
      setMeals(data.meals);
      setShoppingList(data.shoppingList);
      
      // We stay on shopping list view, but data is refreshed
    } catch (e) {
      console.error("Failed regeneration", e);
      alert("Не удалось пересоздать план. Попробуйте позже.");
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
          />
        )}
        {view === ViewState.MEALS && <MealList meals={meals} />}
        {view === ViewState.SHOPPING && (
          <ShoppingList 
            items={shoppingList} 
            toggleItem={toggleShoppingItem} 
            clearAll={clearShoppingList}
            onRegenerate={handleRegenerateWithExclusions}
            isRegenerating={isLoadingPlan}
            currentExclusions={profile.excludedIngredients}
          />
        )}
        {view === ViewState.CHAT && <ChatCoach profile={profile} />}
      </main>

      <Navigation currentView={view} setView={setView} />
    </div>
  );
};

export default App;