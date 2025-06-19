import LeaderboardScreen from '@/screens/LeaderboardScreen';
import LessonCompleteScreen from '@/screens/LessonCompleteScreen';
import LessonQuizScreen from '@/screens/LessonQuizScreen';
import { persistor, store } from '@/services/store/store';
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import config from "./gluestack-ui.config";
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import UserHomeScreen from './src/screens/UserHomeScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

// Toast configuration
const toastConfig: ToastConfig = {
    success: (props: any) => (
        <View style={{
            height: 60,
            width: '90%',
            backgroundColor: '#E6F8E0',
            padding: 15,
            borderRadius: 10,
            borderLeftWidth: 5,
            borderLeftColor: '#58CC02',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            margin: 10
        }}>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: 'bold' }}>{props.text1}</Text>
            {props.text2 && <Text style={{ color: '#666', fontSize: 14 }}>{props.text2}</Text>}
        </View>
    ),
    error: (props: any) => (
        <View style={{
            height: 60,
            width: '90%',
            backgroundColor: '#FFEBEE',
            padding: 15,
            borderRadius: 10,
            borderLeftWidth: 5,
            borderLeftColor: '#d32f2f',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            margin: 10
        }}>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: 'bold' }}>{props.text1}</Text>
            {props.text2 && <Text style={{ color: '#666', fontSize: 14 }}>{props.text2}</Text>}
        </View>
    ),
    warning: (props: any) => (
        <View style={{
            height: 60,
            width: '90%',
            backgroundColor: '#FFF8E6',
            padding: 15,
            borderRadius: 10,
            borderLeftWidth: 5,
            borderLeftColor: '#FF9600',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            margin: 10
        }}>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: 'bold' }}>{props.text1}</Text>
            {props.text2 && <Text style={{ color: '#666', fontSize: 14 }}>{props.text2}</Text>}
        </View>
    ),
    info: (props: any) => (
        <View style={{
            height: 60,
            width: '90%',
            backgroundColor: '#E6F7FF',
            padding: 15,
            borderRadius: 10,
            borderLeftWidth: 5,
            borderLeftColor: '#0073e6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            margin: 10
        }}>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: 'bold' }}>{props.text1}</Text>
            {props.text2 && <Text style={{ color: '#666', fontSize: 14 }}>{props.text2}</Text>}
        </View>
    )
};

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
                <GluestackUIProvider config={config}>
                    <NavigationContainer>
                        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="Home" component={HomeScreen} />
                            <Stack.Screen name="Register" component={RegisterScreen} />
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                            <Stack.Screen name="UserHome" component={UserHomeScreen} />
                            <Stack.Screen name="LessonQuiz" component={LessonQuizScreen} />
                            <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} />
                            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
                            <Stack.Screen name="ProfileDetail" component={ProfileScreen} />
                        </Stack.Navigator>
                    </NavigationContainer>
                    <Toast config={toastConfig} />
                </GluestackUIProvider>
            </PersistGate>
        </Provider>
    );
}