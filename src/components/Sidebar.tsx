import { clearUserProfile } from '@/services/slices/user/userSlice';
import { UserProfile } from '@/types/user.types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

// Define navigation params
type RootStackParamList = {
    Login: undefined;
    UserHome: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SidebarProps = {
    user: UserProfile | null;
    onClose: () => void;
    isOpen: boolean;
};

const Sidebar = ({ user, onClose, isOpen }: SidebarProps) => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    const screenWidth = Dimensions.get('window').width;
    const translateX = useRef(new Animated.Value(-screenWidth)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.timing(translateX, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(translateX, {
                toValue: -screenWidth,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isOpen, screenWidth]);

    const handleLogout = () => {
        dispatch(clearUserProfile());
        // Navigate to login screen
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    if (!isOpen) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateX }],
                    width: screenWidth * 0.8,
                },
            ]}
        >
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text style={styles.userEmail}>
                            {user?.email}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?.streak || 0}</Text>
                        <Text style={styles.statLabel}>🔥 Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?.xp || 0}</Text>
                        <Text style={styles.statLabel}>⭐ XP</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?.userLevel || 1}</Text>
                        <Text style={styles.statLabel}>📊 Level</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?.lives || 5}</Text>
                        <Text style={styles.statLabel}>❤️ Lives</Text>
                    </View>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                        navigation.navigate('UserHome');
                        onClose();
                    }}
                >
                    <View style={[styles.menuIcon, styles.homeIcon]}>
                        <Text style={styles.iconText}>🏠</Text>
                    </View>
                    <Text style={styles.menuText}>Học</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => { onClose(); }}
                >
                    <View style={[styles.menuIcon, styles.rankingIcon]}>
                        <Text style={styles.iconText}>🏆</Text>
                    </View>
                    <Text style={styles.menuText}>Bảng xếp hạng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => { onClose(); }}
                >
                    <View style={[styles.menuIcon, styles.supportIcon]}>
                        <Text style={styles.iconText}>📝</Text>
                    </View>
                    <Text style={styles.menuText}>Hỗ trợ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => { onClose(); }}
                >
                    <View style={[styles.menuIcon, styles.settingsIcon]}>
                        <Text style={styles.iconText}>⚙️</Text>
                    </View>
                    <Text style={styles.menuText}>Cài đặt</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleLogout}
                >
                    <View style={[styles.menuIcon, styles.logoutIcon]}>
                        <Text style={styles.iconText}>🚪</Text>
                    </View>
                    <Text style={[styles.menuText, styles.logoutText]}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        padding: 20,
        backgroundColor: '#0073e6', // Primary color
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e6f7ff', // Secondary light
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0073e6', // Primary color
    },
    userInfo: {
        marginLeft: 15,
    },
    userName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userEmail: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
    menuContainer: {
        padding: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 5,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeIcon: {
        backgroundColor: '#e6f2ff', // Primary light
    },
    rankingIcon: {
        backgroundColor: '#fff8e6', // Amber light
    },
    supportIcon: {
        backgroundColor: '#e6f7ff', // Blue light
    },
    settingsIcon: {
        backgroundColor: '#f5f5f5', // Gray light
    },
    logoutIcon: {
        backgroundColor: '#ffe6e6', // Red light
    },
    iconText: {
        fontSize: 20,
    },
    menuText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    logoutText: {
        color: '#ff0000', // Red color
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 15,
    },
});

export default Sidebar; 