import * as DocumentPicker from 'expo-document-picker'
import React, { useContext, useEffect, useState } from 'react'
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { deleteRecipe, getRecipes } from '../api/client'
import FABMenu from '../components/FABMenu'
import RecipeCard from '../components/RecipeCard'
import URLInputSheet from '../components/URLInputSheet'
import { AuthContext } from '../lib/AuthContext'
import { Recipe, SourceType } from '../types/recipe'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppStackParamList } from '../../App'

type Props = NativeStackScreenProps<AppStackParamList, 'RecipeList'>

function EmptyStateArrow() {
  const { width: W, height: H } = Dimensions.get('window')

  const unrotatedWidth = H * 0.78
  const unrotatedHeight = W * 0.9

  const tipX = W - 550
  const tipY = H - 720

  return (
    <Image
      source={require('../../assets/dashed-arrow.png')}
      resizeMode="contain"
      style={{
        position: 'absolute',
        width: unrotatedWidth,
        height: unrotatedHeight,
        left: tipX,
        top: tipY,
        tintColor: '#8E8E93',
        transform: [{ rotate: '62deg' }, { scaleY: -1 }],
      }}
    />
  )
}

export default function RecipeListScreen({ navigation }: Props) {
  const { token } = useContext(AuthContext)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [urlSheetVisible, setUrlSheetVisible] = useState(false)
  const [urlSheetSourceType, setUrlSheetSourceType] = useState<'youtube' | 'url'>('url')

  const fetchRecipes = async () => {
    if (!token) return
    try {
      const data = await getRecipes(token)
      setRecipes(data.recipes)
    } catch {
      // Silent fail — list stays empty
    }
  }

  useEffect(() => {
    fetchRecipes().finally(() => setLoading(false))
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRecipes()
    setRefreshing(false)
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return
          try {
            await deleteRecipe(id, token)
            setRecipes(prev => prev.filter(r => r.id !== id))
          } catch {
            Alert.alert('Error', 'Failed to delete recipe. Please try again.')
          }
        },
      },
    ])
  }

  const handleFABSelect = async (source: SourceType) => {
    if (source === 'youtube' || source === 'url') {
      setUrlSheetSourceType(source)
      setUrlSheetVisible(true)
      return
    }

    const mimeTypes: Record<SourceType, string[]> = {
      video: ['video/*'],
      pdf: ['application/pdf'],
      image: ['image/*'],
      audio: ['audio/*'],
      youtube: [],
      url: [],
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes[source],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.length) return

      const asset = result.assets[0]
      navigation.navigate('RecipeProcessing', {
        sourceType: source,
        fileUri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType,
      })
    } catch (e) {
      console.error('DocumentPicker error', e)
      Alert.alert('Error', `Could not open file picker.\n${String(e)}`)
    }
  }

  const handleURLSubmit = (url: string) => {
    setUrlSheetVisible(false)
    navigation.navigate('RecipeProcessing', {
      sourceType: urlSheetSourceType,
      url,
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#8E8E93', fontSize: 16 }}>Loading…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }} edges={['bottom', 'left', 'right']}>
      {recipes.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyStateArrow />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#d5d5dd', fontSize: 19 }}>Add your first recipe</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E8A838"
            />
          }
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}
              onSwipeLeft={() => handleDelete(item.id)}
              onSwipeRight={() => navigation.navigate('InteractiveMode', { recipe: item })}
            />
          )}
        />
      )}

      <FABMenu onSelect={handleFABSelect} />

      <URLInputSheet
        visible={urlSheetVisible}
        sourceType={urlSheetSourceType}
        onSubmit={handleURLSubmit}
        onClose={() => setUrlSheetVisible(false)}
      />
    </SafeAreaView>
  )
}
