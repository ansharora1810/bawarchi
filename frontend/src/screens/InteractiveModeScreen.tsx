import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as KeepAwake from 'expo-keep-awake'
import React, { useEffect, useRef, useState } from 'react'
import { Alert, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppStackParamList } from '../../App'
import StepCard from '../components/StepCard'

type Props = NativeStackScreenProps<AppStackParamList, 'InteractiveMode'>

export default function InteractiveModeScreen({ route, navigation }: Props) {
  const { recipe } = route.params
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set())
  const [showFinishModal, setShowFinishModal] = useState(false)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync()
    return () => {
      KeepAwake.deactivateKeepAwake()
    }
  }, [])

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: activeStepIndex, animated: true, viewPosition: 0.3 })
  }, [activeStepIndex])

  const handleStepComplete = (index: number) => {
    setCompletedIndices(prev => new Set([...prev, index]))
    if (index === recipe.recipe_steps.length - 1) {
      setShowFinishModal(true)
    } else {
      setActiveStepIndex(index + 1)
    }
  }

  const handleClose = () => {
    Alert.alert('Stop cooking?', "Your progress won't be saved.", [
      { text: 'Keep Cooking', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{ color: '#8E8E93', fontSize: 13, flex: 1, textAlign: 'center' }}
          numberOfLines={1}
        >
          {recipe.name}
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          style={{
            position: 'absolute',
            right: 16,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#8E8E93', fontSize: 22 }}>×</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={recipe.recipe_steps}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={false}
        contentContainerStyle={{ paddingVertical: 8 }}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item, index }) => (
          <StepCard
            step={item}
            stepNumber={index + 1}
            totalSteps={recipe.recipe_steps.length}
            isActive={index === activeStepIndex}
            isCompleted={completedIndices.has(index)}
            onComplete={() => handleStepComplete(index)}
          />
        )}
      />

      <Modal transparent animationType="fade" visible={showFinishModal}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <Text style={{ fontSize: 72, marginBottom: 16 }}>🎉</Text>
          <Text
            style={{ color: '#F5F5F0', fontSize: 26, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}
          >
            Enjoy!
          </Text>
          <Text style={{ color: '#8E8E93', fontSize: 16, textAlign: 'center', marginBottom: 32 }}>
            Your recipe is ready.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowFinishModal(false)
              navigation.goBack()
            }}
            style={{
              backgroundColor: '#E8A838',
              borderRadius: 8,
              paddingHorizontal: 40,
              paddingVertical: 14,
            }}
          >
            <Text style={{ color: '#111111', fontWeight: '700', fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
