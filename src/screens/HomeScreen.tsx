import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hello QuizLingo</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0073e6',
    },
}); 