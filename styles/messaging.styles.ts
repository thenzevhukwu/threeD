import { StyleSheet } from 'react-native';
import { theme } from '@/constants/theme'

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: 16,
        paddingTop: 50,
    },
    header: {
        marginBottom: 20,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: 12,
    },
    searchBar: {
        backgroundColor: theme.inputBackground,
        color: theme.inputText,
        borderRadius: 8,
        elevation: 1,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 0.4,
        borderColor: '#ccc',
    },
    messageContent: {
        flex: 1,
        borderBottomColor: 'transparent',
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.white,
    },
    time: {
        fontSize: 12,
        color: theme.surfaceLight,
    },
    messageText: {
        fontSize: 14,
        color: theme.surfaceLight,
    }
  })