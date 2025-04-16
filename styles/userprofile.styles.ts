import React from "react";
import { StyleSheet } from "react-native";
import { theme } from "@/constants/theme";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 16,
      color: theme.white,
      fontWeight: '600',
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
     },
    followButton: {
      marginLeft: 'auto',
      backgroundColor: theme.primary,
      minWidth: 100,
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    followingButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.primary,
    },
    followButtonText: {
      color: theme.secondary,
      fontSize: 14,
      fontWeight: '600',
    },
    followingButtonText: {
      color: theme.primary,
    },
    nameSection: {
      marginTop: 12,
    },
    name: {
      fontSize: 18,
      color: theme.white,
      fontWeight: '600',
      marginBottom: 8,
    },
    handle: {
      color: theme.grey,
      marginBottom: 16,
    },
    bio: {
      color: theme.grey,
    },
    followSection: {
      flexDirection: 'row',
      paddingVertical: 20,
      gap: 20,
    },
    followText: {
      color: theme.white,
      fontSize: 14,
    },
    bold: {
      fontWeight: 'bold',
    },
    tabRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: theme.surface,
    },
    tabButton: {
      paddingVertical: 10,
    },
    selectedTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primary,
    },
    tabText: {
      color: theme.grey,
      fontSize: 14,
    },
    selectedTabText: {
      color: theme.primary,
    },
    emptySection: {
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      color: theme.grey,
      fontSize: 14,
    },
  });
