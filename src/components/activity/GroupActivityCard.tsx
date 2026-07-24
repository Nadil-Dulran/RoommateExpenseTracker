import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TimelineEntry } from '../../types/activity';

type Props = {
    entry: TimelineEntry;
};

export default function GroupActivityCard({
    entry,
}: Props) {  
        if (!entry.group) {
          return null;
        }

        const memberCount = entry.group.members.length;
    
        return (
          <View key={entry.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{entry.group.emoji}</Text>
                </View>
    
                <View>
                  <Text style={styles.expenseTitle}>{entry.group.name}</Text>
                  <Text style={styles.groupText}>New group created</Text>
                  <Text style={styles.subText}>
                    {memberCount} {memberCount === 1 ? 'member' : 'members'} joined
                  </Text>
                </View>
              </View>
    
              <Text style={styles.amount}>New</Text>
            </View>
          </View>
        );
      };


const styles = StyleSheet.create({
 card: {
   backgroundColor: '#fff',
   padding: 14,
   borderRadius: 12,
   marginBottom: 12,
   shadowColor: '#000',
   shadowOpacity: 0.05, 
   shadowRadius: 8,
   elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settlementIconBox: {
    backgroundColor: '#ecfdf3',
  },
  icon: {
    fontSize: 20,
  },
  expenseTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#101828',
  },
  groupText: {
    fontSize: 12,
    color: '#99a1af',
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    color: '#6a7282',
    marginTop: 2,
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
    color: '#101828',
  },
});