// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useGameStore } from '../store/gameStore';
import { Button, Page, ui } from '../components/GameUI';
import { CustomTabBar } from '../components/CustomTabBar';
import { RootStackParamList, TabParamList } from '../types/navigation';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ShopScreen from '../screens/ShopScreen';
import QuestsScreen from '../screens/QuestsScreen';
import ParentScreen from '../screens/ParentScreen';
import SavingsScreen from '../screens/SavingsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import HelpScreen from '../screens/HelpScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Quests" component={QuestsScreen} />
      <Tab.Screen name="Parent" component={ParentScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const game = useGameStore(s => s.game);
  const ready = useGameStore(s => s.ready);
  const busy = useGameStore(s => s.busy);
  const [confirmRecover, setConfirmRecover] = React.useState(false);

  React.useEffect(() => {
    void useGameStore.getState().load();
  }, []);

  if (!ready) return <Page title="Финни">
    <Text style={ui.text}>{busy ? 'Загружаем сохранение…' : 'Прогресс пока не загружен.'}</Text>
    {!busy && <>
      <Button title="Повторить загрузку" onPress={() => { void useGameStore.getState().load(); }} />
      <Button title="Начать новую игру" onPress={() => setConfirmRecover(true)} />
      {confirmRecover && <>
        <Text style={ui.text}>Текущее сохранение будет оставлено в резервной копии. Начать заново?</Text>
        <Button title="Сохранить копию и начать заново" onPress={() => { void useGameStore.getState().recover(); }} />
        <Button title="Отмена" onPress={() => setConfirmRecover(false)} />
      </>}
    </>}
  </Page>;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!game ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Group navigationKey="game">
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Savings" component={SavingsScreen} options={{ headerShown: true, title: 'Копилка' }} />
            <Stack.Screen name="Progress" component={ProgressScreen} options={{ headerShown: true, title: 'Прогресс' }} />
            <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: true, title: 'Словарик' }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
