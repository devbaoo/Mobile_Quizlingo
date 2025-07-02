import { checkPaymentStatus } from '@/services/slices/package/packageSlice';
import { AppDispatch } from '@/services/store/store';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

type RootStackParamList = {
    LessonQuiz: { lessonId: string };
    UserHome: undefined;
    Leaderboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PaymentResultScreen = () => {
    const route = useRoute();
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavigationProp>();
    const [status, setStatus] = useState<'success' | 'pending' | 'failed' | 'expired' | 'cancel' | 'loading'>('loading');
    const [orderCode, setOrderCode] = useState<string | null>(null);

    useEffect(() => {
        // Lấy orderCode từ params (hoặc deep link)
        const params = route.params as { orderCode?: string; cancel?: boolean };
        if (params?.orderCode) {
            setOrderCode(params.orderCode);
            dispatch(checkPaymentStatus(`PKG_${params.orderCode}`))
                .unwrap()
                .then((res: any) => {
                    switch (res.paymentStatus) {
                        case 'PAID':
                            setStatus('success');
                            setTimeout(() => {
                                navigation.navigate('UserHome');
                            }, 5000);
                            break;
                        case 'EXPIRED':
                            setStatus('expired');
                            break;
                        case 'FAILED':
                            setStatus('failed');
                            break;
                        default:
                            setStatus('pending');
                    }
                })
                .catch(() => setStatus('failed'));
        } else if (params?.cancel) {
            setStatus('cancel');
        } else {
            setStatus('failed');
        }
    }, [route.params, dispatch, navigation]);

    if (status === 'loading') {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0073e6" />
                <Text>Đang kiểm tra trạng thái thanh toán...</Text>
            </View>
        );
    }

    let title = '';
    let subtitle = '';
    let color = '#0073e6';

    switch (status) {
        case 'success':
            title = 'Thanh toán thành công!';
            subtitle = `Mã đơn hàng: ${orderCode}`;
            color = '#4BB543';
            break;
        case 'expired':
            title = 'Giao dịch đã hết hạn';
            subtitle = 'Vui lòng thực hiện giao dịch mới';
            color = '#FF9600';
            break;
        case 'failed':
            title = 'Thanh toán thất bại';
            subtitle = 'Vui lòng thử lại sau';
            color = '#d32f2f';
            break;
        case 'cancel':
            title = 'Thanh toán đã bị hủy';
            subtitle = 'Bạn đã hủy giao dịch thanh toán';
            color = '#d32f2f';
            break;
        default:
            title = 'Đang xử lý thanh toán';
            subtitle = 'Vui lòng chờ trong giây lát...';
            color = '#0073e6';
    }

    return (
        <View style={[styles.centered, { backgroundColor: '#fff' }]}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color, marginBottom: 12 }}>{title}</Text>
            <Text style={{ fontSize: 16, color: '#333', marginBottom: 8 }}>{subtitle}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default PaymentResultScreen; 