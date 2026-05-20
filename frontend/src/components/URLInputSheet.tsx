import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

interface Props {
  visible: boolean
  sourceType: 'youtube' | 'url'
  onSubmit: (url: string) => void
  onClose: () => void
}

export default function URLInputSheet({ visible, sourceType, onSubmit, onClose }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState('')

  const label = sourceType === 'youtube' ? 'Paste a YouTube link' : 'Paste a URL'
  const placeholder = sourceType === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'

  const handleSubmit = () => {
    if (!value.trim()) {
      setError('Please enter a URL')
      return
    }
    setError('')
    onSubmit(value.trim())
    setValue('')
  }

  const handleClose = () => {
    setValue('')
    setError('')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View
                style={{
                  backgroundColor: '#1C1C1E',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 4,
                    backgroundColor: '#3A3A3C',
                    borderRadius: 2,
                    alignSelf: 'center',
                    marginBottom: 20,
                  }}
                />
                <Text
                  style={{
                    color: '#F5F5F0',
                    fontSize: 17,
                    fontWeight: '600',
                    marginBottom: 16,
                  }}
                >
                  {label}
                </Text>
                <TextInput
                  autoFocus
                  value={value}
                  onChangeText={text => {
                    setValue(text)
                    setError('')
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholder}
                  placeholderTextColor="#8E8E93"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: '#2C2C2E',
                    borderRadius: 8,
                    padding: 14,
                    color: '#F5F5F0',
                    fontSize: 15,
                    borderWidth: 1.5,
                    borderColor: focused ? '#E8A838' : 'transparent',
                    marginBottom: 8,
                  }}
                />
                {!!error && (
                  <Text style={{ color: '#FF453A', fontSize: 13, marginBottom: 8 }}>{error}</Text>
                )}
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={{
                    backgroundColor: '#E8A838',
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: '#111111', fontWeight: '700', fontSize: 16 }}>Go</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
