import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SidebarOverlay from '@/components/SidebarOverlay';
import { fetchUserProfile, updateProfile, uploadAvatar } from "@/services/slices/user/userSlice";
import { RootState } from "@/services/store/store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome5";
import Animated from 'react-native/Libraries/Animated/Animated';
import { useDispatch, useSelector } from "react-redux";

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { profile, loading } = useSelector((state: RootState) => state.user);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState({ firstName: "", lastName: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchUserProfile() as any);
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setEditedName({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (isSidebarOpen) {
      Animated.timing(sidebarOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isSidebarOpen]);

  const handlePickAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: "photo" });
    if (result.assets && result.assets[0]) {
      const file = result.assets[0];
      if (file.fileSize && file.fileSize > 5 * 1024 * 1024) {
        Toast.show({ type: "error", text1: "Kích thước file không được vượt quá 5MB" });
        return;
      }
      const formData = new FormData();
      formData.append("avatar", {
        uri: file.uri,
        name: file.fileName,
        type: file.type,
      } as any);
      try {
        await dispatch(uploadAvatar(formData) as any).unwrap();
        await dispatch(fetchUserProfile() as any);
        Toast.show({ type: "success", text1: "Cập nhật ảnh đại diện thành công" });
      } catch {
        Toast.show({ type: "error", text1: "Cập nhật ảnh đại diện thất bại" });
      }
    }
  };

  const handleNameSave = async () => {
    try {
      await dispatch(updateProfile({
        firstName: editedName.firstName,
        lastName: editedName.lastName,
      }) as any).unwrap();
      await dispatch(fetchUserProfile() as any);
      Toast.show({ type: "success", text1: "Cập nhật tên thành công" });
      setIsEditingName(false);
    } catch {
      Toast.show({ type: "error", text1: "Cập nhật tên thất bại" });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header user={profile} onProfilePress={toggleSidebar} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner */}
        {profile.activePackage ? (
          <View style={[styles.banner, { backgroundColor: "#2563eb" }]}>
            <Icon name="crown" size={32} color="#fff" style={styles.bannerIcon} />
            <View>
              <Text style={styles.bannerTitle}>Gói Premium</Text>
              <Text style={styles.bannerText}>{profile.activePackage.name}</Text>
              <Text style={styles.bannerText}>
                Hiệu lực: {new Date(profile.activePackage.startDate).toLocaleDateString()} - {new Date(profile.activePackage.endDate).toLocaleDateString()}
              </Text>
              <Text style={styles.bannerText}>
                Còn lại: {profile.activePackage.daysRemaining} ngày {profile.activePackage.isExpiringSoon ? "(Sắp hết hạn!)" : ""}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.banner, { backgroundColor: "#6b7280" }]}>
            <Icon name="user" size={32} color="#fff" style={styles.bannerIcon} />
            <View>
              <Text style={styles.bannerTitle}>Member</Text>
              <Text style={styles.bannerText}>Tài khoản thường</Text>
              <Text style={styles.bannerText}>Nâng cấp lên Premium để nhận nhiều ưu đãi</Text>
            </View>
          </View>
        )}

        {/* Avatar + Name */}
        <TouchableOpacity onPress={handlePickAvatar}>
          <View style={styles.avatarWrapper}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <Icon name="user" size={64} color="#2563eb" />
            )}
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={20} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.avatarSection}>
          {isEditingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={styles.input}
                value={editedName.firstName}
                onChangeText={text => setEditedName(prev => ({ ...prev, firstName: text }))}
                placeholder="Tên"
              />
              <TextInput
                style={styles.input}
                value={editedName.lastName}
                onChangeText={text => setEditedName(prev => ({ ...prev, lastName: text }))}
                placeholder="Họ"
              />
              <Button title="Lưu" onPress={handleNameSave} />
              <Button title="Hủy" onPress={() => setIsEditingName(false)} />
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Icon name="edit" size={18} color="#2563eb" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          <InfoCard icon="medal" label="Cấp độ" value={profile.userLevel} color="#2563eb" />
          <InfoCard icon="star" label="XP" value={profile.xp} color="#fbbf24" />
          <InfoCard icon="heart" label="Lives" value={profile.lives} color="#ec4899" />
          <InfoCard icon="user-graduate" label="Trình độ" value={profile.level} color="#f97316" />
          <InfoCard icon="book" label="Từ vựng đã hoàn thành" value={profile.completedBasicVocab?.length || 0} color="#2563eb" />
          <InfoCard icon="bullseye" label="Kỹ năng ưu tiên" value={profile.preferredSkills?.join(", ") || "Chưa chọn"} color="#a21caf" />
        </View>
      </ScrollView>
      <SidebarOverlay
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        opacity={sidebarOpacity}
      />
      <Sidebar
        user={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </SafeAreaView>
  );
};

const InfoCard = ({ icon, label, value, color }: { icon: string, label: string, value: any, color: string }) => (
  <View style={[styles.card, { borderColor: color }]}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 16, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  banner: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, marginBottom: 24, width: "100%" },
  bannerIcon: { marginRight: 16 },
  bannerTitle: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  bannerText: { color: "#e0e7ef", fontSize: 14 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarWrapper: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: "#2563eb", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  cameraIcon: { position: "absolute", bottom: 8, right: 8, backgroundColor: "#2563eb", borderRadius: 16, padding: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  name: { fontSize: 22, fontWeight: "bold", color: "#222" },
  email: { fontSize: 16, color: "#666", marginTop: 4 },
  editNameRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 6, marginHorizontal: 4, minWidth: 80 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  card: { width: 140, borderWidth: 1, borderRadius: 12, alignItems: "center", padding: 12, margin: 6, backgroundColor: "#f9fafb" },
  cardLabel: { fontSize: 14, color: "#555", marginTop: 4 },
  cardValue: { fontSize: 16, fontWeight: "bold", color: "#222", marginTop: 2 },
});

export default ProfileScreen;