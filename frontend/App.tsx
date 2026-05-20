import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Session } from '@supabase/supabase-js'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthContext } from './src/lib/AuthContext'
import { supabase } from './src/lib/supabase'
import InteractiveModeScreen from './src/screens/InteractiveModeScreen'
import LoginScreen from './src/screens/LoginScreen'
import RecipeDetailScreen from './src/screens/RecipeDetailScreen'
import RecipeListScreen from './src/screens/RecipeListScreen'
import RecipeProcessingScreen from './src/screens/RecipeProcessingScreen'
import { Recipe, SourceType } from './src/types/recipe'

export type AuthStackParamList = {
  Login: undefined
}

export type AppStackParamList = {
  RecipeList: undefined
  RecipeDetail: { recipe: Recipe }
  RecipeProcessing: {
    sourceType: SourceType
    url?: string
    fileUri?: string
    fileName?: string
    mimeType?: string
  }
  InteractiveMode: { recipe: Recipe }
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()

const headerStyle = {
  backgroundColor: '#111111',
} as const

const headerTitleStyle = {
  color: '#F5F5F0',
} as const

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  )
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="RecipeList"
        component={RecipeListScreen}
        options={{
          title: 'Bawarchi',
          headerStyle,
          headerTitleStyle,
          headerTintColor: '#E8A838',
        }}
      />
      <AppStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={({ route }) => ({
          title: route.params.recipe.name,
          headerStyle,
          headerTitleStyle,
          headerTintColor: '#E8A838',
        })}
      />
      <AppStack.Screen
        name="RecipeProcessing"
        component={RecipeProcessingScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <AppStack.Screen
        name="InteractiveMode"
        component={InteractiveModeScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </AppStack.Navigator>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [initialised, setInitialised] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitialised(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!initialised) return null

  const token = session?.access_token ?? null
  const userId = session?.user.id ?? null
  const signOut = () => supabase.auth.signOut()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthContext.Provider value={{ token, userId, signOut }}>
          <NavigationContainer>
            <StatusBar style="light" />
            {session ? <AppNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </AuthContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
