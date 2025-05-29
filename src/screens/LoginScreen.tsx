import { loginUser } from '@/services/slices/auth/authSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

type RootStackParamList = {
    Register: undefined;
    Login: undefined;
    ForgotPassword: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    const handleChange = (name: string, value: string) => {
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async () => {
        if (!credentials.email || !credentials.password) {
            return;
        }
        try {
            await dispatch(loginUser(credentials)).unwrap();
            // Navigation will be handled by the auth state change
        } catch (error) {
            // Error is handled by the auth slice
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Đang xử lý...</Text>
                    </View>
                )}
                <View style={styles.formWrapper}>
                    <Text style={[styles.header, { fontFamily: 'Baloo2-Bold' }]}>Đăng nhập</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={credentials.email}
                            onChangeText={text => handleChange('email', text)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#888"
                            editable={!loading}
                        />
                    </View>
                    <View style={styles.inputWrapperRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Mật khẩu"
                            value={credentials.password}
                            onChangeText={text => handleChange('password', text)}
                            secureTextEntry
                            placeholderTextColor="#888"
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ForgotPassword')}
                            disabled={loading}
                        >
                            <Text style={[styles.forgotText, { fontFamily: 'Baloo2-Regular' }]}>Quên mật khẩu?</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={[styles.loginButtonText, { fontFamily: 'Baloo2-Bold' }]}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</Text>
                    </TouchableOpacity>

                    <View style={styles.orRow}>
                        <View style={styles.hr} />
                        <Text style={[styles.orText, { fontFamily: 'Baloo2-Regular' }]}>OR</Text>
                        <View style={styles.hr} />
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialButton} disabled={loading}>
                            <Text style={[styles.socialButtonText, { fontFamily: 'Baloo2-Bold', color: '#1d4ed8' }]}>FACEBOOK</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton} disabled={loading}>
                            <Text style={[styles.socialButtonText, { fontFamily: 'Baloo2-Bold', color: '#3B82F6' }]}>GOOGLE</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.termsWrapper}>
                        <Text style={[styles.termsText, { fontFamily: 'Baloo2-Regular' }]}>
                            Bằng việc đăng nhập Quizlingo, bạn đồng ý với{' '}
                            <Text style={[styles.termsLink, { fontFamily: 'Baloo2-Regular' }]}>Terms</Text> và{' '}
                            <Text style={[styles.termsLink, { fontFamily: 'Baloo2-Regular' }]}>Privacy Policy</Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => navigation.navigate('Register')}
                        disabled={loading}
                    >
                        <Text style={[styles.switchButtonText, { fontFamily: 'Baloo2-Bold' }]}>Đăng Ký</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        color: '#374151',
        fontWeight: 'bold',
    },
    formWrapper: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputWrapper: {
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        marginBottom: 12,
        paddingHorizontal: 12,
    },
    inputWrapperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        marginBottom: 12,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#222',
        fontWeight: '500',
    },
    forgotText: {
        fontSize: 13,
        color: '#9ca3af',
        fontWeight: '500',
        marginLeft: 8,
    },
    loginButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        borderBottomWidth: 4,
        borderBottomColor: '#2563eb',
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    orRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    hr: {
        flex: 1,
        height: 1,
        backgroundColor: '#d1d5db',
    },
    orText: {
        marginHorizontal: 12,
        color: '#9ca3af',
        fontWeight: '600',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    socialButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        marginHorizontal: 2,
    },
    socialButtonText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    termsWrapper: {
        marginTop: 16,
        marginBottom: 8,
    },
    termsText: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
    },
    termsLink: {
        color: '#6b7280',
        fontWeight: '500',
    },
    switchButton: {
        marginTop: 8,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#d1d5db',
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    switchButtonText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 