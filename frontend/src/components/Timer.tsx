import React, { useEffect, useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  durationMs: number
  onComplete: () => void
}

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Timer({ durationMs, onComplete }: Props) {
  const [remaining, setRemaining] = useState(durationMs)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashAnim = useRef(new Animated.Value(1)).current
  const completedRef = useRef(false)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(intervalRef.current!)
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  useEffect(() => {
    if (remaining === 0 && !completedRef.current) {
      completedRef.current = true
      setRunning(false)
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        { iterations: 6 },
      ).start(() => onComplete())
    }
  }, [remaining])

  const toggle = () => {
    if (remaining === 0) return
    setRunning(r => !r)
  }

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        opacity: flashAnim,
      }}
    >
      <Text style={{ fontSize: 16 }}>⏱</Text>
      <Text
        style={{
          fontSize: 20,
          color: '#F5F5F0',
          fontVariant: ['tabular-nums'],
          letterSpacing: 1,
        }}
      >
        {formatMs(remaining)}
      </Text>
      <TouchableOpacity
        onPress={toggle}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#E8A838',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 16 }}>{running ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
