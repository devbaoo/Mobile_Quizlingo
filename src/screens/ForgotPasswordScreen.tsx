import { forgotPassword } from '@/services/slices/auth/authSlice';
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

// Định nghĩa navigation
type RootStackParamList = {
    Register: undefined;
    Login: undefined;
    ForgotPassword: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ForgotPasswordScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const [email, setEmail] = useState('');

    const handleSubmit = async () => {
        if (!email) {
            return;
        }
        try {
            await dispatch(forgotPassword({ email })).unwrap();
            navigation.navigate('Login');
        } catch {
            //ok
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.backIcon}>{'←'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.headerLoginBtn}>
                        <Text style={[styles.headerLoginText, { fontFamily: 'Baloo2-Bold' }]}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.formWrapper}>
                    <Text style={[styles.header, { fontFamily: 'Baloo2-Bold' }]}>Quên mật khẩu</Text>
                    <Text style={[styles.desc, { fontFamily: 'Baloo2-Regular' }]}>Nhập email của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để đặt lại mật khẩu.</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { fontFamily: 'Baloo2-Regular' }]}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholderTextColor="#888"
                            editable={!loading}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.submitButtonText, { fontFamily: 'Baloo2-Bold' }]}>Gửi yêu cầu</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backToLoginBtn}>
                        <Text style={[styles.backToLoginText, { fontFamily: 'Baloo2-Regular' }]}>Quay lại đăng nhập</Text>
                    </TouchableOpacity>
                    <View style={styles.registerRow}>
                        <Text style={[styles.registerText, { fontFamily: 'Baloo2-Regular' }]}>Bạn chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={[styles.registerLink, { fontFamily: 'Baloo2-Bold' }]}>Đăng ký</Text>
                        </TouchableOpacity>
                    </View>
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        marginBottom: 12,
    },
    backIcon: {
        fontSize: 28,
        color: '#9ca3af',
        padding: 4,
    },
    headerLoginBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    headerLoginText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 16,
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
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    desc: {
        fontSize: 14,
        color: '#374151',
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
        width: '100%',
    },
    input: {
        height: 48,
        fontSize: 16,
        color: '#222',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        borderBottomWidth: 4,
        borderBottomColor: '#2563eb',
        width: '100%',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backToLoginBtn: {
        marginTop: 12,
        alignSelf: 'center',
    },
    backToLoginText: {
        color: '#3B82F6',
        fontSize: 15,
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
    },
    registerText: {
        color: '#9ca3af',
        fontSize: 13,
    },
    registerLink: {
        color: '#3B82F6',
        fontSize: 15,
        marginLeft: 2,
    },
}); 