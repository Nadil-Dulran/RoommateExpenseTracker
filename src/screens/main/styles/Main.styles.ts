import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  /*
   * ActivityScreen Styles
   */

container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginTop: 6,
  },
  filterActive: {
    backgroundColor: '#009966',
  },
  filterText: {
    fontSize: 14,
    color: '#6a7282',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a7282',
    marginBottom: 10,
  },
  contentWrap: {
    padding: 16,
  },
  daySection: {
    marginBottom: 24,
  },
  emptyWrap: {
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6a7282',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  /*
   * AddExpensScreen Styles
   */

    headerA: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backButton: {
    padding: 10,
    borderRadius: 20,
    color:"#6A7282",
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A7282',
    marginTop: 20,
    marginBottom: 10,
  },

  firstlable: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A7282',
    marginBottom: 10,
  },

  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#fff',
  },

  amountText: {
    fontSize: 36,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    color: '#000000',
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  categoryItem: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 14,
    alignItems: 'center',
  },

  selectedCategory: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  categoryText: {
    fontSize: 12,
    marginTop: 6,
    color: '#6A7282',
    textAlign: 'center',
  },

  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },

  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },

  groupSelectorTitle: {
    fontWeight: '600',
    color: '#101828',
  },

  groupSelectorSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6A7282',
  },

  groupSelectorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupSelectorAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  groupSelectorEmoji: {
    fontSize: 20,
  },

  selectedGroupCard: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  groupEmoji: { fontSize: 24, marginRight: 10 },
  groupName: { fontSize: 16, fontWeight: '600', color: '#101828' },
  groupMembers: { fontSize: 12, color: '#6A7282' },

  paidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },

  memberName: { fontWeight: '500' },

  splitRow: {
    flexDirection: 'row',
    gap: 8,
  },

  splitBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  selectedSplit: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  splitText: { fontSize: 14, color: '#6A7282' },

  splitBox: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },

  splitRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  splitMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  splitAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
  },

  splitMemberName: {
    color: '#101828',
  },

  smallInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
    textAlign: 'center',
    marginRight: 30,
  },

  submitBtn: {
    backgroundColor: '#009966',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },

  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

dateContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 14,
},

dateLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

dateText: {
  marginLeft: 10,
  fontSize: 16,
  fontWeight: '400',
  color: '#101828',
},

 /*
  * Dashboard Styles
  */

  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  headerD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },

  subtitle: {
    fontSize: 14,
    color: '#6a7282',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  bellWrapper: {
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff2056',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  avatarD: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: '#F3F4F6',
    borderWidth: 1,
  },

  balanceCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  balanceLabel: {
    color: '#99A1AF',
    fontSize: 14,
  },

  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
    marginBottom: 10,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  subCard: {
    flex: 0.48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    minHeight: 70,
  },

  owedLabel: { color: '#009966', fontSize: 12 },
  oweLabel: { color: '#ff2056', fontSize: 12 },

  owedAmount: {
    color: '#009966',
    fontSize: 18,
    fontWeight: '600',
  },

  oweAmount: {
    color: '#ff2056',
    fontSize: 18,
    fontWeight: '600',
  },

  settleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderColor: '#d0fae5',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },

  settleText: {
    color: '#007a55',
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#101828',
  },

  seeAll: {
    color: '#009966',
    fontWeight: '500',
  },

  dashboardCard: {
    marginRight: 1,
    marginLeft: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    elevation: 2,
  },

  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emoji: {
    fontSize: 23,
  },

  balanceType: {
    fontSize: 13,
    fontWeight: '700',
  },

  groupAmount: {
    fontSize: 18,
    fontWeight: '700',
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 20,
  },

  activitySub: {
    fontSize: 12,
    color: '#99A1AF',
  },

  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101828',
  },

  errorCard: {
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },

 /*
  * ExpensesScreen Styles
  */
 
  headerE: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
  },
  subHeader: {
    fontSize: 14,
    color: '#6A7282',
    marginBottom: 20,
  },
  expenseListContainer: {
    flex: 1,
  },
  expenseListContent: {
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 100,
  },

  /*
  * GroupScreen Styles
  */

  headerG: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subtitleG: {
    fontSize: 14,
    color: '#6A7282',
    marginTop: 4,
  },

  joinHeaderButton: {
    marginTop: 12,
    backgroundColor: '#009966',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },

  joinHeaderButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  addButton: {
    backgroundColor: '#009966',
    padding: 10,
    borderRadius: 20,
    bottom: 5,
    top: 3,
  },

  groupCardG: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  groupTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emojiBoxG: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  memberText: {
    fontSize: 12,
    color: '#6A7282',
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },

  balanceRowG: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  balanceAmountG: {
    fontSize: 20,
    fontWeight: '700',
  },

  settledText: {
    fontSize: 14,
    color: '#009966',
    fontWeight: '600',
  },

emojiGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},

emojiItem: {
  width: 40,
  height: 40,
  borderRadius: 16,
  borderWidth: 2,
  borderColor: '#E5E7EB',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
},

selectedEmoji: {
  borderColor: '#009966',
  backgroundColor: '#ECFDF5',
},

labelG: {
  fontSize: 13,
  fontWeight: '600',
  color: '#6A7282',
  marginBottom: 8,
},

memberRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
},

avatarStack: {
  flexDirection: 'row',
  marginRight: 8,
},

avatarG: {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: '#fff',
},

});