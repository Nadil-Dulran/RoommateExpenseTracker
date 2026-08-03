import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  /*
   * GroupDetailsScreen Styles
   */

  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 10,
  },

  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 23,
  },

  emojiBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#d4d6da',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  groupName: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: '#101828',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  balanceLabel: {
    color: '#99a1af',
    marginBottom: 6,
  },

  balanceAmount: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6a7282',
    marginHorizontal: 20,
    marginBottom: 10,
  },
    sectionTitlee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a7282',
    marginBottom: 10,
  },

  memberCard: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#f3f4f6',
    borderWidth: 2,
  },

  owingCard: {
    backgroundColor: '#fff5f7',
    borderWidth: 1,
    borderColor: '#ffd9e0',
  },

  owedCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },

  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  memberName: {
    fontSize: 17,
    fontWeight: '500',
  },

  settleBtn: {
    paddingHorizontal: 17,
    paddingVertical: 7,
    borderRadius: 10,
  },

  memberActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  memberAmount: {
    fontSize: 35,
    fontWeight: 'bold',
    marginRight: 12,
  },
   memberAmountt: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
  },

  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  expenseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#f3f4f6',
    borderWidth: 2,
  },

  avatarStack: {
   flexDirection: 'row',
   marginRight: 8,
   marginBottom: 8,
},

avatar: {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: '#fff',
},
membersSection: {
  marginHorizontal: 20,
  marginTop: 20,
  marginBottom: 10,
},

membersHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

membersCount: {
  fontSize: 14,
  fontWeight: '600',
  color: '#6a7282',
},

addBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},

addText: {
  color: '#009966',
  fontWeight: '600',
  marginLeft: 4,
},

memberRow: {
  backgroundColor: '#ffffff',
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 14,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#f3f4f6',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

memberRowLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

avatarLarge: {
  width: 36,
  height: 36,
  borderRadius: 18,
  marginRight: 12,
  borderWidth: 2,
  borderColor: '#fff',
},

avatarText: {
  color: '#fff',
  fontWeight: 'bold',
},

memberRowName: {
  fontSize: 14,
  fontWeight: '600',
  color: '#101828',
},

youLabel: {
  fontSize: 13,
  fontWeight: '400',
  color: '#6a7282',
},

removeBtn: {
  padding: 6,
},
menuButton: {
  padding: 8,
},

menuOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 100,
},

overlayBackground: {
  flex: 1,
},

menuCard: {
  position: 'absolute',
  top: 60,
  right: 20,
  backgroundColor: '#fff',
  borderRadius: 16,
  paddingVertical: 8,
  width: 180,
  elevation: 3,
},

menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  gap: 10,
},

menuText: {
  fontSize: 14,
  fontWeight: '400',
},

menuDivider: {
  height: 1,
  backgroundColor: '#f3f4f6',
},

modalOverlayy: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},

confirmCard: {
  backgroundColor: '#fff',
  borderRadius: 24,
  padding: 24,
  width: '90%',
  alignItems: 'center',
},

modalTitlee: {
  fontSize: 20,
  fontWeight: 'bold',
  marginVertical: 12,
},

modalDescription: {
  textAlign: 'center',
  color: '#6a7282',
  marginBottom: 20,
},

modalButtons: {
  flexDirection: 'row',
  gap: 12,
  width: '100%',
},

cancelBtnn: {
  flex: 1,
  backgroundColor: '#f3f4f6',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

saveBtn: {
  flex: 1,
  backgroundColor: '#009966',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

deleteBtn: {
  flex: 1,
  backgroundColor: '#ff2056',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

leaveBtn: {
  flex: 1,
  backgroundColor: '#ff2056',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

modalOverlayCenter: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},

editCard: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 24,
},


editTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 20,
},

label: {
  fontSize: 14,
  color: '#6a7282',
  marginBottom: 8,
  marginTop: 10,
},

input: {
  backgroundColor: '#f9fafb',
  borderRadius: 16,
  padding: 14,
  fontSize: 16,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

emojiRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 10,
},

emojiButton: {
  width: 33,
  height: 48,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderWidth: 2,
  borderColor: '#E5E7EB',
},

emojiSelected: {
  borderWidth: 2,
  borderColor: '#009966',
  backgroundColor: '#ecfdf5',
},

editButtonRow: {
  flexDirection: 'row',
  marginTop: 30,
  gap: 14,
},

cancelButton: {
  flex: 1,
  backgroundColor: '#f3f4f6',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},

saveButton: {
  flex: 1,
  backgroundColor: '#009966',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},

cancelText: {
  fontSize: 16,
  fontWeight: '600',
},

saveText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#fff',
},

inviteCard: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 24,
},

inviteHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

inviteTitle: {
  fontSize: 22,
  fontWeight: 'bold',
},

inviteSubtitle: {
  marginTop: 10,
  marginBottom: 20,
  color: '#6a7282',
},

linkRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 20,
},

linkInput: {
  flex: 1,
  backgroundColor: '#f9fafb',
  borderRadius: 16,
  padding: 14,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

copyBtn: {
  backgroundColor: '#009966',
  paddingHorizontal: 16,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  gap: 6,
},

sendBtn: {
  backgroundColor: '#009966',
  paddingHorizontal: 16,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  gap: 6,
},

copyText: {
  color: '#fff',
  fontWeight: '600',
},

dividerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginBottom: 20,
},

divider: {
  flex: 1,
  height: 1,
  backgroundColor: '#e5e7eb',
},

closeBtn: {
  backgroundColor: '#f3f4f6',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},
removeCard: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 24,
  alignItems: 'center',
},

removeIconCircle: {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: '#ffe8ed',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
},

removeTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
},

removeDescription: {
  textAlign: 'center',
  color: '#6a7282',
  marginBottom: 28,
  lineHeight: 20,
},

removeButtonRow: {
  flexDirection: 'row',
  gap: 12,
},

confirmRemoveButton: {
  flex: 1,
  backgroundColor: '#ff2056',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},

confirmRemoveText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},

categoryIconn: {
  width: 50,
  height: 50,
  borderRadius: 16,
  backgroundColor: '#f3f4f6',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 14,
  marginTop: 20,
},

expenseContent: {
  flex: 1,
},

rowBetween: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

expenseTitlee: {
  fontSize: 16,
  fontWeight: '600',
},

expenseAmount: {
  fontSize: 18,
  fontWeight: '700',
},

expenseTitleInline: {
  flex: 1,
  marginRight: 12,
},

expenseTitleBlock: {
  marginBottom: 0,
},

expenseAmountBelow: {
  fontSize: 18,
  fontWeight: '700',
  alignSelf: 'flex-end',
  marginTop: -10,
},

expenseMetaRow: {
  marginTop: 2,
},

expenseSubb: {
  fontSize: 13,
  color: '#6a7282',
  marginTop: 0,
},

expenseDate: {
  fontSize: 13,
  color: '#99a1af',
},

expenseDivider: {
  height: 1,
  backgroundColor: '#f3f4f6',
  marginVertical: 10,
},

expenseShare: {
  fontSize: 14,
  fontWeight: '600',
},

/*
   * JoinGroupScreen Styles
*/

  description: {
    marginTop: 8,
    fontSize: 14,
    color: '#6A7282',
    textAlign: 'center',
  },

/*
   * NotificationScreen Styles
 */

  headerN: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#101828',
  },
  subtitle: {
    fontSize: 14,
    color: '#6A7282',
  },
  markAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#009966',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  unreadCard: {
    borderColor: '#009966',
    backgroundColor: '#F9FFFE',
  },
  row: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarN: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  badge: {
    position: 'relative',
    top: -13,
    right: -28,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  message: {
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  messageBlock: {
    flex: 1,
    marginRight: 6,
  },
  bold: {
    fontWeight: '600',
    color: '#101828',
  },
  light: {
    color: '#6A7282',
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: '#009966',
    borderRadius: 4,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6A7282',
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 10,
    color: '#99A1AF',
  },
  date: {
    fontSize: 11,
    color: '#99A1AF',
  },
  amountPill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  settledPill: {
    backgroundColor: '#ECFDF5',
  },
  categoryIcon: {
    marginRight: 6,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#101828',
  },
  settledText: {
    color: '#009966',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6A7282',
  },

  /*
   * SettleUpScreen Styles
 */

  loadingWrap: {
    paddingVertical: 24,
  },

  summaryCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },

  summaryLabel: { color: '#fff', opacity: 0.8 },
  summaryAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  summarySub: { color: '#fff', opacity: 0.8 },

  expenseMetaCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  expenseMetaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseMetaSub: {
    fontSize: 13,
    color: '#6a7282',
  },
  participantsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  participantsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f4f7',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
  },
  participantMeta: {
    fontSize: 12,
    color: '#98a2b3',
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
  },

  emptyWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  memberStatus: { fontSize: 12 },
  memberAmountS: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  settleButton: {
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  settleText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },

  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalDesc: { fontSize: 14, marginBottom: 20 },
  modalButtonsS: { flexDirection: 'row', justifyContent: 'space-between' },

  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 10,
  },

  confirmBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#101828',
    borderRadius: 12,
  },
});