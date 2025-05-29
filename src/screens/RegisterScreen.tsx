import { registerUser } from '@/services/slices/auth/authSlice';
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
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RegisterScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            return;
        }
        try {
            await dispatch(registerUser(formData)).unwrap();
            navigation.navigate('Login');
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
                <View style={styles.formWrapper}>
                    <Text style={[styles.header, { fontFamily: 'Baloo2-Bold' }]}>Tạo tài khoản</Text>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="First Name"
                            value={formData.firstName}
                            onChangeText={text => handleChange('firstName', text)}
                            placeholderTextColor="#888"
                            editable={!loading}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChangeText={text => handleChange('lastName', text)}
                            placeholderTextColor="#888"
                            editable={!loading}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={formData.email}
                            onChangeText={text => handleChange('email', text)}
                            placeholderTextColor="#888"
                            editable={!loading}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputWrapperRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Mật khẩu"
                            value={formData.password}
                            onChangeText={text => handleChange('password', text)}
                            placeholderTextColor="#888"
                            editable={!loading}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={togglePasswordVisibility} disabled={loading}>
                            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.registerButtonText, { fontFamily: 'Baloo2-Bold' }]}>Đăng ký</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                        disabled={loading}
                    >
                        <Text style={[styles.loginButtonText, { fontFamily: 'Baloo2-Bold' }]}>Đăng nhập</Text>
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
    eyeIcon: {
        fontSize: 22,
        marginLeft: 8,
        color: '#6b7280',
    },
    registerButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        borderBottomWidth: 4,
        borderBottomColor: '#2563eb',
    },
    registerButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#3B82F6',
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 12,
        borderBottomWidth: 3,
        borderBottomColor: '#60a5fa',
    },
    loginButtonText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 