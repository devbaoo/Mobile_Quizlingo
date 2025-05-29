import { persistor, store } from '@/services/store/store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        Font.loadAsync({
            'Baloo2-Regular': require('./src/assets/fonts/Baloo2-Regular.ttf'),
            'Baloo2-Bold': require('./src/assets/fonts/Baloo2-Bold.ttf'),
        }).then(() => setFontsLoaded(true));
    }, []);

    if (!fontsLoaded) {
        // Hiển thị loading khi font chưa load xong
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
                <Toast />
            </PersistGate>
        </Provider>
    );
}