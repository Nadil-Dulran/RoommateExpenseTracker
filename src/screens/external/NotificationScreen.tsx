import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { notifications as initialNotifications, categories } from '../../data/mockData';
import { Notification } from '../../types/notification';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const renderItem = ({ item }: { item: Notification }) => {
    const category = item.expense
      ? categories[item.expense.category as keyof typeof categories]
      : null;

    const userShare = item.expense?.splits.find(
      (s: any) => s.userId === 'user1'
    );

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => markAsRead(item.id)}
        style={[
          styles.card,
          !item.read && styles.unreadCard,
        ]}
      >
        <View style={styles.row}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
            source={
            //  item.relatedUser?.avatar
              //   ? { uri: item.relatedUser.avatar }
                    //  : 
                      require('../../../assets/ProfileIcon.png') // fallback image
            }
  style={styles.avatar}
/>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    item.type === 'expense_added'
                      ? '#009966'
                      : '#10B981',
                },
              ]}
            >
              <Icon
                name={
                  item.type === 'expense_added'
                    ? 'dollar-sign'
                    : 'check-circle'
                }
                size={10}
                color="#fff"
              />
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.message}>
                <Text style={styles.bold}>
                   {item.relatedUser?.name ?? 'User'}
                </Text>{' '}
                <Text style={styles.light}>
                  {item.message}
                </Text>
              </Text>

              {!item.read && (
                <View style={styles.unreadDot} />
              )}
            </View>

            {/* Group Info */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {item.groupEmoji} {item.groupName}
              </Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.date}>
                {formatDate(item.date)}
              </Text>
            </View>

            {/* Amount */}
            {item.expense && userShare && (
              <View
                style={[
                  styles.amountPill,
                  item.type === 'expense_settled' &&
                    styles.settledPill,
                ]}
              >
                {category && (
                  <Text style={styles.categoryIcon}>
                    {category.icon}
                  </Text>
                )}

                <Text
                  style={[
                    styles.amountText,
                    item.type === 'expense_settled' &&
                      styles.settledText,
                  ]}
                >
                  ${userShare.amount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color="#6a7282" />
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAll}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>Notifications</Text>

        {unreadCount > 0 && (
          <Text style={styles.subtitle}>
            {unreadCount} unread notification
            {unreadCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* List */}
      <FlatList<Notification>
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
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
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
  },
  subtitle: {
    marginTop: 4,
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
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
});
