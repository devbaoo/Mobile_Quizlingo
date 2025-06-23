import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SidebarOverlay from '@/components/SidebarOverlay';
import { fetchLeaderboard } from '@/services/slices/leaderboard/leaderboardSlice';
import { fetchUserProfile } from '@/services/slices/user/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { LeaderboardEntry } from '@/types/user.types';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

type RootStackParamList = {
    Leaderboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LeaderboardScreen = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavigationProp>();
    const { entries, loading } = useSelector((state: RootState) => state.leaderboard);
    const { profile } = useSelector((state: RootState) => state.user);
    const [refreshing, setRefreshing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarOpacity = useRef(new Animated.Value(0)).current;

    // Load data on initial mount
    useEffect(() => {
        loadLeaderboard();
        loadUserData();
    }, []);

    // Refresh data when returning to this screen
    useFocusEffect(
        useCallback(() => {
            loadLeaderboard();
            return () => { };
        }, [])
    );

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

    const loadUserData = async () => {
        try {
            await dispatch(fetchUserProfile()).unwrap();
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    };

    const loadLeaderboard = async () => {
        try {
            await dispatch(fetchLeaderboard()).unwrap();
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([loadLeaderboard(), loadUserData()]);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return '🥇';
            case 1:
                return '🥈';
            case 2:
                return '🥉';
            default:
                return `${index + 1}`;
        }
    };

    const getRankColor = (index: number) => {
        switch (index) {
            case 0:
                return '#FFD700'; // Gold
            case 1:
                return '#C0C0C0'; // Silver
            case 2:
                return '#CD7F32'; // Bronze
            default:
                return '#6B7280'; // Gray
        }
    };

    const renderLeaderboardItem = (entry: LeaderboardEntry, index: number) => {
        const rankIcon = getRankIcon(index);
        const rankColor = getRankColor(index);
        const isTopThree = index < 3;
        const isCurrentUser = profile && entry.email === profile.email;

        return (
            <View
                key={entry._id}
                style={[
                    styles.leaderboardItem,
                    !isTopThree && {
                        backgroundColor: isCurrentUser ? '#dbeafe' : '#f1f5f9',
                        borderRadius: 16,
                        marginBottom: 12,
                    },
                    isTopThree && styles.topThreeItem,
                    isCurrentUser && { borderWidth: 2, borderColor: '#3B82F6' }
                ]}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={[styles.rankText, { marginRight: 10 }]}>{rankIcon}</Text>
                    {entry.avatar ? (
                        <Image
                            source={{ uri: entry.avatar }}
                            style={[styles.avatar, { marginRight: 8 }]}
                        />
                    ) : (
                        <View
                            style={{
                                width: 35,
                                height: 35,
                                borderRadius: 25,
                                backgroundColor: '#3B82F6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 8,
                            }}
                        >
                            <MaterialIcons name="person" size={28} color="#fff" />
                        </View>
                    )}
                    <Text style={[styles.userName, { marginLeft: 0 }]}>{entry.firstName} {entry.lastName}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                    <Text style={{ color: rankColor, fontWeight: 'bold' }}>Điểm: {entry.totalScore} ★</Text>
                    <Text style={{ color: '#1e293b', fontWeight: 'bold' }}>Bài học: {entry.completedLessons}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            {/* Header */}
            <Header
                user={profile}
                onProfilePress={toggleSidebar}
            />

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
            >
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Đang tải bảng xếp hạng...</Text>
                    </View>
                ) : entries.length > 0 ? (
                    <View style={styles.leaderboardContainer}>
                        {/* Top 3 Section */}
                        {entries.slice(0, 3).length > 0 && (
                            <View style={styles.topThreeSection}>
                                <View style={styles.sectionTitleContainer}>
                                    <Text style={styles.sectionTitleIcon}>🏆</Text>
                                    <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 20,
                                        marginBottom: 20,
                                        paddingVertical: 24,
                                        paddingHorizontal: 8,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.06,
                                        shadowRadius: 8,
                                        elevation: 3,
                                        position: 'relative',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 4 }}>
                                        {/* Top 2 - Left */}
                                        {entries[1] && (
                                            <View style={{ alignItems: 'center', flex: 1, backgroundColor: '#E3EAFD', borderRadius: 16, marginHorizontal: 4, paddingVertical: 10 }}>
                                                <View style={{ position: 'relative', marginBottom: 6 }}>
                                                    <Image source={{ uri: entries[1].avatar }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#C0C0C0', backgroundColor: '#fff' }} />
                                                    <Text style={{ position: 'absolute', top: -18, left: 18, fontSize: 20 }}>👑</Text>
                                                </View>
                                                <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 14, textAlign: 'center' }}>{entries[1].firstName} {entries[1].lastName}</Text>
                                                <Text style={{ color: '#C0C0C0', fontWeight: 'bold' }}>Điểm: {entries[1].totalScore} ★</Text>
                                                <Text style={{ color: '#1e293b', fontWeight: 'bold' }}>Bài học: {entries[1].completedLessons}</Text>
                                            </View>
                                        )}
                                        {/* Top 1 - Center */}
                                        {entries[0] && (
                                            <View style={{ alignItems: 'center', flex: 1, backgroundColor: '#FFF3B0', borderRadius: 16, marginHorizontal: 4, paddingVertical: 10 }}>
                                                <View style={{ position: 'relative', marginBottom: 6 }}>
                                                    <Image source={{ uri: entries[0].avatar }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFD700', backgroundColor: '#fff' }} />
                                                    <Text style={{ position: 'absolute', top: -22, left: 28, fontSize: 24 }}>👑</Text>
                                                </View>
                                                <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 16, textAlign: 'center' }}>{entries[0].firstName} {entries[0].lastName}</Text>
                                                <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Điểm: {entries[0].totalScore} ★</Text>
                                                <Text style={{ color: '#1e293b', fontWeight: 'bold' }}>Bài học: {entries[0].completedLessons}</Text>
                                            </View>
                                        )}
                                        {/* Top 3 - Right */}
                                        {entries[2] && (
                                            <View style={{ alignItems: 'center', flex: 1, backgroundColor: '#F5E3D3', borderRadius: 16, marginHorizontal: 4, paddingVertical: 10 }}>
                                                <View style={{ position: 'relative', marginBottom: 6 }}>
                                                    <Image source={{ uri: entries[2].avatar }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#CD7F32', backgroundColor: '#fff' }} />
                                                    <Text style={{ position: 'absolute', top: -18, left: 18, fontSize: 20 }}>👑</Text>
                                                </View>
                                                <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 14, textAlign: 'center' }}>{entries[2].firstName} {entries[2].lastName}</Text>
                                                <Text style={{ color: '#CD7F32', fontWeight: 'bold' }}>Điểm: {entries[2].totalScore} ★</Text>
                                                <Text style={{ color: '#1e293b', fontWeight: 'bold' }}>Bài học: {entries[2].completedLessons}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Rest of the leaderboard */}
                        {entries.slice(3).length > 0 && (
                            <View style={styles.restSection}>
                                {entries.slice(3).map((entry, index) =>
                                    renderLeaderboardItem(entry, index + 3)
                                )}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
                        <Text style={styles.emptySubtitle}>
                            Bảng xếp hạng sẽ được cập nhật khi có người dùng hoàn thành bài học
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Sidebar and Overlay */}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    leaderboardContainer: {
        padding: 20,
    },
    topThreeSection: {
        marginBottom: 24,
    },
    restSection: {
        marginBottom: 24,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    sectionTitleIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    topThreeItem: {
        borderWidth: 2,
        borderColor: '#FCD34D',
        backgroundColor: '#FFFBEB',
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 24,
        fontWeight: '700',
    },
    userInfoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default LeaderboardScreen; 