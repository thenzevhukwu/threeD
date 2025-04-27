// styles/feed.styles.ts
import { theme } from "@/constants/theme";
import { Dimensions, Platform, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "JetBrainsMono-Medium",
    color: theme.primary,
  },
  post: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.white,
  },
  postImage: {
    width: '100%',
    height: width,
    maxWidth: width,
    alignSelf: 'center',
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  postInfo: {
    paddingHorizontal: 12,
  },
  likesText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.white,
    marginBottom: 6,
  },
  captionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  captionUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.white,
    marginRight: 6,
  },
  captionText: {
    fontSize: 14,
    color: theme.white,
    flex: 1,
  },
  commentsText: {
    fontSize: 14,
    color: theme.grey,
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: theme.grey,
    marginBottom: 8,
  },
  modalContainer: {
    backgroundColor: theme.background,
    marginBottom: Platform.OS === "ios" ? 44 : 0,
    flex: 1,
    marginTop: Platform.OS === "ios" ? 44 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.surface,
  },
  modalTitle: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },
  commentsList: {
    flex: 1,
  },
  commentContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.surface,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: theme.white,
    fontWeight: "500",
    marginBottom: 4,
  },
  commentText: {
    color: theme.white,
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    color: theme.grey,
    fontSize: 12,
    marginTop: 4,
  },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: theme.surface,
    backgroundColor: theme.background,
  },
  input: {
    flex: 1,
    color: theme.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: theme.surface,
    borderRadius: 20,
    fontSize: 14,
  },
  postButton: {
    color: theme.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  editProfileButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editText: {
    fontSize: 14,
  },
  nameSection: {
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  handle: {
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    marginTop: 12,
    fontSize: 15,
  },
  infoSection: {
    marginTop: 10,
  },
  link: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    marginTop: 2,
  },
  followSection: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  followText: {
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingBottom: 8,
  },
  tabButton: {
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
  },
  emptySection: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.white,
  },
  editContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  usernameInput: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveButtonText: {
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 6,
  },
  cancelButtonText: {
  },
  editButton: {
    marginLeft: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 12,
  },
  noPostsContainer: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPostsText: {
    fontSize: 20,
    color: theme.primary,
  },
  mediaContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
  },


  // Post Popup Styles
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 14,
  },



  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 340,
  },
  dialogTitle: {
    color: theme.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dialogMessage: {
    color: theme.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  buttonCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonDelete: {
    backgroundColor: theme.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonTextCancel: {
    color: theme.white,
    fontWeight: '600',
  },
  buttonTextDelete: {
    color: theme.white,
    fontWeight: '600',
  },
  
});