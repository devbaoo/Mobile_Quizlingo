import {
    checkActivePackage,
    clearPurchaseState,
    fetchActivePackages,
    purchasePackage
} from '@/services/slices/package/packageSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

const getDisplayPackageName = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('silver')) return 'Gói Bạc';
    if (lowercaseName.includes('premium')) return 'Gói Premium';
    return name;
};

const calculateRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
};

const SubscriptionPackageScreen = () => {
    const dispatch = useDispatch<AppDispatch>();
    const {
        packages,
        loading,
        error,
        purchaseLoading,
        purchaseError,
        paymentUrl,
        hasActivePackage,
        activePackage,
        activePackageLoading,
        paymentStatus,
    } = useSelector((state: RootState) => state.package);

    useEffect(() => {
        dispatch(fetchActivePackages());
        dispatch(checkActivePackage());
    }, [dispatch]);

    useEffect(() => {
        if (paymentUrl) {
            Toast.show({ type: 'info', text1: 'Đang chuyển hướng...' });
            setTimeout(() => {
                Linking.openURL(paymentUrl);
                dispatch(clearPurchaseState());
            }, 1000);
        }
    }, [paymentUrl, dispatch]);

    useEffect(() => {
        if (purchaseError) {
            Toast.show({ type: 'error', text1: purchaseError });
            dispatch(clearPurchaseState());
        }
    }, [purchaseError, dispatch]);

    const handlePurchase = (packageId: string) => {
        if (hasActivePackage) {
            Toast.show({ type: 'info', text1: 'Bạn cần đợi gói hiện tại hết hạn trước khi mua gói mới' });
            return;
        }
        Alert.alert('Xác nhận mua gói', 'Bạn có chắc chắn muốn mua gói này không?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đồng ý', onPress: () => dispatch(purchasePackage(packageId)) },
        ]);
    };

    if (loading || activePackageLoading) {
        return (
            <View style={styles.centered}><ActivityIndicator size="large" color="#0073e6" /></View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}><Text style={{ color: 'red' }}>{error}</Text></View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerSection}>
                <MaterialCommunityIcons name="crown" size={36} color="#FFD700" style={{ marginBottom: 8 }} />
                <Text style={styles.headerTitle}>Nâng cấp tài khoản Premium</Text>
                <Text style={styles.headerDesc}>Mở khóa tất cả tính năng cao cấp và tối ưu hóa trải nghiệm học tập của bạn</Text>
            </View>
            {hasActivePackage && activePackage && (
                <View style={styles.activeCard}>
                    <Text style={styles.activeTitle}>Gói hiện tại của bạn</Text>
                    <Text style={styles.activeName}>{getDisplayPackageName(activePackage.package.name)}</Text>
                    <Text style={styles.activeExpire}>Còn {calculateRemainingDays(activePackage.endDate)} ngày (hết hạn: {new Date(activePackage.endDate).toLocaleDateString('vi-VN')})</Text>
                </View>
            )}
            {hasActivePackage && (
                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>⚠️ Bạn đang có gói đăng ký, hãy đợi hết hạn để mua gói mới.</Text>
                </View>
            )}
            <FlatList
                data={packages}
                renderItem={({ item }) => {
                    const discountedPrice = item.price * (1 - item.discount / 100);
                    const showDiscount = item.discount > 0 && new Date(item.discountEndDate) > new Date();
                    const isPopular = item.duration === 30;
                    return (
                        <View style={[styles.card, isPopular && styles.popularCard]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={styles.packageName}>{getDisplayPackageName(item.name)}</Text>
                                {isPopular && (
                                    <View style={styles.popularTag}>
                                        <Text style={styles.popularTagText}>Phổ biến</Text>
                                    </View>
                                )}
                                {showDiscount && (
                                    <View style={styles.discountTag}>
                                        <MaterialCommunityIcons name="sale" size={18} color="#fff" />
                                        <Text style={styles.discountTagText}>Giảm {item.discount}%</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.packageDesc}>{item.description}</Text>
                            <View style={styles.priceRow}>
                                {showDiscount && (
                                    <Text style={styles.oldPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                                )}
                                <Text style={styles.price}>{showDiscount ? discountedPrice.toLocaleString('vi-VN') : item.price.toLocaleString('vi-VN')}đ</Text>
                            </View>
                            {showDiscount && (
                                <Text style={styles.discountEndDate}>Hết hạn: {new Date(item.discountEndDate).toLocaleDateString('vi-VN')}</Text>
                            )}
                            <Text style={styles.duration}>/{item.duration} ngày</Text>
                            <View style={styles.features}>
                                {item.features.doubleXP && <Text style={styles.featureItem}>• Nhân đôi XP</Text>}
                                {item.features.unlimitedLives && <Text style={styles.featureItem}>• Mạng không giới hạn</Text>}
                            </View>
                            <TouchableOpacity
                                style={[styles.buyBtn, hasActivePackage && styles.disabledBtn]}
                                onPress={() => handlePurchase(item._id)}
                                disabled={hasActivePackage || purchaseLoading}
                            >
                                <Text style={styles.buyBtnText}>{hasActivePackage ? 'Đã có gói' : 'Mua ngay'}</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
                keyExtractor={item => item._id}
                contentContainerStyle={{ paddingBottom: 32 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16, paddingTop: 36 },
    headerSection: { alignItems: 'center', marginBottom: 24, paddingTop: 24 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#0073e6', marginBottom: 6 },
    headerDesc: { color: '#555', fontSize: 16, textAlign: 'center', marginBottom: 4 },
    popularCard: { borderWidth: 2, borderColor: '#0073e6', shadowColor: '#0073e6', shadowOpacity: 0.15, shadowRadius: 8 },
    popularTag: { backgroundColor: '#0073e6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
    popularTagText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    discountTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF4B4B', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
    discountTagText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
    discountEndDate: { color: '#FF4B4B', fontSize: 13, marginBottom: 2 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2 },
    packageName: { fontSize: 20, fontWeight: 'bold', color: '#0073e6', marginBottom: 4 },
    packageDesc: { color: '#555', marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    oldPrice: { textDecorationLine: 'line-through', color: '#888', marginRight: 8 },
    price: { fontSize: 22, fontWeight: 'bold', color: '#0073e6' },
    duration: { color: '#888', marginBottom: 8 },
    features: { marginBottom: 8 },
    featureItem: { color: '#333', fontSize: 15 },
    buyBtn: { backgroundColor: '#0073e6', padding: 12, borderRadius: 8, alignItems: 'center' },
    buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    disabledBtn: { backgroundColor: '#aaa' },
    activeCard: { backgroundColor: '#e6f2ff', borderRadius: 12, padding: 16, marginBottom: 16 },
    activeTitle: { color: '#0073e6', fontWeight: 'bold', fontSize: 16 },
    activeName: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    activeExpire: { color: '#555', marginTop: 4 },
    warningBox: { backgroundColor: '#FFF8E6', borderRadius: 8, padding: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FF9600' },
    warningText: { color: '#FF9600', fontWeight: 'bold', fontSize: 15 },
});

export default SubscriptionPackageScreen; 