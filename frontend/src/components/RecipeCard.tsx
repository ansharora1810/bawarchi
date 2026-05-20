import React, { useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { Recipe } from '../types/recipe'

interface Props {
  recipe: Recipe
  onPress: () => void
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export default function RecipeCard({ recipe, onPress, onSwipeLeft, onSwipeRight }: Props) {
  const swipeableRef = useRef<Swipeable>(null)

  const stepCount = recipe.recipe_steps.length
  const timeMinutes = recipe.cooking_time ? Math.round(recipe.cooking_time / 60000) : null
  const subtitle =
    timeMinutes !== null ? `${stepCount} steps · ${timeMinutes} min` : `${stepCount} steps`

  const renderLeftActions = () => (
    <TouchableOpacity
      onPress={() => {
        swipeableRef.current?.close()
        onSwipeRight()
      }}
      style={{
        backgroundColor: '#30D158',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 12,
        marginVertical: 6,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Cook</Text>
    </TouchableOpacity>
  )

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={() => {
        swipeableRef.current?.close()
        onSwipeLeft()
      }}
      style={{
        backgroundColor: '#FF453A',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 12,
        marginVertical: 6,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Delete</Text>
    </TouchableOpacity>
  )

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: '#1C1C1E',
          padding: 12,
          borderRadius: 12,
          marginVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
        activeOpacity={0.8}
      >
        <View
          style={{
            width: 56,
            height: 56,
            backgroundColor: '#2C2C2E',
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>🍽</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: '#F5F5F0', fontWeight: '700', fontSize: 16, marginBottom: 4 }}
            numberOfLines={2}
          >
            {recipe.name}
          </Text>
          <Text style={{ color: '#8E8E93', fontSize: 13 }}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  )
}
