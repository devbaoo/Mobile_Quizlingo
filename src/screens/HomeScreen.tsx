import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RootStackParamList = {
    Register: undefined;
    Login: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <ScrollView style={styles.container}>
            {/* Main Section */}
            <View style={styles.mainSection}>
                <View style={styles.mainContent}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: 'https://media.giphy.com/media/5me0l9ZR8SpG0N1UxZ/giphy.gif' }}
                            style={styles.mainImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={[styles.mainTitle, { fontFamily: 'Baloo2-Regular' }]}>
                            Vừa học vừa chơi, ngoại ngữ lên đời!
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={[styles.primaryButtonText, { fontFamily: 'Baloo2-Regular' }]}>Bắt Đầu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={[styles.secondaryButtonText, { fontFamily: 'Baloo2-Regular' }]}>Tôi Đã Có Tài Khoản</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>


        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mainSection: {
        minHeight: Dimensions.get('window').height,
        padding: 16,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        marginBottom: 32,
    },
    mainImage: {
        width: 200,
        height: 200,
    },
    textContainer: {
        alignItems: 'center',
        width: '100%',
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 24,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#93C5FD',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    secondaryButtonText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 