import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SidebarOverlay from '@/components/SidebarOverlay';
import { fetchLeaderboard } from '@/services/slices/leaderboard/leaderboardSlice';
import { fetchUserProfile } from '@/services/slices/user/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { LeaderboardEntry } from '@/types/user.types';
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

        return (
            <View key={entry._id} style={[styles.leaderboardItem, isTopThree && styles.topThreeItem]}>
                <View style={styles.rankContainer}>
                    <Text style={[styles.rankText, { color: rankColor }]}>
                        {rankIcon}
                    </Text>
                </View>

                <View style={styles.userInfoContainer}>
                    <Image
                        source={{ uri: entry.avatar }}
                        style={styles.avatar}
                        defaultSource={{ uri: 'https://via.placeholder.com/48x48/6B7280/FFFFFF?text=U' }}
                    />
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                            {entry.firstName} {entry.lastName}
                        </Text>
                        <Text style={styles.userEmail}>
                            {entry.email}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Điểm</Text>
                        <Text style={[styles.statValue, { color: rankColor }]}>
                            {entry.totalScore.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Bài học</Text>
                        <Text style={styles.statValue}>
                            {entry.completedLessons}
                        </Text>
                    </View>
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
                                {entries.slice(0, 3).map((entry, index) =>
                                    renderLeaderboardItem(entry, index)
                                )}
                            </View>
                        )}

                        {/* Rest of the leaderboard */}
                        {entries.slice(3).length > 0 && (
                            <View style={styles.restSection}>
                                <Text style={styles.sectionTitle}>Các vị trí khác</Text>
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
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    statsContainer: {
        alignItems: 'flex-end',
    },
    statItem: {
        alignItems: 'center',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
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