import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData, Message } from "@/context/DataContext";
import { useAuth, AppUser } from "@/context/AuthContext";
import { COLORS, ROLE_LABELS } from "@/constants/colors";
import { RoleBadge } from "@/components/RoleBadge";

export default function MessagesScreen() {
  const { messages, sendMessage, markMessageAsRead } = useData();
  const { users, currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const otherUsers = useMemo(() => users.filter(u => u.id !== currentUser?.id), [users, currentUser]);

  const conversation = useMemo(() => {
    if (!selectedUser || !currentUser) return [];
    return messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
      (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
    );
  }, [messages, selectedUser, currentUser]);

  useEffect(() => {
    if (selectedUser && conversation.length > 0) {
      const unread = conversation.filter(m => m.receiverId === currentUser?.id && !m.isRead);
      unread.forEach(m => markMessageAsRead(m.id));
    }
  }, [conversation, selectedUser]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return;
    const content = input.trim();
    setInput("");
    await sendMessage(selectedUser.id, content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderUserItem = ({ item }: { item: AppUser }) => {
    const unreadCount = messages.filter(m => m.senderId === item.id && m.receiverId === currentUser?.id && !m.isRead).length;
    const lastMsg = messages.filter(m => 
      (m.senderId === currentUser?.id && m.receiverId === item.id) ||
      (m.senderId === item.id && m.receiverId === currentUser?.id)
    ).pop();

    return (
      <TouchableOpacity 
        style={styles.userItem} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setSelectedUser(item);
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          {unreadCount > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unreadCount}</Text></View>}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{item.name}</Text>
            {lastMsg && <Text style={styles.timeText}>{new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
          </View>
          <View style={styles.userSub}>
            <Text style={styles.lastMsg} numberOfLines={1}>
              {lastMsg ? lastMsg.content : `Start a conversation with ${ROLE_LABELS[item.role]}`}
            </Text>
            <RoleBadge role={item.role} small />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (selectedUser) {
    return (
      <View style={styles.container}>
        <View style={[styles.chatHeader, { paddingTop: top + 8 }]}>
          <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.chatUserInfo}>
            <Text style={styles.chatUserName}>{selectedUser.name}</Text>
            <Text style={styles.chatUserRole}>{ROLE_LABELS[selectedUser.role]}</Text>
          </View>
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.secureText}>Secure</Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={conversation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser?.id;
            return (
              <View style={[styles.msgWrapper, isMe ? styles.msgMe : styles.msgOther]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>{item.content}</Text>
                  <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <View style={[styles.inputArea, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              style={styles.input}
              placeholder="Type a secure message..."
              placeholderTextColor={COLORS.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} 
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.secureBadge}>
          <Ionicons name="lock-closed" size={14} color={COLORS.gold} />
          <Text style={[styles.secureText, { color: COLORS.gold }]}>Internal Only</Text>
        </View>
      </View>

      <FlatList
        data={otherUsers}
        keyExtractor={item => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No other staff members found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.text },
  secureBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${COLORS.primary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  secureText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: COLORS.primary, textTransform: "uppercase" },
  userItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: `${COLORS.primary}20`, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.primary },
  unreadBadge: { position: "absolute", top: -4, right: -4, backgroundColor: COLORS.danger, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.bg },
  unreadText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  userHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: COLORS.text },
  timeText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  userSub: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastMsg: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary, flex: 1, marginRight: 8 },
  empty: { alignItems: "center", marginTop: 100, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", color: COLORS.textMuted, fontSize: 15 },

  chatHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  backBtn: { padding: 4 },
  chatUserInfo: { flex: 1 },
  chatUserName: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.text },
  chatUserRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  chatList: { padding: 16, gap: 12 },
  msgWrapper: { flexDirection: "row", width: "100%" },
  msgMe: { justifyContent: "flex-end" },
  msgOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  msgText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  msgTextMe: { color: "#fff" },
  msgTextOther: { color: COLORS.text },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  msgTimeMe: { color: "rgba(255,255,255,0.7)" },
  msgTimeOther: { color: COLORS.textMuted },
  inputArea: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  input: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
});