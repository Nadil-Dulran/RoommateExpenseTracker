import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { categories, groups, currentUser } from '../../data/mockData';
import { User, Group, CategoryType } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../../types/navigation';


type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function AddExpenseScreen() {
 const navigation = useNavigation<DashboardNavigationProp>();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);


  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType>('food');
  const [selectedGroup, setSelectedGroup] =
    useState<Group>(groups[0]);
  const [paidBy, setPaidBy] =
    useState<User>(currentUser);
  const [splitType, setSplitType] =
    useState<'equal' | 'exact' | 'percentage'>('equal');

  const [exactAmounts, setExactAmounts] =
    useState<Record<string, string>>({});

  const [percentages, setPercentages] =
    useState<Record<string, string>>({});

  // Equal split
  const splitAmount = useMemo(() => {
    if (!amount) return '0.00';
    return (
      parseFloat(amount) /
      selectedGroup.members.length
    ).toFixed(2);
  }, [amount, selectedGroup]);

  // Exact total
  const exactTotal = useMemo(() => {
    return Object.values(exactAmounts)
      .reduce((sum, val) =>
        sum + (parseFloat(val) || 0), 0);
  }, [exactAmounts]);

  // Percentage total
  const percentageTotal = useMemo(() => {
    return Object.values(percentages)
      .reduce((sum, val) =>
        sum + (parseFloat(val) || 0), 0);
  }, [percentages]);

  const getPercentageAmount = (p: string) => {
    if (!amount || !p) return '0.00';
    return (
      (parseFloat(amount) * parseFloat(p)) / 100
    ).toFixed(2);
  };


  return (
    <View style={styles.container}>

               {/* Header */}
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Add Expense</Text>
                  </View>
                  <TouchableOpacity
                              style={styles.backButton}
                              onPress={() => navigation.navigate('Home')}
                            >
                              <Icon name="x" size={25} color="#958f8f" />
                            </TouchableOpacity>
                  </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={true}
      >

        {/* Amount */}
        <Text style={styles.firstlable}>Amount</Text>

        <View style={styles.amountInput}>
          <Icon name="dollar-sign" size={28} color="#6A7282" />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#99A1AF"
            style={styles.amountText}
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What was this for?"
          style={styles.input}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {Object.entries(categories).map(([key, cat]) => (
            <TouchableOpacity
              key={key}
              onPress={() =>
                setSelectedCategory(key as CategoryType)
              }
              style={[
                styles.categoryItem,
                selectedCategory === key &&
                  styles.selectedCategory,
              ]}
            >
              <Text style={{ fontSize: 26 }}>
                {cat.icon}
              </Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === key && {
                    color: '#009966',
                  },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Group */}
        <Text style={styles.label}>Group</Text>
        {groups.map(group => (
          <TouchableOpacity
            key={group.id}
            onPress={() => setSelectedGroup(group)}
            style={[
              styles.groupCard,
              selectedGroup.id === group.id &&
                styles.selectedGroupCard,
            ]}
          >
            <Text style={styles.groupEmoji}>
              {group.emoji}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>
                {group.name}
              </Text>
              <Text style={styles.groupMembers}>
                {group.members.length} members
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Select Date */}

        <Text style={styles.label}>Date</Text>

<View style={styles.dateContainer}>
  
  <View style={styles.dateLeft}>
    <Icon name="calendar" size={20} color="#6A7282" />
    <Text style={styles.dateText}>
      {selectedDate.toISOString().split('T')[0]}
    </Text>
  </View>

  <TouchableOpacity onPress={() => setShowPicker(true)}>
    <Icon name="calendar" size={19} color="#101828" />
  </TouchableOpacity>

</View>

{showPicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowPicker(false);
      if (date) setSelectedDate(date);
    }}
  />
)}
 
        {/* Paid By */}
        <Text style={styles.label}>Paid By</Text>
        {selectedGroup.members.map(member => (
          <TouchableOpacity
            key={member.id}
            onPress={() => setPaidBy(member)}
            style={[
              styles.paidItem,
              paidBy.id === member.id &&
                styles.selectedGroupCard,
            ]}
          >
            <Image
              source={member.avatar}
              style={styles.avatar}
            />
            <Text style={styles.memberName}>
              {member.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Split Type */}
        <Text style={styles.label}>Split</Text>
        <View style={styles.splitRow}>
          {['equal', 'exact', 'percentage'].map(type => (
            <TouchableOpacity
              key={type}
              onPress={() =>
                setSplitType(
                  type as 'equal' | 'exact' | 'percentage'
                )
              }
              style={[
                styles.splitBtn,
                splitType === type &&
                  styles.selectedSplit,
              ]}
            >
              <Text
                style={[
                  styles.splitText,
                  splitType === type && {
                    color: '#009966',
                  },
                ]}
              >
                {type === 'percentage'
                  ? '%'
                  : type.charAt(0).toUpperCase() +
                    type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Equal */}
        {splitType === 'equal' && (
          <View style={styles.splitBox}>
            {selectedGroup.members.map(m => (
              <View
                key={m.id}
                style={styles.splitRowItem}
              >
                <Text>{m.name}</Text>
                <Text>${splitAmount}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exact */}
        {splitType === 'exact' && (
          <View style={styles.splitBox}>
            {selectedGroup.members.map(m => (
              <View
                key={m.id}
                style={styles.splitRowItem}
              >
                <Text>{m.name}</Text>
                <TextInput
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.smallInput}
                  value={exactAmounts[m.id]}
                  onChangeText={val =>
                    setExactAmounts({
                      ...exactAmounts,
                      [m.id]: val,
                    })
                  }
                />
              </View>
            ))}

            <Text
              style={{
                marginTop: 10,
                color:
                  exactTotal ===
                  parseFloat(amount || '0')
                    ? '#009966'
                    : '#FF2056',
              }}
            >
              ${exactTotal.toFixed(2)} /
              ${amount || '0.00'}
            </Text>
          </View>
        )}

        {/* Percentage */}
        {splitType === 'percentage' && (
          <View style={styles.splitBox}>
            {selectedGroup.members.map(m => (
              <View
                key={m.id}
                style={styles.splitRowItem}
              >
                <Text>{m.name}</Text>
                <TextInput
                  placeholder="0"
                  keyboardType="decimal-pad"
                  style={styles.smallInput}
                  value={percentages[m.id]}
                  onChangeText={val =>
                    setPercentages({
                      ...percentages,
                      [m.id]: val,
                    })
                  }
                />
                <Text>
                  $
                  {getPercentageAmount(
                    percentages[m.id]
                  )}
                </Text>
              </View>
            ))}

            <Text
              style={{
                marginTop: 10,
                color:
                  percentageTotal === 100
                    ? '#009966'
                    : '#FF2056',
              }}
            >
              {percentageTotal.toFixed(1)}% / 100%
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          disabled={!amount || !description}
          style={[
            styles.submitBtn,
            (!amount || !description) && {
              backgroundColor: '#99A1AF',
            },
          ]}
        >
          <Text style={styles.submitText}>
            Add Expense
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

    header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
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

  selectedGroupCard: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  groupEmoji: { fontSize: 24, marginRight: 10 },
  groupName: { fontWeight: '600' },
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


});
