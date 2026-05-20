import * as WebBrowser from 'expo-web-browser'
import React, { useState } from 'react'
import { ActivityIndicator, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'apple' | 'email' | null>(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function signInWithEmail() {
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setError('')
    setLoading('email')
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        if (signInError.message.includes('Invalid login')) {
          const { error: signUpError } = await supabase.auth.signUp({ email, password })
          if (signUpError) throw signUpError
        } else {
          throw signInError
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setLoading(null)
    }
  }

  async function signInWithProvider(provider: 'google' | 'apple') {
    setError('')
    setLoading(provider)
    try {
      const redirectTo = 'bawarchi://auth/callback'
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (oauthError) throw oauthError
      if (!data.url) throw new Error('No OAuth URL returned')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

      if (result.type === 'success' && result.url) {
        const urlObj = new URL(result.url)
        const accessToken = urlObj.searchParams.get('access_token') ?? urlObj.hash
          .split('&')
          .find(p => p.startsWith('#access_token=') || p.startsWith('access_token='))
          ?.split('=')[1]
        const refreshToken = urlObj.searchParams.get('refresh_token') ?? urlObj.hash
          .split('&')
          .find(p => p.startsWith('refresh_token='))
          ?.split('=')[1]

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed'
      setError(message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <View style={{ flex: 1, paddingHorizontal: 32 }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '20%',
          }}
        >
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🍳</Text>
          <Text
            style={{
              fontSize: 40,
              fontWeight: '700',
              color: '#F5F5F0',
              marginBottom: 12,
            }}
          >
            Bawarchi
          </Text>
          <Text style={{ fontSize: 17, color: '#8E8E93', textAlign: 'center' }}>
            Cook anything. From anywhere.
          </Text>
        </View>

        <View style={{ paddingBottom: 48, gap: 12 }}>
          {!!error && (
            <Text style={{ color: '#FF453A', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
              {error}
            </Text>
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#8E8E93"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: '#1C1C1E',
              borderRadius: 12,
              padding: 16,
              color: '#F5F5F0',
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#3A3A3C',
            }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#8E8E93"
            secureTextEntry
            style={{
              backgroundColor: '#1C1C1E',
              borderRadius: 12,
              padding: 16,
              color: '#F5F5F0',
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#3A3A3C',
            }}
          />

          <TouchableOpacity
            onPress={signInWithEmail}
            disabled={loading !== null}
            style={{
              backgroundColor: '#E8A838',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              opacity: loading === 'email' ? 0.7 : 1,
            }}
          >
            {loading === 'email' ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111111' }}>Continue</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#3A3A3C' }} />
            <Text style={{ color: '#8E8E93', fontSize: 13 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#3A3A3C' }} />
          </View>

          <TouchableOpacity
            onPress={() => signInWithProvider('google')}
            disabled={loading !== null}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: loading === 'google' ? 0.7 : 1,
            }}
          >
            {loading === 'google' ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4' }}>G</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111111' }}>
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={() => signInWithProvider('apple')}
              disabled={loading !== null}
              style={{
                backgroundColor: '#1C1C1E',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: '#3A3A3C',
                opacity: loading === 'apple' ? 0.7 : 1,
              }}
            >
              {loading === 'apple' ? (
                <ActivityIndicator color="#F5F5F0" />
              ) : (
                <>
                  <Text style={{ fontSize: 18, color: '#F5F5F0' }}>🍎</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#F5F5F0' }}>
                    Sign in with Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
