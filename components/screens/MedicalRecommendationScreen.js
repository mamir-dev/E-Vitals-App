import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    SafeAreaView,
} from "react-native";
import { colors } from '../../config/globall';

const NAVY_BLUE = colors.primaryButton || '#293d55';

const MedicalRecommendationScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (input.trim() === "") return;
        const newMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages([...messages, newMessage]);
        setInput("");
    };

    const renderMessage = ({ item }) => (
        <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_BLUE} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Medical Recommendation</Text>
            </View>

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Write your health inquiry..."
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: NAVY_BLUE,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '300',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    messageList: {
        padding: 15,
    },
    messageBubble: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        marginBottom: 10,
        alignSelf: 'flex-start',
        maxWidth: '90%',
    },
    messageText: {
        color: '#334155',
        fontSize: 15,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 120,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sendButton: {
        marginLeft: 12,
        backgroundColor: NAVY_BLUE,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default MedicalRecommendationScreen;
