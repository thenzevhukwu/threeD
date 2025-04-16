import  React, { View, ActivityIndicator } from 'react-native'
import { theme } from '@/constants/theme'

export function Loader() {
  return (
    <View
        style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.background,
        }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  )
}