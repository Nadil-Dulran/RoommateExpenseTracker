import React from 'react';
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
import { Notification } from '../../types/notification';
import { useAppCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';

const toImageUri = (value?: string | null, mimeType = 'image/jpeg') => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('data:image')
  ) {
    return normalized;
  }

  const compact = normalized.replace(/\s/g, '');
  return `data:${mimeType};base64,${compact}`;
};

const stripExpenseTag = (value?: string | null) => {
  const text = String(value ?? '');
  return text
    .replace(/\[expense:[^\]]+\]\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const { formatCurrency } = useAppCurrency();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const unreadCount = notifications.filter(item => !item.read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserShareAmount = (item: Notification) => {
    const directAmount = item.data?.amount ?? item.data?.userShareAmount ?? item.data?.user_share_amount;
    if (directAmount != null) {
      const parsed = Number(directAmount);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    const directShare = (item as any)?.userShareAmount ?? (item as any)?.user_share_amount;
    if (directShare != null) {
      const parsed = Number(directShare);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    const firstSplitAmount = item.expense?.splits?.[0]?.amount;
    if (firstSplitAmount != null) {
      const parsed = Number(firstSplitAmount);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  };

  const getSettlementSummary = (item: Notification) => {
    if (item.type !== 'expense_settled') {
      return null;
    }

    const data = item.data ?? {};
    const notes = stripExpenseTag(
      data.settlement?.description ??
      data.settlementDescription ??
      data.expense?.description ??
      data.expenseDescription ??
      data.description ??
      ''
    );

    const method = String(
      data.settlement?.method ??
      data.method ??
      data.settlementMethod ??
      ''
    ).trim();

    const payerName = String(
      data.settlement?.payerName ??
      data.payerName ??
      data.fromUser?.name ??
      data.fromName ??
      item.relatedUser?.name ??
      ''
    ).trim();

    const receiverName = String(
      data.settlement?.receiverName ??
      data.receiverName ??
      data.toUser?.name ??
      data.toName ??
      ''
    ).trim();

    const pieces: string[] = [];

    if (notes) {
      pieces.push(notes);
    }

    if (payerName && receiverName) {
      pieces.push(`${payerName} → ${receiverName}`);
    } else if (payerName) {
      pieces.push(`By ${payerName}`);
    }

    if (method) {
      pieces.push(method.toUpperCase());
    }

    const summary = pieces.join(' • ').trim();
    return summary || null;
  };

  const renderItem = ({ item }: { item: Notification }) => {
    

    const avatarMimeType ='image/jpeg';

    const avatarUri = toImageUri(
      item.data?.relatedUser?.avatar_base64 ??
      null,
      avatarMimeType
    );

    const avatarSource =
      typeof avatarUri === 'string' && avatarUri.length > 0
        ? { uri: avatarUri }
        : require('../../../assets/ProfileIcon.png');

    const shareAmount = getUserShareAmount(item);
    const cleanMessage = stripExpenseTag(item.message);

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
          <View style={styles.avatarContainer}>
            <Image
              source={avatarSource}
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
                size={13}
                color="#fff"
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <View style={styles.messageBlock}>
                <Text style={styles.bold}>
                  {item.title ?? item.relatedUser?.name ?? 'Notification'}
                </Text>
                <Text style={styles.light}>
                  {cleanMessage || item.message}
                </Text>
              </View>

              {!item.read && (
                <View style={styles.unreadDot} />
              )}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {item.groupEmoji} {item.groupName}
              </Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.date}>
                {formatDate(item.date)}
              </Text>
            </View>

            {shareAmount != null && (
              <View
                style={[
                  styles.amountPill,
                  item.type === 'expense_settled' && styles.settledPill,
                ]}
              >
                

                <Text
                  style={[
                    styles.amountText,
                    item.type === 'expense_settled' && styles.settledText,
                  ]}
                >
                 <Text>Amount: </Text> {formatCurrency(shareAmount)}
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

      <FlatList<Notification>
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.centeredState}>
            <Text style={styles.emptyText}>No unread notifications</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
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
    marginBottom: 6,
  },
});
