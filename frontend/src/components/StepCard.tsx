import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { RecipeStep } from '../types/recipe'
import Timer from './Timer'

interface Props {
  step: RecipeStep
  stepNumber: number
  totalSteps: number
  isActive: boolean
  isCompleted: boolean
  onComplete: () => void
}

export default function StepCard({
  step,
  stepNumber,
  totalSteps,
  isActive,
  isCompleted,
  onComplete,
}: Props) {
  const isLast = stepNumber === totalSteps
  const opacity = isCompleted ? 0.5 : isActive ? 1 : 0.4
  const scale = isActive ? 1 : 0.9

  const timeMinutes = step.time ? Math.round(step.time / 60000) : null

  return (
    <View
      style={{
        backgroundColor: '#1C1C1E',
        padding: 20,
        borderRadius: 16,
        marginVertical: 6,
        marginHorizontal: 16,
        opacity,
        transform: [{ scale }],
        borderLeftWidth: isActive ? 4 : 0,
        borderLeftColor: '#E8A838',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: '#8E8E93', fontSize: 13 }}>
          Step {stepNumber} of {totalSteps}
        </Text>
        {timeMinutes !== null && (
          <Text style={{ color: '#8E8E93', fontSize: 13 }}>⏱ {timeMinutes}m</Text>
        )}
      </View>

      <Text style={{ color: '#F5F5F0', fontSize: 18, lineHeight: 28 }}>{step.step}</Text>

      {isActive && step.time !== null && (
        <Timer durationMs={step.time} onComplete={() => {}} />
      )}

      {isActive && !isCompleted && (
        <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
          {isLast ? (
            <TouchableOpacity
              onPress={onComplete}
              style={{
                backgroundColor: '#E8A838',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#111111', fontWeight: '700', fontSize: 16 }}>Finish</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onComplete}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#E8A838',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 22, color: '#111111' }}>✓</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isCompleted && (
        <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
          <Text style={{ fontSize: 20, color: '#30D158' }}>✓</Text>
        </View>
      )}
    </View>
  )
}
