import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Expense } from '../../types';
import { groups, currentUser } from '../../data/mockData';
import { expenseService } from '../../services/expenseService';
import { Image } from 'react-native';
import deleteIcon from '../../../assets/delete.png';
import editIcon from '../../../assets/edit.png';
import Icon from 'react-native-vector-icons/Feather';

export default function ExpensesScreen() {
  const navigation = useNavigation<any>();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});



const handleEdit = (item: Expense) => {
  setActiveMenuId(null);
  setSelectedExpense(item);
  setEditDescription(item.description);
  setEditAmount(item.amount.toString());

  const initialExact: Record<string, string> = {};
  item.splits.forEach(split => {
    initialExact[split.userId] = split.amount.toString();
  });

  setExactAmounts(initialExact);
  setSplitType('equal');
  setShowEditModal(true);
};

const handleDelete = (item: Expense) => {
  setActiveMenuId(null);
  setSelectedExpense(item);
  setShowDeleteModal(true);
};

  const getGroupInfo = (groupId: string) =>
    groups.find(g => g.id === groupId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  useEffect(() => {
  const loadExpenses = async () => {
    const data = await expenseService.getExpenses();
    setExpenses(data);
  };

  loadExpenses();
}, []);


  const confirmDelete = () => {
    if (!selectedExpense) return;

    setExpenses(prev =>
      prev.filter(exp => exp.id !== selectedExpense.id)
    );

    setSelectedExpense(null);
    setShowDeleteModal(false);
  };

  const confirmEdit = () => {
    if (!selectedExpense) return;

    setExpenses(prev =>
      prev.map(exp =>
        exp.id === selectedExpense.id
          ? {
              ...exp,
              description: editDescription,
              amount: parseFloat(editAmount),
            }
          : exp
      )
    );

    setShowEditModal(false);
    setSelectedExpense(null);
  };


  const renderExpense = ({ item }: { item: Expense }) => {
  const group = getGroupInfo(item.groupId);
  const myShare = item.splits.find(s => s.userId === currentUser.id);
  const isMyExpense = item.paidBy.id === currentUser.id;

  const amountOwed = isMyExpense
    ? item.amount - (myShare?.amount || 0)
    : 0;

return (
  <View style={styles.card}>
    {/* Top Row */}
<View style={styles.topRow}>
  <Text style={styles.title}>{item.description}</Text>

  <View style={styles.amountRow}>
    <Text style={styles.amount}>
      ${item.amount.toFixed(2)}
    </Text>

    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() =>
          setActiveMenuId(
            activeMenuId === item.id ? null : item.id
          )
        }
        style={styles.menuButton}
      >
        <Icon name="more-vertical" size={18} color="#98A2B3" />
      </Pressable>

      {activeMenuId === item.id && (
        <View style={styles.dropdown}>

           <Pressable
            onPress={() => {
              setActiveMenuId(null);
              navigation.navigate('Activity', { expenseId: item.id } as never);
            }}
            style={styles.menuItem}
          >
            <View style={styles.menuRowItem}>
              <Icon name="dollar-sign" size={16} color="#009966" />
              <Text style={[styles.menuText, { color: '#009966' }]}>
                Settle Up
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleEdit(item)}
            style={styles.menuItem}
          >
            <View style={styles.menuRowItem}>
              <Image source={editIcon} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleDelete(item)}
            style={styles.menuItem}
          >
            <View style={styles.menuRowItem}>
              <Image source={deleteIcon} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: '#FF2056' }]}>
                Delete
              </Text>
            </View>
          </Pressable>


        </View>
      )}
    </View>
  </View>
</View>


    {/* Group + Date */}
    <Text style={styles.meta}>
      {group?.emoji} {group?.name}  •  {formatDate(item.date)}
    </Text>

    {/* Paid + Owed */}
    <View style={styles.paidRow}>
      <Text style={styles.metaLight}>Paid by </Text>
      <Text style={styles.bold}>{item.paidBy.name}</Text>

      <Text style={styles.metaLight}>  •  </Text>

      {isMyExpense && amountOwed > 0 && (
        <Text style={styles.owedText}>
          You are owed:  ${amountOwed.toFixed(2)}
        </Text>
      )}

      {!isMyExpense && myShare && (
        <Text style={styles.oweText}>
          You owe ${myShare.amount.toFixed(2)}
        </Text>
      )}
    </View>

    {/* Divider */}
    <View style={styles.divider} />

    {/* Split Pills */}
    <View style={styles.splitRow}>
<View style={styles.splitRow}>
  <Text style={styles.metaLight}>Split:</Text>

  {item.splits.map(split => {
    let memberName = 'Unknown';

    if (split.userId === currentUser.id) {
      memberName = 'You';
    } else if (split.userId === item.paidBy.id) {
      memberName = item.paidBy.name;
    } else {
      const member = group?.members.find(
        m => m.id === split.userId
      );
      memberName = member?.name ?? 'Unknown';
    }

    return (
      <View key={split.userId} style={styles.splitPill}>
        <Text style={styles.splitText}>
          {memberName} ${split.amount.toFixed(2)}
        </Text>
      </View>
    );
  })}
</View>
    </View>
  </View>
);};

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Expenses</Text>
      <Text style={styles.subHeader}>
        {expenses.length} total
      </Text>

<View style={{ flex: 1 }}>

<FlatList
  data={expenses}
  keyExtractor={item => item.id}
  renderItem={renderExpense}
  contentContainerStyle={{ paddingBottom: 100 }}
  onScrollBeginDrag={() => setActiveMenuId(null)}
/>



</View>

      {/* -------- Edit Modal -------- */}
    <Modal visible={showEditModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.editCard}>

      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Edit Expense</Text>
        <Pressable onPress={() => setShowEditModal(false)}>
          <Icon name="x" size={20} color="#6A7282" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={editDescription}
          onChangeText={setEditDescription}
          style={styles.input}
        />

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="numeric"
            style={styles.amountInput}
          />
        </View>

        {/* Split Selector */}
        <Text style={styles.label}>Split</Text>
        <View style={styles.splitRow}>
          {['equal', 'exact', 'percentage'].map(type => (
            <Pressable
              key={type}
              onPress={() => setSplitType(type as any)}
              style={[
                styles.splitButton,
                splitType === type && styles.activeSplitButton
              ]}
            >
              <Text
                style={[
                  styles.splitButtonText,
                  splitType === type && styles.activeSplitText
                ]}
              >
                {type === 'equal' ? 'Equal' : type === 'exact' ? 'Exact' : '%'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Exact Split */}
        {splitType === 'exact' && selectedExpense && (
          <View style={styles.splitContainer}>
            {selectedExpense.splits.map(split => {
              const member =
                split.userId === selectedExpense.paidBy.id
                  ? selectedExpense.paidBy
                  : groups
                      .find(g => g.id === selectedExpense.groupId)
                      ?.members.find(m => m.id === split.userId);

              if (!member) return null;

              return (
                <View key={split.userId} style={styles.splitInputRow}>
                  <Text>{member.name}</Text>
                  <View style={styles.smallAmountContainer}>
                    <Text>$</Text>
                    <TextInput
                      value={exactAmounts[split.userId]}
                      onChangeText={val =>
                        setExactAmounts({
                          ...exactAmounts,
                          [split.userId]: val,
                        })
                      }
                      keyboardType="numeric"
                      style={styles.smallAmountInput}
                    />
                  </View>
                </View>
              );
            })}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text>Total:</Text>
              <Text style={{ fontWeight: '600', color: '#009966' }}>
                $
                {Object.values(exactAmounts)
                  .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                  .toFixed(2)}
                {' / $'}
                {editAmount}
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Buttons */}
      <View style={styles.modalActions}>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => setShowEditModal(false)}
        >
          <Text style={{ fontWeight: '600' }}>Cancel</Text>
        </Pressable>

        <Pressable style={styles.saveBtn} onPress={confirmEdit}>
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Save Changes
          </Text>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>


      {/* -------- Delete Modal -------- */}
     <Modal visible={showDeleteModal} transparent animationType="fade">
  <View style={styles.deleteOverlay}>
    <View style={styles.deleteCard}>

      {/* Icon */}
      <View style={styles.deleteIconWrapper}>
        <Icon name="trash-2" size={24} color="#FF2056" />
      </View>

      {/* Title */}
      <Text style={styles.deleteTitle}>Delete Expense?</Text>

      {/* Message */}
      <Text style={styles.deleteMessage}>
        Are you sure you want to delete "{selectedExpense?.description}"?
        {"\n"}This action cannot be undone.
      </Text>

      {/* Buttons */}
      <View style={styles.deleteActions}>
        <Pressable
          style={styles.cancelDeleteBtn}
          onPress={() => setShowDeleteModal(false)}
        >
          <Text style={styles.cancelDeleteText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={styles.confirmDeleteBtn}
          onPress={confirmDelete}
        >
          <Text style={styles.confirmDeleteText}>Delete</Text>
        </Pressable>
      </View>

    </View>
  </View>
</Modal>
</View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
  },
  subHeader: {
    fontSize: 14,
    color: '#6A7282',
    marginBottom: 20,
  },
card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 18,
  marginBottom: 16,

  shadowColor: '#000',
  shadowOpacity: 0.08,
  elevation: 1,
  overflow: 'visible', 
},
title: {
  fontSize: 16,
  fontWeight: '600',
  color: '#101828',
},
amountRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

amount: {
  fontSize: 17,
  fontWeight: '700',
  color: '#101828',
  marginRight: 8,
},
menuButton: {
  padding: 4,
},

meta: {
  fontSize: 13,
  color: '#6A7282',
  marginTop: 6,
},
metaLight: {
  fontSize: 13,
  color: '#98A2B3',
},

paidRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
  flexWrap: 'wrap',
},
owedText: {
  color: '#12B76A',
  fontWeight: '600',
},

oweText: {
  color: '#F04438',
  fontWeight: '600',
},

divider: {
  height: 1,
  backgroundColor: '#F2F4F7',
  marginVertical: 12,
},
splitRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
},

splitPill: {
  backgroundColor: '#F2F4F7',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 20,
  marginLeft: 8,
},

splitText: {
  fontSize: 12,
  color: '#344054',
},
  metaSmall: {
    fontSize: 12,
    color: '#99A1AF',
  },
  bold: {
    fontWeight: '600',
  },
  owed: {
    color: '#009966',
    marginTop: 6,
    fontWeight: '600',
  },
  owe: {
    color: '#FF2056',
    marginTop: 6,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  menu: {
    fontSize: 20,
  },
  dropdownItem: {
    paddingVertical: 6,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancel: {
    color: '#6A7282',
    fontWeight: '600',
  },
  save: {
    color: '#009966',
    fontWeight: '700',
  },
  delete: {
    color: '#FF2056',
    fontWeight: '300',
    fontFamily: 'Inter',
  },

dropdown: {
  position: 'absolute',
  top: 28,
  right: 0,
  width: 180,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  paddingVertical: 8,
  zIndex: 1000,
  elevation: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
},

menuItem: {
  paddingVertical: 12,
  paddingHorizontal: 16,
},

menuText: {
  fontSize: 14,
  fontWeight: '400',
  color: '#101828',
},

topRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

amountContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

menuRowItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

menuIcon: {
  width: 16,
  height: 16,
},

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  padding: 20,
},

editCard: {
  backgroundColor: '#FFF',
  borderRadius: 24,
  padding: 20,
  maxHeight: '85%',
},

modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},

label: {
  marginBottom: 6,
  fontWeight: '500',
  marginTop: 15,
},

amountInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  paddingHorizontal: 12,
},

dollar: {
  marginRight: 4,
},

amountInput: {
  flex: 1,
  paddingVertical: 10,
},

splitButton: {
  flex: 1,
  paddingVertical: 10,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  alignItems: 'center',
  marginHorizontal: 4,
},

activeSplitButton: {
  borderColor: '#009966',
  backgroundColor: '#E6F4EC',
},

splitButtonText: {
  color: '#6A7282',
},

activeSplitText: {
  color: '#009966',
  fontWeight: '600',
},

splitContainer: {
  marginTop: 15,
  backgroundColor: '#F9FAFB',
  borderRadius: 16,
  padding: 15,
},

splitInputRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},

smallAmountContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 10,
  paddingHorizontal: 8,
},

smallAmountInput: {
  width: 50,
  paddingVertical: 4,
},

totalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},

modalActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
},

cancelBtn: {
  flex: 1,
  backgroundColor: '#E5E7EB',
  padding: 14,
  borderRadius: 16,
  alignItems: 'center',
  marginRight: 10,
},

saveBtn: {
  flex: 1,
  backgroundColor: '#009966',
  padding: 14,
  borderRadius: 16,
  alignItems: 'center',
},

deleteOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},

deleteCard: {
  width: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: 28,
  paddingVertical: 30,
  paddingHorizontal: 25,
  alignItems: 'center',

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 25,
  elevation: 10,
},

deleteIconWrapper: {
  width: 48,
  height: 48,
  borderRadius: 35,
  backgroundColor: '#FFF5F7',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
},

deleteTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#101828',
  marginBottom: 10,
},

deleteMessage: {
  fontSize: 14,
  color: '#6A7282',
  textAlign: 'center',
  lineHeight: 20,
  marginBottom: 25,
},

deleteActions: {
  flexDirection: 'row',
  width: '100%',
  justifyContent: 'space-between',
},

cancelDeleteBtn: {
  flex: 1,
  backgroundColor: '#E5E7EB',
  paddingVertical: 14,
  borderRadius: 16,
  alignItems: 'center',
  marginRight: 10,
},

confirmDeleteBtn: {
  flex: 1,
  backgroundColor: '#FF2056',
  paddingVertical: 14,
  borderRadius: 16,
  alignItems: 'center',
},

cancelDeleteText: {
  fontWeight: '800',
  color: '#101828',
  fontFamily: 'Inter',
  fontSize: 16,
},

confirmDeleteText: {
  fontWeight: '800',
  color: '#FFFFFF',
  fontFamily: 'Inter',
  fontSize: 16,
},


});
