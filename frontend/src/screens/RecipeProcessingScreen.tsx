import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppStackParamList } from '../../App'
import { createRecipeFromPdf, createRecipeFromText, createRecipeFromUrl } from '../api/client'
import { AuthContext } from '../lib/AuthContext'
import { SourceType } from '../types/recipe'

type Props = NativeStackScreenProps<AppStackParamList, 'RecipeProcessing'>

const UNSUPPORTED_SOURCES: SourceType[] = ['image', 'audio', 'video']

const UNSUPPORTED_MESSAGES: Partial<Record<SourceType, string>> = {
  image: 'Image OCR is not yet supported in this build.',
  audio: 'Audio transcription is not yet supported in this build.',
  video: 'Video transcription is not yet supported in this build.',
}

export default function RecipeProcessingScreen({ route, navigation }: Props) {
  const { sourceType, url, fileUri, fileName } = route.params
  const { token } = useContext(AuthContext)

  const [phase, setPhase] = useState<'extracting' | 'processing' | 'error'>('extracting')
  const [phaseHint, setPhaseHint] = useState('Reading your content…')
  const [errorMessage, setErrorMessage] = useState('')

  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 800, useNativeDriver: true }),
      ]),
    )
    pulseLoop.current.start()
    return () => pulseLoop.current?.stop()
  }, [])

  useEffect(() => {
    run()
  }, [])

  async function run() {
    if (!token) {
      setErrorMessage('Not authenticated.')
      setPhase('error')
      return
    }

    if (UNSUPPORTED_SOURCES.includes(sourceType)) {
      setErrorMessage(UNSUPPORTED_MESSAGES[sourceType] ?? 'This source type is not yet supported.')
      setPhase('error')
      return
    }

    try {
      if (sourceType === 'url') {
        if (!url) throw new Error('No URL provided.')
        setPhaseHint('Fetching recipe from URL…')
        setPhase('processing')
        const recipe = await createRecipeFromUrl(url, token)
        pulseLoop.current?.stop()
        navigation.replace('RecipeDetail', { recipe })
        return
      }

      if (sourceType === 'pdf') {
        if (!fileUri) throw new Error('No PDF file provided.')
        setPhaseHint('Extracting text from PDF…')
        setPhase('processing')
        const recipe = await createRecipeFromPdf(fileUri, fileName, token)
        pulseLoop.current?.stop()
        navigation.replace('RecipeDetail', { recipe })
        return
      }

      if (sourceType === 'youtube') {
        setErrorMessage(
          'YouTube transcript extraction is not yet implemented. It requires a YouTube Data API v3 key.',
        )
        setPhase('error')
        return
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setErrorMessage(message)
      setPhase('error')
    }
  }

  async function retry() {
    setPhase('extracting')
    setErrorMessage('')
    setPhaseHint('Reading your content…')
    pulseLoop.current?.start()
    await run()
  }

  if (phase === 'error') {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', padding: 32 }}
      >
        <Text style={{ fontSize: 64, marginBottom: 20 }}>😔</Text>
        <Text style={{ color: '#F5F5F0', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
          Couldn't extract a recipe
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 15, textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
          {errorMessage}
        </Text>

        {!UNSUPPORTED_SOURCES.includes(sourceType) && sourceType !== 'youtube' && (
          <TouchableOpacity
            onPress={retry}
            style={{
              borderWidth: 1.5,
              borderColor: '#E8A838',
              borderRadius: 8,
              paddingHorizontal: 32,
              paddingVertical: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#E8A838', fontWeight: '600', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#8E8E93', fontSize: 15 }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', padding: 32 }}
    >
      <Animated.View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#E8A838',
          marginBottom: 32,
          transform: [{ scale: pulseAnim }],
          opacity: pulseAnim.interpolate({ inputRange: [0.9, 1.2], outputRange: [0.7, 1] }),
        }}
      />
      <Text style={{ color: '#F5F5F0', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
        Reading your recipe…
      </Text>
      <Text style={{ color: '#8E8E93', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
        {phaseHint}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', bottom: 48 }}
      >
        <Text style={{ color: '#8E8E93', fontSize: 15 }}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
