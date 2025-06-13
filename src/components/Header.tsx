import { User } from '@/types/user.types';
import React from 'react';
import {
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface HeaderProps {
    user: User | null;
    onProfilePress: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onProfilePress }) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.profileSection}
                onPress={onProfilePress}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {user?.firstName?.[0]}{user?.lastName?.[0] || '👤'}
                        </Text>
                    )}
                </View>
                <View>
                    <Text style={styles.userName} numberOfLines={1}>
                        {user?.firstName} {user?.lastName || 'Học viên'}
                    </Text>
                    <View style={styles.levelContainer}>
                        <Text style={styles.levelText}>Cấp {user?.userLevel || 1}</Text>
                        <View style={styles.xpContainer}>
                            <Text style={styles.xpText}>{user?.xp || 0} XP</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.streakContainer} activeOpacity={0.7}>
                <Text style={styles.streakIcon}>🔥</Text>
                <Text style={styles.streakText}>{user?.streak || 0}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DDF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#1CB0F6',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        resizeMode: 'cover',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0073e6',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4b4b4b',
        maxWidth: 120,
    },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    levelText: {
        fontSize: 14,
        color: '#777',
        marginRight: 8,
    },
    xpContainer: {
        backgroundColor: '#FFC800',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    xpText: {
        fontSize: 12,
        color: '#4b4b4b',
        fontWeight: 'bold',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFECEC',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FF4B4B',
        shadowColor: '#FF4B4B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    streakIcon: {
        fontSize: 18,
        marginRight: 4,
    },
    streakText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FF4B4B',
    },
});

export default Header; 