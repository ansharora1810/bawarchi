import React, { useRef, useState } from 'react'
import { Animated, Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { SourceType } from '../types/recipe'

interface Props {
  onSelect: (source: SourceType) => void
}

const OPTIONS: { source: SourceType; label: string; icon: string }[] = [
  { source: 'youtube', label: 'YouTube', icon: '📺' },
  { source: 'video', label: 'Video', icon: '🎬' },
  { source: 'pdf', label: 'PDF', icon: '📄' },
  { source: 'url', label: 'Link', icon: '🔗' },
  { source: 'image', label: 'Image', icon: '🖼' },
  { source: 'audio', label: 'Audio', icon: '🎵' },
]

export default function FABMenu({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const rotateAnim = useRef(new Animated.Value(0)).current
  const itemAnims = useRef(OPTIONS.map(() => new Animated.Value(0))).current
  const pendingSource = useRef<SourceType | null>(null)

  const openMenu = () => {
    setOpen(true)
    Animated.parallel([
      Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ...itemAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          delay: i * 40,
          useNativeDriver: true,
        }),
      ),
    ]).start()
  }

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ...itemAnims.map(anim =>
        Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ),
    ]).start(() => setOpen(false))
  }

  const handleSelect = (source: SourceType) => {
    pendingSource.current = source
    closeMenu()
  }

  const handleDismissed = () => {
    const s = pendingSource.current
    pendingSource.current = null
    if (s) onSelect(s)
  }

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] })

  return (
    <>
      <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu} onDismiss={handleDismissed}>
        <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={closeMenu}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            </TouchableWithoutFeedback>
            <View
              style={{
                position: 'absolute',
                bottom: 104,
                right: 24,
                alignItems: 'flex-end',
                gap: 10,
              }}
            >
              {OPTIONS.map((opt, i) => {
                const translateY = itemAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
                return (
                  <Animated.View
                    key={opt.source}
                    style={{ opacity: itemAnims[i], transform: [{ translateY }] }}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelect(opt.source)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: '#1C1C1E',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#E8A838',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
                      <Text style={{ color: '#F5F5F0', fontSize: 14, fontWeight: '500' }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )
              })}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        onPress={open ? closeMenu : openMenu}
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
        <Animated.Text
          style={{ fontSize: 24, color: '#fff', fontWeight: '700', transform: [{ rotate: rotation }] }}
        >
          +
        </Animated.Text>
      </TouchableOpacity>
    </>
  )
}
