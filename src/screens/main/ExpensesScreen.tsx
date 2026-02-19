import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
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


  const handleEdit = (item: Expense) => {
  setActiveMenuId(null);
  setSelectedExpense(item);
  setEditDescription(item.description);
  setEditAmount(item.amount.toString());
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
      <View style={styles.topRow}>
  <Text style={styles.title}>{item.description}</Text>

  <View style={styles.amountContainer}>
    <Text style={styles.amount}>
      ${item.amount.toFixed(2)}
    </Text>

    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() =>
          setActiveMenuId(activeMenuId === item.id ? null : item.id)
        }
        style={styles.menuButton}
      >
        <Icon name="more-vertical" size={18} color="#6A7282" />
      </Pressable>

      {activeMenuId === item.id && (
        <View style={styles.dropdown} >
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
        </View>
      )}
    </View>
  </View>
</View>


      <Text style={styles.meta}>
        {group?.emoji} {group?.name} • {formatDate(item.date)}
      </Text>

      <View style={styles.row}>
        <Text style={styles.metaSmall}>Paid by </Text>
        <Text style={styles.bold}>{item.paidBy.name}</Text>
      </View>

      {isMyExpense && amountOwed > 0 && (
        <Text style={styles.owed}>
          You are owed ${amountOwed.toFixed(2)}
        </Text>
      )}

      {!isMyExpense && myShare && (
        <Text style={styles.owe}>
          You owe ${myShare.amount.toFixed(2)}
        </Text>
      )}

     
    </View>
  );
};

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
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Expense</Text>

            <TextInput
              placeholder="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              style={styles.input}
            />

            <TextInput
              placeholder="Amount"
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.rowBetween}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmEdit}>
                <Text style={styles.save}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* -------- Delete Modal -------- */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Delete this expense?
            </Text>

            <View style={styles.rowBetween}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmDelete}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
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
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 1,
    overflow: 'visible',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    color: '#6A7282',
    marginTop: 4,
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
  menuButton: {
  padding: 6,
},

dropdown: {
  position: 'absolute',
  top: 28,
  right: 0,
  width: 170,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  paddingVertical: 8,

  zIndex: 999,
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
  alignItems: 'flex-start',
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

});
