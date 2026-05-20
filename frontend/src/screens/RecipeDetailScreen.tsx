import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppStackParamList } from '../../App'

type Props = NativeStackScreenProps<AppStackParamList, 'RecipeDetail'>

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipe } = route.params
  const timeMinutes = recipe.cooking_time ? Math.round(recipe.cooking_time / 60000) : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ color: '#F5F5F0', fontSize: 28, fontWeight: '700', marginBottom: 8 }}>
          {recipe.name}
        </Text>

        {timeMinutes !== null && (
          <Text style={{ color: '#8E8E93', fontSize: 15, marginBottom: 20 }}>
            ⏱ {timeMinutes} min
          </Text>
        )}

        <View style={{ height: 1, backgroundColor: '#2C2C2E', marginBottom: 20 }} />

        <Text
          style={{
            color: '#E8A838',
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Ingredients
        </Text>
        {recipe.ingredients.map((ing, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#2C2C2E',
            }}
          >
            <Text style={{ color: '#8E8E93', fontSize: 15, width: 80 }}>
              {ing.quantity} {ing.unit}
            </Text>
            <Text style={{ color: '#F5F5F0', fontSize: 15, flex: 1 }}>{ing.name}</Text>
          </View>
        ))}

        <View style={{ height: 1, backgroundColor: '#2C2C2E', marginTop: 24, marginBottom: 20 }} />

        <Text
          style={{
            color: '#E8A838',
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Steps
        </Text>
        {recipe.recipe_steps.map((step, i) => {
          const stepMinutes = step.time ? Math.round(step.time / 60000) : null
          return (
            <View
              key={i}
              style={{
                backgroundColor: '#1C1C1E',
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#8E8E93', fontSize: 13, fontWeight: '500' }}>
                  Step {i + 1}
                </Text>
                {stepMinutes !== null && (
                  <Text style={{ color: '#8E8E93', fontSize: 13 }}>🕐 {stepMinutes} min</Text>
                )}
              </View>
              <Text style={{ color: '#F5F5F0', fontSize: 16, lineHeight: 24 }}>{step.step}</Text>
            </View>
          )
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={() => navigation.navigate('InteractiveMode', { recipe })}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#E8A838',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 22 }}>▶</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
